import * as THREE from 'three';
import { mergeGroup } from '../utils/mergeGroup';

export type VoxelShape = 'box' | 'rounded' | 'sphere' | 'wedge' | 'triangle' | 'cylinder';

export interface VoxelData { x: number; y: number; z: number; color: number; shape?: VoxelShape; }
export interface ModelData { name: string; gridSize: number; voxels: VoxelData[]; }

export const PALETTE: number[] = [
  0xf5d6b8,0xd4a574,0xc49464,0xa87040,
  0xff0000,0xcc2222,0x8b1a1a,0xff4444,
  0xff6b35,0xe05a2a,0xcc5522,0xff8844,
  0xffff00,0xfbbf24,0xccaa00,0x998800,
  0x00ff00,0x22c55e,0x2d5016,0x4a7a2a,
  0x00ffff,0x4a90d9,0x6080a0,0x87ceeb,
  0x0000ff,0x1e3a6e,0x1e3a5f,0x3b82f6,
  0x8b5cf6,0x7c3aed,0x6d28d9,0x9333ea,
  0xff00ff,0xec4899,0xf472b6,0xbe185d,
  0x8b4513,0x6b4513,0x5c4033,0x4a3528,
  0xffffff,0xdddddd,0xbbbbbb,0x999999,
  0x777777,0x555555,0x333333,0x111111,
  0xcccccc,0xaaaaaa,0x888888,0x666666,
  0x8b6914,0x6b5344,0x8a7050,0x5a3a0a,
  0x000000,0x1a1a1a,0x2a2a2a,0x3a3a3a,
  0xff6b35,0x1e40af,0xef4444,0x22c55e,
];

// Палитра материалов — переиспользуемые
const M = {
  // Бетон
  conc1: new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.9 }),
  conc2: new THREE.MeshStandardMaterial({ color: 0x858585, roughness: 0.9 }),
  conc3: new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.95 }),
  concDirty: new THREE.MeshLambertMaterial({ color: 0x6e6b65 }),
  // Металл
  metalDark: new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.3, metalness: 0.85 }),
  metalMid: new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.35, metalness: 0.75 }),
  metalLight: new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.3, metalness: 0.7 }),
  metalShiny: new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.15, metalness: 0.9 }),
  metalRust: new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.7, metalness: 0.4 }),
  metalPaint: new THREE.MeshStandardMaterial({ color: 0x556b7a, roughness: 0.5, metalness: 0.3 }),
  bars: new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.2, metalness: 0.9 }),
  // Дерево
  woodDark: new THREE.MeshStandardMaterial({ color: 0x4a3528, roughness: 0.85 }),
  woodMid: new THREE.MeshStandardMaterial({ color: 0x6b4c3b, roughness: 0.8 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.75 }),
  woodEdge: new THREE.MeshStandardMaterial({ color: 0x3e2c1e, roughness: 0.9 }),
  // Ткань
  mattress: new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.95 }),
  mattStripe: new THREE.MeshStandardMaterial({ color: 0x3d4654, roughness: 0.95 }),
  pillow: new THREE.MeshStandardMaterial({ color: 0xc8cdd4, roughness: 0.9 }),
  blanketA: new THREE.MeshStandardMaterial({ color: 0x5a6577, roughness: 0.9 }),
  blanketB: new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 }),
  // Сантехника
  porcBase: new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: 0.25, metalness: 0.1 }),
  porcRim: new THREE.MeshStandardMaterial({ color: 0xc0c0b8, roughness: 0.3, metalness: 0.15 }),
  porcInner: new THREE.MeshStandardMaterial({ color: 0xbabab5, roughness: 0.4 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.05, metalness: 0.95 }),
  // Книги
  bookRed: new THREE.MeshStandardMaterial({ color: 0x8b1a1a, roughness: 0.85 }),
  bookBlue: new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.85 }),
  bookGreen: new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.85 }),
  bookYellow: new THREE.MeshStandardMaterial({ color: 0x9a8520, roughness: 0.85 }),
  bookPages: new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.9 }),
  // Утилиты
  lampBody: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.6 }),
  lampGlow: new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 0.8 }),
  warning: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7 }),
  danger: new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 }),
  dangerBright: new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.5 }),
  sky: new THREE.MeshStandardMaterial({ color: 0x87ceeb, roughness: 1, emissive: 0x87ceeb, emissiveIntensity: 0.15 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xaaccdd, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.6 }),
  ventSlat: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.6 }),
  lensGlass: new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.1, metalness: 0.5 }),
  ledRed: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 }),
  // Кирпич
  brick1: new THREE.MeshStandardMaterial({ color: 0x8b4532, roughness: 0.92 }),
  brick2: new THREE.MeshStandardMaterial({ color: 0x7a3c2a, roughness: 0.92 }),
  brick3: new THREE.MeshStandardMaterial({ color: 0x9a5240, roughness: 0.9 }),
  mortar: new THREE.MeshLambertMaterial({ color: 0xb0a898 }),
  // Плитка
  tileWhite: new THREE.MeshStandardMaterial({ color: 0xddddd5, roughness: 0.3 }),
  tileGray: new THREE.MeshStandardMaterial({ color: 0x9a9a95, roughness: 0.35 }),
  tileDark: new THREE.MeshStandardMaterial({ color: 0x5a5a58, roughness: 0.4 }),
  tileBlue: new THREE.MeshStandardMaterial({ color: 0x6080a0, roughness: 0.35 }),
  tileGrout: new THREE.MeshLambertMaterial({ color: 0x888880 }),
  // Бетонные блоки
  cblock1: new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.85 }),
  cblock2: new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 0.85 }),
  cblockEdge: new THREE.MeshLambertMaterial({ color: 0x6a6a6a }),
  // Полы
  linoleum: new THREE.MeshStandardMaterial({ color: 0x7a8a6a, roughness: 0.6 }),
  linoleumDark: new THREE.MeshStandardMaterial({ color: 0x6a7a5a, roughness: 0.65 }),
  concFloorWorn: new THREE.MeshStandardMaterial({ color: 0x6d6860, roughness: 0.95 }),
  concFloorCrack: new THREE.MeshLambertMaterial({ color: 0x555048 }),
  woodFloor1: new THREE.MeshStandardMaterial({ color: 0x8a7050, roughness: 0.75 }),
  woodFloor2: new THREE.MeshStandardMaterial({ color: 0x7a6040, roughness: 0.78 }),
  // Потолки
  ceilPanel: new THREE.MeshStandardMaterial({ color: 0xc8c8c0, roughness: 0.7 }),
  ceilGrid: new THREE.MeshStandardMaterial({ color: 0xa0a098, roughness: 0.5, metalness: 0.2 }),
  ceilRust: new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.8 }),
  // Решётки
  barsThick: new THREE.MeshStandardMaterial({ color: 0x353535, roughness: 0.2, metalness: 0.92 }),
  barsRust: new THREE.MeshStandardMaterial({ color: 0x5a3a25, roughness: 0.6, metalness: 0.5 }),
  meshWire: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.7 }),
  chainlink: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.25, metalness: 0.75 }),
  // Краски
  greenPaint: new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.6 }),
  orangePaint: new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.6 }),
  whitePaint: new THREE.MeshStandardMaterial({ color: 0xe8e8e0, roughness: 0.5 }),
  // Спец-поверхности
  rubberFloor: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.95 }),
  chainMetal: new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.25, metalness: 0.85 }),
  yellowStripe: new THREE.MeshStandardMaterial({ color: 0xe6b800, roughness: 0.7 }),
  // Ткань
  fabricOrange: new THREE.MeshStandardMaterial({ color: 0xe85d2a, roughness: 0.92 }),
  fabricKhaki: new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.9 }),
  // Экраны / свечение
  screenGlow: new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.1, metalness: 0.3, emissive: 0x0a1a3a, emissiveIntensity: 0.3 }),
  emergRed: new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5, emissive: 0x880000, emissiveIntensity: 0.2 }),
  // Проволока / ржавчина
  barbedWire: new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.4, metalness: 0.7 }),
  rustPatch: new THREE.MeshStandardMaterial({ color: 0x6a3a1a, roughness: 0.85, metalness: 0.3 }),
  agedStain: new THREE.MeshLambertMaterial({ color: 0x5a5548 }),
  exitGreen: new THREE.MeshStandardMaterial({ color: 0x00aa44, roughness: 0.4, emissive: 0x00aa44, emissiveIntensity: 0.6 }),
  exitGreenFrame: new THREE.MeshStandardMaterial({ color: 0x006633, roughness: 0.5 }),
  // Terrain materials
  leafGreen: new THREE.MeshStandardMaterial({ color: 0x3a8a2a, roughness: 0.85 }),
  leafDark: new THREE.MeshStandardMaterial({ color: 0x2a6a1a, roughness: 0.85 }),
  leafLight: new THREE.MeshStandardMaterial({ color: 0x5aaa3a, roughness: 0.8 }),
  barkWhite: new THREE.MeshStandardMaterial({ color: 0xe8e0d8, roughness: 0.9 }),
  barkBrown: new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.9 }),
  barkDark: new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.92 }),
  grassGreen: new THREE.MeshStandardMaterial({ color: 0x4a7a2a, roughness: 0.9 }),
  sandBeige: new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.85 }),
  flowerRed: new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.8 }),
  flowerYellow: new THREE.MeshStandardMaterial({ color: 0xddcc22, roughness: 0.8 }),
  flowerWhite: new THREE.MeshStandardMaterial({ color: 0xeeeedd, roughness: 0.8 }),
};

export interface EditorObjectType {
  id: string;
  name: string;
  icon: string;
  category: 'walls' | 'items' | 'lighting' | 'scripts' | 'building' | 'things' | 'terrain';
  description?: string;
  create: () => THREE.Group;
}

const geoCache = new Map<string, THREE.BufferGeometry>();

