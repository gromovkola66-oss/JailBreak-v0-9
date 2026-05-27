import * as THREE from 'three';

export interface TerrainData {
  size: number;
  resolution: number;
  heights: number[];
  materials: number[];
}

export class TerrainSystem {
  private scene: THREE.Scene;
  private size: number;
  private resolution: number;
  private mesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;
  private heightData: Float32Array;
  private materialMap: Uint8Array;

  private static readonly MATERIAL_COLORS: number[] = [
    0x4a7a2a, // grass (index 0)
    0x8b6914, // dirt (index 1)
    0xd4a574, // sand (index 2)
    0x7a7a7a, // rock (index 3)
  ];

  constructor(scene: THREE.Scene, size: number = 200, resolution: number = 64) {
    this.scene = scene;
    this.size = size;
    this.resolution = resolution;

    this.heightData = new Float32Array(resolution * resolution);
    this.materialMap = new Uint8Array(resolution * resolution);

    this.geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    this.geometry.rotateX(-Math.PI / 2);

    // Initialize vertex colors to grass green
    const count = this.geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const grassColor = new THREE.Color(TerrainSystem.MATERIAL_COLORS[0]);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = grassColor.r;
      colors[i * 3 + 1] = grassColor.g;
      colors[i * 3 + 2] = grassColor.b;
    }
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  raise(worldX: number, worldZ: number, radius: number, strength: number): void {
    this.applyBrush(worldX, worldZ, radius, (dist) => {
      const falloff = 1 - dist / radius;
      return strength * falloff;
    });
  }

  lower(worldX: number, worldZ: number, radius: number, strength: number): void {
    this.applyBrush(worldX, worldZ, radius, (dist) => {
      const falloff = 1 - dist / radius;
      return -strength * falloff;
    });
  }

  flatten(worldX: number, worldZ: number, radius: number, targetHeight: number): void {
    const positions = this.geometry.attributes.position;
    let changed = false;

    for (let row = 0; row < this.resolution; row++) {
      for (let col = 0; col < this.resolution; col++) {
        const vx = (col / (this.resolution - 1) - 0.5) * this.size;
        const vz = (row / (this.resolution - 1) - 0.5) * this.size;
        const dx = vx - worldX;
        const dz = vz - worldZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < radius) {
          const idx = row * this.resolution + col;
          const falloff = 1 - dist / radius;
          const current = this.heightData[idx];
          this.heightData[idx] = current + (targetHeight - current) * falloff * 0.1;
          const vertIdx = row * this.resolution + col;
          positions.setY(vertIdx, this.heightData[idx]);
          changed = true;
        }
      }
    }

