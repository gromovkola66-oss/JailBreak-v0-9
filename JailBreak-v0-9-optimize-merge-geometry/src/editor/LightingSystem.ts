import * as THREE from 'three';

export interface LightProperties {
  color: string;
  intensity: number;
  radius: number;
  shadows: boolean;
}

export class LightingSystem {
  private lightProperties: Map<string, LightProperties> = new Map();
  private lightHelpers: Map<string, THREE.LineSegments> = new Map();
  private ambientOcclusionEnabled = false;

  getProperties(objectId: string): LightProperties | null {
    return this.lightProperties.get(objectId) || null;
  }

  setProperties(objectId: string, props: LightProperties): void {
    this.lightProperties.set(objectId, { ...props });
  }

  updateLightProperty(objectId: string, property: keyof LightProperties, value: string | number | boolean): void {
    const props = this.lightProperties.get(objectId);
    if (!props) return;
    if (property === 'color') props.color = value as string;
    else if (property === 'intensity') props.intensity = value as number;
    else if (property === 'radius') props.radius = value as number;
    else if (property === 'shadows') props.shadows = value as boolean;
    this.lightProperties.set(objectId, props);
  }

  createLightHelper(radius: number): THREE.LineSegments {
    const geometry = new THREE.SphereGeometry(radius, 16, 12);
    const wireframe = new THREE.WireframeGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4 });
    const helper = new THREE.LineSegments(wireframe, material);
    helper.userData.isLightHelper = true;
    return helper;
  }

  addHelper(objectId: string, helper: THREE.LineSegments): void {
    this.lightHelpers.set(objectId, helper);
  }

  removeHelper(objectId: string, scene: THREE.Scene): void {
    const helper = this.lightHelpers.get(objectId);
    if (helper) {
      scene.remove(helper);
      helper.geometry.dispose();
      (helper.material as THREE.LineBasicMaterial).dispose();
      this.lightHelpers.delete(objectId);
    }
  }

  updateHelper(objectId: string, radius: number, scene: THREE.Scene): void {
    const existing = this.lightHelpers.get(objectId);
    if (existing) {
      scene.remove(existing);
      existing.geometry.dispose();
      (existing.material as THREE.LineBasicMaterial).dispose();
    }
    const helper = this.createLightHelper(radius);
    this.lightHelpers.set(objectId, helper);
    scene.add(helper);
  }

  getHelper(objectId: string): THREE.LineSegments | undefined {
    return this.lightHelpers.get(objectId);
  }

  toggleShadowPreview(renderer: THREE.WebGLRenderer, on: boolean): void {
    renderer.shadowMap.enabled = on;
    renderer.shadowMap.needsUpdate = true;
  }

  toggleAmbientOcclusion(on: boolean): void {
    this.ambientOcclusionEnabled = on;
  }

  isAmbientOcclusionEnabled(): boolean {
    return this.ambientOcclusionEnabled;
  }

  removeProperties(objectId: string): void {
    this.lightProperties.delete(objectId);
  }

  dispose(scene: THREE.Scene): void {
    this.lightHelpers.forEach((helper) => {
      scene.remove(helper);
      helper.geometry.dispose();
      (helper.material as THREE.LineBasicMaterial).dispose();
    });
    this.lightHelpers.clear();
    this.lightProperties.clear();
  }
}
