import * as THREE from 'three';

export interface VegetationPreset {
  type: 'tree' | 'grass' | 'bush';
  density: number;
  scale: [number, number];
  randomRotation: boolean;
}

export class VegetationBrush {
  private instancedMeshes: THREE.InstancedMesh[] = [];

  paint(scene: THREE.Scene, centerX: number, centerZ: number, radius: number, preset: VegetationPreset): THREE.InstancedMesh {
    const count = Math.max(1, Math.floor(preset.density * radius * radius * 0.1));
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (preset.type) {
      case 'tree':
        geometry = this.createTreeGeometry();
        material = new THREE.MeshStandardMaterial({ color: 0x2d5a1b, flatShading: true });
        break;
      case 'grass':
        geometry = this.createGrassGeometry();
        material = new THREE.MeshStandardMaterial({ color: 0x4a8a2a, flatShading: true, side: THREE.DoubleSide });
        break;
      case 'bush':
        geometry = this.createBushGeometry();
        material = new THREE.MeshStandardMaterial({ color: 0x3a6a2a, flatShading: true });
        break;
    }

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      // Random position within radius
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      position.set(
        centerX + Math.cos(angle) * dist,
        0,
        centerZ + Math.sin(angle) * dist
      );

      // Random rotation
      if (preset.randomRotation) {
        rotation.set(0, Math.random() * Math.PI * 2, 0);
      } else {
        rotation.set(0, 0, 0);
      }
      quaternion.setFromEuler(rotation);

      // Random scale within range
      const s = preset.scale[0] + Math.random() * (preset.scale[1] - preset.scale[0]);
      scale.set(s, s, s);

      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.isVegetation = true;
    scene.add(mesh);
    this.instancedMeshes.push(mesh);

    return mesh;
  }

  createTreeGeometry(): THREE.BufferGeometry {
    // Simple tree: cylinder trunk + cone canopy
    const trunk = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6);
    trunk.translate(0, 0.75, 0);

    const canopy = new THREE.ConeGeometry(1.2, 2.5, 8);
    canopy.translate(0, 2.75, 0);

    // Merge geometries
    const merged = new THREE.BufferGeometry();
    const trunkPositions = trunk.getAttribute('position');
    const canopyPositions = canopy.getAttribute('position');

    const totalVerts = trunkPositions.count + canopyPositions.count;
    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);

    // Copy trunk
    for (let i = 0; i < trunkPositions.count; i++) {
      positions[i * 3] = trunkPositions.getX(i);
      positions[i * 3 + 1] = trunkPositions.getY(i);
      positions[i * 3 + 2] = trunkPositions.getZ(i);
    }
    const trunkNormals = trunk.getAttribute('normal');
    for (let i = 0; i < trunkNormals.count; i++) {
      normals[i * 3] = trunkNormals.getX(i);
      normals[i * 3 + 1] = trunkNormals.getY(i);
      normals[i * 3 + 2] = trunkNormals.getZ(i);
    }

    // Copy canopy
    const offset = trunkPositions.count;
    for (let i = 0; i < canopyPositions.count; i++) {
      positions[(offset + i) * 3] = canopyPositions.getX(i);
      positions[(offset + i) * 3 + 1] = canopyPositions.getY(i);
      positions[(offset + i) * 3 + 2] = canopyPositions.getZ(i);
    }
    const canopyNormals = canopy.getAttribute('normal');
    for (let i = 0; i < canopyNormals.count; i++) {
      normals[(offset + i) * 3] = canopyNormals.getX(i);
      normals[(offset + i) * 3 + 1] = canopyNormals.getY(i);
      normals[(offset + i) * 3 + 2] = canopyNormals.getZ(i);
    }

    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    // Merge indices
    const trunkIndex = trunk.getIndex();
    const canopyIndex = canopy.getIndex();
    if (trunkIndex && canopyIndex) {
      const indices = new Uint16Array(trunkIndex.count + canopyIndex.count);
      for (let i = 0; i < trunkIndex.count; i++) {
        indices[i] = trunkIndex.getX(i);
      }
      for (let i = 0; i < canopyIndex.count; i++) {
        indices[trunkIndex.count + i] = canopyIndex.getX(i) + offset;
      }
      merged.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    trunk.dispose();
    canopy.dispose();

    return merged;
  }

  createGrassGeometry(): THREE.BufferGeometry {
    // Simple grass blade - thin triangle
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.05, 0, 0,
      0.05, 0, 0,
      0, 0.6, 0,
    ]);
    const normalArr = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normalArr, 3));
    geometry.setIndex([0, 1, 2]);
    return geometry;
  }

  createBushGeometry(): THREE.BufferGeometry {
    // Sphere-ish bush
    const geometry = new THREE.SphereGeometry(0.6, 6, 5);
    geometry.translate(0, 0.4, 0);
    // Deform slightly for natural look
    const pos = geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + (Math.random() - 0.5) * 0.1;
      const y = pos.getY(i) + (Math.random() - 0.5) * 0.05;
      const z = pos.getZ(i) + (Math.random() - 0.5) * 0.1;
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }

  clear(scene: THREE.Scene): void {
    for (const mesh of this.instancedMeshes) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    this.instancedMeshes = [];
  }
}
