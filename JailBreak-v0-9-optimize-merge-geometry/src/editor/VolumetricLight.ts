import * as THREE from 'three';

const godRayVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const godRayFragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float dist = distance(vUv, vec2(0.5, 0.5));
    float alpha = smoothstep(0.5, 0.0, dist) * uIntensity * 0.6;
    alpha *= (1.0 - vUv.y);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export class VolumetricLightSystem {
  createGodRays(position: THREE.Vector3, direction: THREE.Vector3, color: string, intensity: number): THREE.Mesh {
    const coneGeometry = new THREE.ConeGeometry(2, 8, 16, 1, true);
    const threeColor = new THREE.Color(color);

    const material = new THREE.ShaderMaterial({
      vertexShader: godRayVertexShader,
      fragmentShader: godRayFragmentShader,
      uniforms: {
        uColor: { value: threeColor },
        uIntensity: { value: intensity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(coneGeometry, material);
    mesh.position.copy(position);

    // Orient cone along direction
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize().negate());
    mesh.quaternion.copy(quaternion);

    mesh.userData.isGodRay = true;
    return mesh;
  }

  updateGodRays(mesh: THREE.Mesh, intensity: number, color: string): void {
    const material = mesh.material as THREE.ShaderMaterial;
    if (material.uniforms) {
      material.uniforms.uIntensity.value = intensity;
      material.uniforms.uColor.value = new THREE.Color(color);
    }
  }

  removeGodRays(mesh: THREE.Mesh, scene: THREE.Scene): void {
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.ShaderMaterial).dispose();
  }
}
