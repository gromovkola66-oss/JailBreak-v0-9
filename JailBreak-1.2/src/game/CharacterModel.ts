import * as THREE from 'three';

export class CharacterModel {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private group: THREE.Group;
  private vestGroup!: THREE.Group;
  private torsoMesh!: THREE.Mesh;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private rotationY = 0;
  private targetRotationY = 0;
  private animationFrameId: number | null = null;

  constructor(team: 'guard' | 'prisoner' = 'prisoner') {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, 280 / 360, 0.1, 100);
    this.camera.position.set(0, 0.7, 3.2);
    this.camera.lookAt(0, 0.7, 0);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(280, 360);
    this.renderer.setClearColor(0x000000, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 3, 4);
    this.scene.add(dirLight);

    // Character group
    this.group = new THREE.Group();

    if (team === 'prisoner') {
      this.buildPrisoner();
    } else {
      this.buildGuard();
    }

    // Vest overlay (same for both, hidden by default)
    this.vestGroup = new THREE.Group();
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.7 });
    const vestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.5, 0.3), vestMat);
    vestMesh.position.set(0, 0.9, 0);
    this.vestGroup.add(vestMesh);

    // Shoulder straps
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    const leftStrap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), strapMat);
    leftStrap.position.set(-0.15, 1.05, 0);
    this.vestGroup.add(leftStrap);
    const rightStrap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), strapMat);
    rightStrap.position.set(0.15, 1.05, 0);
    this.vestGroup.add(rightStrap);

    this.vestGroup.visible = false;
    this.group.add(this.vestGroup);

    this.scene.add(this.group);
  }

  private buildPrisoner() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
    const jumpsuitMat = new THREE.MeshStandardMaterial({ color: 0xFF6B00, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0xCC5500, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x665544, roughness: 0.9 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
    head.position.set(0, 1.35, 0);
    this.group.add(head);

    // Hair cap (buzz cut)
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), hairMat);
    hair.scale.set(1, 0.6, 1);
    hair.position.set(0, 1.45, 0);
    this.group.add(hair);

    // Eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    leftEye.position.set(-0.07, 1.37, -0.19);
    this.group.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    rightEye.position.set(0.07, 1.37, -0.19);
    this.group.add(rightEye);

    // Torso (orange jumpsuit)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.28), jumpsuitMat);
    torso.position.set(0, 0.9, 0);
    this.group.add(torso);
    this.torsoMesh = torso;

    // Belt area
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.29), beltMat);
    belt.position.set(0, 0.6, 0);
    this.group.add(belt);

    // ID badge on chest
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.01), badgeMat);
    badge.position.set(0.1, 1.0, -0.145);
    this.group.add(badge);

    // Arms (orange sleeves)
    const armGeo = new THREE.BoxGeometry(0.14, 0.5, 0.14);
    const leftArm = new THREE.Mesh(armGeo, jumpsuitMat);
    leftArm.position.set(-0.35, 0.85, 0);
    this.group.add(leftArm);
    this.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, jumpsuitMat);
    rightArm.position.set(0.35, 0.85, 0);
    this.group.add(rightArm);
    this.rightArm = rightArm;

    // Legs (darker orange)
    const legGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.12, 0.28, 0);
    this.group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.12, 0.28, 0);
    this.group.add(rightLeg);

    // Shoes (gray-brown)
    const shoeGeo = new THREE.BoxGeometry(0.2, 0.1, 0.26);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.12, 0.02, 0.02);
    this.group.add(leftShoe);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.12, 0.02, 0.02);
    this.group.add(rightShoe);
  }

  private buildGuard() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x1a1a4e, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x111133, roughness: 0.7 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xDAA520, roughness: 0.4 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 });
    const radioMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
    head.position.set(0, 1.35, 0);
    this.group.add(head);

    // Cap/beret
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.06, 16), uniformMat);
    cap.position.set(0, 1.52, -0.02);
    cap.rotation.x = 0.1;
    this.group.add(cap);

    // Cap brim
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.08), uniformMat);
    brim.position.set(0, 1.49, -0.18);
    this.group.add(brim);

    // Eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    leftEye.position.set(-0.07, 1.37, -0.19);
    this.group.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    rightEye.position.set(0.07, 1.37, -0.19);
    this.group.add(rightEye);

    // Torso (navy blue uniform)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.28), uniformMat);
    torso.position.set(0, 0.9, 0);
    this.group.add(torso);
    this.torsoMesh = torso;

    // Badge on chest (gold)
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.01), goldMat);
    badge.position.set(0.1, 1.0, -0.145);
    this.group.add(badge);

    // Radio on shoulder
    const radio = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), radioMat);
    radio.position.set(-0.28, 1.1, 0);
    this.group.add(radio);

    // Leather belt
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.3), beltMat);
    belt.position.set(0, 0.6, 0);
    this.group.add(belt);

    // Belt buckle (gold)
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.01), goldMat);
    buckle.position.set(0, 0.6, -0.155);
    this.group.add(buckle);

    // Arms (navy blue sleeves)
    const armGeo = new THREE.BoxGeometry(0.14, 0.5, 0.14);
    const leftArm = new THREE.Mesh(armGeo, uniformMat);
    leftArm.position.set(-0.35, 0.85, 0);
    this.group.add(leftArm);
    this.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, uniformMat);
    rightArm.position.set(0.35, 0.85, 0);
    this.group.add(rightArm);
    this.rightArm = rightArm;

    // Legs (dark navy pants)
    const legGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.12, 0.28, 0);
    this.group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.12, 0.28, 0);
    this.group.add(rightLeg);

    // Boots (black, taller than prisoner shoes)
    const bootGeo = new THREE.BoxGeometry(0.2, 0.14, 0.26);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.12, 0.03, 0.02);
    this.group.add(leftBoot);
    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.12, 0.03, 0.02);
    this.group.add(rightBoot);
  }

  setVestVisible(visible: boolean) {
    this.vestGroup.visible = visible;
  }

  rotate(deltaX: number) {
    this.targetRotationY += deltaX * 0.01;
  }

  startAnimation() {
    if (this.animationFrameId !== null) return;
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const t = performance.now() / 1000;

      // Smooth rotation lerp
      this.rotationY += (this.targetRotationY - this.rotationY) * 0.1;
      this.group.rotation.y = this.rotationY;

      // Breathing: torso scales Y
      this.torsoMesh.scale.y = 1.0 + Math.sin(t * 2) * 0.015;

      // Weight shift: group sways
      this.group.rotation.z = Math.sin(t * 0.8) * 0.01;

      // Arm sway
      this.leftArm.rotation.x = Math.sin(t * 1.2) * 0.05;
      this.rightArm.rotation.x = Math.sin(t * 1.2 + Math.PI) * 0.05;

      this.render();
    };
    animate();
  }

  stopAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.stopAnimation();
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        }
      }
    });
  }
}
