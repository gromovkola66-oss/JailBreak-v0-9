import * as THREE from 'three';

export interface WaterZoneData {
  id: string;
  position: { x: number; y: number; z: number };
  width: number;
  depth: number;
  type: 'shallow' | 'deep';
}

export interface WaterZone {
  id: string;
  position: THREE.Vector3;
  size: { width: number; depth: number };
  type: 'shallow' | 'deep';
  mesh: THREE.Mesh;
}

const waterVertexShader = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = position;
  pos.y += sin(pos.x * 2.0 + uTime * 2.0) * 0.05 + sin(pos.z * 3.0 + uTime * 1.5) * 0.03;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waterFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float wave = sin(vUv.x * 20.0 + vUv.y * 15.0) * 0.05 + 0.95;
  gl_FragColor = vec4(uColor * wave, uOpacity);
}
`;

export class WaterSystem {
  private scene: THREE.Scene;
  private zones: WaterZone[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addZone(position: THREE.Vector3, width: number, depth: number, type: 'shallow' | 'deep'): WaterZone {
    const id = `water_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const color = type === 'shallow'
      ? new THREE.Vector3(0.27, 0.53, 0.67)
      : new THREE.Vector3(0.1, 0.23, 0.35);
    const opacity = type === 'shallow' ? 0.5 : 0.7;

    const geometry = new THREE.PlaneGeometry(width, depth, 16, 16);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color },
        uOpacity: { value: opacity },
      },
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    this.scene.add(mesh);

    const zone: WaterZone = {
      id,
      position: position.clone(),
      size: { width, depth },
      type,
      mesh,
    };

    this.zones.push(zone);
    return zone;
  }

  removeZone(id: string): void {
    const idx = this.zones.findIndex(z => z.id === id);
    if (idx === -1) return;
    const zone = this.zones[idx];
    this.scene.remove(zone.mesh);
    zone.mesh.geometry.dispose();
    (zone.mesh.material as THREE.Material).dispose();
    this.zones.splice(idx, 1);
  }

  update(time: number): void {
    for (const zone of this.zones) {
      const mat = zone.mesh.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = time;
    }
  }

  isInWater(position: THREE.Vector3): { inWater: boolean; type?: 'shallow' | 'deep' } {
    for (const zone of this.zones) {
      const halfW = zone.size.width / 2;
      const halfD = zone.size.depth / 2;
      const zp = zone.position;

      if (
        position.x >= zp.x - halfW && position.x <= zp.x + halfW &&
        position.z >= zp.z - halfD && position.z <= zp.z + halfD &&
        position.y <= zp.y + 0.5
      ) {
        return { inWater: true, type: zone.type };
      }
    }
    return { inWater: false };
  }

  exportData(): WaterZoneData[] {
    return this.zones.map(z => ({
      id: z.id,
      position: { x: z.position.x, y: z.position.y, z: z.position.z },
      width: z.size.width,
      depth: z.size.depth,
      type: z.type,
    }));
  }

  importData(data: WaterZoneData[]): void {
    for (const zd of data) {
      const pos = new THREE.Vector3(zd.position.x, zd.position.y, zd.position.z);
      const zone = this.addZone(pos, zd.width, zd.depth, zd.type);
      // Preserve the original ID
      zone.id = zd.id;
    }
  }

  dispose(): void {
    for (const zone of this.zones) {
      this.scene.remove(zone.mesh);
      zone.mesh.geometry.dispose();
      (zone.mesh.material as THREE.Material).dispose();
    }
    this.zones = [];
  }
}
