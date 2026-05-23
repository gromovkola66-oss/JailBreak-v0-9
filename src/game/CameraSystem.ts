import * as THREE from 'three';

export interface SecurityCamera {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  groupId: number;
  label: string;
}

export interface SecurityTerminal {
  id: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  groupId: number;
}

export interface CameraSystemState {
  inTerminalMode: boolean;
  terminalHighlighted: boolean;
  cameras: SecurityCamera[];
  selectedCameraIndex: number | null;
  screenshots: string[];
}

export class CameraSystem {
  private terminals: SecurityTerminal[] = [];
  private cameras: SecurityCamera[] = [];
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private _inTerminalMode = false;
  private _terminalHighlighted = false;
  private _selectedCameraIndex: number | null = null;
  private _activeCameras: SecurityCamera[] = [];
  private _screenshots: string[] = [];

  private highlightedMeshes: { mesh: THREE.Mesh; originalMaterial: THREE.Material }[] = [];

  private interactionRange = 3;

  private securityCamera: THREE.PerspectiveCamera;

  private screenshotInterval: ReturnType<typeof setInterval> | null = null;

  private terminalScreenTarget: THREE.WebGLRenderTarget;
  private terminalScreenElapsed = 0;
  private terminalDataTextures: Map<string, THREE.DataTexture> = new Map();

  // Pooled buffers for captureScreenshots to avoid per-tick allocation
  private screenshotBuffer: Uint8Array;
  private screenshotCanvas: HTMLCanvasElement;
  private screenshotCtx: CanvasRenderingContext2D;
  private screenshotImageData: ImageData;

  // Pooled buffer for updateTerminalScreen pixel copy
  private terminalPixelBuffer: Uint8Array;

