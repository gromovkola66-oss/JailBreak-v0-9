export interface FurnitureRule {
  objectType: string;
  placement: 'perimeter' | 'center' | 'corner' | 'random';
  density: number; // 0-1, probability per placement slot
  margin: number; // distance from walls
}

export interface RoomTemplate {
  type: string;
  minSize: { w: number; d: number };
  maxSize: { w: number; d: number };
  wallType: string;
  floorType: string;
  furniture: FurnitureRule[];
}

// Prison style: cells, guard rooms, corridors
const prisonCell: RoomTemplate = {
  type: 'cell',
  minSize: { w: 3, d: 4 },
  maxSize: { w: 4, d: 5 },
  wallType: 'wall_concrete',
  floorType: 'floor_concrete',
  furniture: [
    { objectType: 'bunk_bed', placement: 'perimeter', density: 0.5, margin: 1 },
    { objectType: 'toilet', placement: 'corner', density: 0.8, margin: 1 },
    { objectType: 'sink', placement: 'corner', density: 0.6, margin: 1 },
  ],
};

const guardRoom: RoomTemplate = {
  type: 'guard_room',
  minSize: { w: 5, d: 5 },
  maxSize: { w: 8, d: 8 },
  wallType: 'wall_concrete',
  floorType: 'floor_concrete',
  furniture: [
    { objectType: 'desk_guard', placement: 'center', density: 0.9, margin: 2 },
    { objectType: 'monitor_security', placement: 'perimeter', density: 0.4, margin: 1 },
    { objectType: 'chair_basic', placement: 'center', density: 0.7, margin: 2 },
    { objectType: 'locker', placement: 'corner', density: 0.6, margin: 1 },
    { objectType: 'light_ceiling', placement: 'center', density: 0.5, margin: 1 },
  ],
};

const prisonCorridor: RoomTemplate = {
  type: 'corridor',
  minSize: { w: 3, d: 8 },
  maxSize: { w: 4, d: 20 },
  wallType: 'wall_concrete',
  floorType: 'floor_concrete',
  furniture: [
    { objectType: 'light_ceiling', placement: 'center', density: 0.6, margin: 1 },
  ],
};

// Office style
const officeRoom: RoomTemplate = {
  type: 'office',
  minSize: { w: 4, d: 4 },
  maxSize: { w: 7, d: 7 },
  wallType: 'wall_concrete',
  floorType: 'floor_wood',
  furniture: [
    { objectType: 'desk_guard', placement: 'center', density: 0.8, margin: 2 },
    { objectType: 'chair_basic', placement: 'center', density: 0.7, margin: 2 },
    { objectType: 'shelf_metal', placement: 'perimeter', density: 0.3, margin: 1 },
    { objectType: 'light_ceiling', placement: 'center', density: 0.5, margin: 1 },
  ],
};

const officeCorridor: RoomTemplate = {
  type: 'corridor',
  minSize: { w: 3, d: 6 },
  maxSize: { w: 4, d: 15 },
  wallType: 'wall_concrete',
  floorType: 'floor_wood',
  furniture: [
    { objectType: 'light_ceiling', placement: 'center', density: 0.4, margin: 1 },
  ],
};

// Warehouse style
const warehouseMain: RoomTemplate = {
  type: 'warehouse',
  minSize: { w: 10, d: 10 },
  maxSize: { w: 20, d: 20 },
  wallType: 'wall_concrete',
  floorType: 'floor_concrete',
  furniture: [
    { objectType: 'shelf_metal', placement: 'perimeter', density: 0.6, margin: 1 },
    { objectType: 'shelf_metal', placement: 'center', density: 0.4, margin: 3 },
    { objectType: 'locker', placement: 'perimeter', density: 0.2, margin: 1 },
    { objectType: 'light_ceiling', placement: 'random', density: 0.3, margin: 2 },
  ],
};

// Bathroom style
const bathroomRoom: RoomTemplate = {
  type: 'bathroom',
  minSize: { w: 4, d: 4 },
  maxSize: { w: 6, d: 8 },
  wallType: 'wall_concrete',
  floorType: 'floor_concrete',
  furniture: [
    { objectType: 'toilet', placement: 'perimeter', density: 0.6, margin: 1 },
    { objectType: 'sink', placement: 'perimeter', density: 0.5, margin: 1 },
    { objectType: 'light_ceiling', placement: 'center', density: 0.5, margin: 1 },
  ],
};

// Barracks style
const barracksRoom: RoomTemplate = {
  type: 'barracks',
  minSize: { w: 6, d: 8 },
  maxSize: { w: 10, d: 14 },
  wallType: 'wall_concrete',
  floorType: 'floor_concrete',
  furniture: [
    { objectType: 'bunk_bed', placement: 'perimeter', density: 0.7, margin: 1 },
    { objectType: 'locker', placement: 'perimeter', density: 0.3, margin: 1 },
    { objectType: 'shelf_metal', placement: 'corner', density: 0.5, margin: 1 },
    { objectType: 'light_ceiling', placement: 'center', density: 0.4, margin: 1 },
  ],
};

export const PROCEDURAL_TEMPLATES: Record<string, RoomTemplate[]> = {
  prison: [prisonCell, guardRoom, prisonCorridor],
  office: [officeRoom, officeCorridor],
  warehouse: [warehouseMain],
  bathroom: [bathroomRoom],
  barracks: [barracksRoom],
};
