import * as THREE from 'three';

export type WeaponTeam = 'guard' | 'prisoner';

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number;
  maxAmmo: number;
  currentAmmo: number;
  range: number;
  spread: number;
}

export class Weapon {
  public group: THREE.Group;
  public stats: WeaponStats;

  private muzzleFlash: THREE.PointLight;
  private lastFireTime = 0;
  private recoilAmount = 0;
  private originalPosition: THREE.Vector3;

  private leftHand: THREE.Group;
  private rightHand: THREE.Group;
  private magazine: THREE.Mesh;
  private magRestPos = new THREE.Vector3();

  private isReloading_ = false;
  private reloadProgress = 0;
  private readonly reloadDuration = 1.6;

  constructor(team: WeaponTeam = 'guard') {
    this.group = new THREE.Group();
    this.stats = { name: 'AK-47', damage: 25, fireRate: 13, maxAmmo: 30, currentAmmo: 30, range: 100, spread: 0.02 };

    this.magazine = new THREE.Mesh();
    this.leftHand = new THREE.Group();
    this.rightHand = new THREE.Group();

    this.buildGun();
    this.buildHands(team);

    this.group.position.set(0.18, -0.18, -0.38);
    this.originalPosition = this.group.position.clone();

    this.muzzleFlash = new THREE.PointLight(0xffaa00, 0, 3);
    this.muzzleFlash.position.set(0, 0.02, -0.7);
    this.group.add(this.muzzleFlash);
  }