    if (changed) {
      positions.needsUpdate = true;
      this.geometry.computeVertexNormals();
    }
  }

  smooth(worldX: number, worldZ: number, radius: number): void {
    const positions = this.geometry.attributes.position;
    let changed = false;
    const tempHeights = new Float32Array(this.heightData);

    for (let row = 0; row < this.resolution; row++) {
      for (let col = 0; col < this.resolution; col++) {
        const vx = (col / (this.resolution - 1) - 0.5) * this.size;
        const vz = (row / (this.resolution - 1) - 0.5) * this.size;
        const dx = vx - worldX;
        const dz = vz - worldZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < radius) {
          const idx = row * this.resolution + col;
          let sum = 0;
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = row + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < this.resolution && nc >= 0 && nc < this.resolution) {
                sum += this.heightData[nr * this.resolution + nc];
                count++;
              }
            }
          }
          const avg = sum / count;
          const falloff = 1 - dist / radius;
          tempHeights[idx] = this.heightData[idx] + (avg - this.heightData[idx]) * falloff * 0.3;
          changed = true;
        }
      }
    }

    if (changed) {
      this.heightData.set(tempHeights);
      for (let i = 0; i < this.heightData.length; i++) {
        positions.setY(i, this.heightData[i]);
      }
      positions.needsUpdate = true;
      this.geometry.computeVertexNormals();
    }
  }

  paint(worldX: number, worldZ: number, radius: number, materialIndex: number): void {
    const colors = this.geometry.attributes.color;
    const color = new THREE.Color(TerrainSystem.MATERIAL_COLORS[materialIndex] ?? TerrainSystem.MATERIAL_COLORS[0]);
    let changed = false;

    for (let row = 0; row < this.resolution; row++) {
      for (let col = 0; col < this.resolution; col++) {
        const vx = (col / (this.resolution - 1) - 0.5) * this.size;
        const vz = (row / (this.resolution - 1) - 0.5) * this.size;
        const dx = vx - worldX;
        const dz = vz - worldZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < radius) {
          const idx = row * this.resolution + col;
          this.materialMap[idx] = materialIndex;
          colors.setXYZ(idx, color.r, color.g, color.b);
          changed = true;
        }
      }
    }

    if (changed) {
      colors.needsUpdate = true;
    }
  }

  getHeightAt(x: number, z: number): number {
    // Return 0 for positions outside the terrain bounds
    const halfSize = this.size / 2;
    if (x < -halfSize || x > halfSize || z < -halfSize || z > halfSize) {
      return 0;
    }

    // Convert world position to grid coordinates
    const gx = (x / this.size + 0.5) * (this.resolution - 1);
    const gz = (z / this.size + 0.5) * (this.resolution - 1);

    const col0 = Math.floor(gx);
    const row0 = Math.floor(gz);
    const col1 = Math.min(col0 + 1, this.resolution - 1);
    const row1 = Math.min(row0 + 1, this.resolution - 1);

    const fx = gx - col0;
    const fz = gz - row0;

    const clampCol0 = Math.max(0, Math.min(col0, this.resolution - 1));
    const clampRow0 = Math.max(0, Math.min(row0, this.resolution - 1));
    const clampCol1 = Math.max(0, Math.min(col1, this.resolution - 1));
    const clampRow1 = Math.max(0, Math.min(row1, this.resolution - 1));

    const h00 = this.heightData[clampRow0 * this.resolution + clampCol0];
    const h10 = this.heightData[clampRow0 * this.resolution + clampCol1];
    const h01 = this.heightData[clampRow1 * this.resolution + clampCol0];
    const h11 = this.heightData[clampRow1 * this.resolution + clampCol1];

    // Bilinear interpolation
    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;
    return h0 * (1 - fz) + h1 * fz;
  }

  resetTerrain(): void {
    this.heightData.fill(0);
    this.materialMap.fill(0);

    const positions = this.geometry.attributes.position;
    const colors = this.geometry.attributes.color;
    const grassColor = new THREE.Color(TerrainSystem.MATERIAL_COLORS[0]);

    for (let i = 0; i < this.heightData.length; i++) {
      positions.setY(i, 0);
      colors.setXYZ(i, grassColor.r, grassColor.g, grassColor.b);
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  exportData(): TerrainData {
    return {
      size: this.size,
      resolution: this.resolution,
      heights: Array.from(this.heightData),
      materials: Array.from(this.materialMap),
    };
  }

  importData(data: TerrainData): void {
    // Resize geometry if imported data has different size/resolution
    if (data.size !== this.size || data.resolution !== this.resolution) {
      this.resize(data.size, data.resolution);
    }

    this.heightData = new Float32Array(data.heights);
    this.materialMap = new Uint8Array(data.materials);

    const positions = this.geometry.attributes.position;
    const colors = this.geometry.attributes.color;

    for (let i = 0; i < this.heightData.length; i++) {
      positions.setY(i, this.heightData[i]);
      const matIdx = this.materialMap[i];
      const color = new THREE.Color(TerrainSystem.MATERIAL_COLORS[matIdx] ?? TerrainSystem.MATERIAL_COLORS[0]);
      colors.setXYZ(i, color.r, color.g, color.b);
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  getSize(): number {
    return this.size;
  }

  getResolution(): number {
    return this.resolution;
  }

  static getResolutionForSize(size: number): number {
    switch (size) {
      case 200: return 64;
      case 400: return 96;
      case 600: return 128;
      case 800: return 160;
      case 1000: return 192;
      default: return 64;
    }
  }

  resize(newSize: number, newResolution: number): void {
    // Dispose old mesh and geometry
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();

    // Update size and resolution
    this.size = newSize;
    this.resolution = newResolution;

    // Reinitialize data arrays
    this.heightData = new Float32Array(newResolution * newResolution);
    this.materialMap = new Uint8Array(newResolution * newResolution);

    // Recreate geometry
    this.geometry = new THREE.PlaneGeometry(newSize, newSize, newResolution - 1, newResolution - 1);
    this.geometry.rotateX(-Math.PI / 2);

    // Initialize vertex colors to grass green
    const count = this.geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const grassColor = new THREE.Color(TerrainSystem.MATERIAL_COLORS[0]);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = grassColor.r;
      colors[i * 3 + 1] = grassColor.g;
      colors[i * 3 + 2] = grassColor.b;
    }
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Recreate mesh
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
    });
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  private applyBrush(worldX: number, worldZ: number, radius: number, fn: (dist: number) => number): void {
    const positions = this.geometry.attributes.position;
    let changed = false;

    for (let row = 0; row < this.resolution; row++) {
      for (let col = 0; col < this.resolution; col++) {
        const vx = (col / (this.resolution - 1) - 0.5) * this.size;
        const vz = (row / (this.resolution - 1) - 0.5) * this.size;
        const dx = vx - worldX;
        const dz = vz - worldZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < radius) {
          const idx = row * this.resolution + col;
          this.heightData[idx] += fn(dist);
          positions.setY(idx, this.heightData[idx]);
          changed = true;
        }
      }
    }

    if (changed) {
      positions.needsUpdate = true;
      this.geometry.computeVertexNormals();
    }
  }
}