function box(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
  const key = `b_${w}_${h}_${d}`;
  let geo = geoCache.get(key);
  if (!geo) {
    geo = new THREE.BoxGeometry(w, h, d);
    geoCache.set(key, geo);
  }
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rt: number, rb: number, h: number, mat: THREE.Material, seg = 12): THREE.Mesh {
  const key = `c_${rt}_${rb}_${h}_${seg}`;
  let geo = geoCache.get(key);
  if (!geo) {
    geo = new THREE.CylinderGeometry(rt, rb, h, seg);
    geoCache.set(key, geo);
  }
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

function pos(mesh: THREE.Mesh, x: number, y: number, z: number): THREE.Mesh {
  mesh.position.set(x, y, z);
  return mesh;
}

export const EDITOR_OBJECTS: EditorObjectType[] = [
  // ============ СТЕНЫ / ПОЛ / ПОТОЛОК ============
  {
    id: 'wall', name: 'Стена бетонная', icon: '🧱', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 4, 0.3, M.conc1), 0, 2, 0));
      g.add(pos(box(4, 0.15, 0.3, M.conc3), 0, 0.075, 0));
      for (let i = -1.5; i <= 1.5; i += 1) {
        g.add(pos(box(0.02, 4, 0.005, M.concDirty), i, 2, 0.148));
      }
      g.add(pos(box(4, 0.02, 0.005, M.concDirty), 0, 2, 0.148));
      // Water stain patches
      g.add(pos(box(0.6, 0.8, 0.005, M.agedStain), -1.2, 3.2, 0.148));
      g.add(pos(box(0.4, 1.0, 0.005, M.agedStain), 1.5, 1.0, 0.148));
      return mergeGroup(g);
    }
  },
  {
    id: 'wall_corner', name: 'Угол стены', icon: '📐', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(2, 4, 0.3, M.conc1), 1, 2, 0));
      g.add(pos(box(0.3, 4, 2, M.conc2), 0, 2, 1));
      g.add(pos(box(0.08, 4, 0.08, M.metalLight), 0.14, 2, 0.14));
      g.add(pos(box(2, 0.15, 0.3, M.conc3), 1, 0.075, 0));
      g.add(pos(box(0.3, 0.15, 2, M.conc3), 0, 0.075, 1));
      return mergeGroup(g);
    }
  },
  {
    id: 'floor', name: 'Пол', icon: '⬜', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.3, 4, M.conc2), 0, -0.15, 0));
      // Швы плитки
      for (let i = -1.5; i <= 1.5; i += 1) {
        g.add(pos(box(0.02, 0.01, 4, M.concDirty), i, 0.01, 0));
        g.add(pos(box(4, 0.01, 0.02, M.concDirty), 0, 0.01, i));
      }
      // Scuff marks
      g.add(pos(box(0.3, 0.005, 0.15, M.agedStain), 0.8, 0.015, -0.5));
      g.add(pos(box(0.2, 0.005, 0.25, M.agedStain), -1.2, 0.015, 1.0));
      return mergeGroup(g);
    }
  },
  {
    id: 'ceiling', name: 'Потолок', icon: '⬛', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.3, 4, M.conc3), 0, 4.15, 0));
      g.add(pos(box(4, 0.02, 0.02, M.concDirty), 0, 3.99, -1));
      g.add(pos(box(4, 0.02, 0.02, M.concDirty), 0, 3.99, 1));
      return mergeGroup(g);
    }
  },
  {
    id: 'door_frame', name: 'Дверной проём', icon: '🚪', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Стойки с фаской
      for (const x of [-0.6, 0.6]) {
        g.add(pos(box(0.12, 3.5, 0.3, M.metalDark), x, 1.75, 0));
        g.add(pos(box(0.04, 3.5, 0.3, M.metalMid), x + (x > 0 ? -0.06 : 0.06), 1.75, 0));
      }
      // Перекладина
      g.add(pos(box(1.32, 0.12, 0.3, M.metalDark), 0, 3.55, 0));
      g.add(pos(box(1.32, 0.04, 0.3, M.metalMid), 0, 3.47, 0));
      // Петли
      for (const y of [0.5, 1.5, 2.5]) {
        g.add(pos(box(0.06, 0.12, 0.06, M.metalRust), -0.57, y, 0.15));
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'bars_door', name: 'Решётка-дверь', icon: '🔒', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        g.add(pos(cyl(0.02, 0.02, 3, M.bars), -0.55 + i * 0.18, 1.5, 0));
      }
      for (const y of [0.3, 1.5, 2.7]) {
        g.add(pos(box(1.2, 0.06, 0.06, M.metalDark), 0, y, 0));
      }
      // Замок
      g.add(pos(box(0.1, 0.15, 0.06, M.metalMid), 0.5, 1.2, 0.03));
      g.add(pos(cyl(0.025, 0.025, 0.04, M.chrome), 0.5, 1.2, 0.06));
      // Invisible collision box to prevent jumping over
      const collisionBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 3.8, 0.12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      collisionBox.position.set(0, 1.9, 0);
      g.add(collisionBox);
      return mergeGroup(g);
    }
  },

  // --- Кирпичная стена ---
  {
    id: 'wall_brick', name: 'Кирпичная стена', icon: '🟫', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 4, 0.3, M.brick1), 0, 2, 0));
      for (let y = 0.15; y < 4; y += 0.3) {
        g.add(pos(box(4, 0.02, 0.005, M.mortar), 0, y, 0.148));
      }
      for (let y = 0; y < 4; y += 0.3) {
        const offset = (Math.floor(y / 0.3) % 2) * 0.4;
        for (let x = -2; x <= 2; x += 0.8) {
          g.add(pos(box(0.02, 0.28, 0.005, M.mortar), x + offset, y + 0.15, 0.148));
        }
      }
      for (let i = 0; i < 6; i++) {
        const rx = -1.6 + Math.floor(i * 0.7 * 10) / 10;
        const ry = 0.5 + (i * 0.8) % 3.5;
        g.add(pos(box(0.75, 0.26, 0.005, i % 2 === 0 ? M.brick2 : M.brick3), rx, ry, 0.148));
      }
      g.add(pos(box(4, 0.15, 0.3, M.conc3), 0, 0.075, 0));
      // Cracked mortar
      g.add(pos(box(0.5, 0.015, 0.006, M.concDirty), -0.8, 2.5, 0.149));
      g.add(pos(box(0.3, 0.015, 0.006, M.concDirty), 1.2, 1.8, 0.149));
      return mergeGroup(g);
    }
  },
  // --- Стена из бетонных блоков ---
  {
    id: 'wall_cblock', name: 'Стена из блоков', icon: '⬜', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 4, 0.3, M.cblock1), 0, 2, 0));
      for (let y = 0; y < 4; y += 0.4) {
        g.add(pos(box(4, 0.02, 0.005, M.cblockEdge), 0, y, 0.148));
        const off = (Math.floor(y / 0.4) % 2) * 0.4;
        for (let x = -2; x <= 2; x += 0.8) {
          g.add(pos(box(0.02, 0.38, 0.005, M.cblockEdge), x + off, y + 0.2, 0.148));
        }
      }
      g.add(pos(box(0.76, 0.36, 0.005, M.cblock2), 0.4, 1.2, 0.148));
      g.add(pos(box(0.76, 0.36, 0.005, M.cblock2), -1.2, 2.8, 0.148));
      g.add(pos(box(0.76, 0.36, 0.005, M.cblock2), 1.6, 3.6, 0.148));
      return mergeGroup(g);
    }
  },
  // --- Стена с плиткой ---
  {
    id: 'wall_tile', name: 'Стена с плиткой', icon: '🔲', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 4, 0.3, M.tileWhite), 0, 2, 0));
      for (let y = 0; y < 4; y += 0.5) {
        g.add(pos(box(4, 0.02, 0.005, M.tileGrout), 0, y, 0.148));
      }
      for (let x = -2; x <= 2; x += 0.5) {
        g.add(pos(box(0.02, 4, 0.005, M.tileGrout), x, 2, 0.148));
      }
      g.add(pos(box(4, 0.12, 0.005, M.tileBlue), 0, 1.5, 0.148));
      g.add(pos(box(4, 0.04, 0.005, M.tileGray), 0, 1.42, 0.148));
      g.add(pos(box(4, 0.04, 0.005, M.tileGray), 0, 1.58, 0.148));
      g.add(pos(box(4, 1.4, 0.005, M.tileDark), 0, 0.7, 0.148));
      return mergeGroup(g);
    }
  },
  // --- Стена с окрашенной панелью ---
  {
    id: 'wall_painted', name: 'Крашеная стена', icon: '🎨', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 1.5, 0.3, M.metalPaint), 0, 0.75, 0));
      g.add(pos(box(4, 2.5, 0.3, M.conc1), 0, 2.75, 0));
      g.add(pos(box(4, 0.08, 0.3, M.metalDark), 0, 1.5, 0));
      g.add(pos(box(4, 0.12, 0.3, M.conc3), 0, 0.06, 0));
      return mergeGroup(g);
    }
  },
  // --- Короткая стена (2м) ---
  {
    id: 'wall_short', name: 'Стена короткая', icon: '▬', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(2, 4, 0.3, M.conc1), 0, 2, 0));
      g.add(pos(box(2, 0.15, 0.3, M.conc3), 0, 0.075, 0));
      g.add(pos(box(2, 0.02, 0.005, M.concDirty), 0, 2, 0.148));
      return mergeGroup(g);
    }
  },
  // --- Бетонный пол (потрёпанный) ---
  {
    id: 'floor_worn', name: 'Пол бетон (старый)', icon: '🟫', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.3, 4, M.concFloorWorn), 0, -0.15, 0));
      // Трещины
      g.add(pos(box(0.03, 0.01, 2.5, M.concFloorCrack), 0.8, 0.01, -0.3));
      g.add(pos(box(1.8, 0.01, 0.03, M.concFloorCrack), -0.5, 0.01, 1.2));
      g.add(pos(box(0.03, 0.01, 1.2, M.concFloorCrack), -1.3, 0.01, 0.5));
      // Пятна
      g.add(pos(box(0.6, 0.005, 0.5, M.concDirty), 1.0, 0.01, -1.0));
      g.add(pos(box(0.4, 0.005, 0.7, M.concDirty), -0.8, 0.01, 0.8));
      // Additional stain
      g.add(pos(box(0.5, 0.005, 0.4, M.agedStain), -0.3, 0.012, -0.8));
      return mergeGroup(g);
    }
  },
  // --- Пол с линолеумом ---
  {
    id: 'floor_linoleum', name: 'Пол линолеум', icon: '🟩', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.3, 4, M.conc2), 0, -0.15, 0));
      g.add(pos(box(4, 0.02, 4, M.linoleum), 0, 0.01, 0));
      // Полоски линолеума
      for (let i = -1.5; i <= 1.5; i += 1) {
        g.add(pos(box(4, 0.005, 0.04, M.linoleumDark), 0, 0.02, i));
      }
      return mergeGroup(g);
    }
  },
  // --- Деревянный пол ---
  {
    id: 'floor_wood', name: 'Пол деревянный', icon: '🟤', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.28, 4, M.conc2), 0, -0.16, 0));
      // Доски
      for (let z = -1.8; z <= 1.8; z += 0.4) {
        const mat = Math.abs(z) % 0.8 < 0.4 ? M.woodFloor1 : M.woodFloor2;
        g.add(pos(box(4, 0.04, 0.36, mat), 0, 0.0, z));
        g.add(pos(box(4, 0.005, 0.02, M.woodEdge), 0, 0.02, z + 0.18));
      }
      return mergeGroup(g);
    }
  },
  // --- Плиточный пол ---
  {
    id: 'floor_tile', name: 'Пол плиточный', icon: '⬛', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.3, 4, M.conc2), 0, -0.15, 0));
      // Плитка шахматная
      for (let x = -1.5; x <= 1.5; x += 1) {
        for (let z = -1.5; z <= 1.5; z += 1) {
          const mat = (Math.round(x + z + 3)) % 2 === 0 ? M.tileWhite : M.tileDark;
          g.add(pos(box(0.95, 0.02, 0.95, mat), x, 0.01, z));
        }
      }
      // Швы
      for (let i = -2; i <= 2; i += 1) {
        g.add(pos(box(0.03, 0.01, 4, M.tileGrout), i + 0.5, 0.015, 0));
        g.add(pos(box(4, 0.01, 0.03, M.tileGrout), 0, 0.015, i + 0.5));
      }
      return mergeGroup(g);
    }
  },
  // --- Потолок панельный ---
  {
    id: 'ceiling_panel', name: 'Потолок панельный', icon: '🔳', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.25, 4, M.conc3), 0, 4.13, 0));
      // Панели
      for (let x = -1.5; x <= 1.5; x += 1) {
        for (let z = -1.5; z <= 1.5; z += 1) {
          g.add(pos(box(0.92, 0.04, 0.92, M.ceilPanel), x, 3.98, z));
        }
      }
      // Рамка
      for (let i = -2; i <= 2; i += 1) {
        g.add(pos(box(0.06, 0.06, 4, M.ceilGrid), i + 0.5, 3.97, 0));
        g.add(pos(box(4, 0.06, 0.06, M.ceilGrid), 0, 3.97, i + 0.5));
      }
      return mergeGroup(g);
    }
  },
  // --- Потолок ржавый ---
  {
    id: 'ceiling_rust', name: 'Потолок ржавый', icon: '🟫', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.3, 4, M.ceilRust), 0, 4.15, 0));
      // Ржавые пятна
      g.add(pos(box(0.8, 0.01, 0.6, M.metalRust), -0.5, 3.99, 0.7));
      g.add(pos(box(0.5, 0.01, 0.9, M.metalRust), 1.0, 3.99, -0.5));
      // Швы
      g.add(pos(box(4, 0.02, 0.03, M.concDirty), 0, 3.99, 0));
      g.add(pos(box(0.03, 0.02, 4, M.concDirty), 0, 3.99, 0));
      // Труба
      g.add(pos(cyl(0.06, 0.06, 4, M.metalRust), 1.5, 3.9, 0));
      return mergeGroup(g);
    }
  },
  // --- Толстая решётка ---
  {
    id: 'bars_heavy', name: 'Решётка усиленная', icon: '🔐', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        g.add(pos(cyl(0.035, 0.035, 3.2, M.barsThick), -0.5 + i * 0.25, 1.6, 0));
      }
      // Усиленные горизонтальные
      for (const y of [0.2, 1.0, 1.8, 2.6, 3.1]) {
        g.add(pos(box(1.1, 0.08, 0.08, M.barsThick), 0, y, 0));
      }
      // Сварочные точки
      for (let i = 0; i < 5; i++) {
        for (const y of [1.0, 2.6]) {
          g.add(pos(cyl(0.02, 0.02, 0.02, M.metalRust), -0.5 + i * 0.25, y, 0.02));
        }
      }
      return mergeGroup(g);
    }
  },
  // --- Ржавая решётка ---
  {
    id: 'bars_rusty', name: 'Решётка ржавая', icon: '🟤', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const r = 0.018 + (i % 3) * 0.003; // Разная толщина от ржавчины
        const m = i % 2 === 0 ? M.barsRust : M.metalRust;
        g.add(pos(cyl(r, r, 3, m), -0.55 + i * 0.18, 1.5, 0));
      }
      for (const y of [0.3, 1.5, 2.7]) {
        g.add(pos(box(1.2, 0.05, 0.05, M.barsRust), 0, y, 0));
      }
      // Ржавые подтёки на прутьях
      for (let i = 0; i < 3; i++) {
        g.add(pos(box(0.04, 0.3, 0.01, M.metalRust), -0.55 + (i * 2 + 1) * 0.18, 0.8, 0.02));
      }
      return mergeGroup(g);
    }
  },
  // --- Сетка-рабица ---
  {
    id: 'mesh_fence', name: 'Сетка-рабица', icon: '🔗', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Рамка
      g.add(pos(box(0.08, 3, 0.08, M.metalDark), -1.0, 1.5, 0));
      g.add(pos(box(0.08, 3, 0.08, M.metalDark), 1.0, 1.5, 0));
      g.add(pos(box(2.08, 0.08, 0.08, M.metalDark), 0, 3, 0));
      g.add(pos(box(2.08, 0.08, 0.08, M.metalDark), 0, 0.05, 0));
      // Диагональная сетка
      for (let i = 0; i < 12; i++) {
        const w = box(0.015, 0.015, 2.7, M.meshWire);
        w.position.set(-0.9 + i * 0.16, 1.5, 0);
        w.rotation.z = 0.7;
        g.add(w);
        const w2 = box(0.015, 0.015, 2.7, M.meshWire);
        w2.position.set(-0.9 + i * 0.16, 1.5, 0);
        w2.rotation.z = -0.7;
        g.add(w2);
      }
      return mergeGroup(g);
    }
  },

  // --- Industrial Metal Wall Panel ---
  {
    id: 'wall_metal_panel', name: 'Металлическая панель', icon: '🔩', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Main panel
      g.add(pos(box(4, 4, 0.25, M.metalMid), 0, 2, 0));
      // Horizontal panel seams
      for (const y of [1.0, 2.0, 3.0]) {
        g.add(pos(box(4, 0.03, 0.01, M.metalDark), 0, y, 0.126));
      }
      // Vertical seams
      for (const x of [-1.3, 0, 1.3]) {
        g.add(pos(box(0.03, 4, 0.01, M.metalDark), x, 2, 0.126));
      }
      // Rivets at seam intersections
      for (const x of [-1.3, 0, 1.3]) {
        for (const y of [1.0, 2.0, 3.0, 3.8]) {
          g.add(pos(cyl(0.025, 0.025, 0.02, M.metalShiny, 6), x, y, 0.136));
        }
      }
      // Rust patches
      g.add(pos(box(0.5, 0.4, 0.005, M.rustPatch), -1.0, 0.8, 0.128));
      g.add(pos(box(0.4, 0.3, 0.005, M.rustPatch), 1.5, 2.5, 0.128));
      g.add(pos(box(0.6, 0.35, 0.005, M.rustPatch), 0.3, 3.5, 0.128));
      // Bottom corrosion strip
      g.add(pos(box(4, 0.2, 0.005, M.metalRust), 0, 0.1, 0.128));
      // Mounting bolt heads at corners
      g.add(pos(cyl(0.03, 0.03, 0.02, M.metalDark, 6), -1.8, 0.2, 0.136));
      g.add(pos(cyl(0.03, 0.03, 0.02, M.metalDark, 6), 1.8, 0.2, 0.136));
      g.add(pos(cyl(0.03, 0.03, 0.02, M.metalDark, 6), -1.8, 3.8, 0.136));
      g.add(pos(cyl(0.03, 0.03, 0.02, M.metalDark, 6), 1.8, 3.8, 0.136));
      // Green paint section (lower panel)
      g.add(pos(box(4, 1.2, 0.005, M.greenPaint), 0, 0.7, 0.128));
      return mergeGroup(g);
    }
  },
  // --- Ventilation Duct Section ---
  {
    id: 'wall_vent_duct', name: 'Вентиляционный короб', icon: '🌀', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Main rectangular duct body
      g.add(pos(box(4, 1.0, 0.8, M.metalLight), 0, 3.0, 0));
      // Seam lines along length (top and bottom edges)
      g.add(pos(box(4, 0.02, 0.01, M.metalDark), 0, 3.5, 0.4));
      g.add(pos(box(4, 0.02, 0.01, M.metalDark), 0, 2.5, 0.4));
      // Mounting brackets (L-brackets)
      for (const x of [-1.5, 0, 1.5]) {
        g.add(pos(box(0.08, 0.2, 0.06, M.metalDark), x, 2.4, 0));
        g.add(pos(box(0.08, 0.06, 0.2, M.metalDark), x, 2.5, -0.3));
      }
      // End flange
      g.add(pos(box(0.08, 1.05, 0.85, M.metalMid), 2.0, 3.0, 0));
      // Surface dents (overlay patches)
      g.add(pos(box(0.5, 0.4, 0.01, M.metalMid), -0.8, 3.1, 0.41));
      g.add(pos(box(0.4, 0.3, 0.01, M.metalMid), 1.0, 2.9, 0.41));
      g.add(pos(box(0.35, 0.35, 0.01, M.metalMid), 0.2, 3.2, 0.41));
      // Screws at bracket points
      for (const x of [-1.5, 0, 1.5]) {
        g.add(pos(cyl(0.02, 0.02, 0.015, M.metalShiny, 6), x, 2.35, 0.02));
        g.add(pos(cyl(0.02, 0.02, 0.015, M.metalShiny, 6), x, 2.52, -0.35));
      }
      return mergeGroup(g);
    }
  },

  // ============ ПРЕДМЕТЫ ============
  {
    id: 'bunkbed', name: 'Двухъярусная койка', icon: '🛏️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Стойки с закруглёнными заглушками
      for (const dx of [-0.85, 0.85]) {
        for (const dz of [-0.85, 0.85]) {
          g.add(pos(box(0.06, 2.15, 0.06, M.metalPaint), dx, 1.08, dz));
          g.add(pos(cyl(0.04, 0.04, 0.04, M.metalDark), dx, 2.18, dz)); // заглушка
          g.add(pos(cyl(0.05, 0.05, 0.02, M.metalRust), dx, 0.01, dz)); // ножка
        }
      }
      // Перекладины
      for (const y of [0.78, 2.18]) {
        g.add(pos(box(1.64, 0.04, 0.04, M.metalDark), 0, y, -0.85));
        g.add(pos(box(1.64, 0.04, 0.04, M.metalDark), 0, y, 0.85));
      }
      // Нижняя койка
      g.add(pos(box(1.7, 0.06, 1.68, M.metalMid), 0, 0.5, 0));
      g.add(pos(box(1.62, 0.1, 1.6, M.mattress), 0, 0.58, 0));
      // Полоски на матрасе
      for (let i = -0.6; i <= 0.6; i += 0.3) {
        g.add(pos(box(1.58, 0.005, 0.08, M.mattStripe), 0, 0.64, i));
      }
      g.add(pos(box(0.55, 0.12, 0.3, M.pillow), 0, 0.69, -0.6));
      g.add(pos(box(1.5, 0.06, 0.8, M.blanketA), 0, 0.64, 0.3));
      g.add(pos(box(1.46, 0.02, 0.15, M.blanketB), 0, 0.68, 0.65)); // загиб

      // Верхняя койка
      g.add(pos(box(1.7, 0.06, 1.68, M.metalMid), 0, 1.68, 0));
      g.add(pos(box(1.62, 0.1, 1.6, M.mattress), 0, 1.76, 0));
      for (let i = -0.6; i <= 0.6; i += 0.3) {
        g.add(pos(box(1.58, 0.005, 0.08, M.mattStripe), 0, 1.82, i));
      }
      g.add(pos(box(0.55, 0.12, 0.3, M.pillow), 0, 1.87, -0.6));

      // Лестница
      g.add(pos(box(0.04, 2, 0.04, M.metalDark), 0.95, 1, 0.3));
      g.add(pos(box(0.04, 2, 0.04, M.metalDark), 0.95, 1, -0.3));
      for (let i = 0; i < 5; i++) {
        g.add(pos(box(0.04, 0.04, 0.56, M.metalLight), 0.95, 0.3 + i * 0.4, 0));
      }
      // Бортик верхней койки
      g.add(pos(box(1.7, 0.2, 0.04, M.metalPaint), 0, 1.92, 0.84));
      return mergeGroup(g);
    }
  },
  {
    id: 'single_bed', name: 'Одиночная койка', icon: '🛌', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Рама
      g.add(pos(box(1.8, 0.08, 0.04, M.metalPaint), 0, 0.3, -0.43));
      g.add(pos(box(1.8, 0.08, 0.04, M.metalPaint), 0, 0.3, 0.43));
      g.add(pos(box(0.04, 0.15, 0.9, M.metalPaint), -0.88, 0.24, 0));
      g.add(pos(box(0.04, 0.15, 0.9, M.metalPaint), 0.88, 0.24, 0));
      // Основание
      g.add(pos(box(1.75, 0.05, 0.85, M.metalMid), 0, 0.2, 0));
      // Ножки
      for (const dx of [-0.85, 0.85]) {
        for (const dz of [-0.4, 0.4]) {
          g.add(pos(cyl(0.03, 0.03, 0.16, M.metalDark), dx, 0.08, dz));
        }
      }
      // Матрас
      g.add(pos(box(1.7, 0.14, 0.78, M.mattress), 0, 0.34, 0));
      for (let i = -0.3; i <= 0.3; i += 0.15) {
        g.add(pos(box(1.66, 0.004, 0.06, M.mattStripe), 0, 0.42, i));
      }
      // Подушка
      g.add(pos(box(0.4, 0.1, 0.5, M.pillow), -0.6, 0.47, 0));
      // Одеяло
      g.add(pos(box(0.9, 0.06, 0.7, M.blanketA), 0.3, 0.42, 0));
      g.add(pos(box(0.86, 0.02, 0.1, M.blanketB), 0.3, 0.46, 0.35));
      return mergeGroup(g);
    }
  },
  {
    id: 'toilet', name: 'Туалет', icon: '🚽', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Основание
      g.add(pos(box(0.42, 0.35, 0.5, M.porcBase), 0, 0.18, 0));
      // Закругление спереди
      g.add(pos(cyl(0.2, 0.2, 0.35, M.porcBase, 16), 0, 0.18, 0.15));
      // Ободок
      g.add(pos(box(0.4, 0.06, 0.45, M.porcRim), 0, 0.39, 0.03));
      // Внутренняя часть (тёмная)
      g.add(pos(box(0.3, 0.04, 0.35, M.porcInner), 0, 0.38, 0.03));
      // Бачок
      g.add(pos(box(0.36, 0.32, 0.16, M.porcBase), 0, 0.52, -0.22));
      g.add(pos(box(0.38, 0.04, 0.18, M.porcRim), 0, 0.7, -0.22)); // крышка бачка
      // Кнопка
      g.add(pos(cyl(0.04, 0.04, 0.03, M.chrome, 16), 0, 0.73, -0.22));
      // Труба
      g.add(pos(cyl(0.02, 0.02, 0.3, M.chrome), -0.2, 0.5, -0.32));
      return mergeGroup(g);
    }
  },
  {
    id: 'sink', name: 'Раковина', icon: '🚰', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Раковина
      g.add(pos(box(0.48, 0.06, 0.38, M.porcBase), 0, 0.92, 0));
      g.add(pos(box(0.38, 0.08, 0.28, M.porcInner), 0, 0.87, 0.02)); // впадина
      g.add(pos(box(0.48, 0.03, 0.02, M.porcRim), 0, 0.96, -0.18)); // задний бортик
      // Ножка-пьедестал
      g.add(pos(box(0.15, 0.88, 0.12, M.porcBase), 0, 0.44, -0.05));
      g.add(pos(box(0.2, 0.04, 0.16, M.porcBase), 0, 0.0, -0.05)); // основание
      // Кран
      g.add(pos(cyl(0.025, 0.02, 0.18, M.chrome, 8), 0, 1.05, -0.12));
      const spout = cyl(0.015, 0.012, 0.12, M.chrome, 8);
      spout.position.set(0, 1.1, -0.04);
      spout.rotation.x = Math.PI / 3;
      g.add(spout);
      // Вентили
      g.add(pos(cyl(0.02, 0.02, 0.03, M.chrome, 6), -0.08, 1.0, -0.12));
      g.add(pos(cyl(0.02, 0.02, 0.03, M.chrome, 6), 0.08, 1.0, -0.12));
      // Зеркало над раковиной
      g.add(pos(box(0.4, 0.5, 0.02, M.glass), 0, 1.5, -0.2));
      g.add(pos(box(0.44, 0.54, 0.015, M.metalMid), 0, 1.5, -0.21)); // рамка
      return mergeGroup(g);
    }
  },
  {
    id: 'table', name: 'Стол', icon: '📦', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Столешница
      g.add(pos(box(1.2, 0.05, 0.7, M.woodMid), 0, 0.78, 0));
      // Кромка
      g.add(pos(box(1.22, 0.02, 0.02, M.woodEdge), 0, 0.76, 0.35));
      g.add(pos(box(1.22, 0.02, 0.02, M.woodEdge), 0, 0.76, -0.35));
      g.add(pos(box(0.02, 0.02, 0.72, M.woodEdge), 0.6, 0.76, 0));
      g.add(pos(box(0.02, 0.02, 0.72, M.woodEdge), -0.6, 0.76, 0));
      // Ножки
      for (const dx of [-0.5, 0.5]) {
        for (const dz of [-0.28, 0.28]) {
          g.add(pos(box(0.06, 0.74, 0.06, M.woodDark), dx, 0.37, dz));
        }
      }
      // Перекладина под столом
      g.add(pos(box(0.9, 0.04, 0.04, M.woodDark), 0, 0.2, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'chair', name: 'Стул', icon: '🪑', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Сиденье
      g.add(pos(box(0.42, 0.04, 0.4, M.woodMid), 0, 0.45, 0));
      g.add(pos(box(0.42, 0.02, 0.4, M.woodLight), 0, 0.47, 0)); // верхний слой
      // Спинка
      g.add(pos(box(0.42, 0.45, 0.04, M.woodMid), 0, 0.72, -0.18));
      // Планки спинки
      g.add(pos(box(0.08, 0.3, 0.03, M.woodDark), -0.12, 0.72, -0.17));
      g.add(pos(box(0.08, 0.3, 0.03, M.woodDark), 0.12, 0.72, -0.17));
      // Ножки
      for (const dx of [-0.17, 0.17]) {
        for (const dz of [-0.16, 0.16]) {
          g.add(pos(box(0.035, 0.44, 0.035, M.woodDark), dx, 0.22, dz));
        }
      }
      // Перекладины между ножками
      g.add(pos(box(0.3, 0.03, 0.03, M.woodEdge), 0, 0.12, 0.16));
      g.add(pos(box(0.3, 0.03, 0.03, M.woodEdge), 0, 0.12, -0.16));
      return mergeGroup(g);
    }
  },
  {
    id: 'stool', name: 'Табурет', icon: '🔵', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.19, 0.19, 0.04, M.metalLight, 16), 0, 0.5, 0));
      g.add(pos(cyl(0.17, 0.17, 0.02, M.metalMid, 16), 0, 0.48, 0)); // вмятина
      g.add(pos(cyl(0.04, 0.06, 0.46, M.metalDark), 0, 0.25, 0));
      // 3 ножки
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const foot = cyl(0.015, 0.02, 0.06, M.metalRust);
        foot.position.set(Math.sin(angle) * 0.13, 0.01, Math.cos(angle) * 0.13);
        g.add(foot);
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'shelf', name: 'Полка с книгами', icon: '📚', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Полка
      g.add(pos(box(0.8, 0.03, 0.22, M.metalLight), 0, 1.5, 0));
      g.add(pos(box(0.8, 0.015, 0.22, M.metalMid), 0, 1.485, 0)); // нижняя сторона
      // L-крепления
      for (const x of [-0.33, 0.33]) {
        g.add(pos(box(0.03, 0.14, 0.04, M.metalDark), x, 1.43, -0.08));
        g.add(pos(box(0.03, 0.03, 0.18, M.metalDark), x, 1.47, 0.02));
      }
      // Книги (с видимыми страницами)
      g.add(pos(box(0.07, 0.2, 0.16, M.bookRed), -0.3, 1.62, 0));
      g.add(pos(box(0.01, 0.18, 0.13, M.bookPages), -0.26, 1.62, 0));
      g.add(pos(box(0.055, 0.16, 0.16, M.bookBlue), -0.19, 1.6, 0));
      g.add(pos(box(0.01, 0.14, 0.13, M.bookPages), -0.155, 1.6, 0));
      g.add(pos(box(0.065, 0.19, 0.16, M.bookGreen), -0.09, 1.62, 0));
      g.add(pos(box(0.04, 0.14, 0.16, M.bookYellow), -0.02, 1.59, 0));
      // Наклонённая книга
      const leaning = box(0.06, 0.17, 0.14, M.bookRed);
      leaning.position.set(0.08, 1.58, 0);
      leaning.rotation.z = 0.25;
      g.add(leaning);
      return mergeGroup(g);
    }
  },

  // --- Скамейка ---
  {
    id: 'bench', name: 'Скамейка', icon: '🪑', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(2, 0.08, 0.4, M.woodMid), 0, 0.45, 0));
      g.add(pos(box(2, 0.04, 0.4, M.woodLight), 0, 0.49, 0));
      for (const dx of [-0.8, 0, 0.8]) {
        g.add(pos(box(0.06, 0.44, 0.35, M.metalDark), dx, 0.22, 0));
      }
      return mergeGroup(g);
    }
  },
  // --- Шкафчик ---
  {
    id: 'locker', name: 'Шкафчик', icon: '🗄️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.5, 1.8, 0.45, M.metalPaint), 0, 0.9, 0));
      g.add(pos(box(0.46, 1.74, 0.02, M.metalMid), 0, 0.9, 0.22));
      g.add(pos(box(0.46, 0.005, 0.42, M.metalDark), 0, 0.9, 0));
      g.add(pos(box(0.04, 0.12, 0.02, M.chrome), 0.18, 1.1, 0.24));
      g.add(pos(box(0.06, 0.06, 0.02, M.metalDark), 0.18, 0.9, 0.24));
      for (let y = 0.1; y <= 1.7; y += 0.4) {
        g.add(pos(box(0.42, 0.005, 0.005, M.metalDark), 0, y, 0.23));
      }
      return mergeGroup(g);
    }
  },
  // --- Двойной шкафчик ---
  {
    id: 'locker_double', name: 'Шкафчики (2)', icon: '🗄️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      for (const dx of [-0.27, 0.27]) {
        const c = dx < 0 ? M.metalPaint : M.metalMid;
        g.add(pos(box(0.5, 1.8, 0.45, c), dx, 0.9, 0));
        g.add(pos(box(0.46, 1.74, 0.02, M.metalLight), dx, 0.9, 0.22));
        g.add(pos(box(0.04, 0.12, 0.02, M.chrome), dx + 0.18, 1.1, 0.24));
      }
      g.add(pos(box(0.02, 1.8, 0.45, M.metalDark), 0, 0.9, 0));
      return mergeGroup(g);
    }
  },
  // --- Мусорное ведро ---
  {
    id: 'trashcan', name: 'Мусорное ведро', icon: '🗑️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.18, 0.15, 0.5, M.metalMid, 10), 0, 0.25, 0));
      g.add(pos(cyl(0.19, 0.19, 0.03, M.metalDark, 10), 0, 0.51, 0));
      g.add(pos(cyl(0.16, 0.14, 0.02, M.metalLight, 10), 0, 0.01, 0));
      // Мусор внутри
      g.add(pos(box(0.12, 0.08, 0.1, M.bookPages), 0.03, 0.45, 0));
      g.add(pos(cyl(0.05, 0.04, 0.06, M.concDirty, 6), -0.05, 0.42, 0.04));
      return mergeGroup(g);
    }
  },
  // --- Радиатор ---
  {
    id: 'radiator', name: 'Радиатор', icon: '🔥', category: 'items',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        g.add(pos(box(0.06, 0.6, 0.08, M.porcBase), -0.42 + i * 0.12, 0.4, 0));
      }
      g.add(pos(box(1, 0.04, 0.1, M.porcRim), 0, 0.72, 0));
      g.add(pos(box(1, 0.04, 0.1, M.porcRim), 0, 0.08, 0));
      g.add(pos(cyl(0.02, 0.02, 0.3, M.chrome), -0.42, 0.56, -0.06));
      g.add(pos(cyl(0.015, 0.015, 0.02, M.danger, 6), -0.42, 0.72, -0.06));
      return mergeGroup(g);
    }
  },
  // --- Телевизор на стену ---
  {
    id: 'tv', name: 'Телевизор', icon: '📺', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.8, 0.5, 0.04, M.metalDark), 0, 2.2, 0));
      g.add(pos(box(0.74, 0.44, 0.005, new THREE.MeshStandardMaterial({
        color: 0x111122, roughness: 0.1, metalness: 0.3, emissive: 0x0a0a20, emissiveIntensity: 0.2
      })), 0, 2.2, 0.021));
      g.add(pos(box(0.82, 0.02, 0.05, M.metalMid), 0, 1.94, 0));
      g.add(pos(box(0.1, 0.08, 0.04, M.metalDark), 0, 2.5, -0.02));
      return mergeGroup(g);
    }
  },
  // --- Ящик / коробка ---
  {
    id: 'crate', name: 'Ящик', icon: '📦', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.7, 0.5, 0.5, M.woodMid), 0, 0.25, 0));
      for (const dx of [-0.36, 0.36]) {
        g.add(pos(box(0.04, 0.5, 0.5, M.woodEdge), dx, 0.25, 0));
      }
      for (const dz of [-0.26, 0.26]) {
        g.add(pos(box(0.7, 0.5, 0.04, M.woodEdge), 0, 0.25, dz));
      }
      g.add(pos(box(0.7, 0.04, 0.5, M.woodDark), 0, 0.5, 0));
      g.add(pos(box(0.5, 0.03, 0.04, M.metalRust), 0, 0.52, 0));
      return mergeGroup(g);
    }
  },
  // --- Бочка ---
  {
    id: 'barrel', name: 'Бочка', icon: '🛢️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.25, 0.22, 0.9, M.metalPaint, 16), 0, 0.45, 0));
      g.add(pos(cyl(0.26, 0.26, 0.06, M.metalDark, 16), 0, 0.15, 0));
      g.add(pos(cyl(0.26, 0.26, 0.06, M.metalDark, 16), 0, 0.75, 0));
      g.add(pos(cyl(0.23, 0.23, 0.02, M.metalMid, 16), 0, 0.9, 0));
      g.add(pos(cyl(0.03, 0.03, 0.04, M.metalDark), 0.1, 0.92, 0));
      return mergeGroup(g);
    }
  },
  // --- Поддон ---
  {
    id: 'pallet', name: 'Поддон', icon: '🟫', category: 'items',
    create: () => {
      const g = new THREE.Group();
      for (let x = -0.4; x <= 0.4; x += 0.4) {
        g.add(pos(box(0.12, 0.12, 0.8, M.woodDark), x, 0.06, 0));
      }
      for (let z = -0.35; z <= 0.35; z += 0.175) {
        g.add(pos(box(1, 0.03, 0.14, M.woodMid), 0, 0.14, z));
      }
      return mergeGroup(g);
    }
  },
  // --- Матрас на полу ---
  {
    id: 'mattress_floor', name: 'Матрас на полу', icon: '🛏️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.8, 0.12, 0.8, M.mattress), 0, 0.06, 0));
      for (let i = -0.3; i <= 0.3; i += 0.15) {
        g.add(pos(box(1.76, 0.004, 0.06, M.mattStripe), 0, 0.12, i));
      }
      g.add(pos(box(0.4, 0.08, 0.35, M.pillow), -0.6, 0.14, 0));
      g.add(pos(box(1.0, 0.05, 0.7, M.blanketA), 0.2, 0.12, 0));
      return mergeGroup(g);
    }
  },

  // --- Тумбочка ---
  {
    id: 'nightstand', name: 'Тумбочка', icon: '🔲', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.5, 0.6, 0.4, M.woodMid), 0, 0.3, 0));
      g.add(pos(box(0.48, 0.02, 0.38, M.woodLight), 0, 0.6, 0));
      g.add(pos(box(0.42, 0.2, 0.02, M.woodDark), 0, 0.35, 0.18));
      g.add(pos(box(0.06, 0.04, 0.02, M.metalLight), 0, 0.35, 0.2));
      for (const dx of [-0.2, 0.2]) for (const dz of [-0.15, 0.15]) {
        g.add(pos(box(0.04, 0.04, 0.04, M.woodDark), dx, 0.02, dz));
      }
      return mergeGroup(g);
    }
  },
  // --- Кресло ---
  {
    id: 'armchair', name: 'Кресло', icon: '🪑', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.55, 0.08, 0.5, M.mattress), 0, 0.35, 0));
      g.add(pos(box(0.55, 0.5, 0.06, M.mattress), 0, 0.55, -0.22));
      g.add(pos(box(0.06, 0.3, 0.5, M.mattress), -0.28, 0.45, 0));
      g.add(pos(box(0.06, 0.3, 0.5, M.mattress), 0.28, 0.45, 0));
      for (const dx of [-0.2, 0.2]) for (const dz of [-0.18, 0.18]) {
        g.add(pos(box(0.05, 0.3, 0.05, M.woodDark), dx, 0.15, dz));
      }
      return mergeGroup(g);
    }
  },
  // --- Телефон настенный ---
  {
    id: 'phone_wall', name: 'Телефон настенный', icon: '📞', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.2, 0.3, 0.08, M.metalDark), 0, 1.4, 0));
      g.add(pos(box(0.18, 0.06, 0.04, M.metalMid), 0, 1.5, 0.04));
      g.add(pos(box(0.06, 0.15, 0.04, M.metalDark), -0.12, 1.35, 0.05));
      const cord = cyl(0.01, 0.01, 0.2, M.metalDark);
      cord.position.set(-0.08, 1.25, 0.04); cord.rotation.z = 0.5;
      g.add(cord);
      return mergeGroup(g);
    }
  },
  // --- Диван ---
  {
    id: 'sofa', name: 'Диван', icon: '🛋️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.6, 0.35, 0.7, M.mattress), 0, 0.18, 0));
      g.add(pos(box(1.6, 0.12, 0.65, M.blanketA), 0, 0.4, 0));
      g.add(pos(box(1.6, 0.5, 0.08, M.mattress), 0, 0.55, -0.31));
      g.add(pos(box(0.08, 0.35, 0.7, M.mattress), -0.76, 0.38, 0));
      g.add(pos(box(0.08, 0.35, 0.7, M.mattress), 0.76, 0.38, 0));
      for (const dx of [-0.6, 0.6]) for (const dz of [-0.25, 0.25]) {
        g.add(pos(box(0.06, 0.1, 0.06, M.woodDark), dx, 0.05, dz));
      }
      return mergeGroup(g);
    }
  },
  // --- Книжный шкаф ---
  {
    id: 'bookcase', name: 'Книжный шкаф', icon: '📚', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.8, 2.2, 0.35, M.woodMid), 0, 1.1, 0));
      for (let y = 0.4; y <= 2; y += 0.4) {
        g.add(pos(box(0.76, 0.03, 0.32, M.woodDark), 0, y, 0));
      }
      const bookColors = [M.bookRed, M.bookBlue, M.bookGreen, M.bookYellow];
      for (let shelf = 0; shelf < 4; shelf++) {
        for (let i = 0; i < 5; i++) {
          const bw = 0.06 + Math.random() * 0.04;
          const bh = 0.28 + Math.random() * 0.08;
          g.add(pos(box(bw, bh, 0.2, bookColors[(shelf + i) % 4]), -0.3 + i * 0.14, 0.55 + shelf * 0.4, 0));
        }
      }
      return mergeGroup(g);
    }
  },
  // --- Металлический ящик ---
  {
    id: 'metal_crate', name: 'Ящик металлический', icon: '📦', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.7, 0.5, 0.5, M.metalPaint), 0, 0.25, 0));
      g.add(pos(box(0.72, 0.04, 0.52, M.metalDark), 0, 0.5, 0));
      for (const dx of [-0.36, 0.36]) {
        g.add(pos(box(0.04, 0.5, 0.5, M.metalMid), dx, 0.25, 0));
      }
      g.add(pos(box(0.3, 0.06, 0.04, M.metalLight), 0, 0.52, 0.2));
      g.add(pos(box(0.1, 0.08, 0.04, M.metalShiny), 0.25, 0.28, 0.26));
      return mergeGroup(g);
    }
  },
  // --- Клетка для мяча ---
  {
    id: 'ball_cage', name: 'Корзина для мячей', icon: '🏀', category: 'items',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        g.add(pos(cyl(0.02, 0.02, 0.8, M.metalDark), Math.sin(angle) * 0.35, 0.4, Math.cos(angle) * 0.35));
      }
      g.add(pos(cyl(0.38, 0.38, 0.03, M.metalMid, 16), 0, 0.01, 0));
      g.add(pos(cyl(0.36, 0.36, 0.02, M.metalDark, 16), 0, 0.4, 0));
      return mergeGroup(g);
    }
  },
  // --- Табличка / указатель ---
  {
    id: 'sign_post', name: 'Указатель', icon: '🪧', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.04, 0.04, 2, M.metalDark), 0, 1, 0));
      g.add(pos(box(0.8, 0.3, 0.04, M.warning), 0, 1.8, 0));
      g.add(pos(box(0.76, 0.26, 0.005, M.metalDark), 0, 1.8, 0.02));
      return mergeGroup(g);
    }
  },
  // --- Мусорный контейнер ---
  {
    id: 'dumpster', name: 'Контейнер мусорный', icon: '🗑️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.2, 0.9, 0.8, M.metalPaint), 0, 0.45, 0));
      g.add(pos(box(1.22, 0.05, 0.82, M.metalDark), 0, 0.9, 0));
      g.add(pos(box(1.24, 0.08, 0.04, M.metalMid), 0, 0.95, -0.38));
      for (const dx of [-0.4, 0.4]) {
        g.add(pos(cyl(0.06, 0.06, 0.1, M.metalDark, 8), dx, 0.05, -0.35));
        g.add(pos(cyl(0.06, 0.06, 0.1, M.metalDark, 8), dx, 0.05, 0.35));
      }
      return mergeGroup(g);
    }
  },
  // --- Конус дорожный ---
  {
    id: 'traffic_cone', name: 'Дорожный конус', icon: '🔶', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.25, 0.03, 0.25, M.metalDark), 0, 0.015, 0));
      g.add(pos(cyl(0.1, 0.04, 0.5, M.danger, 8), 0, 0.28, 0));
      g.add(pos(cyl(0.08, 0.07, 0.08, M.porcBase, 8), 0, 0.22, 0));
      return mergeGroup(g);
    }
  },
  // --- Стиральная машина ---
  {
    id: 'washing_machine', name: 'Стиральная машина', icon: '🧺', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.6, 0.85, 0.6, M.porcBase), 0, 0.425, 0));
      g.add(pos(cyl(0.2, 0.2, 0.05, M.metalShiny, 16), 0, 0.5, 0.31));
      g.add(pos(cyl(0.17, 0.17, 0.02, M.metalDark, 16), 0, 0.5, 0.32));
      g.add(pos(box(0.5, 0.08, 0.55, M.porcRim), 0, 0.88, 0));
      for (let i = 0; i < 3; i++) g.add(pos(cyl(0.03, 0.03, 0.02, M.metalMid, 8), -0.15 + i * 0.15, 0.9, -0.15));
      return mergeGroup(g);
    }
  },
  // --- Умывальник двойной ---
  {
    id: 'sink_double', name: 'Умывальник двойной', icon: '🚰', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.2, 0.08, 0.5, M.porcBase), 0, 0.85, 0));
      for (const dx of [-0.3, 0.3]) {
        g.add(pos(box(0.35, 0.1, 0.35, M.porcInner), dx, 0.8, 0));
        g.add(pos(cyl(0.02, 0.02, 0.18, M.chrome, 8), dx, 1.0, -0.15));
      }
      g.add(pos(box(0.06, 0.85, 0.45, M.porcBase), -0.57, 0.42, 0));
      g.add(pos(box(0.06, 0.85, 0.45, M.porcBase), 0.57, 0.42, 0));
      return mergeGroup(g);
    }
  },
  // --- Зеркало большое ---
  {
    id: 'mirror_large', name: 'Зеркало большое', icon: '🪞', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.0, 1.2, 0.03, M.glass), 0, 1.8, 0));
      g.add(pos(box(1.06, 1.26, 0.02, M.metalMid), 0, 1.8, -0.01));
      return mergeGroup(g);
    }
  },
  // --- Вешалка ---
  {
    id: 'coat_rack', name: 'Вешалка', icon: '🧥', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.04, 0.06, 1.7, M.woodDark), 0, 0.85, 0));
      g.add(pos(cyl(0.25, 0.25, 0.03, M.woodDark, 12), 0, 0.015, 0));
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const hook = cyl(0.02, 0.02, 0.15, M.metalDark);
        hook.position.set(Math.sin(a) * 0.12, 1.65, Math.cos(a) * 0.12);
        hook.rotation.z = Math.sin(a) * 0.5;
        hook.rotation.x = Math.cos(a) * 0.5;
        g.add(hook);
      }
      return mergeGroup(g);
    }
  },
  // --- Водяной кулер ---
  {
    id: 'water_cooler', name: 'Кулер для воды', icon: '🚰', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.35, 1.0, 0.35, M.porcBase), 0, 0.5, 0));
      g.add(pos(cyl(0.14, 0.14, 0.4, M.metalPaint, 12), 0, 1.2, 0));
      g.add(pos(cyl(0.13, 0.15, 0.03, M.metalDark, 12), 0, 1.0, 0));
      g.add(pos(box(0.06, 0.04, 0.08, M.danger), 0.12, 0.7, 0.15));
      g.add(pos(box(0.06, 0.04, 0.08, M.metalPaint), -0.12, 0.7, 0.15));
      return mergeGroup(g);
    }
  },
  // --- Мешок с песком ---
  {
    id: 'sandbag', name: 'Мешок с песком', icon: '💰', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.6, 0.25, 0.35, M.woodLight), 0, 0.125, 0));
      g.add(pos(box(0.55, 0.05, 0.3, M.woodEdge), 0, 0.26, 0));
      return mergeGroup(g);
    }
  },
  // --- Стопка мешков ---
  {
    id: 'sandbag_stack', name: 'Баррикада из мешков', icon: '🧱', category: 'items',
    create: () => {
      const g = new THREE.Group();
      for (let y = 0; y < 3; y++) {
        const offset = y % 2 === 0 ? 0 : 0.15;
        g.add(pos(box(0.6, 0.25, 0.35, M.woodLight), offset, 0.125 + y * 0.25, 0));
        g.add(pos(box(0.6, 0.25, 0.35, M.woodLight), offset - 0.6, 0.125 + y * 0.25, 0));
      }
      return mergeGroup(g);
    }
  },
  // --- Лестница ---
  {
    id: 'ladder', name: 'Лестница', icon: '🪜', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.04, 3, 0.04, M.metalDark), -0.2, 1.5, 0));
      g.add(pos(box(0.04, 3, 0.04, M.metalDark), 0.2, 1.5, 0));
      for (let i = 0; i < 8; i++) {
        g.add(pos(box(0.36, 0.03, 0.04, M.metalLight), 0, 0.3 + i * 0.35, 0));
      }
      return mergeGroup(g);
    }
  },
  // --- Забор деревянный ---
  {
    id: 'fence_wood', name: 'Забор деревянный', icon: '🪵', category: 'items',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const h = 1.2 + Math.sin(i * 1.5) * 0.1;
        g.add(pos(box(0.1, h, 0.04, i % 2 === 0 ? M.woodMid : M.woodLight), -0.8 + i * 0.4, h / 2, 0));
      }
      g.add(pos(box(2, 0.06, 0.04, M.woodDark), 0, 0.4, 0));
      g.add(pos(box(2, 0.06, 0.04, M.woodDark), 0, 0.9, 0));
      return mergeGroup(g);
    }
  },

  // --- Скамья для жима ---
  {
    id: 'weight_bench', name: 'Скамья для жима', icon: '🏋️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Frame legs
      g.add(pos(box(0.06, 0.45, 0.06, M.metalDark), -0.5, 0.225, -0.3));
      g.add(pos(box(0.06, 0.45, 0.06, M.metalDark), -0.5, 0.225, 0.3));
      g.add(pos(box(0.06, 0.45, 0.06, M.metalDark), 0.5, 0.225, -0.3));
      g.add(pos(box(0.06, 0.45, 0.06, M.metalDark), 0.5, 0.225, 0.3));
      // Cross supports
      g.add(pos(box(1.0, 0.04, 0.04, M.metalMid), 0, 0.12, -0.3));
      g.add(pos(box(1.0, 0.04, 0.04, M.metalMid), 0, 0.12, 0.3));
      // Padded seat
      g.add(pos(box(0.9, 0.08, 0.35, M.mattress), 0, 0.5, 0));
      // Stitch lines on seat
      g.add(pos(box(0.85, 0.005, 0.02, M.mattStripe), 0, 0.545, -0.1));
      g.add(pos(box(0.85, 0.005, 0.02, M.mattStripe), 0, 0.545, 0.1));
      // Rack uprights
      g.add(pos(cyl(0.03, 0.03, 0.7, M.metalDark), -0.5, 0.8, 0));
      g.add(pos(cyl(0.03, 0.03, 0.7, M.metalDark), 0.5, 0.8, 0));
      // Barbell bar
      g.add(pos(cyl(0.02, 0.02, 1.6, M.chrome), 0, 1.1, 0));
      // Weight plates
      g.add(pos(cyl(0.12, 0.12, 0.04, M.metalDark, 16), -0.7, 1.1, 0));
      g.add(pos(cyl(0.13, 0.13, 0.02, M.metalMid, 16), -0.72, 1.1, 0));
      g.add(pos(cyl(0.12, 0.12, 0.04, M.metalDark, 16), 0.7, 1.1, 0));
      g.add(pos(cyl(0.13, 0.13, 0.02, M.metalMid, 16), 0.72, 1.1, 0));
      // Rubber feet
      g.add(pos(box(0.08, 0.02, 0.08, M.rubberFloor), -0.5, 0.01, -0.3));
      g.add(pos(box(0.08, 0.02, 0.08, M.rubberFloor), -0.5, 0.01, 0.3));
      g.add(pos(box(0.08, 0.02, 0.08, M.rubberFloor), 0.5, 0.01, -0.3));
      g.add(pos(box(0.08, 0.02, 0.08, M.rubberFloor), 0.5, 0.01, 0.3));
      return mergeGroup(g);
    }
  },
  // --- Турник ---
  {
    id: 'pullup_bar', name: 'Турник', icon: '💪', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Wall mounting plates
      g.add(pos(box(0.15, 0.15, 0.03, M.metalDark), -0.5, 2.2, 0));
      g.add(pos(box(0.15, 0.15, 0.03, M.metalDark), 0.5, 2.2, 0));
      // Support arms from wall
      g.add(pos(box(0.06, 0.06, 0.3, M.metalMid), -0.5, 2.2, 0.15));
      g.add(pos(box(0.06, 0.06, 0.3, M.metalMid), 0.5, 2.2, 0.15));
      // Horizontal bar
      g.add(pos(cyl(0.025, 0.025, 1.1, M.chrome), 0, 2.2, 0.3));
      // Grip texture - alternating segments
      for (let i = -4; i <= 4; i++) {
        const mat = i % 2 === 0 ? M.rubberFloor : M.metalMid;
        g.add(pos(cyl(0.028, 0.028, 0.05, mat), i * 0.1, 2.2, 0.3));
      }
      // Mounting bolts
      g.add(pos(cyl(0.015, 0.015, 0.04, M.metalShiny, 8), -0.5, 2.26, 0.01));
      g.add(pos(cyl(0.015, 0.015, 0.04, M.metalShiny, 8), -0.5, 2.14, 0.01));
      g.add(pos(cyl(0.015, 0.015, 0.04, M.metalShiny, 8), 0.5, 2.26, 0.01));
      g.add(pos(cyl(0.015, 0.015, 0.04, M.metalShiny, 8), 0.5, 2.14, 0.01));
      return mergeGroup(g);
    }
  },
  // --- Поднос с едой ---
  {
    id: 'food_tray', name: 'Поднос с едой', icon: '🍽️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Tray base
      g.add(pos(box(0.4, 0.02, 0.3, M.metalLight), 0, 0.9, 0));
      // Raised rim edges
      g.add(pos(box(0.4, 0.025, 0.015, M.metalMid), 0, 0.93, 0.14));
      g.add(pos(box(0.4, 0.025, 0.015, M.metalMid), 0, 0.93, -0.14));
      g.add(pos(box(0.015, 0.025, 0.3, M.metalMid), 0.19, 0.93, 0));
      g.add(pos(box(0.015, 0.025, 0.3, M.metalMid), -0.19, 0.93, 0));
      // Compartment dividers
      g.add(pos(box(0.005, 0.02, 0.25, M.metalMid), 0.06, 0.92, 0));
      g.add(pos(box(0.2, 0.02, 0.005, M.metalMid), -0.06, 0.92, 0.04));
      // Food items - carrots
      g.add(pos(box(0.06, 0.03, 0.04, M.orangePaint), -0.1, 0.94, 0.09));
      // Greens
      g.add(pos(box(0.08, 0.025, 0.06, M.greenPaint), -0.1, 0.94, -0.06));
      // Bread
      g.add(pos(box(0.07, 0.04, 0.05, M.woodLight), 0.13, 0.94, 0.06));
      // Rice
      g.add(pos(box(0.08, 0.03, 0.07, M.porcBase), 0.13, 0.94, -0.05));
      return mergeGroup(g);
    }
  },
  // --- Наручники на стене ---
  {
    id: 'handcuffs_wall', name: 'Наручники на стене', icon: '⛓️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Wall bracket/hook
      g.add(pos(box(0.1, 0.06, 0.04, M.metalDark), 0, 1.5, 0));
      g.add(pos(box(0.03, 0.1, 0.04, M.metalDark), 0, 1.45, 0));
      // First cuff ring (approximated with small boxes)
      g.add(pos(box(0.08, 0.01, 0.08, M.chrome), -0.06, 1.32, 0));
      g.add(pos(box(0.08, 0.01, 0.08, M.chrome), -0.06, 1.24, 0));
      g.add(pos(box(0.01, 0.08, 0.08, M.chrome), -0.025, 1.28, 0));
      g.add(pos(box(0.01, 0.08, 0.08, M.chrome), -0.095, 1.28, 0));
      // Second cuff ring
      g.add(pos(box(0.08, 0.01, 0.08, M.chrome), 0.06, 1.32, 0));
      g.add(pos(box(0.08, 0.01, 0.08, M.chrome), 0.06, 1.24, 0));
      g.add(pos(box(0.01, 0.08, 0.08, M.chrome), 0.025, 1.28, 0));
      g.add(pos(box(0.01, 0.08, 0.08, M.chrome), 0.095, 1.28, 0));
      // Chain links between
      g.add(pos(box(0.04, 0.015, 0.02, M.chainMetal), 0, 1.34, 0));
      g.add(pos(box(0.02, 0.015, 0.02, M.chainMetal), 0, 1.36, 0));
      // Keyhole detail
      g.add(pos(cyl(0.008, 0.008, 0.02, M.metalDark, 6), -0.06, 1.28, 0.04));
      // Mounting screws
      g.add(pos(cyl(0.012, 0.012, 0.02, M.metalShiny, 6), -0.03, 1.52, 0.02));
      g.add(pos(cyl(0.012, 0.012, 0.02, M.metalShiny, 6), 0.03, 1.52, 0.02));
      return mergeGroup(g);
    }
  },
  // --- Пожарная сигнализация ---
  {
    id: 'fire_alarm', name: 'Пожарная сигнализация', icon: '🚨', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Mounting plate behind
      g.add(pos(box(0.18, 0.24, 0.02, M.metalDark), 0, 1.4, 0));
      // Red box housing
      g.add(pos(box(0.15, 0.2, 0.06, M.emergRed), 0, 1.4, 0.04));
      // Glass panel front
      g.add(pos(box(0.12, 0.1, 0.01, M.glass), 0, 1.44, 0.075));
      // Pull handle
      g.add(pos(box(0.06, 0.03, 0.02, M.metalLight), 0, 1.34, 0.075));
      // Strobe light dome on top
      g.add(pos(cyl(0.03, 0.03, 0.03, M.lampGlow, 8), 0, 1.53, 0.04));
      // FIRE text label area
      g.add(pos(box(0.1, 0.03, 0.005, M.whitePaint), 0, 1.48, 0.076));
      // Wire conduit going up
      g.add(pos(cyl(0.012, 0.012, 0.3, M.metalMid), 0, 1.67, 0));
      // Frame edges
      g.add(pos(box(0.16, 0.01, 0.06, M.metalDark), 0, 1.51, 0.04));
      g.add(pos(box(0.16, 0.01, 0.06, M.metalDark), 0, 1.29, 0.04));
      return mergeGroup(g);
    }
  },
  // --- Часы настенные ---
  {
    id: 'wall_clock', name: 'Часы настенные', icon: '🕐', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Frame rim
      g.add(pos(cyl(0.22, 0.22, 0.04, M.metalDark, 24), 0, 2.0, 0));
      // Round face
      g.add(pos(cyl(0.2, 0.2, 0.02, M.whitePaint, 24), 0, 2.0, 0.02));
      // Hour markers (12)
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const marker = box(0.015, 0.03, 0.005, M.metalDark);
        marker.position.set(Math.sin(a) * 0.16, 2.0 + Math.cos(a) * 0.16, 0.035);
        g.add(marker);
      }
      // Hour hand
      const hourHand = box(0.015, 0.09, 0.005, M.metalDark);
      hourHand.position.set(0.02, 2.04, 0.04);
      hourHand.rotation.z = -0.8;
      g.add(hourHand);
      // Minute hand
      const minHand = box(0.01, 0.13, 0.005, M.metalDark);
      minHand.position.set(-0.01, 2.06, 0.04);
      minHand.rotation.z = 0.4;
      g.add(minHand);
      // Center pin
      g.add(pos(cyl(0.01, 0.01, 0.015, M.chrome, 8), 0, 2.0, 0.04));
      // Glass cover
      g.add(pos(cyl(0.19, 0.19, 0.01, M.glass, 24), 0, 2.0, 0.045));
      return mergeGroup(g);
    }
  },
  // --- Доска маркерная ---
  {
    id: 'whiteboard', name: 'Доска маркерная', icon: '📋', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // White board surface
      g.add(pos(box(1.2, 0.8, 0.02, M.whitePaint), 0, 1.8, 0));
      // Metal frame
      g.add(pos(box(1.24, 0.03, 0.03, M.metalLight), 0, 2.2, 0));
      g.add(pos(box(1.24, 0.03, 0.03, M.metalLight), 0, 1.4, 0));
      g.add(pos(box(0.03, 0.8, 0.03, M.metalLight), -0.61, 1.8, 0));
      g.add(pos(box(0.03, 0.8, 0.03, M.metalLight), 0.61, 1.8, 0));
      // Tray at bottom
      g.add(pos(box(1.0, 0.04, 0.06, M.metalMid), 0, 1.38, 0.04));
      // Markers in tray
      g.add(pos(cyl(0.012, 0.012, 0.1, M.danger), -0.15, 1.39, 0.04));
      g.add(pos(cyl(0.012, 0.012, 0.1, M.metalPaint), 0, 1.39, 0.04));
      g.add(pos(cyl(0.012, 0.012, 0.1, M.metalDark), 0.15, 1.39, 0.04));
      // Eraser
      g.add(pos(box(0.08, 0.03, 0.04, M.mattress), 0.35, 1.39, 0.04));
      // Wall mounting
      g.add(pos(box(0.6, 0.06, 0.02, M.metalDark), 0, 1.8, -0.02));
      return mergeGroup(g);
    }
  },
  // --- Шкаф картотечный ---
  {
    id: 'filing_cabinet', name: 'Шкаф картотечный', icon: '🗄️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Main body
      g.add(pos(box(0.5, 1.4, 0.6, M.metalPaint), 0, 0.7, 0));
      // 4 drawer faces
      for (let i = 0; i < 4; i++) {
        const y = 0.2 + i * 0.34;
        g.add(pos(box(0.46, 0.28, 0.02, M.metalMid), 0, y, 0.3));
        // Handle
        g.add(pos(box(0.12, 0.02, 0.02, M.chrome), 0, y + 0.06, 0.32));
        // Label holder
        g.add(pos(box(0.08, 0.05, 0.005, M.metalLight), 0, y - 0.04, 0.315));
      }
      // Top surface detail
      g.add(pos(box(0.5, 0.02, 0.6, M.metalDark), 0, 1.41, 0));
      // Lock on top drawer
      g.add(pos(cyl(0.015, 0.015, 0.025, M.chrome, 8), 0.15, 1.3, 0.315));
      // Feet
      g.add(pos(box(0.06, 0.03, 0.06, M.metalDark), -0.2, 0.015, -0.24));
      g.add(pos(box(0.06, 0.03, 0.06, M.metalDark), 0.2, 0.015, -0.24));
      g.add(pos(box(0.06, 0.03, 0.06, M.metalDark), -0.2, 0.015, 0.24));
      g.add(pos(box(0.06, 0.03, 0.06, M.metalDark), 0.2, 0.015, 0.24));
      return mergeGroup(g);
    }
  },
  // --- Офисный стол с ПК ---
  {
    id: 'office_desk', name: 'Офисный стол с ПК', icon: '🖥️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Desk surface
      g.add(pos(box(1.4, 0.04, 0.7, M.woodMid), 0, 0.75, 0));
      // Desk panel sides
      g.add(pos(box(0.04, 0.7, 0.66, M.woodDark), -0.68, 0.37, 0));
      g.add(pos(box(0.04, 0.7, 0.66, M.woodDark), 0.68, 0.37, 0));
      // Back panel
      g.add(pos(box(1.32, 0.5, 0.02, M.woodDark), 0, 0.5, -0.33));
      // Monitor frame
      g.add(pos(box(0.5, 0.35, 0.03, M.metalDark), 0.1, 1.1, -0.1));
      // Monitor screen
      g.add(pos(box(0.46, 0.3, 0.01, M.screenGlow), 0.1, 1.1, -0.08));
      // Monitor stand
      g.add(pos(cyl(0.03, 0.05, 0.15, M.metalMid), 0.1, 0.85, -0.1));
      g.add(pos(box(0.15, 0.02, 0.1, M.metalDark), 0.1, 0.77, -0.1));
      // Keyboard
      g.add(pos(box(0.35, 0.015, 0.12, M.metalDark), 0.1, 0.78, 0.12));
      // Key detail on keyboard
      g.add(pos(box(0.32, 0.005, 0.09, M.metalMid), 0.1, 0.79, 0.12));
      // Mouse
      g.add(pos(box(0.05, 0.02, 0.08, M.metalMid), 0.4, 0.78, 0.12));
      // Drawer unit
      g.add(pos(box(0.35, 0.5, 0.5, M.woodMid), -0.4, 0.28, 0.05));
      g.add(pos(box(0.08, 0.02, 0.02, M.chrome), -0.4, 0.4, 0.31));
      return mergeGroup(g);
    }
  },
  // --- Тюремная форма ---
  {
    id: 'prison_uniform', name: 'Тюремная форма', icon: '👕', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Wall hook
      g.add(pos(box(0.04, 0.04, 0.06, M.metalDark), 0, 1.9, 0));
      g.add(pos(box(0.04, 0.08, 0.02, M.metalDark), 0, 1.86, 0.03));
      // Hanger piece
      g.add(pos(cyl(0.01, 0.01, 0.3, M.metalLight), 0, 1.82, 0.02));
      // Shirt body
      g.add(pos(box(0.35, 0.45, 0.06, M.fabricOrange), 0, 1.55, 0.02));
      // Shirt sleeves
      const sleeveL = box(0.12, 0.3, 0.06, M.fabricOrange);
      sleeveL.position.set(-0.22, 1.6, 0.02);
      sleeveL.rotation.z = 0.3;
      g.add(sleeveL);
      const sleeveR = box(0.12, 0.3, 0.06, M.fabricOrange);
      sleeveR.position.set(0.22, 1.6, 0.02);
      sleeveR.rotation.z = -0.3;
      g.add(sleeveR);
      // Number stripe on back
      g.add(pos(box(0.2, 0.06, 0.005, M.whitePaint), 0, 1.6, -0.01));
      // Pants below
      g.add(pos(box(0.32, 0.5, 0.06, M.orangePaint), 0, 1.05, 0.02));
      // Waistline detail
      g.add(pos(box(0.34, 0.02, 0.065, M.metalDark), 0, 1.3, 0.02));
      return mergeGroup(g);
    }
  },
  // --- Баскетбольное кольцо ---
  {
    id: 'basketball_hoop', name: 'Баскетбольное кольцо', icon: '🏀', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Backboard
      g.add(pos(box(1.0, 0.7, 0.03, M.whitePaint), 0, 3.2, 0));
      // Backboard border
      g.add(pos(box(1.04, 0.03, 0.04, M.metalDark), 0, 3.55, 0));
      g.add(pos(box(1.04, 0.03, 0.04, M.metalDark), 0, 2.85, 0));
      g.add(pos(box(0.03, 0.7, 0.04, M.metalDark), -0.51, 3.2, 0));
      g.add(pos(box(0.03, 0.7, 0.04, M.metalDark), 0.51, 3.2, 0));
      // Target square on backboard
      g.add(pos(box(0.44, 0.005, 0.005, M.metalDark), 0, 3.25, 0.02));
      g.add(pos(box(0.44, 0.005, 0.005, M.metalDark), 0, 2.95, 0.02));
      g.add(pos(box(0.005, 0.3, 0.005, M.metalDark), -0.22, 3.1, 0.02));
      g.add(pos(box(0.005, 0.3, 0.005, M.metalDark), 0.22, 3.1, 0.02));
      // Rim/ring (4 segments)
      g.add(pos(box(0.35, 0.02, 0.02, M.danger), 0, 3.0, 0.2));
      g.add(pos(box(0.02, 0.02, 0.2, M.danger), -0.17, 3.0, 0.1));
      g.add(pos(box(0.02, 0.02, 0.2, M.danger), 0.17, 3.0, 0.1));
      g.add(pos(box(0.35, 0.02, 0.02, M.danger), 0, 3.0, 0.0));
      // Mounting bracket
      g.add(pos(box(0.2, 0.15, 0.1, M.metalDark), 0, 3.0, -0.01));
      // Net (thin cylinders hanging down)
      for (let i = -3; i <= 3; i++) {
        g.add(pos(cyl(0.008, 0.008, 0.2, M.porcBase), i * 0.045, 2.85, 0.1 + Math.abs(i) * 0.01));
      }
      // Support arm
      g.add(pos(box(0.08, 0.08, 0.15, M.metalMid), 0, 3.0, -0.08));
      return mergeGroup(g);
    }
  },
  // --- Вышка охраны ---
  {
    id: 'guard_tower_section', name: 'Вышка охраны', icon: '🗼', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // 4 corner posts
      g.add(pos(cyl(0.04, 0.04, 5, M.metalDark), -1, 2.5, -1));
      g.add(pos(cyl(0.04, 0.04, 5, M.metalDark), 1, 2.5, -1));
      g.add(pos(cyl(0.04, 0.04, 5, M.metalDark), -1, 2.5, 1));
      g.add(pos(cyl(0.04, 0.04, 5, M.metalDark), 1, 2.5, 1));
      // Platform floor
      g.add(pos(box(2.2, 0.06, 2.2, M.metalMid), 0, 4.0, 0));
      // Railing panels
      g.add(pos(box(2.0, 0.8, 0.03, M.metalLight), 0, 4.4, 1.0));
      g.add(pos(box(2.0, 0.8, 0.03, M.metalLight), 0, 4.4, -1.0));
      g.add(pos(box(0.03, 0.8, 2.0, M.metalLight), 1.0, 4.4, 0));
      g.add(pos(box(0.03, 0.8, 2.0, M.metalLight), -1.0, 4.4, 0));
      // Railing posts
      g.add(pos(cyl(0.025, 0.025, 1.0, M.metalDark), -1, 4.5, -1));
      g.add(pos(cyl(0.025, 0.025, 1.0, M.metalDark), 1, 4.5, -1));
      g.add(pos(cyl(0.025, 0.025, 1.0, M.metalDark), -1, 4.5, 1));
      g.add(pos(cyl(0.025, 0.025, 1.0, M.metalDark), 1, 4.5, 1));
      // Ladder (side rails + rungs)
      g.add(pos(box(0.03, 4.5, 0.03, M.metalLight), 1.1, 2.25, -0.15));
      g.add(pos(box(0.03, 4.5, 0.03, M.metalLight), 1.1, 2.25, 0.15));
      for (let i = 0; i < 12; i++) {
        g.add(pos(box(0.03, 0.02, 0.28, M.metalLight), 1.1, 0.3 + i * 0.36, 0));
      }
      // Searchlight mount on top
      g.add(pos(box(0.15, 0.1, 0.15, M.metalDark), 0, 4.85, 0));
      g.add(pos(cyl(0.08, 0.1, 0.12, M.lampBody, 8), 0, 4.95, 0));
      // Roof overhang
      g.add(pos(box(2.5, 0.04, 2.5, M.metalMid), 0, 5.1, 0));
      return mergeGroup(g);
    }
  },
  // ============ ОСВЕЩЕНИЕ ============
  {
    id: 'light_ceiling', name: 'Потолочная лампа', icon: '💡', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      // Крепление
      g.add(pos(cyl(0.06, 0.06, 0.04, M.metalDark, 8), 0, 3.98, 0));
      // Корпус
      g.add(pos(box(0.65, 0.06, 0.18, M.lampBody), 0, 3.94, 0));
      // Отражатель
      g.add(pos(box(0.6, 0.02, 0.14, M.metalShiny), 0, 3.9, 0));
      // Светящийся элемент
      g.add(pos(box(0.5, 0.03, 0.1, M.lampGlow), 0, 3.88, 0));
      // Заглушки по бокам
      g.add(pos(box(0.03, 0.06, 0.18, M.metalDark), -0.33, 3.94, 0));
      g.add(pos(box(0.03, 0.06, 0.18, M.metalDark), 0.33, 3.94, 0));
      // Свет
      const light = new THREE.PointLight(0xffffee, 2.5, 14);
      light.castShadow = false;
      light.position.set(0, 3.8, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  {
    id: 'light_wall', name: 'Настенная лампа', icon: '🔦', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      // Настенное крепление
      g.add(pos(box(0.08, 0.12, 0.06, M.metalDark), 0, 2.5, 0));
      // Рычаг
      g.add(pos(box(0.15, 0.04, 0.04, M.metalMid), 0.08, 2.5, 0));
      // Плафон
      g.add(pos(cyl(0.08, 0.1, 0.12, M.lampBody, 8), 0.18, 2.48, 0));
      // Лампочка
      g.add(pos(cyl(0.04, 0.04, 0.06, M.lampGlow, 8), 0.18, 2.4, 0));
      const light = new THREE.PointLight(0xffffee, 2, 10);
      light.castShadow = false;
      light.position.set(0.2, 2.38, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  {
    id: 'light_floor', name: 'Фонарь напольный', icon: '🔆', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.15, 0.2, 0.04, M.metalDark, 12), 0, 0.02, 0));
      g.add(pos(cyl(0.04, 0.04, 1.5, M.metalDark), 0, 0.77, 0));
      g.add(pos(cyl(0.12, 0.08, 0.2, M.metalMid, 8), 0, 1.6, 0));
      g.add(pos(cyl(0.06, 0.06, 0.08, M.lampGlow, 8), 0, 1.55, 0));
      const light = new THREE.PointLight(0xffffcc, 2, 12);
      light.castShadow = false;
      light.position.set(0, 1.7, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  {
    id: 'light_spot', name: 'Прожектор', icon: '🔦', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.15, 0.15, 0.2, M.metalDark), 0, 3.92, 0));
      g.add(pos(cyl(0.1, 0.15, 0.15, M.metalMid, 8), 0, 3.8, 0));
      g.add(pos(cyl(0.08, 0.08, 0.04, M.lampGlow, 8), 0, 3.72, 0));
      const light = new THREE.SpotLight(0xffffff, 5, 18, 0.5, 0.5);
      light.castShadow = false;
      light.position.set(0, 3.7, 0);
      light.target.position.set(0, 0, 0);
      g.add(light);
      g.add(light.target);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  {
    id: 'light_red', name: 'Лампа красная', icon: '🔴', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.6, 0.08, 0.2, M.metalDark), 0, 3.96, 0));
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.12), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.8 }));
      bulb.position.set(0, 3.9, 0);
      g.add(bulb);
      const light = new THREE.PointLight(0xff0000, 2, 12);
      light.castShadow = false;
      light.position.set(0, 3.85, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  {
    id: 'light_neon', name: 'Неон синий', icon: '🔵', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      const neonMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x2266ff, emissiveIntensity: 1.0 });
      g.add(pos(new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.06), neonMat), 0, 3.5, 0));
      const light = new THREE.PointLight(0x4488ff, 2, 10);
      light.castShadow = false;
      light.position.set(0, 3.4, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  {
    id: 'vent', name: 'Вентиляция', icon: '🌀', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Рамка
      g.add(pos(box(0.64, 0.44, 0.05, M.metalDark), 0, 3.5, 0));
      // Внутренность (тёмная)
      g.add(pos(box(0.56, 0.36, 0.03, M.metalDark), 0, 3.5, 0.02));
      // Горизонтальные ламели
      for (let i = 0; i < 6; i++) {
        const slat = box(0.52, 0.015, 0.04, M.ventSlat);
        slat.position.set(0, 3.33 + i * 0.065, 0.04);
        slat.rotation.x = 0.4;
        g.add(slat);
      }
      // Винты по углам
      for (const x of [-0.27, 0.27]) {
        for (const y of [3.3, 3.7]) {
          g.add(pos(cyl(0.015, 0.015, 0.02, M.metalShiny, 6), x, y, 0.04));
        }
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'window_bars', name: 'Окно с решёткой', icon: '🪟', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Ниша окна
      g.add(pos(box(0.25, 0.75, 0.95, M.sky), 0, 2.5, 0));
      // Рама окна
      g.add(pos(box(0.04, 0.8, 0.04, M.metalDark), 0.11, 2.5, -0.46));
      g.add(pos(box(0.04, 0.8, 0.04, M.metalDark), 0.11, 2.5, 0.46));
      g.add(pos(box(0.04, 0.04, 0.96, M.metalDark), 0.11, 2.1, 0));
      g.add(pos(box(0.04, 0.04, 0.96, M.metalDark), 0.11, 2.9, 0));
      // Решётка
      for (let i = 0; i < 4; i++) {
        g.add(pos(cyl(0.02, 0.02, 0.75, M.bars), 0.12, 2.5, -0.35 + i * 0.23));
      }
      g.add(pos(box(0.04, 0.04, 0.9, M.metalDark), 0.12, 2.3, 0));
      g.add(pos(box(0.04, 0.04, 0.9, M.metalDark), 0.12, 2.7, 0));
      // Подоконник
      g.add(pos(box(0.2, 0.04, 1, M.conc2), 0.05, 2.08, 0));
      return mergeGroup(g);
    }
  },
  // --- Стена с дверным проёмом ---
  {
    id: 'wall_with_door', name: 'Стена с проёмом', icon: '🚪', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Левая часть
      g.add(pos(box(1.2, 4, 0.3, M.conc1), -1.4, 2, 0));
      // Правая часть
      g.add(pos(box(1.2, 4, 0.3, M.conc1), 1.4, 2, 0));
      // Верхняя перемычка
      g.add(pos(box(1.5, 0.5, 0.3, M.conc2), 0, 3.75, 0));
      // Рама проёма
      g.add(pos(box(0.08, 3.5, 0.32, M.metalDark), -0.68, 1.75, 0));
      g.add(pos(box(0.08, 3.5, 0.32, M.metalDark), 0.68, 1.75, 0));
      return mergeGroup(g);
    }
  },
  // --- Стена с окном ---
  {
    id: 'wall_with_window', name: 'Стена с окном', icon: '🪟', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 1.5, 0.3, M.conc1), 0, 0.75, 0));
      g.add(pos(box(4, 1.2, 0.3, M.conc1), 0, 3.4, 0));
      g.add(pos(box(0.6, 1.3, 0.3, M.conc1), -1.7, 2.15, 0));
      g.add(pos(box(0.6, 1.3, 0.3, M.conc1), 1.7, 2.15, 0));
      // Подоконник
      g.add(pos(box(2.8, 0.06, 0.4, M.conc3), 0, 1.5, 0));
      // Рама окна
      g.add(pos(box(2.76, 0.04, 0.05, M.metalDark), 0, 2.8, 0.14));
      g.add(pos(box(0.04, 1.3, 0.05, M.metalDark), 0, 2.15, 0.14));
      return mergeGroup(g);
    }
  },
  // --- Полустена ---
  {
    id: 'wall_half', name: 'Полустена', icon: '▬', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 2, 0.3, M.conc1), 0, 1, 0));
      g.add(pos(box(4, 0.15, 0.3, M.conc3), 0, 0.075, 0));
      g.add(pos(box(4, 0.1, 0.3, M.conc2), 0, 2.05, 0));
      return mergeGroup(g);
    }
  },
  // --- Стена длинная ---
  {
    id: 'wall_long', name: 'Стена длинная (8м)', icon: '🧱', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(8, 4, 0.3, M.conc1), 0, 2, 0));
      g.add(pos(box(8, 0.15, 0.3, M.conc3), 0, 0.075, 0));
      for (let i = -3; i <= 3; i += 2) g.add(pos(box(0.02, 4, 0.005, M.concDirty), i, 2, 0.148));
      g.add(pos(box(8, 0.02, 0.005, M.concDirty), 0, 2, 0.148));
      return mergeGroup(g);
    }
  },
  // --- Стена стеклянная ---
  {
    id: 'wall_glass', name: 'Стена стеклянная', icon: '🪟', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.8, 0.3, M.conc2), 0, 0.4, 0));
      g.add(pos(box(4, 3.2, 0.06, M.glass), 0, 2.4, 0));
      g.add(pos(box(4, 0.08, 0.1, M.metalDark), 0, 0.84, 0));
      g.add(pos(box(4, 0.08, 0.1, M.metalDark), 0, 3.96, 0));
      g.add(pos(box(0.08, 3.2, 0.1, M.metalDark), -1.96, 2.4, 0));
      g.add(pos(box(0.08, 3.2, 0.1, M.metalDark), 1.96, 2.4, 0));
      g.add(pos(box(0.08, 3.2, 0.1, M.metalDark), 0, 2.4, 0));
      return mergeGroup(g);
    }
  },
  // --- Окно большое (без стены) ---
  {
    id: 'window_large', name: 'Окно большое', icon: '🪟', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(3, 2, 0.06, M.glass), 0, 2.5, 0));
      // Рама
      g.add(pos(box(3.1, 0.08, 0.1, M.metalDark), 0, 1.46, 0));
      g.add(pos(box(3.1, 0.08, 0.1, M.metalDark), 0, 3.54, 0));
      g.add(pos(box(0.08, 2.16, 0.1, M.metalDark), -1.54, 2.5, 0));
      g.add(pos(box(0.08, 2.16, 0.1, M.metalDark), 1.54, 2.5, 0));
      // Перекладина посередине
      g.add(pos(box(3.04, 0.06, 0.08, M.metalMid), 0, 2.5, 0));
      g.add(pos(box(0.06, 2.08, 0.08, M.metalMid), 0, 2.5, 0));
      // Подоконник
      g.add(pos(box(3.2, 0.06, 0.25, M.conc2), 0, 1.44, 0.08));
      return mergeGroup(g);
    }
  },
  // --- Полустена для окна (нижняя часть) ---
  {
    id: 'wall_window_base', name: 'Полустена под окно', icon: '▬', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 1.5, 0.3, M.conc1), 0, 0.75, 0));
      g.add(pos(box(4, 0.15, 0.3, M.conc3), 0, 0.075, 0));
      g.add(pos(box(4, 0.08, 0.32, M.conc2), 0, 1.52, 0));
      // Швы
      for (let i = -1.5; i <= 1.5; i += 1) g.add(pos(box(0.02, 1.5, 0.005, M.concDirty), i, 0.75, 0.148));
      return mergeGroup(g);
    }
  },
  // --- Окно с подоконником (встраиваемое) ---
  {
    id: 'window_insert', name: 'Окно встроенное', icon: '🪟', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Стекло
      g.add(pos(box(1.6, 1.4, 0.04, M.glass), 0, 2.2, 0));
      // Рама
      g.add(pos(box(1.7, 0.06, 0.08, M.metalDark), 0, 1.48, 0));
      g.add(pos(box(1.7, 0.06, 0.08, M.metalDark), 0, 2.92, 0));
      g.add(pos(box(0.06, 1.5, 0.08, M.metalDark), -0.84, 2.2, 0));
      g.add(pos(box(0.06, 1.5, 0.08, M.metalDark), 0.84, 2.2, 0));
      // Подоконник
      g.add(pos(box(1.8, 0.05, 0.2, M.conc2), 0, 1.46, 0.08));
      return mergeGroup(g);
    }
  },
  // --- Арка ---
  {
    id: 'arch', name: 'Арка', icon: '🏛️', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Колонны
      g.add(pos(box(0.4, 3.5, 0.4, M.conc1), -1.2, 1.75, 0));
      g.add(pos(box(0.4, 3.5, 0.4, M.conc1), 1.2, 1.75, 0));
      // Верхняя перемычка
      g.add(pos(box(2.8, 0.5, 0.4, M.conc2), 0, 3.75, 0));
      // Капители
      g.add(pos(box(0.5, 0.15, 0.5, M.conc3), -1.2, 3.5, 0));
      g.add(pos(box(0.5, 0.15, 0.5, M.conc3), 1.2, 3.5, 0));
      return mergeGroup(g);
    }
  },
  // --- Верстак ---
  {
    id: 'workbench', name: 'Верстак', icon: '🔧', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.6, 0.08, 0.7, M.woodMid), 0, 0.85, 0));
      g.add(pos(box(1.58, 0.03, 0.68, M.woodEdge), 0, 0.87, 0));
      for (const dx of [-0.7, 0.7]) for (const dz of [-0.28, 0.28]) g.add(pos(box(0.07, 0.82, 0.07, M.woodDark), dx, 0.42, dz));
      // Тиски
      g.add(pos(box(0.15, 0.12, 0.1, M.metalDark), 0.6, 0.94, 0.25));
      g.add(pos(box(0.04, 0.2, 0.08, M.metalMid), 0.6, 1.0, 0.18));
      g.add(pos(box(0.04, 0.2, 0.08, M.metalMid), 0.6, 1.0, 0.32));
      // Инструменты на стене (если стоит у стены)
      g.add(pos(box(0.03, 0.15, 0.03, M.metalShiny), -0.3, 0.95, 0));
      g.add(pos(box(0.08, 0.04, 0.03, M.metalShiny), -0.3, 1.04, 0));
      return mergeGroup(g);
    }
  },
  // --- Медицинская кушетка ---
  {
    id: 'medical_bed', name: 'Медицинская кушетка', icon: '🛏️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(2, 0.06, 0.8, M.metalLight), 0, 0.6, 0));
      g.add(pos(box(1.9, 0.08, 0.75, M.porcBase), 0, 0.65, 0));
      // Подушка
      g.add(pos(box(0.5, 0.08, 0.5, M.pillow), -0.65, 0.72, 0));
      // Ножки на колёсиках
      for (const dx of [-0.85, 0.85]) for (const dz of [-0.3, 0.3]) {
        g.add(pos(cyl(0.03, 0.03, 0.55, M.metalDark), dx, 0.28, dz));
        g.add(pos(cyl(0.04, 0.04, 0.05, M.metalMid, 8), dx, 0.02, dz));
      }
      return mergeGroup(g);
    }
  },
  // --- Аптечка на стене ---
  {
    id: 'first_aid', name: 'Аптечка', icon: '➕', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.35, 0.4, 0.12, M.porcBase), 0, 1.5, 0));
      g.add(pos(box(0.33, 0.38, 0.02, M.porcRim), 0, 1.5, 0.06));
      // Крест
      g.add(pos(box(0.08, 0.2, 0.005, M.danger), 0, 1.5, 0.075));
      g.add(pos(box(0.2, 0.08, 0.005, M.danger), 0, 1.5, 0.075));
      return mergeGroup(g);
    }
  },
  // --- Сейф ---
  {
    id: 'safe', name: 'Сейф', icon: '🔐', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.5, 0.6, 0.45, M.metalDark), 0, 0.3, 0));
      g.add(pos(box(0.46, 0.56, 0.02, M.metalMid), 0, 0.3, 0.22));
      // Ручка
      g.add(pos(box(0.04, 0.12, 0.04, M.chrome), 0.15, 0.35, 0.24));
      // Шкала
      g.add(pos(cyl(0.06, 0.06, 0.02, M.metalShiny, 12), -0.05, 0.35, 0.24));
      return mergeGroup(g);
    }
  },
  // --- Автомат с едой ---
  {
    id: 'vending_machine', name: 'Автомат', icon: '🥤', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.8, 1.8, 0.6, M.metalPaint), 0, 0.9, 0));
      // Стекло
      g.add(pos(box(0.6, 1.0, 0.02, M.glass), 0, 1.1, 0.3));
      // Рама стекла
      g.add(pos(box(0.64, 0.04, 0.04, M.metalDark), 0, 0.6, 0.3));
      g.add(pos(box(0.64, 0.04, 0.04, M.metalDark), 0, 1.6, 0.3));
      // Панель кнопок
      g.add(pos(box(0.25, 0.3, 0.04, M.metalMid), 0.2, 0.9, 0.32));
      // Отверстие выдачи
      g.add(pos(box(0.3, 0.2, 0.15, M.metalDark), 0, 0.15, 0.22));
      return mergeGroup(g);
    }
  },
  {
    id: 'fire_extinguisher', name: 'Огнетушитель', icon: '🧯', category: 'items',
    create: () => {
      const g = new THREE.Group();
      // Баллон
      g.add(pos(cyl(0.1, 0.1, 0.5, M.danger, 16), 0, 0.4, 0));
      // Полоса-этикетка
      g.add(pos(cyl(0.102, 0.102, 0.15, M.dangerBright, 16), 0, 0.35, 0));
      // Дно
      g.add(pos(cyl(0.1, 0.08, 0.04, M.metalDark, 16), 0, 0.14, 0));
      // Верх
      g.add(pos(cyl(0.06, 0.1, 0.06, M.metalDark, 16), 0, 0.69, 0));
      // Вентиль
      g.add(pos(cyl(0.03, 0.03, 0.06, M.metalMid, 8), 0, 0.75, 0));
      // Ручка
      g.add(pos(box(0.08, 0.12, 0.02, M.metalDark), 0.06, 0.74, 0));
      // Шланг
      g.add(pos(cyl(0.012, 0.012, 0.2, M.metalDark, 6), 0.1, 0.6, 0));
      // Крепление на стену
      g.add(pos(box(0.16, 0.06, 0.04, M.metalMid), 0, 0.55, -0.12));
      g.add(pos(box(0.16, 0.06, 0.04, M.metalMid), 0, 0.3, -0.12));
      return mergeGroup(g);
    }
  },
  {
    id: 'camera', name: 'Камера наблюдения', icon: '📹', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      // Крепление к потолку
      g.add(pos(cyl(0.05, 0.05, 0.08, M.metalDark, 8), 0, 3.56, 0));
      // Шарнир
      g.add(pos(cyl(0.04, 0.04, 0.04, M.metalMid, 8), 0, 3.5, 0));
      // Корпус камеры
      g.add(pos(box(0.1, 0.08, 0.18, M.metalDark), 0, 3.42, 0.05));
      // Козырёк
      g.add(pos(box(0.12, 0.02, 0.12, M.metalMid), 0, 3.47, 0.08));
      // Объектив
      g.add(pos(cyl(0.035, 0.04, 0.06, M.lensGlass, 12), 0, 3.42, 0.17));
      g.add(pos(cyl(0.025, 0.025, 0.02, M.metalShiny, 12), 0, 3.42, 0.2));
      // LED индикатор
      g.add(pos(box(0.02, 0.02, 0.01, M.ledRed), 0.04, 3.45, 0.14));
      g.userData.scriptType = 'camera';
      return mergeGroup(g);
    }
  },

  // --- Промышленная лампа ---
  {
    id: 'light_industrial_hanging', name: 'Промышленная лампа', icon: '🏭', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      // Ceiling mount plate
      g.add(pos(box(0.12, 0.03, 0.12, M.metalDark), 0, 3.97, 0));
      // Chain segments
      for (let i = 0; i < 5; i++) {
        g.add(pos(box(0.02, 0.06, 0.02, M.chainMetal), 0, 3.9 - i * 0.08, 0));
      }
      // Large metal shade
      g.add(pos(cyl(0.06, 0.25, 0.18, M.metalRust, 12), 0, 3.4, 0));
      // Shade rim
      g.add(pos(cyl(0.25, 0.26, 0.02, M.metalDark, 12), 0, 3.31, 0));
      // Visible bulb
      g.add(pos(cyl(0.04, 0.04, 0.1, M.lampGlow, 8), 0, 3.35, 0));
      // PointLight
      const light = new THREE.PointLight(0xffffcc, 3, 16);
      light.position.set(0, 3.3, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  // --- Выход (аварийный) ---
  {
    id: 'light_emergency_exit', name: 'Выход (аварийный)', icon: '🚪', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      // Green illuminated box housing
      g.add(pos(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.04), M.exitGreen), 0, 3.5, 0));
      // Frame edges (darker green)
      g.add(pos(new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.01, 0.045), M.exitGreenFrame), 0, 3.575, 0));
      g.add(pos(new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.01, 0.045), M.exitGreenFrame), 0, 3.425, 0));
      g.add(pos(new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.15, 0.045), M.exitGreenFrame), -0.18, 3.5, 0));
      g.add(pos(new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.15, 0.045), M.exitGreenFrame), 0.18, 3.5, 0));
      // Running man silhouette (simplified with dark boxes)
      g.add(pos(box(0.02, 0.06, 0.005, M.metalDark), -0.04, 3.51, 0.025));
      g.add(pos(box(0.04, 0.02, 0.005, M.metalDark), -0.02, 3.48, 0.025));
      g.add(pos(box(0.03, 0.04, 0.005, M.metalDark), 0.04, 3.5, 0.025));
      // Mounting bracket on top
      g.add(pos(box(0.08, 0.04, 0.06, M.metalMid), 0, 3.6, 0));
      // PointLight green
      const light = new THREE.PointLight(0x00cc66, 0.4, 4);
      light.position.set(0, 3.4, 0.05);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  // --- Лампа люминесцентная (двойная) ---
  {
    id: 'light_fluorescent_dual', name: 'Лампа люминесцентная (двойная)', icon: '💡', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      // Housing
      g.add(pos(box(1.2, 0.06, 0.25, M.lampBody), 0, 3.94, 0));
      // Reflector panel above tubes
      g.add(pos(box(1.1, 0.02, 0.2, M.metalShiny), 0, 3.9, 0));
      // Fluorescent tube 1 (bright)
      g.add(pos(box(1.0, 0.03, 0.04, M.lampGlow), 0, 3.87, -0.05));
      // Fluorescent tube 2 (slightly dimmer - aging)
      const dimTube = new THREE.MeshStandardMaterial({ color: 0xeeeedd, emissive: 0xeeeedd, emissiveIntensity: 0.5 });
      g.add(pos(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.04), dimTube), 0, 3.87, 0.05));
      // End caps on tubes
      g.add(pos(box(0.03, 0.04, 0.12, M.metalMid), -0.5, 3.87, 0));
      g.add(pos(box(0.03, 0.04, 0.12, M.metalMid), 0.5, 3.87, 0));
      // Ceiling mounting clips
      g.add(pos(box(0.04, 0.04, 0.06, M.metalDark), -0.4, 3.98, 0));
      g.add(pos(box(0.04, 0.04, 0.06, M.metalDark), 0, 3.98, 0));
      g.add(pos(box(0.04, 0.04, 0.06, M.metalDark), 0.4, 3.98, 0));
      // PointLight
      const light = new THREE.PointLight(0xffffee, 1.0, 12);
      light.position.set(0, 3.8, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  // --- Уличный фонарь ---
  {
    id: 'light_street_lamp', name: 'Уличный фонарь', icon: '🔆', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      // Base plate
      g.add(pos(box(0.35, 0.06, 0.35, M.metalDark), 0, 0.03, 0));
      // Decorative base collar
      g.add(pos(cyl(0.1, 0.14, 0.15, M.metalDark, 8), 0, 0.14, 0));
      // Tall pole
      g.add(pos(cyl(0.05, 0.06, 5, M.metalDark), 0, 2.6, 0));
      // Curved arm (box segments)
      g.add(pos(box(0.04, 0.3, 0.04, M.metalMid), 0, 5.2, 0));
      g.add(pos(box(0.04, 0.04, 0.3, M.metalMid), 0, 5.35, 0.13));
      g.add(pos(box(0.04, 0.2, 0.04, M.metalMid), 0, 5.25, 0.28));
      // Lantern housing
      g.add(pos(box(0.15, 0.2, 0.15, M.metalMid), 0, 5.1, 0.28));
      // Glass panels on lantern
      g.add(pos(box(0.01, 0.15, 0.12, M.glass), 0.07, 5.08, 0.28));
      g.add(pos(box(0.01, 0.15, 0.12, M.glass), -0.07, 5.08, 0.28));
      g.add(pos(box(0.12, 0.15, 0.01, M.glass), 0, 5.08, 0.35));
      g.add(pos(box(0.12, 0.15, 0.01, M.glass), 0, 5.08, 0.21));
      // Bulb inside
      g.add(pos(cyl(0.03, 0.03, 0.08, M.lampGlow, 8), 0, 5.08, 0.28));
      // PointLight up high
      const light = new THREE.PointLight(0xffffaa, 1.5, 18);
      light.position.set(0, 5.0, 0.28);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  // --- Прожектор поисковый ---
  {
    id: 'light_searchlight', name: 'Прожектор поисковый', icon: '🔦', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      // Heavy base
      g.add(pos(cyl(0.25, 0.3, 0.1, M.metalDark, 12), 0, 0.05, 0));
      // Pedestal/pivot mount
      g.add(pos(cyl(0.06, 0.08, 0.4, M.metalMid), 0, 0.3, 0));
      // Pivot joint
      g.add(pos(cyl(0.05, 0.05, 0.06, M.metalShiny, 8), 0, 0.52, 0));
      // Large cylindrical housing (horizontal)
      const housing = cyl(0.15, 0.12, 0.45, M.metalDark, 12);
      housing.position.set(0, 0.6, 0.15);
      housing.rotation.x = Math.PI / 2;
      g.add(housing);
      // Lens at front
      const lens = cyl(0.13, 0.13, 0.03, M.glass, 12);
      lens.position.set(0, 0.6, 0.38);
      lens.rotation.x = Math.PI / 2;
      g.add(lens);
      // Heat vents on housing
      for (let i = -2; i <= 2; i++) {
        g.add(pos(box(0.12, 0.01, 0.04, M.ventSlat), 0, 0.6 + i * 0.04, -0.02));
      }
      // Handle/aiming arms
      g.add(pos(box(0.02, 0.15, 0.02, M.metalMid), -0.12, 0.6, 0.1));
      g.add(pos(box(0.02, 0.15, 0.02, M.metalMid), 0.12, 0.6, 0.1));
      // SpotLight with high intensity
      const light = new THREE.SpotLight(0xffffff, 3, 25, 0.4, 0.5);
      light.position.set(0, 0.6, 0.4);
      light.target.position.set(0, 0.6, 5);
      g.add(light);
      g.add(light.target);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  // ============ СКРИПТЫ ============
  {
    id: 'spawn_prisoner', name: 'Спавн зека', icon: '👤', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      // Круг на полу (оранжевый)
      const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, emissive: 0xff6b35, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 24), orangeMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.02, 0);
      g.add(ring);
      // Заполнение круга
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.48, 24), new THREE.MeshStandardMaterial({ color: 0xff6b35, transparent: true, opacity: 0.15 }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(0, 0.01, 0);
      g.add(disc);
      // Силуэт человека (палка-фигурка)
      // Голова
      g.add(pos(cyl(0.1, 0.1, 0.2, orangeMat, 12), 0, 1.65, 0));
      // Тело
      g.add(pos(box(0.08, 0.6, 0.08, orangeMat), 0, 1.2, 0));
      // Руки
      g.add(pos(box(0.5, 0.06, 0.06, orangeMat), 0, 1.35, 0));
      // Ноги
      g.add(pos(box(0.06, 0.5, 0.06, orangeMat), -0.1, 0.65, 0));
      g.add(pos(box(0.06, 0.5, 0.06, orangeMat), 0.1, 0.65, 0));
      // Стрелка вверх
      const arrowMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, emissive: 0xff6b35, emissiveIntensity: 0.5 });
      g.add(pos(box(0.04, 0.3, 0.04, arrowMat), 0, 2.1, 0));
      g.add(pos(box(0.15, 0.04, 0.04, arrowMat), 0, 2.28, 0));
      g.userData.scriptType = 'spawn_prisoner';
      return mergeGroup(g);
    }
  },
  {
    id: 'spawn_guard', name: 'Спавн охраны', icon: '👮', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      // Круг на полу (синий)
      const blueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 24), blueMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.02, 0);
      g.add(ring);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.48, 24), new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.15 }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(0, 0.01, 0);
      g.add(disc);
      // Силуэт с фуражкой
      g.add(pos(cyl(0.1, 0.1, 0.2, blueMat, 12), 0, 1.65, 0));
      // Козырёк фуражки
      g.add(pos(box(0.22, 0.03, 0.12, blueMat), 0, 1.77, 0.04));
      g.add(pos(box(0.06, 0.6, 0.06, blueMat), 0, 1.2, 0));
      g.add(pos(box(0.5, 0.06, 0.06, blueMat), 0, 1.35, 0));
      g.add(pos(box(0.06, 0.5, 0.06, blueMat), -0.1, 0.65, 0));
      g.add(pos(box(0.06, 0.5, 0.06, blueMat), 0.1, 0.65, 0));
      // Стрелка
      const arrowMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 0.5 });
      g.add(pos(box(0.04, 0.3, 0.04, arrowMat), 0, 2.1, 0));
      g.add(pos(box(0.15, 0.04, 0.04, arrowMat), 0, 2.28, 0));
      g.userData.scriptType = 'spawn_guard';
      return mergeGroup(g);
    }
  },
  {
    id: 'weapon_ak47', name: 'AK-47 (подбираемый)', icon: '🔫', category: 'things',
    description: 'Автомат AK-47. Подбирается любой командой по нажатию E.',
    create: () => {
      const g = new THREE.Group();
      // Круг подсветки на полу
      const weaponGlow = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 20), weaponGlow);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // AK-47 модель
      // Ствол
      g.add(pos(box(0.04, 0.04, 0.55, M.metalDark), 0, 0.5, -0.15));
      // Ствольная коробка
      g.add(pos(box(0.07, 0.09, 0.28, M.metalDark), 0, 0.5, 0.12));
      g.add(pos(box(0.065, 0.08, 0.26, M.metalMid), 0, 0.5, 0.12));
      // Магазин (банан)
      const mag = box(0.05, 0.18, 0.08, M.metalDark);
      mag.position.set(0, 0.38, 0.18);
      mag.rotation.x = 0.2;
      g.add(mag);
      // Приклад (дерево)
      g.add(pos(box(0.06, 0.08, 0.25, M.woodMid), 0, 0.49, 0.38));
      g.add(pos(box(0.055, 0.07, 0.24, M.woodDark), 0, 0.49, 0.38));
      // Рукоятка
      const grip = box(0.05, 0.1, 0.04, M.woodDark);
      grip.position.set(0, 0.42, 0.24);
      grip.rotation.x = -0.3;
      g.add(grip);
      // Цевьё
      g.add(pos(box(0.05, 0.045, 0.2, M.woodMid), 0, 0.47, -0.08));
      // Мушка
      g.add(pos(box(0.015, 0.04, 0.015, M.metalDark), 0, 0.55, -0.4));
      // Стрелка подбора
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.6 });
      g.add(pos(box(0.03, 0.15, 0.03, pickupMat), 0, 0.8, 0));
      g.add(pos(box(0.1, 0.03, 0.03, pickupMat), 0, 0.9, 0));
      g.userData.scriptType = 'weapon_pickup';
      g.userData.weaponType = 'ak47';
      return mergeGroup(g);
    }
  },
  {
    id: 'weapon_shotgun', name: 'SPAS-12 (подбираемый)', icon: '🔫', category: 'things',
    description: 'Дробовик SPAS-12. Подбирается любой командой по нажатию E.',
    create: () => {
      const g = new THREE.Group();
      // Glow ring on floor (orange)
      const weaponGlow = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 20), weaponGlow);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // SPAS-12 model
      // Long barrel
      g.add(pos(box(0.04, 0.04, 0.6, M.metalDark), 0, 0.5, -0.15));
      // Pump handguard below barrel
      g.add(pos(box(0.05, 0.04, 0.2, M.woodDark), 0, 0.46, -0.1));
      // Receiver body
      g.add(pos(box(0.07, 0.08, 0.2, M.metalDark), 0, 0.5, 0.15));
      // Stock
      g.add(pos(box(0.05, 0.06, 0.2, M.metalDark), 0, 0.5, 0.35));
      // Front sight post
      g.add(pos(box(0.01, 0.03, 0.01, M.metalDark), 0, 0.55, -0.44));
      // Pickup arrow (orange)
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.6 });
      g.add(pos(box(0.03, 0.15, 0.03, pickupMat), 0, 0.8, 0));
      g.add(pos(box(0.1, 0.03, 0.03, pickupMat), 0, 0.9, 0));
      g.userData.scriptType = 'weapon_pickup';
      g.userData.weaponType = 'shotgun';
      return mergeGroup(g);
    }
  },
  {
    id: 'weapon_pistol', name: 'Makarov PM (подбираемый)', icon: '🔫', category: 'things',
    description: 'Пистолет Макарова. Подбирается любой командой по нажатию E.',
    create: () => {
      const g = new THREE.Group();
      // Glow ring on floor (gray-blue)
      const weaponGlow = new THREE.MeshStandardMaterial({ color: 0x8888cc, emissive: 0x8888cc, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 20), weaponGlow);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // Makarov PM model
      // Slide
      g.add(pos(box(0.03, 0.03, 0.14, M.metalDark), 0, 0.45, 0));
      // Frame/lower
      g.add(pos(box(0.03, 0.025, 0.1, M.metalMid), 0, 0.44, 0.02));
      // Grip
      const gripMat = new THREE.MeshStandardMaterial({ color: 0x6b4020, roughness: 0.8 });
      const grip = box(0.025, 0.06, 0.035, gripMat);
      grip.position.set(0, 0.4, 0.04);
      grip.rotation.x = -0.2;
      g.add(grip);
      // Trigger guard
      g.add(pos(box(0.015, 0.02, 0.03, M.metalDark), 0, 0.42, 0.01));
      // Pickup arrow (gray-blue)
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0x8888cc, emissive: 0x8888cc, emissiveIntensity: 0.6 });
      g.add(pos(box(0.03, 0.15, 0.03, pickupMat), 0, 0.65, 0));
      g.add(pos(box(0.1, 0.03, 0.03, pickupMat), 0, 0.75, 0));
      g.userData.scriptType = 'weapon_pickup';
      g.userData.weaponType = 'pistol';
      return mergeGroup(g);
    }
  },
  {
    id: 'weapon_taser', name: 'Taser (подбираемый)', icon: '⚡', category: 'things',
    description: 'Тазер. Оглушает на 4 секунды. Подбирается по нажатию E.',
    create: () => {
      const g = new THREE.Group();
      // Glow ring on floor (electric blue)
      const weaponGlow = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x44aaff, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 20), weaponGlow);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // Taser model
      // Body (yellow)
      const taserBody = new THREE.MeshStandardMaterial({ color: 0xddcc00, roughness: 0.6 });
      g.add(pos(box(0.04, 0.035, 0.12, taserBody), 0, 0.45, 0));
      // Front section (dark)
      g.add(pos(box(0.04, 0.035, 0.03, M.metalDark), 0, 0.45, -0.075));
      // Two electrode prongs
      g.add(pos(cyl(0.005, 0.005, 0.04, M.metalShiny), 0.015, 0.45, -0.11));
      g.add(pos(cyl(0.005, 0.005, 0.04, M.metalShiny), -0.015, 0.45, -0.11));
      // Black stripe on body
      g.add(pos(box(0.041, 0.015, 0.04, M.metalDark), 0, 0.45, 0.02));
      // Green dot indicators
      const greenDot = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
      const dot1 = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), greenDot);
      dot1.position.set(0.01, 0.47, 0.04);
      g.add(dot1);
      const dot2 = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), greenDot);
      dot2.position.set(-0.01, 0.47, 0.04);
      g.add(dot2);
      // Pickup arrow (electric blue)
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x44aaff, emissiveIntensity: 0.6 });
      g.add(pos(box(0.03, 0.15, 0.03, pickupMat), 0, 0.65, 0));
      g.add(pos(box(0.1, 0.03, 0.03, pickupMat), 0, 0.75, 0));
      g.userData.scriptType = 'weapon_pickup';
      g.userData.weaponType = 'taser';
      return mergeGroup(g);
    }
  },

  // ============ ВЕЩИ (новые предметы) ============
  {
    id: 'item_shiv', name: 'Заточка', icon: '🗡️', category: 'things',
    description: 'Самодельная заточка. Наносит x2 урон кулаков. Подбирается по E.',
    create: () => {
      const g = new THREE.Group();
      // Glow ring on floor
      const glowMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 20), glowMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // Blade (sharpened metal shard)
      g.add(pos(box(0.015, 0.02, 0.18, M.metalShiny), 0, 0.45, -0.05));
      // Blade edge taper
      g.add(pos(box(0.01, 0.015, 0.06, M.metalLight), 0, 0.45, -0.17));
      // Tape-wrapped handle
      const tapeMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
      g.add(pos(box(0.025, 0.025, 0.1, tapeMat), 0, 0.45, 0.08));
      // Tape wraps (rings)
      for (let i = 0; i < 4; i++) {
        g.add(pos(box(0.03, 0.03, 0.015, M.metalDark), 0, 0.45, 0.04 + i * 0.025));
      }
      // Pickup arrow
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 0.6 });
      g.add(pos(box(0.025, 0.12, 0.025, pickupMat), 0, 0.7, 0));
      g.add(pos(box(0.08, 0.025, 0.025, pickupMat), 0, 0.78, 0));
      g.userData.scriptType = 'item_pickup';
      g.userData.itemType = 'item_shiv';
      return mergeGroup(g);
    }
  },
  {
    id: 'item_baton', name: 'Дубинка', icon: '🏏', category: 'things',
    description: 'Резиновая дубинка. Наносит x1.5 урон кулаков. Подбирается по E.',
    create: () => {
      const g = new THREE.Group();
      // Glow ring on floor
      const glowMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 20), glowMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // Baton body (rubber, black)
      const rubberMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
      g.add(pos(cyl(0.025, 0.022, 0.45, rubberMat), 0, 0.5, 0));
      // Grip ridges
      for (let i = 0; i < 5; i++) {
        g.add(pos(cyl(0.028, 0.028, 0.015, M.metalDark), 0, 0.3 + i * 0.025, 0));
      }
      // Handle cap
      g.add(pos(cyl(0.03, 0.03, 0.02, M.metalMid), 0, 0.27, 0));
      // Tip cap
      g.add(pos(cyl(0.024, 0.02, 0.02, M.metalMid), 0, 0.73, 0));
      // Pickup arrow
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.6 });
      g.add(pos(box(0.025, 0.12, 0.025, pickupMat), 0, 0.9, 0));
      g.add(pos(box(0.08, 0.025, 0.025, pickupMat), 0, 0.98, 0));
      g.userData.scriptType = 'item_pickup';
      g.userData.itemType = 'item_baton';
      return mergeGroup(g);
    }
  },
  {
    id: 'item_shield', name: 'Щит', icon: '🛡️', category: 'things',
    description: '\u0411\u0443\u043d\u0442\u043e\u0432\u043e\u0439 \u0449\u0438\u0442. \u041f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e \u0431\u043b\u043e\u043a\u0438\u0440\u0443\u0435\u0442 \u0432\u0435\u0441\u044c \u0432\u0445\u043e\u0434\u044f\u0449\u0438\u0439 \u0443\u0440\u043e\u043d. \u041f\u043e\u0434\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044f \u043f\u043e E.',
    create: () => {
      const g = new THREE.Group();
      // Glow ring on floor
      const glowMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x44aaff, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 8, 20), glowMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // Shield frame (tall rectangle with rounded top)
      g.add(pos(box(0.6, 0.9, 0.04, M.metalDark), 0, 0.7, 0));
      // Transparent center panel
      const shieldGlass = new THREE.MeshStandardMaterial({ color: 0xaaddff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.4 });
      g.add(pos(box(0.5, 0.5, 0.02, shieldGlass), 0, 0.85, 0.02));
      // Frame edges
      g.add(pos(box(0.04, 0.9, 0.05, M.metalMid), -0.3, 0.7, 0));
      g.add(pos(box(0.04, 0.9, 0.05, M.metalMid), 0.3, 0.7, 0));
      g.add(pos(box(0.64, 0.04, 0.05, M.metalMid), 0, 1.15, 0));
      g.add(pos(box(0.64, 0.04, 0.05, M.metalMid), 0, 0.25, 0));
      // Handle (back)
      g.add(pos(box(0.08, 0.15, 0.04, M.metalDark), 0, 0.6, -0.04));
      // Pickup arrow
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x44aaff, emissiveIntensity: 0.6 });
      g.add(pos(box(0.025, 0.12, 0.025, pickupMat), 0, 1.4, 0));
      g.add(pos(box(0.08, 0.025, 0.025, pickupMat), 0, 1.48, 0));
      g.userData.scriptType = 'item_pickup';
      g.userData.itemType = 'item_shield';
      return mergeGroup(g);
    }
  },
  {
    id: 'item_flashlight', name: 'Фонарик', icon: '🔦', category: 'things',
    description: 'Тактический фонарик. ЛКМ включает/выключает свет. Подбирается по E.',
    create: () => {
      const g = new THREE.Group();
      // Glow ring on floor
      const glowMat = new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0xffdd44, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 8, 20), glowMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // Flashlight body (cylinder)
      g.add(pos(cyl(0.025, 0.025, 0.22, M.metalDark), 0, 0.45, 0));
      // Head (wider section)
      g.add(pos(cyl(0.035, 0.025, 0.06, M.metalMid), 0, 0.57, 0));
      // Lens
      const lensMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.3, transparent: true, opacity: 0.8 });
      g.add(pos(cyl(0.033, 0.033, 0.01, lensMat), 0, 0.6, 0));
      // Grip texture (rings)
      for (let i = 0; i < 6; i++) {
        g.add(pos(cyl(0.027, 0.027, 0.008, M.metalMid), 0, 0.36 + i * 0.02, 0));
      }
      // Tail cap button
      g.add(pos(cyl(0.015, 0.015, 0.015, M.metalLight), 0, 0.33, 0));
      // Pickup arrow
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0xffdd44, emissiveIntensity: 0.6 });
      g.add(pos(box(0.025, 0.12, 0.025, pickupMat), 0, 0.75, 0));
      g.add(pos(box(0.08, 0.025, 0.025, pickupMat), 0, 0.83, 0));
      g.userData.scriptType = 'item_pickup';
      g.userData.itemType = 'item_flashlight';
      return mergeGroup(g);
    }
  },
  {
    id: 'item_medkit', name: 'Аптечка', icon: '💊', category: 'things',
    description: 'Аптечка первой помощи. Восстанавливает +50 HP за 2 секунды.',
    create: () => {
      const g = new THREE.Group();
      // Glow ring on floor
      const glowMat = new THREE.MeshStandardMaterial({ color: 0x44ff44, emissive: 0x44ff44, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 20), glowMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // Box body (white)
      const boxMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 });
      g.add(pos(box(0.25, 0.15, 0.18, boxMat), 0, 0.45, 0));
      // Red cross on top
      const crossMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });
      g.add(pos(box(0.12, 0.005, 0.04, crossMat), 0, 0.528, 0));
      g.add(pos(box(0.04, 0.005, 0.12, crossMat), 0, 0.528, 0));
      // Red cross on front
      g.add(pos(box(0.08, 0.03, 0.005, crossMat), 0, 0.45, 0.091));
      g.add(pos(box(0.03, 0.08, 0.005, crossMat), 0, 0.45, 0.091));
      // Latch
      g.add(pos(box(0.04, 0.02, 0.015, M.metalLight), 0, 0.39, 0.09));
      // Edges
      g.add(pos(box(0.26, 0.01, 0.19, M.metalLight), 0, 0.375, 0));
      // Pickup arrow
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0x44ff44, emissive: 0x44ff44, emissiveIntensity: 0.6 });
      g.add(pos(box(0.025, 0.12, 0.025, pickupMat), 0, 0.7, 0));
      g.add(pos(box(0.08, 0.025, 0.025, pickupMat), 0, 0.78, 0));
      g.userData.scriptType = 'item_pickup';
      g.userData.itemType = 'item_medkit';
      return mergeGroup(g);
    }
  },
  {
    id: 'item_bandage', name: 'Бинты', icon: '🩹', category: 'things',
    description: 'Рулон бинтов. Медленно восстанавливает +20 HP за 7 секунд.',
    create: () => {
      const g = new THREE.Group();
      // Glow ring on floor
      const glowMat = new THREE.MeshStandardMaterial({ color: 0x88ff88, emissive: 0x88ff88, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 8, 20), glowMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.01, 0);
      g.add(ring);
      // Bandage roll (cylinder, white)
      const bandageMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.85 });
      const roll = cyl(0.06, 0.06, 0.08, bandageMat);
      roll.rotation.x = Math.PI / 2;
      roll.position.set(0, 0.45, 0);
      g.add(roll);
      // Inner hole
      const innerMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 });
      const inner = cyl(0.02, 0.02, 0.085, innerMat);
      inner.rotation.x = Math.PI / 2;
      inner.position.set(0, 0.45, 0);
      g.add(inner);
      // Trailing bandage strip
      g.add(pos(box(0.04, 0.005, 0.12, bandageMat), 0.04, 0.42, 0.08));
      // Pickup arrow
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0x88ff88, emissive: 0x88ff88, emissiveIntensity: 0.6 });
      g.add(pos(box(0.025, 0.12, 0.025, pickupMat), 0, 0.65, 0));
      g.add(pos(box(0.08, 0.025, 0.025, pickupMat), 0, 0.73, 0));
      g.userData.scriptType = 'item_pickup';
      g.userData.itemType = 'item_bandage';
      return mergeGroup(g);
    }
  },

  {
    id: 'item_vest', name: 'Бронежилет', icon: '🦺', category: 'things',
    description: 'Бронежилет. Поглощает урон создавая щит брони. Подбирается по E.',
    create: () => {
      const g = new THREE.Group();
      const vestMat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.8 });
      const strapMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
      // Vest body
      g.add(pos(box(0.25, 0.2, 0.08, vestMat), 0, 0.85, 0));
      // Straps
      g.add(pos(box(0.03, 0.28, 0.02, strapMat), -0.08, 0.89, 0));
      g.add(pos(box(0.03, 0.28, 0.02, strapMat), 0.08, 0.89, 0));
      // Pedestal/pickup indicator
      const pickupMat = new THREE.MeshStandardMaterial({ color: 0x00cc88, emissive: 0x00cc88, emissiveIntensity: 0.3 });
      g.add(pos(box(0.08, 0.025, 0.025, pickupMat), 0, 0.73, 0));
      g.userData.scriptType = 'item_pickup';
      g.userData.itemType = 'item_vest';
      return mergeGroup(g);
    }
  },

  {
    id: 'terminal', name: 'Терминал камер', icon: '🖥️', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      // Desk body (wider)
      g.add(pos(box(1.0, 0.85, 0.5, M.metalDark), 0, 0.425, 0));
      // Desk side panels
      g.add(pos(box(0.03, 0.83, 0.48, M.metalMid), -0.49, 0.425, 0));
      g.add(pos(box(0.03, 0.83, 0.48, M.metalMid), 0.49, 0.425, 0));
      // Top surface
      g.add(pos(box(1.02, 0.03, 0.52, M.metalMid), 0, 0.87, 0));
      // Monitor screen (bigger, angled slightly back)
      const screenMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.1, metalness: 0.3, emissive: 0x0a1a3a, emissiveIntensity: 0.3 });
      const screen = box(0.7, 0.42, 0.03, screenMat);
      screen.position.set(0, 1.26, -0.12);
      screen.rotation.x = -0.12;
      screen.userData.isTerminalScreen = true;
      g.add(screen);
      // Monitor bezel (frame)
      const frame = box(0.76, 0.48, 0.02, M.metalDark);
      frame.position.set(0, 1.26, -0.14);
      frame.rotation.x = -0.12;
      g.add(frame);
      // Monitor bezel edges (top/bottom/left/right strips)
      const bezelTop = box(0.76, 0.025, 0.025, M.metalMid);
      bezelTop.position.set(0, 1.50, -0.14);
      bezelTop.rotation.x = -0.12;
      g.add(bezelTop);
      const bezelBot = box(0.76, 0.025, 0.025, M.metalMid);
      bezelBot.position.set(0, 1.03, -0.14);
      bezelBot.rotation.x = -0.12;
      g.add(bezelBot);
      // Monitor stand/neck
      g.add(pos(box(0.08, 0.18, 0.08, M.metalDark), 0, 0.96, -0.12));
      // Monitor base plate
      g.add(pos(box(0.2, 0.02, 0.12, M.metalDark), 0, 0.88, -0.12));
      // Keyboard (3 rows of key boxes)
      g.add(pos(box(0.4, 0.015, 0.18, M.metalDark), 0, 0.89, 0.1)); // keyboard base
      // Key row 1 (top)
      for (let i = -5; i <= 5; i++) {
        g.add(pos(box(0.028, 0.012, 0.035, M.metalMid), i * 0.034, 0.905, 0.04));
      }
      // Key row 2 (middle)
      for (let i = -5; i <= 5; i++) {
        g.add(pos(box(0.028, 0.012, 0.035, M.metalMid), i * 0.034, 0.905, 0.08));
      }
      // Key row 3 (bottom - spacebar area)
      for (let i = -4; i <= 4; i++) {
        g.add(pos(box(0.028, 0.012, 0.035, M.metalMid), i * 0.034, 0.905, 0.12));
      }
      // Spacebar
      g.add(pos(box(0.12, 0.012, 0.035, M.metalLight), 0, 0.905, 0.155));
      // Mouse (small box + cylinder button)
      g.add(pos(box(0.04, 0.02, 0.06, M.metalMid), 0.3, 0.895, 0.1)); // mouse body
      g.add(pos(cyl(0.008, 0.008, 0.015, M.metalLight, 8), 0.3, 0.91, 0.085)); // scroll wheel
      // Cables (thin cylinders from desk back)
      g.add(pos(cyl(0.01, 0.01, 0.4, M.metalDark, 6), -0.2, 0.66, -0.25));
      g.add(pos(cyl(0.008, 0.008, 0.35, M.metalDark, 6), 0.1, 0.68, -0.25));
      g.add(pos(cyl(0.012, 0.012, 0.45, M.metalDark, 6), 0.25, 0.64, -0.25));
      // LED indicators (5 total)
      const ledGreen = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.6 });
      g.add(pos(box(0.015, 0.015, 0.01, ledGreen), -0.3, 0.90, -0.2));
      g.add(pos(box(0.015, 0.015, 0.01, ledGreen), -0.27, 0.90, -0.2));
      g.add(pos(box(0.015, 0.015, 0.01, M.ledRed), -0.24, 0.90, -0.2));
      g.add(pos(box(0.015, 0.015, 0.01, ledGreen), -0.21, 0.90, -0.2));
      g.add(pos(box(0.015, 0.015, 0.01, M.ledRed), -0.18, 0.90, -0.2));
      g.userData.scriptType = 'terminal';
      return mergeGroup(g);
    }
  },

  {
    id: 'garage_door_large', name: '\u0413\u0430\u0440\u0430\u0436\u043d\u0430\u044f \u0434\u0432\u0435\u0440\u044c (\u0431\u043e\u043b.)', icon: '\uD83D\uDEAA', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      const doorW = 5;
      const doorH = 4;
      const panelRows = 10;
      const panelH = doorH / panelRows;
      // Horizontal ribbed panels
      for (let i = 0; i < panelRows; i++) {
        const mat = i % 2 === 0 ? M.metalMid : M.metalDark;
        const y = panelH * 0.5 + i * panelH;
        g.add(pos(box(doorW - 0.2, panelH * 0.9, 0.06, mat), 0, y, 0));
      }
      // Vertical guide rails
      for (const dx of [-(doorW / 2), doorW / 2]) {
        g.add(pos(box(0.1, doorH, 0.12, M.metalDark), dx, doorH / 2, 0));
        // Rivets along rails
        for (let i = 0; i < 8; i++) {
          const ry = 0.3 + i * (doorH - 0.6) / 7;
          g.add(pos(cyl(0.025, 0.025, 0.03, M.metalShiny, 8), dx, ry, 0.07));
        }
      }
      // Top mechanism housing
      g.add(pos(box(doorW + 0.1, 0.3, 0.25, M.metalDark), 0, doorH + 0.15, 0));
      // Bottom handle bar
      g.add(pos(box(doorW * 0.5, 0.06, 0.08, M.chrome), 0, 0.15, 0.06));
      // LED indicator
      const ledGreen = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.6 });
      g.add(pos(box(0.04, 0.04, 0.02, ledGreen), doorW / 2 - 0.2, doorH - 0.2, 0.08));
      // Invisible collision box
      const collider = box(doorW, doorH, 0.2, new THREE.MeshBasicMaterial({ visible: false }));
      collider.position.set(0, doorH / 2, 0);
      collider.visible = false;
      g.add(collider);
      g.userData.scriptType = 'garage_door';
      g.userData.doorHeight = doorH;
      return mergeGroup(g);
    }
  },

  {
    id: 'garage_door_medium', name: '\u0413\u0430\u0440\u0430\u0436\u043d\u0430\u044f \u0434\u0432\u0435\u0440\u044c (\u0441\u0440\u0435\u0434.)', icon: '\uD83D\uDEAA', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      const doorW = 3.5;
      const doorH = 3;
      const panelRows = 8;
      const panelH = doorH / panelRows;
      // Horizontal ribbed panels
      for (let i = 0; i < panelRows; i++) {
        const mat = i % 2 === 0 ? M.metalMid : M.metalDark;
        const y = panelH * 0.5 + i * panelH;
        g.add(pos(box(doorW - 0.2, panelH * 0.9, 0.06, mat), 0, y, 0));
      }
      // Vertical guide rails
      for (const dx of [-(doorW / 2), doorW / 2]) {
        g.add(pos(box(0.1, doorH, 0.12, M.metalDark), dx, doorH / 2, 0));
        // Rivets along rails
        for (let i = 0; i < 6; i++) {
          const ry = 0.3 + i * (doorH - 0.6) / 5;
          g.add(pos(cyl(0.025, 0.025, 0.03, M.metalShiny, 8), dx, ry, 0.07));
        }
      }
      // Top mechanism housing
      g.add(pos(box(doorW + 0.1, 0.25, 0.22, M.metalDark), 0, doorH + 0.125, 0));
      // Bottom handle bar
      g.add(pos(box(doorW * 0.5, 0.06, 0.08, M.chrome), 0, 0.15, 0.06));
      // LED indicator
      const ledGreen = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.6 });
      g.add(pos(box(0.04, 0.04, 0.02, ledGreen), doorW / 2 - 0.2, doorH - 0.2, 0.08));
      // Invisible collision box
      const collider = box(doorW, doorH, 0.2, new THREE.MeshBasicMaterial({ visible: false }));
      collider.position.set(0, doorH / 2, 0);
      collider.visible = false;
      g.add(collider);
      g.userData.scriptType = 'garage_door';
      g.userData.doorHeight = doorH;
      return mergeGroup(g);
    }
  },

  {
    id: 'bars_door_guard', name: '\u0420\u0435\u0448\u0451\u0442\u043a\u0430 (\u043e\u0445\u0440\u0430\u043d\u0430)', icon: '\uD83D\uDD12', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        g.add(pos(cyl(0.02, 0.02, 3, M.bars), -0.55 + i * 0.18, 1.5, 0));
      }
      for (const y of [0.3, 1.5, 2.7]) {
        g.add(pos(box(1.2, 0.06, 0.06, M.metalDark), 0, y, 0));
      }
      // Замок
      g.add(pos(box(0.1, 0.15, 0.06, M.metalMid), 0.5, 1.2, 0.03));
      g.add(pos(cyl(0.025, 0.025, 0.04, M.chrome), 0.5, 1.2, 0.06));
      // Badge (guard accent)
      g.add(pos(box(0.12, 0.08, 0.02, M.metalPaint), 0.5, 1.5, 0.04));
      // Invisible collision box
      const collisionBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 3.8, 0.12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      collisionBox.position.set(0, 1.9, 0);
      g.add(collisionBox);
      return mergeGroup(g);
    }
  },
  {
    id: 'bars_door_rental', name: '\u0420\u0435\u0448\u0451\u0442\u043a\u0430 - \u0430\u0440\u0435\u043d\u0434\u0430', icon: '\uD83D\uDD11', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        g.add(pos(cyl(0.02, 0.02, 3, M.bars), -0.55 + i * 0.18, 1.5, 0));
      }
      for (const y of [0.3, 1.5, 2.7]) {
        g.add(pos(box(1.2, 0.06, 0.06, M.metalDark), 0, y, 0));
      }
      // Замок
      g.add(pos(box(0.1, 0.15, 0.06, M.metalMid), 0.5, 1.2, 0.03));
      g.add(pos(cyl(0.025, 0.025, 0.04, M.chrome), 0.5, 1.2, 0.06));
      // Rental sign (gold/yellow accent)
      g.add(pos(box(0.2, 0.1, 0.02, M.warning), 0.35, 1.7, 0.04));
      // Invisible collision box
      const collisionBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 3.8, 0.12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      collisionBox.position.set(0, 1.9, 0);
      g.add(collisionBox);
      return mergeGroup(g);
    }
  },

  {
    id: 'storage_locker', name: '\u0428\u043a\u0430\u0444 \u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f', icon: '\uD83D\uDDC4', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      // Корпус шкафа (темный металл)
      g.add(pos(box(0.6, 1.9, 0.5, M.metalDark), 0, 0.95, 0));
      // Дверная панель (чуть светлее)
      g.add(pos(box(0.56, 1.84, 0.04, M.metalMid), 0, 0.95, 0.24));
      // Ручка двери
      g.add(pos(box(0.04, 0.12, 0.04, M.chrome), 0.2, 0.95, 0.27));
      // Вентиляционные щели наверху
      for (let i = 0; i < 4; i++) {
        g.add(pos(box(0.3, 0.015, 0.02, M.metalDark), 0, 1.7 + i * 0.04, 0.26));
      }
      // Замок (навесной)
      g.add(pos(box(0.06, 0.08, 0.04, M.metalMid), 0.2, 0.8, 0.27));
      g.add(pos(cyl(0.02, 0.02, 0.05, M.chrome, 8), 0.2, 0.86, 0.28));
      // Пятна ржавчины
      g.add(pos(box(0.12, 0.08, 0.02, M.metalRust), -0.15, 0.3, 0.25));
      g.add(pos(box(0.08, 0.1, 0.02, M.metalRust), 0.1, 1.5, 0.25));
      // Ножки
      g.add(pos(box(0.08, 0.05, 0.08, M.metalDark), -0.22, 0.025, -0.18));
      g.add(pos(box(0.08, 0.05, 0.08, M.metalDark), 0.22, 0.025, -0.18));
      g.add(pos(box(0.08, 0.05, 0.08, M.metalDark), -0.22, 0.025, 0.18));
      g.add(pos(box(0.08, 0.05, 0.08, M.metalDark), 0.22, 0.025, 0.18));
      return mergeGroup(g);
    }
  },

  {
    id: 'money_bag', name: '\u041c\u0435\u0448\u043e\u043a \u0434\u0435\u043d\u0435\u0433 (1000\u20bd)', icon: '\uD83D\uDCB0', category: 'scripts',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.2, 0.25, 0.35, M.woodMid, 8), 0, 0.18, 0));
      g.add(pos(cyl(0.12, 0.2, 0.1, M.woodDark, 8), 0, 0.38, 0));
      g.add(pos(cyl(0.02, 0.02, 0.15, M.metalLight), 0, 0.43, 0));
      g.add(pos(cyl(0.06, 0.06, 0.02, M.warning, 12), 0.05, 0.35, 0.05));
      g.add(pos(cyl(0.06, 0.06, 0.02, M.warning, 12), -0.04, 0.36, -0.03));
      return mergeGroup(g);
    }
  },

  // ============ СТРОЙКА ============
  {
    id: 'stairs_straight', name: 'Лестница (ступени)', icon: '🪜', category: 'building',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const sy = i * 0.5;
        const sz = -i * 0.5;
        // Горизонтальная ступень (поднята вровень с верхом подступенка)
        g.add(pos(box(2, 0.12, 0.52, M.conc2), 0, sy + 0.5, sz));
        // Подступенок (вертикальная часть, заполняет до предыдущей ступени)
        g.add(pos(box(2, 0.5, 0.06, M.conc3), 0, sy + 0.25, sz + 0.23));
      }
      // Боковые стенки
      for (const dx of [-1.03, 1.03]) {
        for (let i = 0; i < 8; i++) {
          const h = 0.56 + i * 0.5;
          g.add(pos(box(0.06, h, 0.52, M.concDirty), dx, h / 2, -i * 0.5));
        }
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'fence_metal', name: 'Забор металлический', icon: '🔗', category: 'building',
    create: () => {
      const g = new THREE.Group();
      // Столбы
      for (const x of [-2, 0, 2]) g.add(pos(cyl(0.05, 0.05, 2, M.metalDark), x, 1, 0));
      // Горизонтальные перекладины
      for (const y of [0.3, 0.7, 1.1, 1.5, 1.9]) g.add(pos(box(4, 0.04, 0.04, M.metalLight), 0, y, 0));
      // Вертикальные прутья
      for (let x = -1.8; x <= 1.8; x += 0.3) g.add(pos(cyl(0.015, 0.015, 1.6, M.metalMid), x, 1.1, 0));
      // Верхний наконечник
      g.add(pos(box(4.1, 0.06, 0.06, M.metalDark), 0, 1.95, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'pillar_concrete', name: 'Колонна бетонная', icon: '🏛️', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.5, 4, 0.5, M.conc1), 0, 2, 0));
      g.add(pos(box(0.6, 0.15, 0.6, M.conc3), 0, 0.075, 0));
      g.add(pos(box(0.6, 0.15, 0.6, M.conc3), 0, 3.925, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'pillar_metal', name: 'Столб металлический', icon: '🔩', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.08, 0.08, 4, M.metalDark), 0, 2, 0));
      g.add(pos(box(0.25, 0.05, 0.25, M.metalMid), 0, 0.025, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'ramp', name: 'Пандус / рампа', icon: '📐', category: 'building',
    create: () => {
      const g = new THREE.Group();
      // Наклонная поверхность
      const rampGeo = new THREE.BoxGeometry(2, 0.15, 4);
      const ramp = new THREE.Mesh(rampGeo, M.conc2);
      ramp.position.set(0, 1, 0);
      ramp.rotation.x = 0.25;
      ramp.castShadow = true; ramp.receiveShadow = true;
      g.add(ramp);
      // Боковые бортики
      for (const dx of [-1.02, 1.02]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 4), M.conc3);
        b.position.set(dx, 1.1, 0); b.rotation.x = 0.25;
        g.add(b);
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'platform', name: 'Платформа', icon: '⬜', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.2, 4, M.conc2), 0, 2, 0));
      // Ноги
      for (const dx of [-1.7, 1.7]) for (const dz of [-1.7, 1.7]) {
        g.add(pos(cyl(0.08, 0.08, 2, M.metalDark), dx, 1, dz));
      }
      // Перила
      g.add(pos(box(4, 0.8, 0.05, M.metalLight), 0, 2.5, -1.97));
      g.add(pos(box(4, 0.8, 0.05, M.metalLight), 0, 2.5, 1.97));
      return mergeGroup(g);
    }
  },
  {
    id: 'beam_h', name: 'Балка горизонтальная', icon: '➖', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.2, 0.15, M.metalDark), 0, 0, 0));
      g.add(pos(box(4, 0.04, 0.3, M.metalMid), 0, -0.1, 0));
      g.add(pos(box(4, 0.04, 0.3, M.metalMid), 0, 0.1, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'pipe_h', name: 'Труба горизонтальная', icon: '🔧', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.08, 0.08, 4, M.metalRust), 0, 0, 0));
      const pipe = g.children[0] as THREE.Mesh;
      pipe.rotation.z = Math.PI / 2;
      // Крепления
      for (const x of [-1.5, 0, 1.5]) {
        g.add(pos(box(0.2, 0.15, 0.1, M.metalDark), x, 0.12, 0));
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'barbed_wire', name: 'Колючая проволока', icon: '⚡', category: 'building',
    create: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 8;
        const x = (i / 20) * 4 - 2;
        g.add(pos(cyl(0.01, 0.01, 0.12, M.metalDark), x, Math.sin(a) * 0.12, Math.cos(a) * 0.12));
      }
      g.add(pos(cyl(0.015, 0.015, 4, M.metalLight), 0, 0, 0));
      const wire = g.children[g.children.length - 1] as THREE.Mesh;
      wire.rotation.z = Math.PI / 2;
      return mergeGroup(g);
    }
  },
  {
    id: 'concrete_barrier', name: 'Бетонный блок', icon: '🧱', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(2, 0.8, 0.6, M.conc1), 0, 0.4, 0));
      g.add(pos(box(2.04, 0.06, 0.64, M.conc3), 0, 0.8, 0));
      g.add(pos(box(2.04, 0.06, 0.64, M.concDirty), 0, 0.03, 0));
      g.add(pos(box(2.01, 0.1, 0.01, M.warning), 0, 0.5, 0.31));
      return mergeGroup(g);
    }
  },
  {
    id: 'stairs_spiral', name: 'Винтовая лестница', icon: '🔄', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.1, 0.1, 4, M.metalDark), 0, 2, 0));
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const step = box(1.2, 0.1, 0.4, M.metalLight);
        step.position.set(Math.sin(angle) * 0.6, 0.2 + i * 0.33, Math.cos(angle) * 0.6);
        step.rotation.y = -angle;
        step.castShadow = true;
        g.add(step);
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'catwalk', name: 'Мостик / переход', icon: '🌉', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(6, 0.1, 1.5, M.metalMid), 0, 3, 0));
      // Перила
      for (const dz of [-0.75, 0.75]) {
        g.add(pos(box(6, 0.7, 0.04, M.metalLight), 0, 3.4, dz));
        for (let x = -2.5; x <= 2.5; x += 1) g.add(pos(cyl(0.02, 0.02, 0.7, M.metalDark), x, 3.4, dz));
      }
      // Опоры
      for (const dx of [-2.5, 2.5]) {
        g.add(pos(cyl(0.08, 0.08, 3, M.metalDark), dx, 1.5, -0.6));
        g.add(pos(cyl(0.08, 0.08, 3, M.metalDark), dx, 1.5, 0.6));
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'scaffolding', name: 'Строительные леса', icon: '🏗️', category: 'building',
    create: () => {
      const g = new THREE.Group();
      for (const dx of [-1, 1]) for (const dz of [-0.4, 0.4]) {
        g.add(pos(cyl(0.04, 0.04, 4, M.metalDark), dx, 2, dz));
      }
      // Поперечины
      for (const y of [1, 2, 3]) {
        g.add(pos(box(2, 0.04, 0.8, M.metalLight), 0, y, 0));
        g.add(pos(box(2, 0.04, 0.04, M.metalDark), 0, y + 0.5, 0));
      }
      // Настил
      g.add(pos(box(2, 0.06, 0.8, M.woodMid), 0, 2.03, 0));
      return mergeGroup(g);
    }
  },
  // --- Ограждение стройки ---
  {
    id: 'construction_fence', name: 'Ограждение стройки', icon: '🚧', category: 'building',
    create: () => {
      const g = new THREE.Group();
      for (const x of [-1.5, 0, 1.5]) g.add(pos(cyl(0.04, 0.04, 1.2, M.metalDark), x, 0.6, 0));
      g.add(pos(box(3.2, 0.08, 0.04, M.warning), 0, 0.8, 0));
      g.add(pos(box(3.2, 0.08, 0.04, M.danger), 0, 0.5, 0));
      g.add(pos(box(3.2, 0.08, 0.04, M.warning), 0, 0.2, 0));
      return mergeGroup(g);
    }
  },
  // --- Крыша плоская ---
  {
    id: 'roof_flat', name: 'Крыша плоская', icon: '⬜', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(4, 0.2, 4, M.conc3), 0, 0, 0));
      g.add(pos(box(4.1, 0.06, 0.12, M.metalDark), 0, 0.1, -1.94));
      g.add(pos(box(4.1, 0.06, 0.12, M.metalDark), 0, 0.1, 1.94));
      g.add(pos(box(0.12, 0.06, 4.1, M.metalDark), -1.94, 0.1, 0));
      g.add(pos(box(0.12, 0.06, 4.1, M.metalDark), 1.94, 0.1, 0));
      return mergeGroup(g);
    }
  },
  // --- Прожектор на штативе ---
  {
    id: 'light_tripod', name: 'Прожектор на штативе', icon: '🔦', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      // Штатив — 3 ноги как боксы
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const lx = Math.sin(a) * 0.25;
        const lz = Math.cos(a) * 0.25;
        g.add(pos(box(0.04, 1.8, 0.04, M.metalDark), lx, 0.9, lz));
        g.add(pos(box(0.06, 0.04, 0.06, M.metalMid), lx * 1.5, 0.02, lz * 1.5));
      }
      g.add(pos(cyl(0.04, 0.04, 0.5, M.metalDark), 0, 2.05, 0));
      // Корпус прожектора
      g.add(pos(cyl(0.15, 0.2, 0.25, M.metalMid, 12), 0, 2.4, 0.1));
      const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12), M.lampGlow);
      bulb.position.set(0, 2.4, 0.23);
      bulb.rotation.x = Math.PI / 2;
      g.add(bulb);
      const light = new THREE.SpotLight(0xffffcc, 3, 20, 0.4, 0.5);
      light.position.set(0, 2.4, 0.3);
      light.target.position.set(0, 0, 5);
      g.add(light); g.add(light.target);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  // --- Лампа подвесная ---
  {
    id: 'light_pendant', name: 'Лампа подвесная', icon: '💡', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.01, 0.01, 1, M.metalDark), 0, 3.5, 0));
      g.add(pos(cyl(0.15, 0.08, 0.2, M.metalMid, 8), 0, 2.9, 0));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), M.lampGlow);
      bulb.position.set(0, 2.82, 0);
      g.add(bulb);
      const light = new THREE.PointLight(0xffffcc, 2, 12);
      light.position.set(0, 2.8, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  // --- Фонарный столб ---
  {
    id: 'light_post', name: 'Фонарный столб', icon: '🔆', category: 'lighting',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.08, 0.1, 5, M.metalDark), 0, 2.5, 0));
      g.add(pos(box(0.25, 0.04, 0.25, M.metalDark), 0, 0.02, 0));
      // Рожок
      g.add(pos(box(0.6, 0.06, 0.04, M.metalMid), 0.3, 4.97, 0));
      // Плафон
      g.add(pos(cyl(0.12, 0.08, 0.15, M.metalLight, 8), 0.6, 4.9, 0));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), M.lampGlow);
      bulb.position.set(0.6, 4.82, 0);
      g.add(bulb);
      const light = new THREE.PointLight(0xffffaa, 1.2, 18);
      light.position.set(0.6, 4.8, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  // --- Генератор ---
  {
    id: 'generator', name: 'Генератор', icon: '⚡', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.8, 0.6, 0.5, M.metalPaint), 0, 0.3, 0));
      g.add(pos(box(0.82, 0.04, 0.52, M.metalDark), 0, 0.6, 0));
      // Решётка
      for (let i = 0; i < 5; i++) g.add(pos(box(0.7, 0.015, 0.02, M.metalLight), 0, 0.15 + i * 0.1, 0.24));
      // Панель
      g.add(pos(box(0.2, 0.15, 0.02, M.metalMid), -0.25, 0.45, 0.26));
      g.add(pos(cyl(0.02, 0.02, 0.02, M.danger, 6), -0.2, 0.48, 0.28));
      g.add(pos(cyl(0.02, 0.02, 0.02, M.ledRed, 6), -0.3, 0.48, 0.28));
      // Труба выхлопа
      g.add(pos(cyl(0.04, 0.04, 0.4, M.metalRust), 0.35, 0.8, -0.1));
      return mergeGroup(g);
    }
  },
  // --- Кондиционер ---
  {
    id: 'ac_unit', name: 'Кондиционер', icon: '❄️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.8, 0.25, 0.2, M.porcBase), 0, 2.8, 0));
      g.add(pos(box(0.76, 0.04, 0.18, M.porcRim), 0, 2.66, 0));
      // Решётка воздуха
      for (let i = 0; i < 6; i++) g.add(pos(box(0.65, 0.008, 0.01, M.porcInner), 0, 2.7 + i * 0.02, 0.09));
      return mergeGroup(g);
    }
  },
  // --- Перегородка офисная ---
  {
    id: 'partition', name: 'Перегородка', icon: '🔲', category: 'building',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(2, 1.5, 0.06, M.mattress), 0, 0.75, 0));
      g.add(pos(box(2.04, 0.06, 0.08, M.metalDark), 0, 1.5, 0));
      g.add(pos(box(0.06, 1.5, 0.08, M.metalDark), -1.0, 0.75, 0));
      g.add(pos(box(0.06, 1.5, 0.08, M.metalDark), 1.0, 0.75, 0));
      // Ножки
      g.add(pos(box(0.3, 0.04, 0.2, M.metalMid), -0.85, 0.02, 0));
      g.add(pos(box(0.3, 0.04, 0.2, M.metalMid), 0.85, 0.02, 0));
      return mergeGroup(g);
    }
  },
  // --- Контрольно-пропускной пункт ---
  {
    id: 'checkpoint', name: 'КПП / турникет', icon: '🚧', category: 'building',
    create: () => {
      const g = new THREE.Group();
      // Стойки
      g.add(pos(box(0.15, 1, 0.15, M.metalDark), -0.5, 0.5, 0));
      g.add(pos(box(0.15, 1, 0.15, M.metalDark), 0.5, 0.5, 0));
      // Турникет
      g.add(pos(box(0.06, 0.06, 0.9, M.metalShiny), 0, 0.8, 0));
      g.add(pos(box(0.06, 0.06, 0.9, M.metalShiny), 0, 0.5, 0));
      // Основание
      g.add(pos(box(1.2, 0.06, 0.3, M.metalMid), 0, 0.03, 0));
      return mergeGroup(g);
    }
  },
  // --- Сторожевая будка ---
  {
    id: 'guard_booth', name: 'Сторожевая будка', icon: '🏠', category: 'building',
    create: () => {
      const g = new THREE.Group();
      // Пол
      g.add(pos(box(2, 0.15, 2, M.conc2), 0, 0.075, 0));
      // Стены (3 стены, одна открытая)
      g.add(pos(box(2, 2.5, 0.15, M.conc1), 0, 1.35, -0.92));
      g.add(pos(box(0.15, 2.5, 2, M.conc1), -0.92, 1.35, 0));
      g.add(pos(box(0.15, 2.5, 2, M.conc1), 0.92, 1.35, 0));
      // Крыша
      g.add(pos(box(2.2, 0.12, 2.2, M.metalDark), 0, 2.66, 0));
      // Окно в задней стене
      g.add(pos(box(1, 0.8, 0.04, M.glass), 0, 1.8, -0.86));
      // Стол внутри
      g.add(pos(box(0.6, 0.04, 0.4, M.woodMid), 0, 0.8, -0.5));
      // Свет
      const light = new THREE.PointLight(0xffffcc, 1.5, 8);
      light.position.set(0, 2.5, 0);
      g.add(light);
      g.userData.hasLight = true;
      return mergeGroup(g);
    }
  },
  // --- Full Staircase with Landing ---
  {
    id: 'staircase_detailed', name: 'Лестница с площадкой', icon: '🪜', category: 'building',
    create: () => {
      const g = new THREE.Group();
      // 8 steps: treads and risers
      for (let i = 0; i < 8; i++) {
        const sy = i * 0.5;
        const sz = -i * 0.5;
        // Tread
        g.add(pos(box(2, 0.12, 0.5, M.conc2), 0, sy + 0.5, sz));
        // Riser
        g.add(pos(box(2, 0.38, 0.06, M.conc3), 0, sy + 0.25, sz + 0.23));
        // Anti-slip strip on each tread
        g.add(pos(box(1.8, 0.01, 0.08, M.yellowStripe), 0, sy + 0.56, sz + 0.2));
        // Nosing detail on each step edge
        g.add(pos(box(2, 0.04, 0.04, M.metalLight), 0, sy + 0.55, sz + 0.24));
      }
      // Side stringers
      for (const dx of [-1.03, 1.03]) {
        for (let i = 0; i < 8; i++) {
          const h = 0.56 + i * 0.5;
          g.add(pos(box(0.06, h, 0.52, M.concDirty), dx, h / 2, -i * 0.5));
        }
      }
      // Handrail on one side: vertical posts + horizontal top rail
      for (let i = 0; i < 5; i++) {
        const py = i * 1.0 + 0.8;
        const pz = -i * 1.0;
        g.add(pos(cyl(0.03, 0.03, 0.8, M.metalDark), 1.03, py, pz));
      }
      g.add(pos(box(0.04, 0.04, 4.5, M.metalDark), 1.03, 4.4, -1.8));
      // Landing platform at top
      g.add(pos(box(2, 0.15, 1.5, M.conc2), 0, 4.07, -4.5));
      // Rubber mat on landing
      g.add(pos(box(1.8, 0.01, 1.3, M.rubberFloor), 0, 4.15, -4.5));
      return mergeGroup(g);
    }
  },
  // --- Smooth Ramp with Safety Rails ---
  {
    id: 'ramp_detailed', name: 'Пандус с ограждением', icon: '📐', category: 'building',
    create: () => {
      const g = new THREE.Group();
      // Main ramp surface (rotated for slope)
      const rampMesh = box(2, 0.15, 5, M.conc2);
      rampMesh.position.set(0, 1.0, 0);
      rampMesh.rotation.x = 0.2;
      g.add(rampMesh);
      // Non-slip texture strips across width
      for (let i = -2; i <= 2; i += 0.5) {
        const strip = box(1.8, 0.01, 0.08, M.yellowStripe);
        strip.position.set(0, 1.05, i);
        strip.rotation.x = 0.2;
        g.add(strip);
      }
      // Safety rails on both sides: posts + top rail
      for (const dx of [-1.02, 1.02]) {
        for (let z = -2; z <= 2; z += 1.0) {
          const postH = 0.8;
          const postY = 1.0 + Math.tan(0.2) * (-z) + postH / 2;
          g.add(pos(cyl(0.03, 0.03, postH, M.metalDark), dx, postY, z));
        }
        // Top rail
        const rail = box(0.04, 0.04, 5, M.metalDark);
        rail.position.set(dx, 1.8, 0);
        rail.rotation.x = 0.2;
        g.add(rail);
      }
      // Landing pads at top and bottom
      g.add(pos(box(2, 0.15, 1.0, M.conc2), 0, 0.075, -3.0));
      g.add(pos(box(2, 0.15, 1.0, M.conc2), 0, 2.0, 3.0));
      // Orange safety markings on landing edges
      g.add(pos(box(2, 0.02, 0.1, M.orangePaint), 0, 0.16, -2.55));
      g.add(pos(box(2, 0.02, 0.1, M.emergRed), 0, 2.08, 2.55));
      // Edge trim along sides
      const trimL = box(0.04, 0.18, 5, M.metalDark);
      trimL.position.set(-1.0, 1.0, 0);
      trimL.rotation.x = 0.2;
      g.add(trimL);
      const trimR = box(0.04, 0.18, 5, M.metalDark);
      trimR.position.set(1.0, 1.0, 0);
      trimR.rotation.x = 0.2;
      g.add(trimR);
      return mergeGroup(g);
    }
  },
  // --- Decorative Fluted Column ---
  {
    id: 'pillar_fluted', name: 'Колонна рифлёная', icon: '🏛️', category: 'building',
    create: () => {
      const g = new THREE.Group();
      // Main cylinder shaft
      g.add(pos(cyl(0.25, 0.25, 3.2, M.conc1, 16), 0, 1.9, 0));
      // Base (wider)
      g.add(pos(box(0.7, 0.3, 0.7, M.conc3), 0, 0.15, 0));
      // Capital (wider with molding)
      g.add(pos(box(0.65, 0.2, 0.65, M.conc2), 0, 3.6, 0));
      g.add(pos(box(0.6, 0.1, 0.6, M.conc1), 0, 3.75, 0));
      // Fluting detail: thin vertical boxes pressed against column surface
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const fx = Math.sin(angle) * 0.26;
        const fz = Math.cos(angle) * 0.26;
        g.add(pos(box(0.03, 3.0, 0.015, M.concDirty), fx, 1.9, fz));
      }
      // Surface wear patches at base
      g.add(pos(box(0.3, 0.4, 0.01, M.agedStain), 0.15, 0.5, 0.25));
      g.add(pos(box(0.25, 0.3, 0.01, M.agedStain), -0.1, 0.4, -0.25));
      // White paint band (marking)
      g.add(pos(box(0.04, 0.3, 0.04, M.whitePaint), 0.26, 1.2, 0));
      return mergeGroup(g);
    }
  },
  // --- Chain-link Fence with Barbed Wire ---
  {
    id: 'fence_barbed_wire', name: 'Забор с колючкой', icon: '⚡', category: 'building',
    create: () => {
      const g = new THREE.Group();
      // Posts
      g.add(pos(cyl(0.05, 0.05, 2.5, M.metalDark), -2, 1.25, 0));
      g.add(pos(cyl(0.05, 0.05, 2.5, M.metalDark), 2, 1.25, 0));
      // Post caps
      g.add(pos(cyl(0.06, 0.06, 0.04, M.metalMid), -2, 2.52, 0));
      g.add(pos(cyl(0.06, 0.06, 0.04, M.metalMid), 2, 2.52, 0));
      // Top rail
      g.add(pos(box(4, 0.06, 0.06, M.metalDark), 0, 2.5, 0));
      // Bottom rail
      g.add(pos(box(4, 0.06, 0.06, M.metalDark), 0, 0.1, 0));
      // Chain link mesh: diagonal crossing thin boxes
      for (let i = 0; i < 16; i++) {
        const w = box(0.015, 0.015, 2.2, M.chainMetal);
        w.position.set(-1.8 + i * 0.24, 1.25, 0);
        w.rotation.z = 0.7;
        g.add(w);
        const w2 = box(0.015, 0.015, 2.2, M.chainMetal);
        w2.position.set(-1.8 + i * 0.24, 1.25, 0);
        w2.rotation.z = -0.7;
        g.add(w2);
      }
      // Tension bars (thin vertical elements on each side)
      g.add(pos(box(0.02, 2.3, 0.02, M.metalDark), -1.9, 1.25, 0));
      g.add(pos(box(0.02, 2.3, 0.02, M.metalDark), 1.9, 1.25, 0));
      // Barbed wire coils on top (2 rows)
      for (let row = 0; row < 2; row++) {
        const ry = 2.65 + row * 0.2;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 6;
          const x = (i / 12) * 4 - 2;
          g.add(pos(cyl(0.008, 0.008, 0.1, M.barbedWire), x, ry + Math.sin(a) * 0.08, Math.cos(a) * 0.08));
        }
      }
      // Warning sign on fence
      g.add(pos(box(0.4, 0.3, 0.02, M.screenGlow), -0.5, 1.6, 0.04));
      // Fabric strips caught in fence
      g.add(pos(box(0.15, 0.25, 0.02, M.fabricOrange), 0.8, 1.8, 0.02));
      g.add(pos(box(0.12, 0.2, 0.02, M.fabricKhaki), -1.2, 1.3, 0.02));
      return mergeGroup(g);
    }
  },

  // === ЛЕСТНИЦА ===
  {
    id: 'ladder', name: 'Лестница', icon: '🪜', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Two vertical rails
      g.add(pos(cyl(0.03, 0.03, 3.5, M.metalDark), -0.25, 1.75, 0));
      g.add(pos(cyl(0.03, 0.03, 3.5, M.metalDark), 0.25, 1.75, 0));
      // 8 horizontal rungs
      for (let i = 0; i < 8; i++) {
        const y = 0.3 + i * 0.4;
        g.add(pos(box(0.5, 0.04, 0.04, M.metalLight), 0, y, 0));
      }
      // Invisible collision box
      const collisionGeo = new THREE.BoxGeometry(0.6, 3.5, 0.2);
      const collisionMat = new THREE.MeshBasicMaterial({ visible: false });
      const collisionBox = new THREE.Mesh(collisionGeo, collisionMat);
      collisionBox.position.set(0, 1.75, 0);
      g.add(collisionBox);
      g.userData.objectType = 'ladder';
      g.userData.climbHeight = 3.5;
      return g;
    }
  },

  // === ОКНО ===
  {
    id: 'window_glass', name: 'Окно', icon: '🪟', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Metal frame (4 bars forming rectangle 1.2m x 1.5m)
      g.add(pos(box(1.2, 0.06, 0.06, M.metalDark), 0, 0.75, 0));   // bottom
      g.add(pos(box(1.2, 0.06, 0.06, M.metalDark), 0, 2.25, 0));   // top
      g.add(pos(box(0.06, 1.5, 0.06, M.metalDark), -0.57, 1.5, 0)); // left
      g.add(pos(box(0.06, 1.5, 0.06, M.metalDark), 0.57, 1.5, 0));  // right
      // Transparent glass pane in center
      const glassMesh = box(1.08, 1.38, 0.02, M.glass);
      glassMesh.position.set(0, 1.5, 0);
      glassMesh.userData.isGlass = true;
      g.add(glassMesh);
      g.userData.objectType = 'window_glass';
      return g;
    }
  },

  // === КОЛЮЧАЯ ПРОВОЛОКА ===
  {
    id: 'barbed_wire', name: 'Колючая проволока', icon: '🔪', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Two short posts
      g.add(pos(cyl(0.04, 0.04, 0.8, M.metalDark), -1.0, 0.4, 0));
      g.add(pos(cyl(0.04, 0.04, 0.8, M.metalDark), 1.0, 0.4, 0));
      // Coiled wire segments between posts
      for (let i = 0; i < 16; i++) {
        const t = i / 16;
        const x = -0.9 + t * 1.8;
        const a = t * Math.PI * 6;
        const y = 0.6 + Math.sin(a) * 0.1;
        const z = Math.cos(a) * 0.1;
        const wire = cyl(0.008, 0.008, 0.15, M.barbedWire);
        wire.position.set(x, y, z);
        wire.rotation.z = Math.PI / 4 + t * 0.5;
        g.add(wire);
      }
      // Second coil row
      for (let i = 0; i < 16; i++) {
        const t = i / 16;
        const x = -0.9 + t * 1.8;
        const a = t * Math.PI * 6 + Math.PI;
        const y = 0.75 + Math.sin(a) * 0.08;
        const z = Math.cos(a) * 0.08;
        const wire = cyl(0.008, 0.008, 0.12, M.barbedWire);
        wire.position.set(x, y, z);
        wire.rotation.z = -Math.PI / 4 + t * 0.3;
        g.add(wire);
      }
      g.userData.objectType = 'barbed_wire';
      g.userData.damagePerSecond = 5;
      return g;
    }
  },

  // ============ ЛАНДШАФТ / TERRAIN ============
  {
    id: 'tree_birch', name: '\u0411\u0435\u0440\u0451\u0437\u0430', icon: '\uD83C\uDF33', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      // Trunk - tapered white cylinder
      g.add(pos(cyl(0.08, 0.15, 5, M.barkWhite), 0, 2.5, 0));
      // Bark marks
      for (let i = 0; i < 5; i++) {
        g.add(pos(box(0.06, 0.02, 0.02, M.barkDark), 0.08, 1 + i * 0.8, 0));
      }
      // Canopy clusters (icosahedron-like using dodecahedrons from cache)
      const icoKey = 'ico_0.9';
      let icoGeo = geoCache.get(icoKey);
      if (!icoGeo) { icoGeo = new THREE.IcosahedronGeometry(0.9, 1); geoCache.set(icoKey, icoGeo); }
      const icoKey2 = 'ico_1.0';
      let icoGeo2 = geoCache.get(icoKey2);
      if (!icoGeo2) { icoGeo2 = new THREE.IcosahedronGeometry(1.0, 1); geoCache.set(icoKey2, icoGeo2); }
      const icoKey3 = 'ico_0.8';
      let icoGeo3 = geoCache.get(icoKey3);
      if (!icoGeo3) { icoGeo3 = new THREE.IcosahedronGeometry(0.8, 1); geoCache.set(icoKey3, icoGeo3); }
      const c1 = new THREE.Mesh(icoGeo, M.leafGreen); c1.position.set(0, 3.5, 0); c1.castShadow = true; g.add(c1);
      const c2 = new THREE.Mesh(icoGeo2, M.leafLight); c2.position.set(0.4, 4.2, 0.3); c2.castShadow = true; g.add(c2);
      const c3 = new THREE.Mesh(icoGeo3, M.leafDark); c3.position.set(-0.3, 4.8, -0.2); c3.castShadow = true; g.add(c3);
      return mergeGroup(g);
    }
  },
  {
    id: 'tree_oak', name: '\u0414\u0443\u0431', icon: '\uD83C\uDF33', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      // Thick trunk
      g.add(pos(cyl(0.15, 0.25, 4, M.barkBrown), 0, 2, 0));
      // Canopy - dodecahedrons
      const dodKey = 'dod_0.9';
      let dodGeo = geoCache.get(dodKey);
      if (!dodGeo) { dodGeo = new THREE.DodecahedronGeometry(0.9, 0); geoCache.set(dodKey, dodGeo); }
      const dodKey2 = 'dod_0.7';
      let dodGeo2 = geoCache.get(dodKey2);
      if (!dodGeo2) { dodGeo2 = new THREE.DodecahedronGeometry(0.7, 0); geoCache.set(dodKey2, dodGeo2); }
      const dodKey3 = 'dod_1.0';
      let dodGeo3 = geoCache.get(dodKey3);
      if (!dodGeo3) { dodGeo3 = new THREE.DodecahedronGeometry(1.0, 0); geoCache.set(dodKey3, dodGeo3); }
      const m1 = new THREE.Mesh(dodGeo, M.leafGreen); m1.position.set(0, 3.5, 0); m1.castShadow = true; g.add(m1);
      const m2 = new THREE.Mesh(dodGeo2, M.leafDark); m2.position.set(0.6, 3.8, 0.4); m2.castShadow = true; g.add(m2);
      const m3 = new THREE.Mesh(dodGeo3, M.leafLight); m3.position.set(-0.5, 4.2, -0.3); m3.castShadow = true; g.add(m3);
      const m4 = new THREE.Mesh(dodGeo2, M.leafGreen); m4.position.set(0.3, 4.6, 0.5); m4.castShadow = true; g.add(m4);
      const m5 = new THREE.Mesh(dodGeo, M.leafDark); m5.position.set(-0.4, 4.9, 0.2); m5.castShadow = true; g.add(m5);
      return mergeGroup(g);
    }
  },
  {
    id: 'tree_pine', name: '\u0415\u043b\u044c', icon: '\uD83C\uDF32', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      // Trunk
      g.add(pos(cyl(0.05, 0.1, 5, M.barkBrown), 0, 2.5, 0));
      // Cone layers
      const coneKey1 = 'cone_1.5_2.0';
      let coneGeo1 = geoCache.get(coneKey1);
      if (!coneGeo1) { coneGeo1 = new THREE.ConeGeometry(1.5, 2.0, 8); geoCache.set(coneKey1, coneGeo1); }
      const coneKey2 = 'cone_1.0_1.5';
      let coneGeo2 = geoCache.get(coneKey2);
      if (!coneGeo2) { coneGeo2 = new THREE.ConeGeometry(1.0, 1.5, 8); geoCache.set(coneKey2, coneGeo2); }
      const coneKey3 = 'cone_0.6_1.2';
      let coneGeo3 = geoCache.get(coneKey3);
      if (!coneGeo3) { coneGeo3 = new THREE.ConeGeometry(0.6, 1.2, 8); geoCache.set(coneKey3, coneGeo3); }
      const c1 = new THREE.Mesh(coneGeo1, M.leafDark); c1.position.set(0, 2.0, 0); c1.castShadow = true; g.add(c1);
      const c2 = new THREE.Mesh(coneGeo2, M.leafDark); c2.position.set(0, 3.5, 0); c2.castShadow = true; g.add(c2);
      const c3 = new THREE.Mesh(coneGeo3, M.leafDark); c3.position.set(0, 4.6, 0); c3.castShadow = true; g.add(c3);
      return mergeGroup(g);
    }
  },
  {
    id: 'bush_green', name: '\u041a\u0443\u0441\u0442', icon: '\uD83C\uDF3F', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      const sphKey1 = 'sph_0.4';
      let sphGeo1 = geoCache.get(sphKey1);
      if (!sphGeo1) { sphGeo1 = new THREE.SphereGeometry(0.4, 8, 6); geoCache.set(sphKey1, sphGeo1); }
      const sphKey2 = 'sph_0.35';
      let sphGeo2 = geoCache.get(sphKey2);
      if (!sphGeo2) { sphGeo2 = new THREE.SphereGeometry(0.35, 8, 6); geoCache.set(sphKey2, sphGeo2); }
      const sphKey3 = 'sph_0.5';
      let sphGeo3 = geoCache.get(sphKey3);
      if (!sphGeo3) { sphGeo3 = new THREE.SphereGeometry(0.5, 8, 6); geoCache.set(sphKey3, sphGeo3); }
      const s1 = new THREE.Mesh(sphGeo1, M.leafGreen); s1.position.set(0, 0.4, 0); s1.castShadow = true; g.add(s1);
      const s2 = new THREE.Mesh(sphGeo2, M.leafDark); s2.position.set(0.3, 0.35, 0.2); s2.castShadow = true; g.add(s2);
      const s3 = new THREE.Mesh(sphGeo3, M.leafLight); s3.position.set(-0.2, 0.5, -0.15); s3.castShadow = true; g.add(s3);
      return mergeGroup(g);
    }
  },
  {
    id: 'bush_flowers', name: '\u041a\u0443\u0441\u0442 \u0441 \u0446\u0432\u0435\u0442\u0430\u043c\u0438', icon: '\uD83C\uDF3A', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      const sphKey = 'sph_0.4';
      let sphGeo = geoCache.get(sphKey);
      if (!sphGeo) { sphGeo = new THREE.SphereGeometry(0.4, 8, 6); geoCache.set(sphKey, sphGeo); }
      const sphKey2 = 'sph_0.35';
      let sphGeo2 = geoCache.get(sphKey2);
      if (!sphGeo2) { sphGeo2 = new THREE.SphereGeometry(0.35, 8, 6); geoCache.set(sphKey2, sphGeo2); }
      const s1 = new THREE.Mesh(sphGeo, M.leafGreen); s1.position.set(0, 0.4, 0); s1.castShadow = true; g.add(s1);
      const s2 = new THREE.Mesh(sphGeo2, M.leafLight); s2.position.set(0.3, 0.35, 0.2); s2.castShadow = true; g.add(s2);
      const s3 = new THREE.Mesh(sphGeo, M.leafDark); s3.position.set(-0.2, 0.45, -0.15); s3.castShadow = true; g.add(s3);
      // Flower dots
      g.add(pos(box(0.06, 0.06, 0.06, M.flowerRed), 0.2, 0.7, 0.1));
      g.add(pos(box(0.06, 0.06, 0.06, M.flowerYellow), -0.15, 0.65, 0.2));
      g.add(pos(box(0.06, 0.06, 0.06, M.flowerWhite), 0.1, 0.6, -0.2));
      g.add(pos(box(0.06, 0.06, 0.06, M.flowerRed), -0.25, 0.55, -0.1));
      return mergeGroup(g);
    }
  },
  {
    id: 'grass_tall', name: '\u0412\u044b\u0441\u043e\u043a\u0430\u044f \u0442\u0440\u0430\u0432\u0430', icon: '\uD83C\uDF3E', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      let i = 0;
      for (let x = -0.8; x <= 0.8; x += 0.4) {
        for (let z = -0.8; z <= 0.8; z += 0.4) {
          const seed = (i * 7 + 3) % 17;
          const h = 0.6 + (seed / 17) * 0.4;
          const offsetX = ((i * 13 + 5) % 11) / 110;
          const offsetZ = ((i * 11 + 7) % 13) / 130;
          g.add(pos(box(0.05, h, 0.05, M.grassGreen), x + offsetX, h / 2, z + offsetZ));
          i++;
        }
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'rock_large', name: '\u0411\u043e\u043b\u044c\u0448\u043e\u0439 \u043a\u0430\u043c\u0435\u043d\u044c', icon: '\uD83E\uDEA8', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      const dodKey = 'dod_1.2';
      let dodGeo = geoCache.get(dodKey);
      if (!dodGeo) { dodGeo = new THREE.DodecahedronGeometry(1.2, 0); geoCache.set(dodKey, dodGeo); }
      const rock = new THREE.Mesh(dodGeo, M.conc3);
      rock.scale.set(1.0, 0.7, 1.1);
      rock.position.set(0, 0.7, 0);
      rock.castShadow = true;
      rock.receiveShadow = true;
      g.add(rock);
      return mergeGroup(g);
    }
  },
  {
    id: 'rock_small', name: '\u041c\u0430\u043b\u044b\u0439 \u043a\u0430\u043c\u0435\u043d\u044c', icon: '\uD83E\uDEA8', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      const dodKey = 'dod_0.5';
      let dodGeo = geoCache.get(dodKey);
      if (!dodGeo) { dodGeo = new THREE.DodecahedronGeometry(0.5, 0); geoCache.set(dodKey, dodGeo); }
      const rock = new THREE.Mesh(dodGeo, M.conc3);
      rock.scale.set(1.1, 0.8, 0.9);
      rock.position.set(0, 0.35, 0);
      rock.castShadow = true;
      rock.receiveShadow = true;
      g.add(rock);
      return mergeGroup(g);
    }
  },
  {
    id: 'ground_grass', name: '\u0417\u0435\u043c\u043b\u044f (\u0442\u0440\u0430\u0432\u0430)', icon: '\uD83D\uDFE9', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(8, 0.1, 8, M.grassGreen), 0, 0.05, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'ground_dirt', name: '\u0417\u0435\u043c\u043b\u044f (\u0433\u0440\u0443\u043d\u0442)', icon: '\uD83D\uDFEB', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(8, 0.1, 8, M.barkBrown), 0, 0.05, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'ground_sand', name: '\u0417\u0435\u043c\u043b\u044f (\u043f\u0435\u0441\u043e\u043a)', icon: '\uD83C\uDFD6\uFE0F', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(8, 0.1, 8, M.sandBeige), 0, 0.05, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'ground_asphalt', name: '\u0410\u0441\u0444\u0430\u043b\u044c\u0442', icon: '\u2B1B', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(8, 0.1, 8, M.metalDark), 0, 0.05, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'water_shallow', name: '\u0412\u043e\u0434\u0430 (\u043c\u0435\u043b\u043a\u0430\u044f)', icon: '\uD83D\uDCA7', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      const geo = new THREE.PlaneGeometry(4, 4);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({ color: 0x4488aa, transparent: true, opacity: 0.5, roughness: 0.1 });
      const plane = new THREE.Mesh(geo, mat);
      plane.position.set(0, 0.05, 0);
      plane.receiveShadow = true;
      g.add(plane);
      return mergeGroup(g);
    }
  },
  {
    id: 'water_deep', name: '\u0412\u043e\u0434\u0430 (\u0433\u043b\u0443\u0431\u043e\u043a\u0430\u044f)', icon: '\uD83C\uDF0A', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      const geo = new THREE.PlaneGeometry(4, 4);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({ color: 0x1a3a5a, transparent: true, opacity: 0.7, roughness: 0.1 });
      const plane = new THREE.Mesh(geo, mat);
      plane.position.set(0, 0.05, 0);
      plane.receiveShadow = true;
      g.add(plane);
      return mergeGroup(g);
    }
  },
  {
    id: 'slope_small', name: '\u041f\u0430\u043d\u0434\u0443\u0441 \u043c\u0430\u043b\u044b\u0439', icon: '\uD83D\uDCD0', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      // Wedge: 4m wide, 1m rise, 4m deep
      const geo = new THREE.BufferGeometry();
      const w = 2; // half width
      const h = 1;
      const d = 2; // half depth
      // Vertices: front-bottom-left, front-bottom-right, back-bottom-left, back-bottom-right, back-top-left, back-top-right
      const vertices = new Float32Array([
        // Bottom face (y=0)
        -w, 0, d,   w, 0, d,   w, 0, -d,
        -w, 0, d,   w, 0, -d,  -w, 0, -d,
        // Back face (z=-d, rectangle from bottom to top)
        -w, 0, -d,  w, 0, -d,  w, h, -d,
        -w, 0, -d,  w, h, -d,  -w, h, -d,
        // Sloped top face (front bottom to back top)
        -w, 0, d,   -w, h, -d,  w, h, -d,
        -w, 0, d,   w, h, -d,   w, 0, d,
        // Left side triangle
        -w, 0, d,   -w, 0, -d,  -w, h, -d,
        // Right side triangle
        w, 0, -d,   w, 0, d,    w, h, -d,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, M.conc2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mergeGroup(g);
    }
  },
  {
    id: 'slope_large', name: '\u041f\u0430\u043d\u0434\u0443\u0441 \u0431\u043e\u043b\u044c\u0448\u043e\u0439', icon: '\uD83D\uDCD0', category: 'terrain',
    create: () => {
      const g = new THREE.Group();
      // Wedge: 4m wide, 2m rise, 4m deep
      const geo = new THREE.BufferGeometry();
      const w = 2; // half width
      const h = 2;
      const d = 2; // half depth
      const vertices = new Float32Array([
        // Bottom face
        -w, 0, d,   w, 0, d,   w, 0, -d,
        -w, 0, d,   w, 0, -d,  -w, 0, -d,
        // Back face
        -w, 0, -d,  w, 0, -d,  w, h, -d,
        -w, 0, -d,  w, h, -d,  -w, h, -d,
        // Sloped top face
        -w, 0, d,   -w, h, -d,  w, h, -d,
        -w, 0, d,   w, h, -d,   w, 0, d,
        // Left side triangle
        -w, 0, d,   -w, 0, -d,  -w, h, -d,
        // Right side triangle
        w, 0, -d,   w, 0, d,    w, h, -d,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, M.conc2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mergeGroup(g);
    }
  },
  // ============ ДЕКОРАТИВНЫЕ КОЛОННЫ И АРКИ ============
  {
    id: 'column_doric', name: 'Колонна дорическая', icon: '🏛️', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Base
      g.add(pos(box(0.7, 0.15, 0.7, M.conc2), 0, 0.075, 0));
      g.add(pos(box(0.55, 0.1, 0.55, M.conc1), 0, 0.2, 0));
      // Shaft
      g.add(pos(cyl(0.3, 0.32, 3.0, M.conc1, 16), 0, 1.75, 0));
      // Fluting (kannelures)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const rx = Math.cos(angle) * 0.3;
        const rz = Math.sin(angle) * 0.3;
        g.add(pos(box(0.04, 2.8, 0.02, M.conc3), rx, 1.75, rz));
      }
      // Capital
      g.add(pos(box(0.6, 0.1, 0.6, M.conc2), 0, 3.3, 0));
      g.add(pos(box(0.65, 0.08, 0.65, M.conc1), 0, 3.4, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'column_corinthian', name: 'Колонна коринфская', icon: '🏛️', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Tiered base
      g.add(pos(box(0.6, 0.1, 0.6, M.conc2), 0, 0.05, 0));
      g.add(pos(box(0.5, 0.08, 0.5, M.conc1), 0, 0.14, 0));
      g.add(pos(box(0.4, 0.06, 0.4, M.conc2), 0, 0.21, 0));
      // Shaft
      g.add(pos(cyl(0.22, 0.24, 3.2, M.conc1, 16), 0, 1.85, 0));
      // Acanthus leaf capital
      g.add(pos(cyl(0.24, 0.22, 0.3, M.conc2, 12), 0, 3.6, 0));
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const rx = Math.cos(angle) * 0.28;
        const rz = Math.sin(angle) * 0.28;
        g.add(pos(box(0.08, 0.25, 0.04, M.conc3), rx, 3.55, rz));
      }
      for (let i = 0; i < 4; i++) {
        const angle = ((i + 0.5) / 4) * Math.PI * 2;
        const rx = Math.cos(angle) * 0.2;
        const rz = Math.sin(angle) * 0.2;
        g.add(pos(box(0.06, 0.15, 0.03, M.conc2), rx, 3.75, rz));
      }
      // Top plate
      g.add(pos(box(0.55, 0.08, 0.55, M.conc1), 0, 3.9, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'column_twisted', name: 'Колонна витая', icon: '🌀', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Base
      g.add(pos(box(0.6, 0.15, 0.6, M.conc2), 0, 0.075, 0));
      g.add(pos(box(0.5, 0.1, 0.5, M.conc1), 0, 0.2, 0));
      // Twisted shaft segments
      for (let i = 0; i < 12; i++) {
        const y = 0.35 + i * 0.25;
        const angle = (i / 12) * Math.PI * 3;
        const rx = Math.cos(angle) * 0.06;
        const rz = Math.sin(angle) * 0.06;
        g.add(pos(cyl(0.2, 0.2, 0.28, M.conc1, 10), rx, y, rz));
      }
      // Capital
      g.add(pos(box(0.55, 0.1, 0.55, M.conc2), 0, 3.4, 0));
      g.add(pos(box(0.6, 0.08, 0.6, M.conc1), 0, 3.5, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'column_broken', name: 'Колонна сломанная', icon: '🧱', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Base
      g.add(pos(box(0.7, 0.15, 0.7, M.conc2), 0, 0.075, 0));
      // Broken shaft (short)
      g.add(pos(cyl(0.3, 0.32, 1.5, M.conc1, 12), 0, 0.95, 0));
      // Jagged top edge
      g.add(pos(box(0.2, 0.15, 0.15, M.conc3), 0.1, 1.8, 0.05));
      g.add(pos(box(0.15, 0.2, 0.12, M.conc1), -0.1, 1.85, -0.08));
      g.add(pos(box(0.12, 0.1, 0.18, M.conc2), 0.15, 1.75, -0.1));
      // Debris at base
      g.add(pos(box(0.3, 0.2, 0.25, M.conc1), 0.5, 0.1, 0.3));
      g.add(pos(box(0.25, 0.15, 0.2, M.conc3), -0.4, 0.075, 0.5));
      g.add(pos(box(0.2, 0.12, 0.3, M.conc2), 0.3, 0.06, -0.4));
      g.add(pos(box(0.35, 0.1, 0.15, M.concDirty), -0.3, 0.05, -0.3));
      g.add(pos(box(0.15, 0.18, 0.15, M.conc1), 0.6, 0.09, -0.2));
      return mergeGroup(g);
    }
  },
  {
    id: 'column_double', name: 'Двойная колонна', icon: '🏛️', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Shared base platform
      g.add(pos(box(1.2, 0.12, 0.6, M.conc2), 0, 0.06, 0));
      // Left column
      g.add(pos(cyl(0.15, 0.17, 3.2, M.conc1, 12), -0.4, 1.72, 0));
      // Right column
      g.add(pos(cyl(0.15, 0.17, 3.2, M.conc1, 12), 0.4, 1.72, 0));
      // Connecting beam at top
      g.add(pos(box(1.1, 0.2, 0.35, M.conc2), 0, 3.42, 0));
      g.add(pos(box(1.2, 0.1, 0.4, M.conc3), 0, 3.57, 0));
      // Small capitals
      g.add(pos(box(0.35, 0.08, 0.35, M.conc2), -0.4, 3.3, 0));
      g.add(pos(box(0.35, 0.08, 0.35, M.conc2), 0.4, 3.3, 0));
      // Column bases
      g.add(pos(cyl(0.18, 0.18, 0.08, M.conc3, 12), -0.4, 0.16, 0));
      g.add(pos(cyl(0.18, 0.18, 0.08, M.conc3, 12), 0.4, 0.16, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'column_chains', name: 'Колонна с цепями', icon: '⛓️', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Base
      g.add(pos(box(0.6, 0.12, 0.6, M.conc2), 0, 0.06, 0));
      // Shaft
      g.add(pos(cyl(0.25, 0.27, 3.2, M.conc1, 12), 0, 1.72, 0));
      // Capital
      g.add(pos(box(0.55, 0.1, 0.55, M.conc2), 0, 3.37, 0));
      // Brackets
      g.add(pos(box(0.12, 0.06, 0.08, M.metalDark), 0.28, 3.0, 0));
      g.add(pos(box(0.12, 0.06, 0.08, M.metalDark), -0.28, 3.0, 0));
      // Chain links (right side)
      for (let i = 0; i < 8; i++) {
        const y = 2.9 - i * 0.2;
        const xOff = (i % 2 === 0) ? 0.32 : 0.36;
        g.add(pos(box(0.04, 0.12, 0.03, M.metalMid), xOff, y, 0));
      }
      // Chain links (left side)
      for (let i = 0; i < 8; i++) {
        const y = 2.9 - i * 0.2;
        const xOff = (i % 2 === 0) ? -0.32 : -0.36;
        g.add(pos(box(0.04, 0.12, 0.03, M.metalMid), xOff, y, 0));
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'arch_round', name: 'Круглая арка', icon: '🌉', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Left pillar
      g.add(pos(box(0.4, 3.0, 0.4, M.conc1), -1.5, 1.5, 0));
      g.add(pos(box(0.5, 0.12, 0.5, M.conc2), -1.5, 3.06, 0));
      // Right pillar
      g.add(pos(box(0.4, 3.0, 0.4, M.conc1), 1.5, 1.5, 0));
      g.add(pos(box(0.5, 0.12, 0.5, M.conc2), 1.5, 3.06, 0));
      // Semicircular arch (12 voussoirs)
      for (let i = 0; i <= 12; i++) {
        const angle = (i / 12) * Math.PI;
        const x = Math.cos(angle) * 1.5;
        const y = Math.sin(angle) * 1.5 + 3.0;
        g.add(pos(box(0.3, 0.25, 0.4, M.conc2), -x, y, 0));
      }
      // Keystone
      g.add(pos(box(0.2, 0.35, 0.45, M.conc3), 0, 4.5, 0));
      // Base molding
      g.add(pos(box(0.5, 0.1, 0.5, M.conc3), -1.5, 0.05, 0));
      g.add(pos(box(0.5, 0.1, 0.5, M.conc3), 1.5, 0.05, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'arch_pointed', name: 'Стрельчатая арка', icon: '⛪', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Left pillar
      g.add(pos(box(0.4, 3.0, 0.4, M.conc1), -1.5, 1.5, 0));
      // Right pillar
      g.add(pos(box(0.4, 3.0, 0.4, M.conc1), 1.5, 1.5, 0));
      // Left curve (8 blocks curving up and inward to point)
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const x = -1.5 + t * 1.5;
        const y = 3.0 + Math.sin(t * Math.PI * 0.5) * 1.8;
        g.add(pos(box(0.25, 0.22, 0.4, M.conc2), x, y, 0));
      }
      // Right curve (8 blocks curving up and inward to point)
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const x = 1.5 - t * 1.5;
        const y = 3.0 + Math.sin(t * Math.PI * 0.5) * 1.8;
        g.add(pos(box(0.25, 0.22, 0.4, M.conc2), x, y, 0));
      }
      // Pointed keystone at top
      g.add(pos(box(0.2, 0.3, 0.42, M.conc3), 0, 4.8, 0));
      // Base moldings
      g.add(pos(box(0.5, 0.1, 0.5, M.conc3), -1.5, 0.05, 0));
      g.add(pos(box(0.5, 0.1, 0.5, M.conc3), 1.5, 0.05, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'arch_horseshoe', name: 'Подковообразная арка', icon: '🕌', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Left pillar
      g.add(pos(box(0.4, 2.5, 0.4, M.conc1), -1.4, 1.25, 0));
      // Right pillar
      g.add(pos(box(0.4, 2.5, 0.4, M.conc1), 1.4, 1.25, 0));
      // Horseshoe arch (extends past semicircle, curving inward)
      for (let i = 0; i <= 14; i++) {
        const angle = -0.3 + (i / 14) * (Math.PI + 0.6);
        const x = Math.cos(angle) * 1.4;
        const y = Math.sin(angle) * 1.4 + 2.5;
        g.add(pos(box(0.25, 0.2, 0.4, M.conc2), -x, y, 0));
      }
      // Keystone
      g.add(pos(box(0.2, 0.3, 0.42, M.conc3), 0, 3.9, 0));
      // Base molding
      g.add(pos(box(0.5, 0.1, 0.5, M.conc3), -1.4, 0.05, 0));
      g.add(pos(box(0.5, 0.1, 0.5, M.conc3), 1.4, 0.05, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'arch_ruined', name: 'Разрушенная арка', icon: '🏚️', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Left pillar (intact)
      g.add(pos(box(0.4, 3.0, 0.4, M.conc1), -1.5, 1.5, 0));
      // Right pillar (partially broken)
      g.add(pos(box(0.4, 2.4, 0.4, M.conc1), 1.5, 1.2, 0));
      g.add(pos(box(0.2, 0.15, 0.2, M.conc3), 1.6, 2.5, 0.1));
      // Partial arch (some pieces missing)
      for (let i = 0; i <= 12; i++) {
        if (i === 5 || i === 6 || i === 9) continue; // Missing pieces
        const angle = (i / 12) * Math.PI;
        const x = Math.cos(angle) * 1.5;
        const y = Math.sin(angle) * 1.5 + 3.0;
        g.add(pos(box(0.28, 0.23, 0.38, M.conc2), -x, y, 0));
      }
      // Debris at base
      g.add(pos(box(0.3, 0.2, 0.25, M.conc2), 0.5, 0.1, 0.4));
      g.add(pos(box(0.25, 0.15, 0.2, M.conc1), -0.3, 0.075, 0.5));
      g.add(pos(box(0.2, 0.18, 0.22, M.conc3), 0.8, 0.09, -0.3));
      g.add(pos(box(0.28, 0.12, 0.18, M.concDirty), -0.6, 0.06, -0.4));
      return mergeGroup(g);
    }
  },
  {
    id: 'wall_relief', name: 'Стена с барельефом', icon: '🖼️', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Main wall
      g.add(pos(box(4, 4, 0.3, M.conc1), 0, 2, 0));
      // Frame border
      g.add(pos(box(3.2, 0.1, 0.08, M.conc3), 0, 3.4, 0.19));
      g.add(pos(box(3.2, 0.1, 0.08, M.conc3), 0, 0.6, 0.19));
      g.add(pos(box(0.1, 2.9, 0.08, M.conc3), -1.55, 2.0, 0.19));
      g.add(pos(box(0.1, 2.9, 0.08, M.conc3), 1.55, 2.0, 0.19));
      // Interior geometric pattern
      g.add(pos(box(0.8, 0.8, 0.12, M.conc2), 0, 2.0, 0.21));
      g.add(pos(box(0.5, 1.2, 0.08, M.conc3), -0.8, 2.0, 0.19));
      g.add(pos(box(0.5, 1.2, 0.08, M.conc3), 0.8, 2.0, 0.19));
      g.add(pos(box(1.0, 0.4, 0.1, M.conc2), 0, 2.8, 0.2));
      g.add(pos(box(1.0, 0.4, 0.1, M.conc2), 0, 1.2, 0.2));
      g.add(pos(box(0.3, 0.3, 0.15, M.conc3), 0, 2.0, 0.22));
      return mergeGroup(g);
    }
  },
  {
    id: 'wall_niche', name: 'Стена с нишей', icon: '🚪', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Main wall
      g.add(pos(box(4, 4, 0.3, M.conc1), 0, 2, 0));
      // Niche interior (recessed, darker)
      g.add(pos(box(1.2, 2.0, 0.15, M.concDirty), 0, 2.2, -0.07));
      // Frame around niche
      g.add(pos(box(0.1, 2.2, 0.06, M.conc3), -0.65, 2.2, 0.17));
      g.add(pos(box(0.1, 2.2, 0.06, M.conc3), 0.65, 2.2, 0.17));
      g.add(pos(box(1.4, 0.1, 0.06, M.conc3), 0, 3.3, 0.17));
      g.add(pos(box(1.4, 0.1, 0.06, M.conc3), 0, 1.1, 0.17));
      // Shelf inside niche
      g.add(pos(box(1.1, 0.06, 0.12, M.conc2), 0, 2.0, -0.02));
      // Arch top of niche
      g.add(pos(box(1.0, 0.12, 0.06, M.conc2), 0, 3.2, 0.17));
      return mergeGroup(g);
    }
  },
  {
    id: 'wall_lattice', name: 'Решётчатая перегородка', icon: '🔲', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Outer frame
      g.add(pos(box(3.0, 0.1, 0.08, M.metalDark), 0, 0.05, 0));
      g.add(pos(box(3.0, 0.1, 0.08, M.metalDark), 0, 3.0, 0));
      g.add(pos(box(0.1, 3.0, 0.08, M.metalDark), -1.5, 1.5, 0));
      g.add(pos(box(0.1, 3.0, 0.08, M.metalDark), 1.5, 1.5, 0));
      // Diagonal bars (one direction)
      for (let i = -2; i <= 2; i++) {
        g.add(pos(box(0.04, 4.2, 0.03, M.bars), i * 0.6, 1.5, 0));
      }
      // Diagonal bars (other direction) - crossed
      for (let i = -2; i <= 2; i++) {
        g.add(pos(box(4.2, 0.04, 0.03, M.bars), 0, 0.6 + i * 0.6 + 1.5, 0));
      }
      // Diamond pattern diagonals
      for (let i = 0; i < 5; i++) {
        const offset = -1.2 + i * 0.6;
        g.add(pos(box(0.03, 0.85, 0.02, M.metalMid), offset, 1.5, 0.02));
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'wall_rosette', name: 'Стена с розеткой', icon: '🌸', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Main wall
      g.add(pos(box(4, 4, 0.3, M.conc1), 0, 2, 0));
      // Central rosette - radial pattern
      g.add(pos(cyl(0.15, 0.15, 0.12, M.conc3, 12), 0, 2.0, 0.21));
      // Petals (12 small boxes radiating out)
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const rx = Math.cos(angle) * 0.4;
        const ry = Math.sin(angle) * 0.4;
        g.add(pos(box(0.12, 0.2, 0.08, M.conc2), rx, 2.0 + ry, 0.2));
      }
      // Outer ring of smaller elements
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const rx = Math.cos(angle) * 0.75;
        const ry = Math.sin(angle) * 0.75;
        g.add(pos(box(0.08, 0.08, 0.1, M.conc3), rx, 2.0 + ry, 0.2));
      }
      // Corner accents
      g.add(pos(box(0.2, 0.2, 0.06, M.conc2), -1.5, 3.5, 0.18));
      g.add(pos(box(0.2, 0.2, 0.06, M.conc2), 1.5, 3.5, 0.18));
      g.add(pos(box(0.2, 0.2, 0.06, M.conc2), -1.5, 0.5, 0.18));
      g.add(pos(box(0.2, 0.2, 0.06, M.conc2), 1.5, 0.5, 0.18));
      return mergeGroup(g);
    }
  },
  {
    id: 'gate_prison', name: 'Ворота тюремные', icon: '🚧', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Thick side posts
      g.add(pos(box(0.3, 3.5, 0.3, M.metalDark), -1.5, 1.75, 0));
      g.add(pos(box(0.3, 3.5, 0.3, M.metalDark), 1.5, 1.75, 0));
      // Top beam
      g.add(pos(box(3.3, 0.25, 0.3, M.metalDark), 0, 3.6, 0));
      // Bottom beam
      g.add(pos(box(3.3, 0.15, 0.2, M.metalDark), 0, 0.08, 0));
      // Vertical bars
      for (let i = -4; i <= 4; i++) {
        g.add(pos(cyl(0.04, 0.04, 3.3, M.barsThick), i * 0.3, 1.75, 0));
      }
      // Horizontal cross bars
      g.add(pos(box(2.7, 0.08, 0.08, M.metalMid), 0, 1.2, 0));
      g.add(pos(box(2.7, 0.08, 0.08, M.metalMid), 0, 2.4, 0));
      // Rivets on posts
      for (const x of [-1.5, 1.5]) {
        for (const y of [0.5, 1.5, 2.5, 3.2]) {
          g.add(pos(cyl(0.04, 0.04, 0.04, M.metalLight, 8), x, y, 0.17));
        }
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'gate_wrought', name: 'Ворота кованые', icon: '🏰', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Frame
      g.add(pos(box(0.12, 3.5, 0.08, M.metalDark), -1.5, 1.75, 0));
      g.add(pos(box(0.12, 3.5, 0.08, M.metalDark), 1.5, 1.75, 0));
      g.add(pos(box(3.12, 0.12, 0.08, M.metalDark), 0, 3.5, 0));
      g.add(pos(box(3.12, 0.1, 0.08, M.metalDark), 0, 0.05, 0));
      // Vertical bars
      for (let i = -4; i <= 4; i++) {
        g.add(pos(box(0.04, 3.3, 0.04, M.metalMid), i * 0.3, 1.75, 0));
      }
      // Decorative scroll curls at top (C-shapes with small boxes)
      for (let s = -1; s <= 1; s += 2) {
        const cx = s * 0.6;
        g.add(pos(box(0.15, 0.04, 0.04, M.metalDark), cx, 3.2, 0));
        g.add(pos(box(0.04, 0.12, 0.04, M.metalDark), cx + s * 0.07, 3.14, 0));
        g.add(pos(box(0.1, 0.04, 0.04, M.metalDark), cx + s * 0.03, 3.08, 0));
        g.add(pos(box(0.04, 0.1, 0.04, M.metalDark), cx - s * 0.02, 3.14, 0));
      }
      // Center scroll
      g.add(pos(box(0.2, 0.04, 0.04, M.metalDark), 0, 3.3, 0));
      g.add(pos(box(0.04, 0.1, 0.04, M.metalDark), -0.08, 3.24, 0));
      g.add(pos(box(0.04, 0.1, 0.04, M.metalDark), 0.08, 3.24, 0));
      // Horizontal rail
      g.add(pos(box(2.8, 0.06, 0.06, M.metalMid), 0, 1.0, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'fence_wrought', name: 'Забор кованый', icon: '⚜️', category: 'walls',
    create: () => {
      const g = new THREE.Group();
      // Bottom rail
      g.add(pos(box(4.0, 0.06, 0.06, M.metalDark), 0, 0.15, 0));
      // Top rail
      g.add(pos(box(4.0, 0.06, 0.06, M.metalDark), 0, 1.5, 0));
      // Vertical bars with pointed tips
      for (let i = -5; i <= 5; i++) {
        const x = i * 0.36;
        g.add(pos(box(0.04, 1.3, 0.04, M.metalMid), x, 0.8, 0));
        // Spear tip (diamond shape)
        g.add(pos(box(0.07, 0.1, 0.07, M.metalDark), x, 1.55, 0));
        g.add(pos(box(0.04, 0.06, 0.04, M.metalDark), x, 1.63, 0));
      }
      // Decorative scroll between some bars
      for (let i = -2; i <= 2; i++) {
        const x = i * 0.72;
        g.add(pos(box(0.12, 0.03, 0.03, M.metalDark), x, 0.5, 0));
        g.add(pos(box(0.03, 0.08, 0.03, M.metalDark), x - 0.05, 0.45, 0));
        g.add(pos(box(0.03, 0.08, 0.03, M.metalDark), x + 0.05, 0.45, 0));
      }
      // End posts
      g.add(pos(box(0.08, 1.6, 0.08, M.metalDark), -2.0, 0.8, 0));
      g.add(pos(box(0.08, 1.6, 0.08, M.metalDark), 2.0, 0.8, 0));
      // Post caps
      g.add(pos(box(0.12, 0.06, 0.12, M.metalLight), -2.0, 1.63, 0));
      g.add(pos(box(0.12, 0.06, 0.12, M.metalLight), 2.0, 1.63, 0));
      return mergeGroup(g);
    }
  },
  // === ITEMS CATEGORY (decorative models) ===
  {
    id: 'vase_amphora', name: 'Амфора', icon: '🏺', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.15, 0.18, 0.06, M.conc2), 0, 0.03, 0));
      g.add(pos(cyl(0.12, 0.15, 0.1, M.conc1), 0, 0.11, 0));
      g.add(pos(cyl(0.2, 0.12, 0.12, M.conc1), 0, 0.22, 0));
      g.add(pos(cyl(0.25, 0.2, 0.15, M.conc1), 0, 0.36, 0));
      g.add(pos(cyl(0.22, 0.25, 0.1, M.conc1), 0, 0.48, 0));
      g.add(pos(cyl(0.15, 0.22, 0.08, M.conc2), 0, 0.57, 0));
      g.add(pos(cyl(0.08, 0.1, 0.12, M.conc1), 0, 0.67, 0));
      g.add(pos(cyl(0.12, 0.08, 0.04, M.conc2), 0, 0.73, 0));
      g.add(pos(box(0.03, 0.08, 0.03, M.conc3), -0.2, 0.6, 0));
      g.add(pos(box(0.06, 0.03, 0.03, M.conc3), -0.22, 0.64, 0));
      g.add(pos(box(0.03, 0.08, 0.03, M.conc3), -0.24, 0.56, 0));
      g.add(pos(box(0.06, 0.03, 0.03, M.conc3), -0.22, 0.52, 0));
      g.add(pos(box(0.03, 0.08, 0.03, M.conc3), 0.2, 0.6, 0));
      g.add(pos(box(0.06, 0.03, 0.03, M.conc3), 0.22, 0.64, 0));
      g.add(pos(box(0.03, 0.08, 0.03, M.conc3), 0.24, 0.56, 0));
      g.add(pos(box(0.06, 0.03, 0.03, M.conc3), 0.22, 0.52, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'vase_floor', name: 'Напольная ваза', icon: '🏺', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.2, 0.22, 0.06, M.conc2), 0, 0.03, 0));
      g.add(pos(cyl(0.15, 0.2, 0.15, M.conc1), 0, 0.135, 0));
      g.add(pos(cyl(0.12, 0.15, 0.15, M.conc1), 0, 0.285, 0));
      g.add(pos(cyl(0.14, 0.14, 0.03, M.conc3), 0, 0.37, 0));
      g.add(pos(cyl(0.2, 0.14, 0.2, M.conc1), 0, 0.485, 0));
      g.add(pos(cyl(0.18, 0.2, 0.15, M.conc1), 0, 0.66, 0));
      g.add(pos(cyl(0.19, 0.19, 0.03, M.conc3), 0, 0.75, 0));
      g.add(pos(cyl(0.1, 0.14, 0.12, M.conc2), 0, 0.83, 0));
      g.add(pos(cyl(0.16, 0.1, 0.06, M.conc1), 0, 0.92, 0));
      g.add(pos(cyl(0.17, 0.17, 0.02, M.conc3), 0, 0.96, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'fountain_tiered', name: 'Фонтан многоярусный', icon: '⛲', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(1.2, 1.3, 0.15, M.conc2), 0, 0.075, 0));
      g.add(pos(cyl(1.3, 1.35, 0.08, M.conc3), 0, 0.19, 0));
      g.add(pos(cyl(1.1, 1.1, 0.02, M.glass), 0, 0.16, 0));
      g.add(pos(cyl(0.12, 0.15, 0.6, M.conc1), 0, 0.53, 0));
      g.add(pos(cyl(0.6, 0.65, 0.1, M.conc2), 0, 0.88, 0));
      g.add(pos(cyl(0.65, 0.67, 0.05, M.conc3), 0, 0.96, 0));
      g.add(pos(cyl(0.55, 0.55, 0.02, M.glass), 0, 0.92, 0));
      g.add(pos(cyl(0.08, 0.1, 0.4, M.conc1), 0, 1.19, 0));
      g.add(pos(cyl(0.3, 0.32, 0.08, M.conc2), 0, 1.43, 0));
      g.add(pos(cyl(0.32, 0.34, 0.04, M.conc3), 0, 1.49, 0));
      g.add(pos(cyl(0.28, 0.28, 0.02, M.glass), 0, 1.46, 0));
      g.add(pos(cyl(0.05, 0.08, 0.15, M.conc1), 0, 1.59, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'urn_decorative', name: 'Урна декоративная', icon: '⚱️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.12, 0.14, 0.04, M.conc3), 0, 0.02, 0));
      g.add(pos(cyl(0.1, 0.12, 0.06, M.conc2), 0, 0.07, 0));
      g.add(pos(cyl(0.16, 0.1, 0.1, M.conc1), 0, 0.15, 0));
      g.add(pos(cyl(0.2, 0.16, 0.12, M.conc1), 0, 0.26, 0));
      g.add(pos(cyl(0.18, 0.2, 0.1, M.conc1), 0, 0.37, 0));
      g.add(pos(cyl(0.12, 0.18, 0.06, M.conc2), 0, 0.45, 0));
      g.add(pos(cyl(0.09, 0.1, 0.05, M.conc1), 0, 0.505, 0));
      g.add(pos(cyl(0.13, 0.12, 0.03, M.conc3), 0, 0.545, 0));
      g.add(pos(cyl(0.04, 0.12, 0.06, M.conc2), 0, 0.59, 0));
      g.add(pos(cyl(0.025, 0.025, 0.03, M.conc3), 0, 0.635, 0));
      g.add(pos(box(0.03, 0.06, 0.02, M.conc3), -0.17, 0.38, 0));
      g.add(pos(box(0.04, 0.02, 0.02, M.conc3), -0.19, 0.35, 0));
      g.add(pos(box(0.03, 0.06, 0.02, M.conc3), 0.17, 0.38, 0));
      g.add(pos(box(0.04, 0.02, 0.02, M.conc3), 0.19, 0.35, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'bust_pedestal', name: 'Бюст на постаменте', icon: '🗿', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.6, 0.08, 0.6, M.conc3), 0, 0.04, 0));
      g.add(pos(box(0.5, 0.3, 0.5, M.conc2), 0, 0.23, 0));
      g.add(pos(box(0.54, 0.04, 0.54, M.conc3), 0, 0.4, 0));
      g.add(pos(box(0.45, 0.5, 0.45, M.conc1), 0, 0.67, 0));
      g.add(pos(box(0.5, 0.04, 0.5, M.conc3), 0, 0.94, 0));
      g.add(pos(cyl(0.08, 0.1, 0.12, M.conc1), 0, 1.02, 0));
      g.add(pos(box(0.4, 0.12, 0.2, M.conc1), 0, 1.14, 0));
      g.add(pos(box(0.18, 0.24, 0.2, M.conc1), 0, 1.32, 0));
      g.add(pos(box(0.04, 0.06, 0.06, M.conc2), 0, 1.3, 0.12));
      g.add(pos(box(0.14, 0.03, 0.03, M.conc2), 0, 1.38, 0.09));
      g.add(pos(box(0.2, 0.1, 0.18, M.conc3), 0, 1.45, -0.02));
      return mergeGroup(g);
    }
  },
  {
    id: 'obelisk', name: 'Обелиск', icon: '🗼', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.8, 0.15, 0.8, M.conc3), 0, 0.075, 0));
      g.add(pos(box(0.6, 0.1, 0.6, M.conc2), 0, 0.2, 0));
      g.add(pos(box(0.45, 0.7, 0.45, M.conc1), 0, 0.6, 0));
      g.add(pos(box(0.4, 0.7, 0.4, M.conc1), 0, 1.3, 0));
      g.add(pos(box(0.35, 0.7, 0.35, M.conc2), 0, 2.0, 0));
      g.add(pos(box(0.3, 0.5, 0.3, M.conc2), 0, 2.6, 0));
      g.add(pos(box(0.25, 0.15, 0.25, M.conc3), 0, 2.925, 0));
      g.add(pos(box(0.15, 0.1, 0.15, M.conc3), 0, 3.05, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'sculpture_sphere', name: 'Сфера на кубе', icon: '🔮', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.7, 0.05, 0.7, M.conc3), 0, 0.025, 0));
      g.add(pos(box(0.6, 0.6, 0.6, M.conc1), 0, 0.35, 0));
      g.add(pos(box(0.65, 0.04, 0.65, M.conc2), 0, 0.67, 0));
      g.add(pos(cyl(0.35, 0.35, 0.7, M.conc2, 16), 0, 1.05, 0));
      g.add(pos(cyl(0.1, 0.3, 0.15, M.conc1, 16), 0, 1.475, 0));
      g.add(pos(cyl(0.3, 0.1, 0.15, M.conc1, 16), 0, 0.625, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'sculpture_eagle', name: 'Орёл', icon: '🦅', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.04, 0.04, 0.8, M.metalDark), 0, 0.04, 0));
      g.add(pos(box(0.04, 0.08, 0.04, M.metalDark), -0.3, 0.04, 0));
      g.add(pos(box(0.04, 0.08, 0.04, M.metalDark), 0.3, 0.04, 0));
      g.add(pos(box(0.06, 0.04, 0.08, M.conc3), -0.05, 0.1, 0));
      g.add(pos(box(0.06, 0.04, 0.08, M.conc3), 0.05, 0.1, 0));
      g.add(pos(box(0.03, 0.12, 0.03, M.conc3), -0.04, 0.18, 0));
      g.add(pos(box(0.03, 0.12, 0.03, M.conc3), 0.04, 0.18, 0));
      g.add(pos(box(0.2, 0.25, 0.3, M.conc2), 0, 0.37, 0));
      g.add(pos(box(0.15, 0.12, 0.1, M.conc1), 0, 0.42, 0.15));
      g.add(pos(box(0.08, 0.1, 0.08, M.conc1), 0, 0.55, 0.08));
      g.add(pos(box(0.1, 0.1, 0.12, M.conc1), 0, 0.65, 0.1));
      g.add(pos(box(0.04, 0.04, 0.08, M.conc3), 0, 0.63, 0.2));
      g.add(pos(box(0.3, 0.04, 0.2, M.conc2), -0.25, 0.5, 0));
      g.add(pos(box(0.2, 0.03, 0.15, M.conc2), -0.4, 0.56, 0));
      g.add(pos(box(0.3, 0.04, 0.2, M.conc2), 0.25, 0.5, 0));
      g.add(pos(box(0.2, 0.03, 0.15, M.conc2), 0.4, 0.56, 0));
      g.add(pos(box(0.12, 0.03, 0.2, M.conc3), 0, 0.35, -0.2));
      g.add(pos(box(0.08, 0.02, 0.15, M.conc3), 0, 0.33, -0.3));
      return mergeGroup(g);
    }
  },
  {
    id: 'lion_head', name: 'Львиная голова', icon: '🦁', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.5, 0.5, 0.05, M.conc2), 0, 0.25, 0));
      g.add(pos(box(0.25, 0.28, 0.12, M.conc1), 0, 0.25, 0.08));
      g.add(pos(box(0.14, 0.12, 0.1, M.conc1), 0, 0.2, 0.16));
      g.add(pos(box(0.1, 0.05, 0.08, M.concDirty), 0, 0.13, 0.16));
      g.add(pos(box(0.06, 0.04, 0.04, M.conc3), 0, 0.24, 0.22));
      g.add(pos(box(0.04, 0.03, 0.03, M.concDirty), -0.07, 0.32, 0.14));
      g.add(pos(box(0.04, 0.03, 0.03, M.concDirty), 0.07, 0.32, 0.14));
      g.add(pos(box(0.08, 0.1, 0.06, M.conc3), -0.2, 0.38, 0.05));
      g.add(pos(box(0.08, 0.1, 0.06, M.conc3), 0.2, 0.38, 0.05));
      g.add(pos(box(0.08, 0.1, 0.06, M.conc3), -0.22, 0.25, 0.05));
      g.add(pos(box(0.08, 0.1, 0.06, M.conc3), 0.22, 0.25, 0.05));
      g.add(pos(box(0.1, 0.08, 0.06, M.conc3), -0.15, 0.45, 0.05));
      g.add(pos(box(0.1, 0.08, 0.06, M.conc3), 0.15, 0.45, 0.05));
      g.add(pos(box(0.12, 0.08, 0.06, M.conc3), 0, 0.48, 0.05));
      g.add(pos(box(0.08, 0.1, 0.06, M.conc3), -0.2, 0.12, 0.05));
      g.add(pos(box(0.08, 0.1, 0.06, M.conc3), 0.2, 0.12, 0.05));
      return mergeGroup(g);
    }
  },
  {
    id: 'floor_mosaic', name: 'Мозаичный пол', icon: '🟫', category: 'items',
    create: () => {
      const g = new THREE.Group();
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const mat = (row + col) % 2 === 0 ? M.tileWhite : M.tileDark;
          g.add(pos(box(0.48, 0.02, 0.48, mat), -1.75 + col * 0.5, 0.01, -1.75 + row * 0.5));
        }
      }
      return mergeGroup(g);
    }
  },
  {
    id: 'rug_round', name: 'Круглый ковёр', icon: '🔴', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(1.0, 1.0, 0.02, M.fabricOrange, 16), 0, 0.01, 0));
      g.add(pos(cyl(0.75, 0.75, 0.022, M.fabricKhaki, 16), 0, 0.012, 0));
      g.add(pos(cyl(0.5, 0.5, 0.024, M.danger, 16), 0, 0.014, 0));
      g.add(pos(cyl(0.25, 0.25, 0.026, M.warning, 16), 0, 0.016, 0));
      g.add(pos(cyl(0.1, 0.1, 0.028, M.fabricOrange, 16), 0, 0.018, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'manhole', name: 'Люк', icon: '⚙️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.45, 0.48, 0.06, M.metalDark, 16), 0, 0.03, 0));
      g.add(pos(cyl(0.4, 0.4, 0.03, M.metalMid, 16), 0, 0.075, 0));
      g.add(pos(box(0.7, 0.02, 0.05, M.metalDark), 0, 0.1, 0));
      g.add(pos(box(0.05, 0.02, 0.7, M.metalDark), 0, 0.1, 0));
      g.add(pos(box(0.6, 0.02, 0.05, M.metalDark), 0, 0.1, 0.15));
      g.add(pos(box(0.6, 0.02, 0.05, M.metalDark), 0, 0.1, -0.15));
      g.add(pos(box(0.05, 0.02, 0.6, M.metalDark), 0.15, 0.1, 0));
      g.add(pos(box(0.05, 0.02, 0.6, M.metalDark), -0.15, 0.1, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'podium', name: 'Подиум', icon: '🏆', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(2.0, 0.33, 2.0, M.conc2), 0, 0.165, 0));
      g.add(pos(box(1.5, 0.33, 1.5, M.conc1), 0, 0.495, 0));
      g.add(pos(box(1.0, 0.34, 1.0, M.conc3), 0, 0.83, 0));
      g.add(pos(box(2.05, 0.03, 2.05, M.metalDark), 0, 0.33, 0));
      g.add(pos(box(1.55, 0.03, 1.55, M.metalDark), 0, 0.66, 0));
      g.add(pos(box(1.05, 0.03, 1.05, M.metalDark), 0, 1.0, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'throne', name: 'Трон', icon: '👑', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.1, 0.4, 0.1, M.woodDark), -0.35, 0.2, -0.25));
      g.add(pos(box(0.1, 0.4, 0.1, M.woodDark), 0.35, 0.2, -0.25));
      g.add(pos(box(0.1, 0.4, 0.1, M.woodDark), -0.35, 0.2, 0.25));
      g.add(pos(box(0.1, 0.4, 0.1, M.woodDark), 0.35, 0.2, 0.25));
      g.add(pos(box(0.8, 0.1, 0.6, M.woodMid), 0, 0.45, 0));
      g.add(pos(box(0.7, 0.06, 0.5, M.fabricKhaki), 0, 0.53, 0));
      g.add(pos(box(0.8, 1.2, 0.08, M.woodDark), 0, 1.1, -0.28));
      g.add(pos(box(0.6, 0.8, 0.03, M.woodMid), 0, 1.1, -0.24));
      g.add(pos(box(0.3, 0.12, 0.06, M.woodDark), 0, 1.76, -0.28));
      g.add(pos(box(0.12, 0.08, 0.06, M.woodDark), -0.25, 1.72, -0.28));
      g.add(pos(box(0.12, 0.08, 0.06, M.woodDark), 0.25, 1.72, -0.28));
      g.add(pos(box(0.08, 0.5, 0.08, M.woodDark), -0.4, 0.75, 0.1));
      g.add(pos(box(0.08, 0.5, 0.08, M.woodDark), 0.4, 0.75, 0.1));
      g.add(pos(box(0.1, 0.06, 0.5, M.woodMid), -0.4, 1.03, -0.05));
      g.add(pos(box(0.1, 0.06, 0.5, M.woodMid), 0.4, 1.03, -0.05));
      return mergeGroup(g);
    }
  },
  {
    id: 'vitrine', name: 'Витрина', icon: '🗄️', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.0, 0.06, 0.5, M.metalDark), 0, 0.03, 0));
      g.add(pos(box(1.0, 0.06, 0.5, M.metalDark), 0, 1.97, 0));
      g.add(pos(box(0.04, 2.0, 0.04, M.metalDark), -0.48, 1.0, -0.23));
      g.add(pos(box(0.04, 2.0, 0.04, M.metalDark), 0.48, 1.0, -0.23));
      g.add(pos(box(0.04, 2.0, 0.04, M.metalDark), -0.48, 1.0, 0.23));
      g.add(pos(box(0.04, 2.0, 0.04, M.metalDark), 0.48, 1.0, 0.23));
      g.add(pos(box(0.92, 1.85, 0.02, M.glass), 0, 1.0, 0.24));
      g.add(pos(box(0.92, 1.85, 0.02, M.glass), 0, 1.0, -0.24));
      g.add(pos(box(0.02, 1.85, 0.44, M.glass), -0.49, 1.0, 0));
      g.add(pos(box(0.02, 1.85, 0.44, M.glass), 0.49, 1.0, 0));
      g.add(pos(box(0.9, 0.02, 0.42, M.glass), 0, 0.65, 0));
      g.add(pos(box(0.9, 0.02, 0.42, M.glass), 0, 1.3, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'desk_ornate', name: 'Письменный стол', icon: '📝', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.2, 0.05, 0.6, M.woodMid), 0, 0.78, 0));
      g.add(pos(cyl(0.05, 0.07, 0.25, M.woodDark), -0.5, 0.125, -0.22));
      g.add(pos(cyl(0.07, 0.05, 0.25, M.woodDark), -0.5, 0.375, -0.22));
      g.add(pos(cyl(0.05, 0.07, 0.25, M.woodDark), -0.5, 0.625, -0.22));
      g.add(pos(cyl(0.05, 0.07, 0.25, M.woodDark), 0.5, 0.125, -0.22));
      g.add(pos(cyl(0.07, 0.05, 0.25, M.woodDark), 0.5, 0.375, -0.22));
      g.add(pos(cyl(0.05, 0.07, 0.25, M.woodDark), 0.5, 0.625, -0.22));
      g.add(pos(cyl(0.05, 0.07, 0.25, M.woodDark), -0.5, 0.125, 0.22));
      g.add(pos(cyl(0.07, 0.05, 0.25, M.woodDark), -0.5, 0.375, 0.22));
      g.add(pos(cyl(0.05, 0.07, 0.25, M.woodDark), -0.5, 0.625, 0.22));
      g.add(pos(cyl(0.05, 0.07, 0.25, M.woodDark), 0.5, 0.125, 0.22));
      g.add(pos(cyl(0.07, 0.05, 0.25, M.woodDark), 0.5, 0.375, 0.22));
      g.add(pos(cyl(0.05, 0.07, 0.25, M.woodDark), 0.5, 0.625, 0.22));
      g.add(pos(box(0.03, 0.4, 0.4, M.woodMid), -0.5, 0.55, 0));
      g.add(pos(box(0.9, 0.08, 0.03, M.woodMid), 0, 0.72, 0.28));
      g.add(pos(box(0.35, 0.1, 0.03, M.woodDark), -0.2, 0.6, 0.28));
      g.add(pos(box(0.35, 0.1, 0.03, M.woodDark), 0.2, 0.6, 0.28));
      g.add(pos(cyl(0.015, 0.015, 0.03, M.chrome), -0.2, 0.6, 0.3));
      g.add(pos(cyl(0.015, 0.015, 0.03, M.chrome), 0.2, 0.6, 0.3));
      return mergeGroup(g);
    }
  },
  {
    id: 'bookshelf_tall', name: 'Книжный шкаф', icon: '📚', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.04, 2.2, 0.35, M.woodDark), -0.5, 1.1, 0));
      g.add(pos(box(0.04, 2.2, 0.35, M.woodDark), 0.5, 1.1, 0));
      g.add(pos(box(1.04, 0.04, 0.35, M.woodDark), 0, 2.2, 0));
      g.add(pos(box(1.04, 0.06, 0.35, M.woodDark), 0, 0.03, 0));
      g.add(pos(box(0.96, 0.03, 0.33, M.woodMid), 0, 0.44, 0));
      g.add(pos(box(0.96, 0.03, 0.33, M.woodMid), 0, 0.88, 0));
      g.add(pos(box(0.96, 0.03, 0.33, M.woodMid), 0, 1.32, 0));
      g.add(pos(box(0.96, 0.03, 0.33, M.woodMid), 0, 1.76, 0));
      g.add(pos(box(0.15, 0.35, 0.22, M.bookRed), -0.3, 0.235, 0));
      g.add(pos(box(0.12, 0.35, 0.22, M.bookBlue), -0.1, 0.235, 0));
      g.add(pos(box(0.18, 0.35, 0.22, M.bookGreen), 0.1, 0.235, 0));
      g.add(pos(box(0.14, 0.35, 0.22, M.bookYellow), 0.3, 0.235, 0));
      g.add(pos(box(0.16, 0.38, 0.22, M.bookBlue), -0.25, 0.65, 0));
      g.add(pos(box(0.14, 0.38, 0.22, M.bookRed), -0.05, 0.65, 0));
      g.add(pos(box(0.12, 0.38, 0.22, M.bookYellow), 0.12, 0.65, 0));
      g.add(pos(box(0.18, 0.38, 0.22, M.bookGreen), 0.32, 0.65, 0));
      g.add(pos(box(0.15, 0.36, 0.22, M.bookGreen), -0.3, 1.08, 0));
      g.add(pos(box(0.18, 0.36, 0.22, M.bookYellow), -0.08, 1.08, 0));
      g.add(pos(box(0.14, 0.36, 0.22, M.bookRed), 0.14, 1.08, 0));
      g.add(pos(box(0.12, 0.36, 0.22, M.bookBlue), 0.32, 1.08, 0));
      g.add(pos(box(0.16, 0.37, 0.22, M.bookYellow), -0.28, 1.535, 0));
      g.add(pos(box(0.12, 0.37, 0.22, M.bookGreen), -0.08, 1.535, 0));
      g.add(pos(box(0.15, 0.37, 0.22, M.bookBlue), 0.12, 1.535, 0));
      g.add(pos(box(0.14, 0.37, 0.22, M.bookRed), 0.3, 1.535, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'piano', name: 'Рояль', icon: '🎹', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.5, 0.15, 1.0, M.woodDark), 0, 0.7, 0));
      g.add(pos(box(1.5, 0.5, 0.06, M.woodDark), 0, 0.45, -0.47));
      g.add(pos(box(1.5, 0.5, 0.06, M.woodDark), 0, 0.45, 0.47));
      g.add(pos(box(0.06, 0.5, 1.0, M.woodDark), -0.73, 0.45, 0));
      g.add(pos(box(0.9, 0.04, 0.15, M.porcBase), 0.25, 0.8, 0.38));
      g.add(pos(box(0.05, 0.03, 0.09, M.metalDark), -0.05, 0.83, 0.38));
      g.add(pos(box(0.05, 0.03, 0.09, M.metalDark), 0.08, 0.83, 0.38));
      g.add(pos(box(0.05, 0.03, 0.09, M.metalDark), 0.21, 0.83, 0.38));
      g.add(pos(box(0.05, 0.03, 0.09, M.metalDark), 0.38, 0.83, 0.38));
      g.add(pos(box(0.05, 0.03, 0.09, M.metalDark), 0.51, 0.83, 0.38));
      g.add(pos(box(0.05, 0.03, 0.09, M.metalDark), 0.64, 0.83, 0.38));
      g.add(pos(cyl(0.04, 0.05, 0.5, M.metalDark), -0.5, 0.25, -0.3));
      g.add(pos(cyl(0.04, 0.05, 0.5, M.metalDark), 0.5, 0.25, -0.3));
      g.add(pos(cyl(0.04, 0.05, 0.5, M.metalDark), 0.3, 0.25, 0.3));
      g.add(pos(box(0.6, 0.3, 0.02, M.woodDark), -0.2, 1.0, -0.2));
      return mergeGroup(g);
    }
  },
  {
    id: 'fireplace', name: 'Камин', icon: '🔥', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.6, 0.06, 0.7, M.conc3), 0, 0.03, 0));
      g.add(pos(box(0.2, 1.3, 0.15, M.conc1), -0.6, 0.68, 0));
      g.add(pos(box(0.2, 1.3, 0.15, M.conc1), 0.6, 0.68, 0));
      g.add(pos(box(1.6, 0.1, 0.25, M.conc2), 0, 1.38, 0));
      g.add(pos(box(0.8, 0.9, 0.4, M.concDirty), 0, 0.51, -0.1));
      g.add(pos(box(0.75, 0.85, 0.03, M.concDirty), 0, 0.49, -0.3));
      g.add(pos(box(1.5, 0.05, 0.18, M.conc3), 0, 1.25, 0.02));
      g.add(pos(box(1.5, 0.05, 0.18, M.conc3), 0, 0.09, 0.02));
      g.add(pos(box(0.22, 0.05, 0.17, M.conc3), -0.6, 0.4, 0));
      g.add(pos(box(0.22, 0.05, 0.17, M.conc3), -0.6, 0.9, 0));
      g.add(pos(box(0.22, 0.05, 0.17, M.conc3), 0.6, 0.4, 0));
      g.add(pos(box(0.22, 0.05, 0.17, M.conc3), 0.6, 0.9, 0));
      return mergeGroup(g);
    }
  },
  {
    id: 'chandelier', name: 'Люстра', icon: '✨', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.03, 0.03, 0.4, M.chrome), 0, 0.6, 0));
      g.add(pos(cyl(0.06, 0.04, 0.08, M.chrome), 0, 0.82, 0));
      g.add(pos(cyl(0.35, 0.35, 0.03, M.metalShiny), 0, 0.45, 0));
      g.add(pos(cyl(0.32, 0.32, 0.03, M.chrome), 0, 0.43, 0));
      g.add(pos(box(0.35, 0.02, 0.03, M.chrome), 0.2, 0.45, 0));
      g.add(pos(box(0.35, 0.02, 0.03, M.chrome), -0.2, 0.45, 0));
      g.add(pos(box(0.03, 0.02, 0.35, M.chrome), 0, 0.45, 0.2));
      g.add(pos(box(0.03, 0.02, 0.35, M.chrome), 0, 0.45, -0.2));
      g.add(pos(box(0.25, 0.02, 0.25, M.chrome), 0.15, 0.45, 0.15));
      g.add(pos(box(0.25, 0.02, 0.25, M.chrome), -0.15, 0.45, -0.15));
      g.add(pos(cyl(0.025, 0.03, 0.06, M.metalShiny), 0.38, 0.42, 0));
      g.add(pos(cyl(0.025, 0.03, 0.06, M.metalShiny), -0.38, 0.42, 0));
      g.add(pos(cyl(0.025, 0.03, 0.06, M.metalShiny), 0, 0.42, 0.38));
      g.add(pos(cyl(0.025, 0.03, 0.06, M.metalShiny), 0, 0.42, -0.38));
      g.add(pos(cyl(0.025, 0.03, 0.06, M.metalShiny), 0.27, 0.42, 0.27));
      g.add(pos(cyl(0.025, 0.03, 0.06, M.metalShiny), -0.27, 0.42, -0.27));
      g.add(pos(cyl(0.015, 0.015, 0.05, M.porcBase), 0.38, 0.48, 0));
      g.add(pos(cyl(0.015, 0.015, 0.05, M.porcBase), -0.38, 0.48, 0));
      g.add(pos(cyl(0.015, 0.015, 0.05, M.porcBase), 0, 0.48, 0.38));
      g.add(pos(cyl(0.015, 0.015, 0.05, M.porcBase), 0, 0.48, -0.38));
      g.add(pos(cyl(0.015, 0.015, 0.05, M.porcBase), 0.27, 0.48, 0.27));
      g.add(pos(cyl(0.015, 0.015, 0.05, M.porcBase), -0.27, 0.48, -0.27));
      return mergeGroup(g);
    }
  },
  {
    id: 'lamp_street', name: 'Уличный фонарь', icon: '🏮', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.15, 0.2, 0.15, M.metalDark), 0, 0.075, 0));
      g.add(pos(cyl(0.2, 0.22, 0.05, M.metalDark), 0, 0.025, 0));
      g.add(pos(cyl(0.06, 0.08, 3.0, M.metalDark), 0, 1.65, 0));
      g.add(pos(cyl(0.09, 0.09, 0.05, M.metalMid), 0, 1.5, 0));
      g.add(pos(box(0.04, 0.04, 0.3, M.metalDark), 0, 3.2, 0.15));
      g.add(pos(box(0.04, 0.2, 0.04, M.metalDark), 0, 3.1, 0.28));
      g.add(pos(cyl(0.15, 0.15, 0.3, M.glass, 16), 0, 3.35, 0.28));
      g.add(pos(cyl(0.08, 0.15, 0.08, M.glass, 16), 0, 3.54, 0.28));
      g.add(pos(cyl(0.15, 0.08, 0.08, M.glass, 16), 0, 3.16, 0.28));
      g.add(pos(cyl(0.06, 0.1, 0.05, M.metalDark), 0, 3.6, 0.28));
      return mergeGroup(g);
    }
  },
  {
    id: 'torch_wall', name: 'Настенный факел', icon: '🔥', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(0.12, 0.15, 0.03, M.metalDark), 0, 0.3, 0));
      g.add(pos(box(0.04, 0.04, 0.15, M.metalDark), 0, 0.32, 0.09));
      g.add(pos(box(0.04, 0.12, 0.04, M.metalDark), 0, 0.26, 0.14));
      g.add(pos(cyl(0.025, 0.03, 0.4, M.woodDark), 0, 0.52, 0.14));
      g.add(pos(cyl(0.04, 0.035, 0.08, M.fabricKhaki), 0, 0.72, 0.14));
      g.add(pos(box(0.06, 0.08, 0.06, M.warning), 0, 0.8, 0.14));
      g.add(pos(box(0.05, 0.07, 0.05, M.danger), 0, 0.87, 0.14));
      g.add(pos(box(0.03, 0.05, 0.03, M.warning), 0, 0.93, 0.14));
      return mergeGroup(g);
    }
  },
  {
    id: 'neon_sign', name: 'Неоновая вывеска', icon: '💡', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(box(1.0, 0.04, 0.04, M.metalDark), 0, 0.52, 0));
      g.add(pos(box(1.0, 0.04, 0.04, M.metalDark), 0, 0.0, 0));
      g.add(pos(box(0.04, 0.52, 0.04, M.metalDark), -0.5, 0.26, 0));
      g.add(pos(box(0.04, 0.52, 0.04, M.metalDark), 0.5, 0.26, 0));
      g.add(pos(box(0.9, 0.42, 0.02, M.screenGlow), 0, 0.26, 0.01));
      g.add(pos(box(0.06, 0.06, 0.08, M.metalDark), -0.35, 0.5, -0.05));
      g.add(pos(box(0.06, 0.06, 0.08, M.metalDark), 0.35, 0.5, -0.05));
      g.add(pos(box(0.06, 0.06, 0.08, M.metalDark), -0.35, 0.04, -0.05));
      g.add(pos(box(0.06, 0.06, 0.08, M.metalDark), 0.35, 0.04, -0.05));
      return mergeGroup(g);
    }
  },
  {
    id: 'spotlight_tripod', name: 'Прожектор на треноге', icon: '🔦', category: 'items',
    create: () => {
      const g = new THREE.Group();
      g.add(pos(cyl(0.025, 0.03, 1.4, M.metalDark), 0, 0.65, 0.35));
      g.add(pos(cyl(0.025, 0.03, 1.4, M.metalDark), -0.3, 0.65, -0.18));
      g.add(pos(cyl(0.025, 0.03, 1.4, M.metalDark), 0.3, 0.65, -0.18));
      g.add(pos(box(0.05, 0.02, 0.05, M.metalDark), 0, 0.01, 0.5));
      g.add(pos(box(0.05, 0.02, 0.05, M.metalDark), -0.42, 0.01, -0.25));
      g.add(pos(box(0.05, 0.02, 0.05, M.metalDark), 0.42, 0.01, -0.25));
      g.add(pos(cyl(0.05, 0.05, 0.1, M.metalMid), 0, 1.3, 0));
      g.add(pos(cyl(0.1, 0.08, 0.3, M.metalDark), 0, 1.35, 0.15));
      g.add(pos(cyl(0.11, 0.11, 0.03, M.lensGlass, 16), 0, 1.35, 0.32));
      g.add(pos(box(0.12, 0.02, 0.04, M.metalMid), 0, 1.46, 0.15));
      g.add(pos(box(0.02, 0.06, 0.02, M.metalMid), -0.05, 1.43, 0.15));
      g.add(pos(box(0.02, 0.06, 0.02, M.metalMid), 0.05, 1.43, 0.15));
      return mergeGroup(g);
    }
  },
];