  private buildGun() {
    const mt = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.8 });
    const mtL = new THREE.MeshStandardMaterial({ color: 0x383838, roughness: 0.35, metalness: 0.7 });
    const wd = new THREE.MeshStandardMaterial({ color: 0x6b4513, roughness: 0.8 });
    const wdD = new THREE.MeshStandardMaterial({ color: 0x5a3a0a, roughness: 0.85 });

    const b = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      this.group.add(mesh);
    };

    b(0.028, 0.028, 0.45, mt, 0, 0.02, -0.42);
    b(0.022, 0.018, 0.18, mtL, 0, 0.04, -0.38);
    b(0.058, 0.07, 0.24, mt, 0, 0, -0.1);
    b(0.054, 0.015, 0.2, mtL, 0, 0.038, -0.1);

    this.magazine = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.14, 0.07), mt);
    this.magazine.position.set(0, -0.09, -0.06);
    this.magazine.rotation.x = 0.15;
    this.magRestPos.copy(this.magazine.position);
    this.group.add(this.magazine);

    b(0.048, 0.065, 0.22, wd, 0, -0.01, 0.14);
    b(0.05, 0.07, 0.018, mtL, 0, -0.01, 0.26);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.035), wdD);
    grip.position.set(0, -0.07, 0.02); grip.rotation.x = -0.25;
    this.group.add(grip);

    b(0.046, 0.038, 0.18, wd, 0, -0.015, -0.3);
    b(0.044, 0.012, 0.17, wdD, 0, -0.035, -0.3);
    b(0.008, 0.03, 0.008, mt, 0, 0.05, -0.6);
    b(0.02, 0.012, 0.02, mt, 0, 0.033, -0.6);
    b(0.028, 0.02, 0.012, mt, 0, 0.045, -0.15);
  }

  private buildHands(team: WeaponTeam) {
    const skin = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.75 });
    const skinD = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.8 });

    // Цвета формы по команде
    let sleeveColor: number, cuffColor: number;
    if (team === 'guard') {
      sleeveColor = 0x1e3a6e;
      cuffColor = 0x162e58;
    } else {
      sleeveColor = 0xff6b35;
      cuffColor = 0xe05a2a;
    }
    const sleeve = new THREE.MeshStandardMaterial({ color: sleeveColor, roughness: 0.8 });
    const cuff = new THREE.MeshStandardMaterial({ color: cuffColor, roughness: 0.85 });

    // === ПРАВАЯ РУКА (на рукоятке) — уходит вниз-назад за экран ===
    this.rightHand = new THREE.Group();

    // Плечо (уходит за экран)
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.2), sleeve), 0.06, -0.06, 0.2));
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.14), sleeve), 0.04, -0.03, 0.12));
    // Манжета
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.025), cuff), 0.03, -0.01, 0.04));
    // Предплечье
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.058, 0.06), skin), 0.015, 0, -0.0));
    // Запястье
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), skinD), 0.005, 0, -0.03));
    // Ладонь
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.045), skin), 0, -0.008, -0.055));
    // Пальцы на рукоятке
    for (let i = 0; i < 4; i++) {
      this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.025, 0.014), skinD), -0.02 + i * 0.013, -0.022, -0.045));
    }
    // Указательный на спусковом крючке
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.028), skinD), -0.01, -0.018, -0.08));

    this.rightHand.position.set(0.02, -0.055, 0.02);
    this.rightHand.rotation.x = -0.25;
    this.group.add(this.rightHand);

    // === ЛЕВАЯ РУКА (на цевье) — уходит влево за экран ===
    this.leftHand = new THREE.Group();

    // Плечо (уходит влево-вниз за экран)
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.18), sleeve), -0.08, -0.06, 0.15));
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.12), sleeve), -0.06, -0.03, 0.08));
    // Манжета
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.025), cuff), -0.04, -0.01, 0.01));
    // Предплечье
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.058, 0.055), skin), -0.02, 0, -0.02));
    // Запястье
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.035), skinD), -0.01, 0, -0.045));
    // Ладонь обхватывает цевьё
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.03, 0.055), skin), 0, -0.01, -0.06));
    // Пальцы снизу цевья
    for (let i = 0; i < 4; i++) {
      this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.025, 0.014), skinD), -0.02 + i * 0.013, 0.012, -0.055));
    }
    // Большой палец сверху
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.013, 0.03), skinD), 0.03, 0.018, -0.055));

    this.leftHand.position.set(-0.02, -0.025, -0.28);
    this.group.add(this.leftHand);
  }

  private p(mesh: THREE.Mesh, x: number, y: number, z: number): THREE.Mesh {
    mesh.position.set(x, y, z);
    return mesh;
  }

  canFire(): boolean {
    if (this.isReloading_) return false;
    return this.stats.currentAmmo > 0 && (performance.now() - this.lastFireTime) >= 1000 / this.stats.fireRate;
  }

  fire(): boolean {
    if (!this.canFire()) return false;
    this.stats.currentAmmo--;
    this.lastFireTime = performance.now();
    this.recoilAmount = 0.04;
    this.muzzleFlash.intensity = 2;
    setTimeout(() => { this.muzzleFlash.intensity = 0; }, 50);
    return true;
  }

  reload() {
    if (this.isReloading_ || this.stats.currentAmmo === this.stats.maxAmmo) return;
    this.isReloading_ = true;
    this.reloadProgress = 0;
  }

  isCurrentlyReloading() { return this.isReloading_; }

  update(delta: number) {
    if (this.isReloading_) {
      this.reloadProgress += delta / this.reloadDuration;

      if (this.reloadProgress >= 1) {
        this.isReloading_ = false;
        this.reloadProgress = 0;
        this.stats.currentAmmo = this.stats.maxAmmo;
        this.magazine.position.copy(this.magRestPos);
        this.magazine.rotation.set(0.15, 0, 0);
        this.leftHand.position.set(-0.02, -0.025, -0.28);
        this.leftHand.rotation.set(0, 0, 0);
      } else {
        const p = this.reloadProgress;
        const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

        if (p < 0.15) {
          const t = ease(p / 0.15);
          this.leftHand.position.set(-0.02 + t * 0.01, -0.025 - t * 0.03, -0.28 + t * 0.22);
        } else if (p < 0.35) {
          const t = ease((p - 0.15) / 0.2);
          this.magazine.position.set(0, this.magRestPos.y - t * 0.12, this.magRestPos.z);
          this.leftHand.position.set(-0.01, -0.055 - t * 0.06, -0.06);
        } else if (p < 0.5) {
          const t = ease((p - 0.35) / 0.15);
          this.magazine.position.set(t * 0.06, this.magRestPos.y - 0.12 - t * 0.05, this.magRestPos.z);
          this.magazine.rotation.z = t * 0.25;
          this.leftHand.position.set(-0.01 + t * 0.05, -0.115, -0.06);
        } else if (p < 0.7) {
          const t = ease((p - 0.5) / 0.2);
          this.magazine.position.set(0.06 * (1 - t), this.magRestPos.y - 0.17 + t * 0.1, this.magRestPos.z);
          this.magazine.rotation.z = 0.25 * (1 - t);
          this.leftHand.position.set(0.04 * (1 - t), -0.115 + t * 0.04, -0.06);
        } else if (p < 0.85) {
          const t = ease((p - 0.7) / 0.15);
          this.magazine.position.set(0, this.magRestPos.y - 0.07 + t * 0.07, this.magRestPos.z);
          this.magazine.rotation.z = 0;
          this.leftHand.position.set(-0.01, -0.075 + t * 0.015, -0.06 - t * 0.04);
        } else {
          const t = ease((p - 0.85) / 0.15);
          this.magazine.position.copy(this.magRestPos);
          this.magazine.rotation.set(0.15, 0, 0);
          this.leftHand.position.set(-0.01 - t * 0.01, -0.06 + t * 0.035, -0.1 - t * 0.18);
        }
      }
      return;
    }

    if (this.recoilAmount > 0) {
      this.group.position.z = this.originalPosition.z + this.recoilAmount;
      this.group.rotation.x = -this.recoilAmount * 1.5;
      this.recoilAmount -= delta * 0.4;
      if (this.recoilAmount <= 0) this.recoilAmount = 0;
    }
    this.group.position.lerp(this.originalPosition, delta * 8);
    this.group.rotation.x += (0 - this.group.rotation.x) * delta * 8;
  }

  getAimDirection(camera: THREE.Camera, isMoving = false, isCrouching = false): THREE.Vector3 {
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    let spread = this.stats.spread;
    if (isMoving) spread *= 2.5;
    if (isCrouching) spread *= 0.5;
    d.x += (Math.random() - 0.5) * spread;
    d.y += (Math.random() - 0.5) * spread;
    d.z += (Math.random() - 0.5) * spread;
    return d.normalize();
  }
}
