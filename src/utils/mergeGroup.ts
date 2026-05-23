import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function mergeGroup(group: THREE.Group): THREE.Group {
  group.updateMatrixWorld(true);

  const meshesByMaterial = new Map<THREE.Material, THREE.Mesh[]>();
  const preserved: THREE.Object3D[] = [];

  group.traverse((obj) => {
    if (obj === group) return;
    if (obj instanceof THREE.Mesh) {
      const mat = obj.material as THREE.Material;
      if ((mat as unknown as { visible: boolean }).visible === false) return;
      if (!meshesByMaterial.has(mat)) meshesByMaterial.set(mat, []);
      meshesByMaterial.get(mat)!.push(obj);
    } else if (!(obj instanceof THREE.Group)) {
      preserved.push(obj);
    }
  });

  const result = new THREE.Group();

  meshesByMaterial.forEach((meshes, material) => {
    const cloned: THREE.BufferGeometry[] = [];
    for (const mesh of meshes) {
      const geo = mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrixWorld);
      cloned.push(geo);
    }
    const merged = mergeGeometries(cloned, false);
    for (const geo of cloned) geo.dispose();
    if (merged) {
      const m = new THREE.Mesh(merged, material);
      m.castShadow = true;
      m.receiveShadow = true;
      result.add(m);
    }
  });

  for (const obj of preserved) {
    result.add(obj.clone());
  }

  return result;
}