function createGeometryForShape(shape: VoxelShape): THREE.BufferGeometry {
  if (shape === 'rounded') {
    const g = new THREE.BoxGeometry(0.88, 0.88, 0.88, 2, 2, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).normalize().multiplyScalar(0.52);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }
  if (shape === 'sphere') return new THREE.SphereGeometry(0.48, 10, 10);
  if (shape === 'cylinder') return new THREE.CylinderGeometry(0.48, 0.48, 1, 12);
  if (shape === 'wedge') {
    const g = new THREE.BufferGeometry();
    const v = new Float32Array([
      -0.5,-0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,
      -0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,-0.5,
      -0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,-0.5,-0.5,-0.5,0.5,0.5,0.5,-0.5,-0.5,0.5,-0.5,
      -0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,
      0.5,-0.5,0.5,0.5,-0.5,-0.5,0.5,0.5,-0.5,
    ]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }
  if (shape === 'triangle') {
    const g = new THREE.BufferGeometry();
    const v = new Float32Array([
      -0.5,-0.5,0.5,0.5,-0.5,0.5,0,0.5,0.5,
      0.5,-0.5,-0.5,-0.5,-0.5,-0.5,0,0.5,-0.5,
      -0.5,-0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,
      -0.5,-0.5,-0.5,-0.5,-0.5,0.5,0,0.5,0.5,-0.5,-0.5,-0.5,0,0.5,0.5,0,0.5,-0.5,
      0.5,-0.5,0.5,0.5,-0.5,-0.5,0,0.5,-0.5,0.5,-0.5,0.5,0,0.5,-0.5,0,0.5,0.5,
    ]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }
  return new THREE.BoxGeometry(1, 1, 1);
}

function createCustomModelGroup(model: ModelData): THREE.Group {
  const g = new THREE.Group();
  const half = model.gridSize / 2;
  const matCache = new Map<number, THREE.MeshStandardMaterial>();
  const geoCache = new Map<VoxelShape, THREE.BufferGeometry>();

  const getMat = (idx: number) => {
    if (!matCache.has(idx)) {
      matCache.set(idx, new THREE.MeshStandardMaterial({ color: PALETTE[idx] ?? 0xffffff, roughness: 0.75 }));
    }
    return matCache.get(idx)!;
  };
  const getGeo = (shape: VoxelShape) => {
    if (!geoCache.has(shape)) geoCache.set(shape, createGeometryForShape(shape));
    return geoCache.get(shape)!;
  };

  for (const voxel of model.voxels) {
    const shape = voxel.shape || 'box';
    const mesh = new THREE.Mesh(getGeo(shape), getMat(voxel.color));
    mesh.position.set(voxel.x - half + 0.5, voxel.y + 0.5, voxel.z - half + 0.5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }

  // Нормализуем масштаб/позицию для карты
  const merged = mergeGroup(g);
  merged.scale.setScalar(0.18);
  return merged;
}

export function getCustomModelTypes(): EditorObjectType[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('jb_custom_models');
    if (!raw) return [];
    const models = JSON.parse(raw) as Array<{ id: string; name: string; model: ModelData }>;
    return models.map((entry) => ({
      id: entry.id,
      name: entry.name,
      icon: '◈',
      category: 'items',
      create: () => createCustomModelGroup(entry.model),
    }));
  } catch {
    return [];
  }
}

export function getAllEditorObjectTypes(): EditorObjectType[] {
  return [...EDITOR_OBJECTS, ...getCustomModelTypes()];
}

export function getObjectById(id: string): EditorObjectType | undefined {
  return getAllEditorObjectTypes().find((o) => o.id === id);
}

export function getObjectsByCategory(category: string): EditorObjectType[] {
  return getAllEditorObjectTypes().filter((o) => o.category === category);
}