  public onStateChange?: (state: CameraSystemState) => void;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.securityCamera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 200);
    this.terminalScreenTarget = new THREE.WebGLRenderTarget(256, 144);

    // Pre-allocate pooled buffers
    const width = 256;
    const height = 144;
    this.screenshotBuffer = new Uint8Array(width * height * 4);
    this.screenshotCanvas = document.createElement('canvas');
    this.screenshotCanvas.width = width;
    this.screenshotCanvas.height = height;
    this.screenshotCtx = this.screenshotCanvas.getContext('2d')!;
    this.screenshotImageData = this.screenshotCtx.createImageData(width, height);

    this.terminalPixelBuffer = new Uint8Array(width * height * 4);
  }

  registerTerminal(id: string, mesh: THREE.Object3D, position: THREE.Vector3, groupId: number) {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData.isTerminal = true;
        child.userData.terminalId = id;
      }
    });
    this.terminals.push({ id, mesh, position, groupId });
  }

  registerCamera(id: string, position: THREE.Vector3, rotation: THREE.Euler, groupId: number, label: string) {
    this.cameras.push({ id, position, rotation, groupId, label });
  }

  checkRaycast(raycaster: THREE.Raycaster): boolean {
    const terminalMeshes: THREE.Object3D[] = [];
    for (const terminal of this.terminals) {
      terminal.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && !child.userData.isTerminalScreen) {
          terminalMeshes.push(child);
        }
      });
    }

    if (terminalMeshes.length === 0) {
      this.clearHighlight();
      const wasHighlighted = this._terminalHighlighted;
      this._terminalHighlighted = false;
      if (wasHighlighted !== this._terminalHighlighted) {
        this.emitState();
      }
      return false;
    }

    const intersects = raycaster.intersectObjects(terminalMeshes, false);
    const hit = intersects.length > 0 && intersects[0].distance < this.interactionRange;

    const wasHighlighted = this._terminalHighlighted;

    if (hit) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      // Find the terminal group this mesh belongs to
      const terminalGroup = this.findTerminalGroup(hitMesh);
      const currentGroup = this.highlightedMeshes.length > 0 ? this.findTerminalGroup(this.highlightedMeshes[0].mesh) : null;
      if (terminalGroup !== currentGroup) {
        this.clearHighlight();
        if (terminalGroup) {
          this.applyHighlight(terminalGroup);
        }
      }
      this._terminalHighlighted = true;
    } else {
      this.clearHighlight();
      this._terminalHighlighted = false;
    }

    if (this._terminalHighlighted !== wasHighlighted) {
      this.emitState();
    }

    return hit;
  }

  private findTerminalGroup(mesh: THREE.Object3D): THREE.Object3D | null {
    for (const terminal of this.terminals) {
      let current: THREE.Object3D | null = mesh;
      while (current) {
        if (current === terminal.mesh) return terminal.mesh;
        current = current.parent;
      }
    }
    return null;
  }

  private applyHighlight(group: THREE.Object3D) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.userData.isTerminalScreen) return;
        const mat = child.material as THREE.MeshStandardMaterial;
        if (!mat || !mat.emissive) return;
        const originalMaterial = child.material;
        const cloned = mat.clone();
        cloned.emissive.set(0x44ffaa);
        cloned.emissiveIntensity = 0.008;
        child.material = cloned;
        this.highlightedMeshes.push({
          mesh: child,
          originalMaterial: originalMaterial,
        });
      }
    });
  }

  private clearHighlight() {
    for (const entry of this.highlightedMeshes) {
      const clonedMat = entry.mesh.material as THREE.MeshStandardMaterial;
      entry.mesh.material = entry.originalMaterial;
      if (clonedMat && clonedMat !== entry.originalMaterial) {
        clonedMat.dispose();
      }
    }
    this.highlightedMeshes = [];
  }

  enterTerminalMode(playerPosition: THREE.Vector3): boolean {
    // Find the nearest terminal within interaction range
    let nearest: SecurityTerminal | null = null;
    let minDist = this.interactionRange;
    for (const terminal of this.terminals) {
      const dist = playerPosition.distanceTo(terminal.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = terminal;
      }
    }

    if (!nearest) return false;

    // Clear any existing highlight when entering terminal mode
    this.clearHighlight();
    this._terminalHighlighted = false;

    // Get cameras linked to this terminal via groupId
    this._activeCameras = this.cameras.filter(c => c.groupId === nearest!.groupId);

    this._inTerminalMode = true;
    this._selectedCameraIndex = null;

    // Capture initial screenshots
    this.captureScreenshots();

    // Set up interval to refresh screenshots every 1 second
    this.screenshotInterval = setInterval(() => {
      this.captureScreenshots();
    }, 1000);

    document.exitPointerLock();
    this.emitState();
    return true;
  }

  exitTerminalMode() {
    this._inTerminalMode = false;
    this._selectedCameraIndex = null;
    this._activeCameras = [];
    this._screenshots = [];
    this.clearHighlight();
    this._terminalHighlighted = false;
    if (this.screenshotInterval !== null) {
      clearInterval(this.screenshotInterval);
      this.screenshotInterval = null;
    }
    document.body.requestPointerLock();
    this.emitState();
  }

  selectCamera(index: number | null) {
    if (index !== null && index >= 0 && index < this._activeCameras.length) {
      this._selectedCameraIndex = index;
    } else {
      this._selectedCameraIndex = null;
    }
    this.emitState();
  }

  getSelectedCamera(): SecurityCamera | null {
    if (this._selectedCameraIndex === null) return null;
    return this._activeCameras[this._selectedCameraIndex] ?? null;
  }

  renderFromCamera(mainCamera: THREE.PerspectiveCamera) {
    if (!this._inTerminalMode || this._selectedCameraIndex === null) return;

    const cam = this._activeCameras[this._selectedCameraIndex];
    if (!cam) return;

    // Position the security camera
    this.securityCamera.position.copy(cam.position);
    this.securityCamera.rotation.copy(cam.rotation);
    this.securityCamera.aspect = mainCamera.aspect;
    this.securityCamera.updateProjectionMatrix();

    // Render from security camera perspective
    this.renderer.render(this.scene, this.securityCamera);
  }

  private captureScreenshots() {
    if (this._activeCameras.length === 0) {
      this._screenshots = [];
      this.emitState();
      return;
    }

    const currentRenderTarget = this.renderer.getRenderTarget();
    const screenshots: string[] = [];

    const width = 256;
    const height = 144;
    const buffer = this.screenshotBuffer;
    const canvas = this.screenshotCanvas;
    const ctx = this.screenshotCtx;
    const imageData = this.screenshotImageData;

    for (const cam of this._activeCameras) {
      this.securityCamera.position.copy(cam.position);
      this.securityCamera.rotation.copy(cam.rotation);
      this.securityCamera.aspect = 16 / 9;
      this.securityCamera.updateProjectionMatrix();

      this.renderer.setRenderTarget(this.terminalScreenTarget);
      this.renderer.render(this.scene, this.securityCamera);
      this.renderer.setRenderTarget(null);

      // Read pixels using pooled buffer
      this.renderer.readRenderTargetPixels(this.terminalScreenTarget, 0, 0, width, height, buffer);

      // Flip vertically (WebGL reads bottom-to-top) using pooled imageData
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIdx = ((height - 1 - y) * width + x) * 4;
          const dstIdx = (y * width + x) * 4;
          imageData.data[dstIdx] = buffer[srcIdx];
          imageData.data[dstIdx + 1] = buffer[srcIdx + 1];
          imageData.data[dstIdx + 2] = buffer[srcIdx + 2];
          imageData.data[dstIdx + 3] = buffer[srcIdx + 3];
        }
      }
      ctx.putImageData(imageData, 0, 0);
      screenshots.push(canvas.toDataURL('image/jpeg', 0.6));
    }

    this.renderer.setRenderTarget(currentRenderTarget);
    this._screenshots = screenshots;
    this.emitState();
  }

  updateTerminalScreen(delta: number) {
    this.terminalScreenElapsed += delta;
    if (this.terminalScreenElapsed < 0.5) return;
    this.terminalScreenElapsed = 0;

    const width = 256;
    const height = 144;

    // Iterate ALL registered terminals and render the first linked camera's view onto each terminal's screen mesh
    for (const terminal of this.terminals) {
      const linkedCams = this.cameras.filter(c => c.groupId === terminal.groupId);
      if (linkedCams.length === 0) continue;

      const cam = linkedCams[0];
      this.securityCamera.position.copy(cam.position);
      this.securityCamera.rotation.copy(cam.rotation);
      this.securityCamera.aspect = 256 / 144;
      this.securityCamera.updateProjectionMatrix();

      const currentRenderTarget = this.renderer.getRenderTarget();
      this.renderer.setRenderTarget(this.terminalScreenTarget);
      this.renderer.render(this.scene, this.securityCamera);
      this.renderer.setRenderTarget(currentRenderTarget);

      // Copy pixels into a per-terminal DataTexture to avoid shared render target overwrite
      this.renderer.readRenderTargetPixels(this.terminalScreenTarget, 0, 0, width, height, this.terminalPixelBuffer);

      let dataTexture = this.terminalDataTextures.get(terminal.id);
      if (!dataTexture) {
        dataTexture = new THREE.DataTexture(new Uint8Array(width * height * 4), width, height, THREE.RGBAFormat);
        dataTexture.flipY = true;
        this.terminalDataTextures.set(terminal.id, dataTexture);
      }

      // Copy pixel buffer into the DataTexture's data
      (dataTexture.image.data as Uint8Array).set(this.terminalPixelBuffer);
      dataTexture.needsUpdate = true;

      // Apply the per-terminal DataTexture to terminal screen meshes
      terminal.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isTerminalScreen) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat === undefined) return;
          mat.map = dataTexture!;
          mat.needsUpdate = true;
        }
      });
    }
  }

  update(delta: number, mainCamera: THREE.PerspectiveCamera) {
    this.updateTerminalScreen(delta);
    if (this._inTerminalMode && this._selectedCameraIndex !== null) {
      this.renderFromCamera(mainCamera);
    }
  }

  dispose() {
    if (this.screenshotInterval !== null) {
      clearInterval(this.screenshotInterval);
      this.screenshotInterval = null;
    }
    this.terminalScreenTarget.dispose();
    for (const dataTexture of this.terminalDataTextures.values()) {
      dataTexture.dispose();
    }
    this.terminalDataTextures.clear();
  }

  private emitState() {
    if (this.onStateChange) {
      this.onStateChange({
        inTerminalMode: this._inTerminalMode,
        terminalHighlighted: this._terminalHighlighted,
        cameras: this._activeCameras,
        selectedCameraIndex: this._selectedCameraIndex,
        screenshots: this._screenshots,
      });
    }
  }

  get inTerminalMode(): boolean {
    return this._inTerminalMode;
  }

  get terminalHighlighted(): boolean {
    return this._terminalHighlighted;
  }

  get selectedCameraIndex(): number | null {
    return this._selectedCameraIndex;
  }

  get activeCameras(): SecurityCamera[] {
    return this._activeCameras;
  }

  getState(): CameraSystemState {
    return {
      inTerminalMode: this._inTerminalMode,
      terminalHighlighted: this._terminalHighlighted,
      cameras: this._activeCameras,
      selectedCameraIndex: this._selectedCameraIndex,
      screenshots: this._screenshots,
    };
  }
}
