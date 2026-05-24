import * as THREE from 'three';

export class MiniMap {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.OrthographicCamera;
  private canvas: HTMLCanvasElement;
  private frameCount = 0;
  private readonly renderEvery = 10;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 200;
    this.canvas.height = 200;
    this.canvas.style.width = '180px';
    this.canvas.style.height = '180px';
    this.canvas.style.borderRadius = '8px';

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
    this.renderer.setSize(200, 200);
    this.renderer.setClearColor(0x1a1a2e);

    const size = 80;
    this.camera = new THREE.OrthographicCamera(-size, size, size, -size, 1, 200);
    this.camera.position.set(0, 100, 0);
    this.camera.lookAt(0, 0, 0);
  }

  update(scene: THREE.Scene): void {
    this.frameCount++;
    if (this.frameCount % this.renderEvery !== 0) return;
    this.renderer.render(scene, this.camera);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
