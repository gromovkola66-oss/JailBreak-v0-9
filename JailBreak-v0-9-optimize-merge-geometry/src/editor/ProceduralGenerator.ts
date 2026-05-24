import type { PlacedObject } from './MapEditor';
import { PROCEDURAL_TEMPLATES } from './ProceduralTemplates';
import type { RoomTemplate, FurnitureRule } from './ProceduralTemplates';

export interface GenerationParams {
  areaX: number;
  areaZ: number;
  areaWidth: number;
  areaDepth: number;
  roomMinSize: number;
  roomMaxSize: number;
  corridorWidth: number;
  density: number; // 0-1
  style: string;
  seed: number;
}

interface BSPNode {
  x: number;
  z: number;
  w: number;
  d: number;
  left?: BSPNode;
  right?: BSPNode;
  room?: { x: number; z: number; w: number; d: number };
}

export type { FurnitureRule, RoomTemplate };

export class ProceduralGenerator {
  private rng: () => number;
  private idCounter = 0;
  private timestamp: number;

  constructor(seed: number) {
    this.rng = this.seededRandom(seed);
    this.timestamp = Date.now();
  }

  private seededRandom(seed: number): () => number {
    // mulberry32
    let s = seed | 0;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private nextId(): string {
    return `proc_${this.timestamp}_${this.idCounter++}`;
  }

  generateArea(params: GenerationParams): PlacedObject[] {
    const objects: PlacedObject[] = [];
    const { areaX, areaZ, areaWidth, areaDepth, roomMinSize, roomMaxSize, corridorWidth } = params;

    // BSP divide
    const root: BSPNode = { x: areaX, z: areaZ, w: areaWidth, d: areaDepth };
    this.bspDivide(root, roomMinSize, roomMaxSize, 0);

    // Collect leaf rooms
    const leaves: BSPNode[] = [];
    this.collectLeaves(root, leaves);

    // Assign rooms within each leaf
    for (const leaf of leaves) {
      const roomW = Math.max(roomMinSize, Math.floor(leaf.w * (0.7 + this.rng() * 0.25)));
      const roomD = Math.max(roomMinSize, Math.floor(leaf.d * (0.7 + this.rng() * 0.25)));
      const roomX = leaf.x + Math.floor((leaf.w - roomW) * this.rng());
      const roomZ = leaf.z + Math.floor((leaf.d - roomD) * this.rng());
      leaf.room = { x: roomX, z: roomZ, w: roomW, d: roomD };
    }

    // Get templates based on style
    const templates: RoomTemplate[] = PROCEDURAL_TEMPLATES[params.style] || PROCEDURAL_TEMPLATES['prison'];

    // Generate rooms
    for (const leaf of leaves) {
      if (!leaf.room) continue;
      const template = templates[Math.floor(this.rng() * templates.length)];
      const roomObjects = this.generateRoom(template, leaf.room, params.density);
      objects.push(...roomObjects);
    }

    // Connect adjacent rooms with corridors
    this.connectRooms(root, corridorWidth, objects);

    return objects;
  }

  generateRoom(template: RoomTemplate, bounds: { x: number; z: number; w: number; d: number }, density: number = 1): PlacedObject[] {
    const objects: PlacedObject[] = [];
    const { x, z, w, d } = bounds;

    // Place floor tiles
    for (let fx = 0; fx < w; fx++) {
      for (let fz = 0; fz < d; fz++) {
        objects.push({
          id: this.nextId(),
          type: template.floorType,
          position: { x: x + fx, y: 0, z: z + fz },
          rotation: 0,
        });
      }
    }

    // Place walls around perimeter
    // North wall (z = z)
    for (let wx = 0; wx < w; wx++) {
      objects.push({
        id: this.nextId(),
        type: template.wallType,
        position: { x: x + wx, y: 0, z: z },
        rotation: 0,
      });
    }
    // South wall (z = z + d - 1)
    for (let wx = 0; wx < w; wx++) {
      objects.push({
        id: this.nextId(),
        type: template.wallType,
        position: { x: x + wx, y: 0, z: z + d - 1 },
        rotation: 180,
      });
    }
    // West wall (x = x)
    for (let wz = 1; wz < d - 1; wz++) {
      objects.push({
        id: this.nextId(),
        type: template.wallType,
        position: { x: x, y: 0, z: z + wz },
        rotation: 90,
      });
    }
    // East wall (x = x + w - 1)
    for (let wz = 1; wz < d - 1; wz++) {
      objects.push({
        id: this.nextId(),
        type: template.wallType,
        position: { x: x + w - 1, y: 0, z: z + wz },
        rotation: 270,
      });
    }

    // Place furniture according to rules
    for (const rule of template.furniture) {
      if (this.rng() > density) continue;
      this.placeFurniture(rule, bounds, objects);
    }

    return objects;
  }

  generateCorridor(from: { x: number; z: number }, to: { x: number; z: number }, width: number): PlacedObject[] {
    const objects: PlacedObject[] = [];
    const halfW = Math.floor(width / 2);

    // L-shaped corridor: go horizontal first, then vertical
    const midX = to.x;
    const midZ = from.z;

    // Horizontal segment
    const hStartX = Math.min(from.x, midX);
    const hEndX = Math.max(from.x, midX);
    for (let hx = hStartX; hx <= hEndX; hx++) {
      for (let hw = -halfW; hw <= halfW; hw++) {
        objects.push({
          id: this.nextId(),
          type: 'floor_concrete',
          position: { x: hx, y: 0, z: midZ + hw },
          rotation: 0,
        });
      }
      // Walls on sides of corridor
      objects.push({
        id: this.nextId(),
        type: 'wall_concrete',
        position: { x: hx, y: 0, z: midZ - halfW - 1 },
        rotation: 0,
      });
      objects.push({
        id: this.nextId(),
        type: 'wall_concrete',
        position: { x: hx, y: 0, z: midZ + halfW + 1 },
        rotation: 180,
      });
    }

    // Vertical segment
    const vStartZ = Math.min(midZ, to.z);
    const vEndZ = Math.max(midZ, to.z);
    for (let vz = vStartZ; vz <= vEndZ; vz++) {
      for (let vw = -halfW; vw <= halfW; vw++) {
        objects.push({
          id: this.nextId(),
          type: 'floor_concrete',
          position: { x: midX + vw, y: 0, z: vz },
          rotation: 0,
        });
      }
      // Walls on sides of corridor
      objects.push({
        id: this.nextId(),
        type: 'wall_concrete',
        position: { x: midX - halfW - 1, y: 0, z: vz },
        rotation: 90,
      });
      objects.push({
        id: this.nextId(),
        type: 'wall_concrete',
        position: { x: midX + halfW + 1, y: 0, z: vz },
        rotation: 270,
      });
    }

    return objects;
  }

  fillArea(bounds: { x: number; z: number; w: number; d: number }, objectType: string, spacing: number): PlacedObject[] {
    const objects: PlacedObject[] = [];
    const { x, z, w, d } = bounds;

    for (let fx = 0; fx < w; fx += spacing) {
      for (let fz = 0; fz < d; fz += spacing) {
        objects.push({
          id: this.nextId(),
          type: objectType,
          position: { x: x + fx, y: 0, z: z + fz },
          rotation: 0,
        });
      }
    }

    return objects;
  }

  private bspDivide(node: BSPNode, minSize: number, maxSize: number, depth: number): void {
    // Stop if node is small enough or we've reached max depth
    if (node.w <= maxSize && node.d <= maxSize && depth > 1) return;
    if (node.w < minSize * 2 && node.d < minSize * 2) return;
    if (depth > 8) return;

    // Decide split direction
    let splitH: boolean;
    if (node.w > node.d * 1.25) {
      splitH = false; // split vertically (along X)
    } else if (node.d > node.w * 1.25) {
      splitH = true; // split horizontally (along Z)
    } else {
      splitH = this.rng() > 0.5;
    }

    if (splitH) {
      // Horizontal split
      if (node.d < minSize * 2) return;
      const split = minSize + Math.floor(this.rng() * (node.d - minSize * 2));
      node.left = { x: node.x, z: node.z, w: node.w, d: split };
      node.right = { x: node.x, z: node.z + split, w: node.w, d: node.d - split };
    } else {
      // Vertical split
      if (node.w < minSize * 2) return;
      const split = minSize + Math.floor(this.rng() * (node.w - minSize * 2));
      node.left = { x: node.x, z: node.z, w: split, d: node.d };
      node.right = { x: node.x + split, z: node.z, w: node.w - split, d: node.d };
    }

    this.bspDivide(node.left, minSize, maxSize, depth + 1);
    this.bspDivide(node.right, minSize, maxSize, depth + 1);
  }

  private collectLeaves(node: BSPNode, leaves: BSPNode[]): void {
    if (!node.left && !node.right) {
      leaves.push(node);
      return;
    }
    if (node.left) this.collectLeaves(node.left, leaves);
    if (node.right) this.collectLeaves(node.right, leaves);
  }

  private connectRooms(node: BSPNode, corridorWidth: number, objects: PlacedObject[]): void {
    if (!node.left || !node.right) return;

    // Recursively connect sub-trees
    this.connectRooms(node.left, corridorWidth, objects);
    this.connectRooms(node.right, corridorWidth, objects);

    // Connect left and right subtrees
    const leftRoom = this.getRoom(node.left);
    const rightRoom = this.getRoom(node.right);
    if (leftRoom && rightRoom) {
      const fromCenter = {
        x: leftRoom.x + Math.floor(leftRoom.w / 2),
        z: leftRoom.z + Math.floor(leftRoom.d / 2),
      };
      const toCenter = {
        x: rightRoom.x + Math.floor(rightRoom.w / 2),
        z: rightRoom.z + Math.floor(rightRoom.d / 2),
      };
      const corridorObjects = this.generateCorridor(fromCenter, toCenter, corridorWidth);
      objects.push(...corridorObjects);
    }
  }

  private getRoom(node: BSPNode): { x: number; z: number; w: number; d: number } | null {
    if (node.room) return node.room;
    if (node.left) {
      const r = this.getRoom(node.left);
      if (r) return r;
    }
    if (node.right) {
      const r = this.getRoom(node.right);
      if (r) return r;
    }
    return null;
  }

  private placeFurniture(rule: FurnitureRule, bounds: { x: number; z: number; w: number; d: number }, objects: PlacedObject[]): void {
    const { x, z, w, d } = bounds;
    const margin = rule.margin;
    const innerX = x + margin;
    const innerZ = z + margin;
    const innerW = w - margin * 2;
    const innerD = d - margin * 2;

    if (innerW <= 0 || innerD <= 0) return;

    switch (rule.placement) {
      case 'perimeter': {
        // Place items along the walls
        const slots: { px: number; pz: number; rot: number }[] = [];
        // North edge
        for (let i = 0; i < innerW; i += 2) {
          slots.push({ px: innerX + i, pz: innerZ, rot: 0 });
        }
        // South edge
        for (let i = 0; i < innerW; i += 2) {
          slots.push({ px: innerX + i, pz: innerZ + innerD - 1, rot: 180 });
        }
        // West edge
        for (let i = 1; i < innerD - 1; i += 2) {
          slots.push({ px: innerX, pz: innerZ + i, rot: 90 });
        }
        // East edge
        for (let i = 1; i < innerD - 1; i += 2) {
          slots.push({ px: innerX + innerW - 1, pz: innerZ + i, rot: 270 });
        }
        for (const slot of slots) {
          if (this.rng() < rule.density) {
            objects.push({
              id: this.nextId(),
              type: rule.objectType,
              position: { x: slot.px, y: 0, z: slot.pz },
              rotation: slot.rot,
            });
          }
        }
        break;
      }
      case 'center': {
        // Place in center area
        const cx = x + Math.floor(w / 2);
        const cz = z + Math.floor(d / 2);
        const spread = Math.min(innerW, innerD) / 3;
        const count = Math.max(1, Math.floor(rule.density * 4));
        for (let i = 0; i < count; i++) {
          const px = cx + Math.floor((this.rng() - 0.5) * spread * 2);
          const pz = cz + Math.floor((this.rng() - 0.5) * spread * 2);
          objects.push({
            id: this.nextId(),
            type: rule.objectType,
            position: { x: px, y: 0, z: pz },
            rotation: Math.floor(this.rng() * 4) * 90,
          });
        }
        break;
      }
      case 'corner': {
        // Place in corners
        const corners = [
          { px: innerX, pz: innerZ, rot: 0 },
          { px: innerX + innerW - 1, pz: innerZ, rot: 90 },
          { px: innerX, pz: innerZ + innerD - 1, rot: 270 },
          { px: innerX + innerW - 1, pz: innerZ + innerD - 1, rot: 180 },
        ];
        for (const corner of corners) {
          if (this.rng() < rule.density) {
            objects.push({
              id: this.nextId(),
              type: rule.objectType,
              position: { x: corner.px, y: 0, z: corner.pz },
              rotation: corner.rot,
            });
          }
        }
        break;
      }
      case 'random': {
        // Scatter randomly in the interior
        const count = Math.max(1, Math.floor(rule.density * innerW * innerD * 0.1));
        for (let i = 0; i < count; i++) {
          const px = innerX + Math.floor(this.rng() * innerW);
          const pz = innerZ + Math.floor(this.rng() * innerD);
          objects.push({
            id: this.nextId(),
            type: rule.objectType,
            position: { x: px, y: 0, z: pz },
            rotation: Math.floor(this.rng() * 4) * 90,
          });
        }
        break;
      }
    }
  }
}
