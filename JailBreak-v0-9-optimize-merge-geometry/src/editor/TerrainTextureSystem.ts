export interface TerrainLayer {
  id: string;
  name: string;
  color: string;
}

export class TerrainTextureSystem {
  private layers: TerrainLayer[] = [
    { id: 'grass', name: 'Трава', color: '#4a7a2a' },
    { id: 'dirt', name: 'Земля', color: '#8b6914' },
    { id: 'rock', name: 'Камень', color: '#7a7a7a' },
    { id: 'snow', name: 'Снег', color: '#e8e8e8' },
  ];

  private splatmap: Float32Array;
  private width: number;
  private depth: number;

  constructor(width: number, depth: number) {
    this.width = width;
    this.depth = depth;
    // 4 values per vertex (one per layer)
    this.splatmap = new Float32Array(width * depth * 4);
    // Default: all grass
    for (let i = 0; i < width * depth; i++) {
      this.splatmap[i * 4] = 1.0; // grass
      this.splatmap[i * 4 + 1] = 0.0; // dirt
      this.splatmap[i * 4 + 2] = 0.0; // rock
      this.splatmap[i * 4 + 3] = 0.0; // snow
    }
  }

  getLayers(): TerrainLayer[] {
    return [...this.layers];
  }

  getSplatAt(x: number, z: number): number[] {
    const ix = Math.max(0, Math.min(this.width - 1, Math.round(x)));
    const iz = Math.max(0, Math.min(this.depth - 1, Math.round(z)));
    const idx = (iz * this.width + ix) * 4;
    return [
      this.splatmap[idx],
      this.splatmap[idx + 1],
      this.splatmap[idx + 2],
      this.splatmap[idx + 3],
    ];
  }

  paintLayer(x: number, z: number, radius: number, layerIndex: number, strength: number): void {
    const ix = Math.round(x);
    const iz = Math.round(z);
    const r = Math.ceil(radius);

    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        const px = ix + dx;
        const pz = iz + dz;
        if (px < 0 || px >= this.width || pz < 0 || pz >= this.depth) continue;

        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > radius) continue;

        const falloff = 1.0 - (dist / radius);
        const amount = strength * falloff;
        const idx = (pz * this.width + px) * 4;

        // Increase target layer, decrease others proportionally
        const current = this.splatmap[idx + layerIndex];
        const newVal = Math.min(1.0, current + amount);
        const added = newVal - current;
        this.splatmap[idx + layerIndex] = newVal;

        // Reduce others
        let othersTotal = 0;
        for (let i = 0; i < 4; i++) {
          if (i !== layerIndex) othersTotal += this.splatmap[idx + i];
        }
        if (othersTotal > 0) {
          for (let i = 0; i < 4; i++) {
            if (i !== layerIndex) {
              this.splatmap[idx + i] -= (this.splatmap[idx + i] / othersTotal) * added;
              this.splatmap[idx + i] = Math.max(0, this.splatmap[idx + i]);
            }
          }
        }
      }
    }
  }

  autoByHeightSlope(heights: Float32Array, width: number, depth: number, maxHeight: number): void {
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        const idx = z * width + x;
        const h = heights[idx];
        const normalizedHeight = maxHeight > 0 ? h / maxHeight : 0;

        // Calculate slope
        let slope = 0;
        if (x > 0 && x < width - 1 && z > 0 && z < depth - 1) {
          const hLeft = heights[z * width + (x - 1)];
          const hRight = heights[z * width + (x + 1)];
          const hUp = heights[(z - 1) * width + x];
          const hDown = heights[(z + 1) * width + x];
          const dx = (hRight - hLeft) * 0.5;
          const dz = (hDown - hUp) * 0.5;
          slope = Math.atan(Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI);
        }

        const splatIdx = idx * 4;

        // Steep slopes (>45 degrees) = rock
        if (slope > 45) {
          this.splatmap[splatIdx] = 0;
          this.splatmap[splatIdx + 1] = 0;
          this.splatmap[splatIdx + 2] = 1.0;
          this.splatmap[splatIdx + 3] = 0;
        } else if (normalizedHeight > 0.75) {
          // High altitude = snow
          this.splatmap[splatIdx] = 0;
          this.splatmap[splatIdx + 1] = 0;
          this.splatmap[splatIdx + 2] = 0;
          this.splatmap[splatIdx + 3] = 1.0;
        } else if (normalizedHeight < 0.25) {
          // Low altitude = grass
          this.splatmap[splatIdx] = 1.0;
          this.splatmap[splatIdx + 1] = 0;
          this.splatmap[splatIdx + 2] = 0;
          this.splatmap[splatIdx + 3] = 0;
        } else {
          // Medium = dirt
          this.splatmap[splatIdx] = 0;
          this.splatmap[splatIdx + 1] = 1.0;
          this.splatmap[splatIdx + 2] = 0;
          this.splatmap[splatIdx + 3] = 0;
        }
      }
    }
  }

  getWidth(): number { return this.width; }
  getDepth(): number { return this.depth; }
}
