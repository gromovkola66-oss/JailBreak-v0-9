import * as THREE from 'three';

export class CharacterModel {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private group: THREE.Group;
  private vestMesh: THREE.Mesh;
  private rotationY = 0;

  constructor() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, 280 / 360, 0.1, 100);
    this.camera.position.set(0, 0.2, 3.5);
    this.camera.lookAt(0, 0.2, 0);

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

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
    head.position.set(0, 1.35, 0);
    this.group.add(head);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), bodyMat);
    torso.position.set(0, 0.9, 0);
    this.group.add(torso);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.55, 0.15);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.35, 0.85, 0);
    this.group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.35, 0.85, 0);
    this.group.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.12, 0.3, 0);
    this.group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.12, 0.3, 0);
    this.group.add(rightLeg);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.2, 0.08, 0.25);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.12, 0.02, 0.02);
    this.group.add(leftShoe);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.12, 0.02, 0.02);
    this.group.add(rightShoe);

    // Vest overlay (hidden by default)
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.7 });
    this.vestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.58, 0.28), vestMat);
    this.vestMesh.position.set(0, 0.9, 0);
    this.vestMesh.visible = false;
    this.group.add(this.vestMesh);

    this.scene.add(this.group);
  }

  setVestVisible(visible: boolean) {
    this.vestMesh.visible = visible;
  }

  rotate(deltaX: number) {
    this.rotationY += deltaX * 0.01;
    this.group.rotation.y = this.rotationY;
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
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
