import * as THREE from 'three';

const PLAYER_COLORS = [
  0x4fc3f7, 0x81c784, 0xffb74d, 0xba68c8,
  0xe57373, 0x4db6ac, 0xfff176, 0xa1887f,
];

interface RemotePlayerMesh {
  group: THREE.Group;
  targetPosition: THREE.Vector3;
  targetRotationY: number;
  label: THREE.Sprite;
}

export class RemotePlayerManager {
  private scene: THREE.Scene;
  private players: Map<string, RemotePlayerMesh> = new Map();
  private colorIndex = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addPlayer(id: string, nickname: string): void {
    if (this.players.has(id)) return;

    const color = PLAYER_COLORS[this.colorIndex % PLAYER_COLORS.length];
    this.colorIndex++;

    const group = new THREE.Group();

    // Body - capsule
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    group.add(body);

    // Head - sphere
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.55;
    group.add(head);

    // Nickname label
    const label = this.createLabel(nickname);
    label.position.y = 2.0;
    group.add(label);

    this.scene.add(group);

    this.players.set(id, {
      group,
      targetPosition: new THREE.Vector3(),
      targetRotationY: 0,
      label,
    });
  }

  removePlayer(id: string): void {
    const player = this.players.get(id);
    if (!player) return;

    this.scene.remove(player.group);

    // Dispose geometries and materials
    player.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        }
      }
      if (obj instanceof THREE.Sprite) {
        obj.material.map?.dispose();
        obj.material.dispose();
      }
    });

    this.players.delete(id);
  }

  updatePlayer(id: string, position: { x: number; y: number; z: number }, rotation: { x: number; y: number }): void {
    const player = this.players.get(id);
    if (!player) return;

    player.targetPosition.set(position.x, position.y - 1.7, position.z);
    player.targetRotationY = rotation.y;
  }

  update(delta: number): void {
    const lerpFactor = Math.min(1, delta * 10);
    for (const player of this.players.values()) {
      player.group.position.lerp(player.targetPosition, lerpFactor);

      // Smooth rotation interpolation
      const currentY = player.group.rotation.y;
      let diffY = player.targetRotationY - currentY;
      // Wrap to -PI..PI
      while (diffY > Math.PI) diffY -= Math.PI * 2;
      while (diffY < -Math.PI) diffY += Math.PI * 2;
      player.group.rotation.y = currentY + diffY * lerpFactor;
    }
  }

  dispose(): void {
    for (const id of Array.from(this.players.keys())) {
      this.removePlayer(id);
    }
  }

  private createLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText(text, 128, 32);
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    return sprite;
  }
}
