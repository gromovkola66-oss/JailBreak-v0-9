import { MapData, PlacedObject } from './MapEditor';

let idCounter = 0;
const nextId = () => `sample_${idCounter++}`;

const obj = (type: string, x: number, y: number, z: number, rotation = 0): PlacedObject => ({
  id: nextId(),
  type,
  position: { x, y, z },
  rotation,
});

export function createLargeTestMap(): MapData {
  idCounter = 0;
  const objects: PlacedObject[] = [];

  // ===== helper builders =====
  const addFloorArea = (x0: number, z0: number, wTiles: number, dTiles: number, type = 'floor_worn') => {
    for (let x = 0; x < wTiles; x++) {
      for (let z = 0; z < dTiles; z++) {
        objects.push(obj(type, x0 + x * 4, 0, z0 + z * 4));
      }
    }
  };

  const addCeilingArea = (x0: number, z0: number, wTiles: number, dTiles: number, type = 'ceiling_panel') => {
    for (let x = 0; x < wTiles; x++) {
      for (let z = 0; z < dTiles; z++) {
        objects.push(obj(type, x0 + x * 4, 0, z0 + z * 4));
      }
    }
  };

  // 0 deg = along X, 90 deg = along Z
  const addWallLine = (x: number, z: number, count: number, dir: 'x' | 'z', type = 'wall_cblock') => {
    for (let i = 0; i < count; i++) {
      objects.push(obj(type, x + (dir === 'x' ? i * 4 : 0), 0, z + (dir === 'z' ? i * 4 : 0), dir === 'z' ? 90 : 0));
    }
  };

  const addLightLine = (x: number, z: number, count: number, dir: 'x' | 'z', every = 2) => {
    for (let i = 0; i < count; i += every) {
      objects.push(obj('light_ceiling', x + (dir === 'x' ? i * 4 : 0), 0, z + (dir === 'z' ? i * 4 : 0)));
    }
  };

  // ===== overall footprint =====
  // Main prison footprint about 40x40, plus yard
  addFloorArea(-18, -18, 10, 10, 'floor_worn');
  addCeilingArea(-18, -18, 10, 10, 'ceiling_panel');

  // Outer shell
  addWallLine(-18, -18, 10, 'x', 'wall_cblock');
  addWallLine(-18, 18, 10, 'x', 'wall_cblock');
  addWallLine(-18, -18, 10, 'z', 'wall_cblock');
  addWallLine(18, -18, 10, 'z', 'wall_cblock');

  // ===== central main corridor =====
  // Long corridor through prison
  addFloorArea(-2, -14, 2, 8, 'floor_tile');
  addCeilingArea(-2, -14, 2, 8, 'ceiling_panel');
  addWallLine(-2, -14, 8, 'z', 'wall_painted');
  addWallLine(6, -14, 8, 'z', 'wall_painted');
  addLightLine(2, -14, 8, 'z', 1);

  // ===== left cell block =====
  addFloorArea(-14, -14, 3, 8, 'floor_worn');
  addCeilingArea(-14, -14, 3, 8, 'ceiling_rust');
  addWallLine(-14, -14, 8, 'z', 'wall_brick');
  addWallLine(-6, -14, 8, 'z', 'wall_brick');
  addWallLine(-14, -14, 3, 'x', 'wall_brick');
  addWallLine(-14, 18, 3, 'x', 'wall_brick');

  // Cells split walls
  for (const z of [-6, 2, 10]) {
    addWallLine(-14, z, 3, 'x', 'wall_brick');
  }

  // Doors / bars into corridor
  for (const z of [-10, -2, 6, 14]) {
    objects.push(obj('door_frame', -6, 0, z, 90));
    objects.push(obj('bars_heavy', -6, 0, z, 90));
  }

  // Cell props
  const cellCentersLeft = [-10, -2, 6, 14];
  for (const z of cellCentersLeft) {
    objects.push(obj('bunkbed', -11.5, 0, z - 1, 90));
    objects.push(obj('toilet', -8.8, 0, z + 1.2));
    objects.push(obj('sink', -8.6, 0, z));
    objects.push(obj('table', -9.6, 0, z - 0.1, 90));
    objects.push(obj('stool', -9.2, 0, z + 1.2));
    objects.push(obj('shelf', -13.4, 0, z - 0.5, 90));
    objects.push(obj('vent', -14, 0, z - 1.8, 90));
    objects.push(obj('window_bars', -14, 0, z + 0.2, 90));
    objects.push(obj('light_ceiling', -10, 0, z));
  }

  // Prisoner spawns
  objects.push(obj('spawn_prisoner', -10.5, 0, -10));
  objects.push(obj('spawn_prisoner', -10.5, 0, -2));
  objects.push(obj('spawn_prisoner', -10.5, 0, 6));
  objects.push(obj('spawn_prisoner', -10.5, 0, 14));

  // ===== right armory block =====
  addFloorArea(10, -10, 2, 3, 'floor_linoleum');
  addCeilingArea(10, -10, 2, 3, 'ceiling_panel');
  addWallLine(10, -10, 2, 'x', 'wall_tile');
  addWallLine(10, 2, 2, 'x', 'wall_tile');
  addWallLine(10, -10, 3, 'z', 'wall_tile');
  addWallLine(18, -10, 3, 'z', 'wall_tile');

  // Armory props
  objects.push(obj('locker_double', 13.5, 0, -7.5, 90));
  objects.push(obj('locker_double', 13.5, 0, -3.5, 90));
  objects.push(obj('locker', 16, 0, -7.5, 90));
  objects.push(obj('table', 12.5, 0, -1.5));
  objects.push(obj('crate', 16, 0, -1.5));
  objects.push(obj('barrel', 17, 0, -1.5));
  objects.push(obj('light_ceiling', 14, 0, -6));
  objects.push(obj('light_ceiling', 14, 0, -2));
  objects.push(obj('spawn_guard', 14, 0, -6));
  objects.push(obj('spawn_guard', 16, 0, -6));
  objects.push(obj('spawn_guard', 14, 0, -2));
  objects.push(obj('weapon_ak47', 12, 0, -7));
  objects.push(obj('weapon_ak47', 12, 0, -5));
  objects.push(obj('weapon_ak47', 12, 0, -3));

  // ===== cafeteria / common room =====
  addFloorArea(10, 6, 3, 3, 'floor_wood');
  addCeilingArea(10, 6, 3, 3, 'ceiling_panel');
  addWallLine(10, 6, 3, 'x', 'wall_painted');
  addWallLine(10, 18, 3, 'x', 'wall_painted');
  addWallLine(10, 6, 3, 'z', 'wall_painted');
  addWallLine(22, 6, 3, 'z', 'wall_painted');
  for (const z of [8, 12, 16]) {
    objects.push(obj('table', 14, 0, z));
    objects.push(obj('chair', 13.2, 0, z - 0.6));
    objects.push(obj('chair', 14.8, 0, z + 0.6, 180));
    objects.push(obj('chair', 13.2, 0, z + 0.6, 90));
    objects.push(obj('chair', 14.8, 0, z - 0.6, -90));
  }
  objects.push(obj('tv', 10.2, 0, 12, 90));
  objects.push(obj('trashcan', 21, 0, 17));
  objects.push(obj('radiator', 21.6, 0, 10, 90));
  objects.push(obj('light_ceiling', 14, 0, 10));
  objects.push(obj('light_ceiling', 14, 0, 14));

  // ===== yard =====
  addFloorArea(-6, -34, 4, 3, 'floor_worn');
  addWallLine(-6, -34, 4, 'x', 'mesh_fence');
  addWallLine(-6, -22, 4, 'x', 'mesh_fence');
  addWallLine(-6, -34, 3, 'z', 'mesh_fence');
  addWallLine(10, -34, 3, 'z', 'mesh_fence');
  objects.push(obj('bench', -2, 0, -30));
  objects.push(obj('bench', 5, 0, -30));
  objects.push(obj('pallet', 6, 0, -26));
  objects.push(obj('barrel', 7.5, 0, -26));
  objects.push(obj('crate', 0, 0, -26));
  objects.push(obj('light_wall', -5.8, 0, -28, 90));
  objects.push(obj('camera', 9.8, 0, -33, 180));

  // ===== hallway props =====
  for (const z of [-12, -4, 4, 12]) {
    objects.push(obj('bench', 2, 0, z, 90));
    objects.push(obj('fire_extinguisher', 5.5, 0, z));
    objects.push(obj('camera', -1.8, 0, z - 1.5));
  }

  // ===== additional exits/openings using frames =====
  objects.push(obj('door_frame', 10, 0, -6, 90));
  objects.push(obj('door_frame', 10, 0, 10, 90));
  objects.push(obj('door_frame', 2, 0, -22));
  objects.push(obj('door_frame', -6, 0, -10, 90));

  return {
    name: 'Large Test Prison',
    version: 1,
    objects,
  };
}
