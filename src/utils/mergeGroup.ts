import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function mergeGroup(group: THREE.Group): THREE.Group {
  group.updateMatrixWorld(true);

  const meshesByMaterial = new Map<THREE.Material, THREE.Mesh[]>();
  const preserved: THREE.Object3D[] = [];
  const invisibleMeshes: THREE.Mesh[] = [];

  // Collect SpotLight targets so we can skip them in the preserved pass
  const spotLightTargets = new Set<THREE.Object3D>();
  group.traverse((obj) => {
    if (obj instanceof THREE.SpotLight) {
      spotLightTargets.add(obj.target);
    }
  });

  group.traverse((obj) => {
    if (obj === group) return;
    if (obj instanceof THREE.Mesh) {
      const mat = obj.material as THREE.Material;
      if ((mat as unknown as { visible: boolean }).visible === false) {
        invisibleMeshes.push(obj);
        return;
      }
      if (!meshesByMaterial.has(mat)) meshesByMaterial.set(mat, []);
      meshesByMaterial.get(mat)!.push(obj);
    } else if (!(obj instanceof THREE.Group)) {
      // Skip SpotLight targets; they will be handled with their SpotLight
      if (spotLightTargets.has(obj)) return;
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

  // Preserve invisible collision meshes
  for (const mesh of invisibleMeshes) {
    const clone = mesh.clone();
    clone.position.copy(mesh.position);
    clone.rotation.copy(mesh.rotation);
    clone.scale.copy(mesh.scale);
    result.add(clone);
  }

  // Preserve non-mesh, non-group children (lights, etc.)
  for (const obj of preserved) {
    const clone = obj.clone();
    if (clone instanceof THREE.SpotLight) {
      const target = clone.target;
      result.add(target);
    }
    result.add(clone);
  }

  // Copy userData from the original group
  Object.assign(result.userData, group.userData);

  return result;
}
