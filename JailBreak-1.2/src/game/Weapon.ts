import * as THREE from 'three';

export type WeaponTeam = 'guard' | 'prisoner';
export type WeaponType = 'ak47' | 'shotgun' | 'pistol' | 'taser';
export type FireMode = 'auto' | 'semi' | 'pump' | 'single';

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number;
  maxAmmo: number;
  currentAmmo: number;
  range: number;
  spread: number;
  pelletsPerShot: number;
  fireMode: FireMode;
}

export interface FireResult {
  fired: boolean;
  mode: FireMode;
  pelletsPerShot: number;
}

function getStatsForType(type: WeaponType): WeaponStats {
  switch (type) {
    case 'ak47':
      return { name: 'AK-47', damage: 25, fireRate: 13, maxAmmo: 30, currentAmmo: 30, range: 100, spread: 0.02, pelletsPerShot: 1, fireMode: 'auto' };
    case 'shotgun':
      return { name: 'SPAS-12', damage: 15, fireRate: 1.43, maxAmmo: 6, currentAmmo: 6, range: 10, spread: 0.08, pelletsPerShot: 8, fireMode: 'pump' };
    case 'pistol':
      return { name: 'Makarov PM', damage: 30, fireRate: 5, maxAmmo: 8, currentAmmo: 8, range: 50, spread: 0.008, pelletsPerShot: 1, fireMode: 'semi' };
    case 'taser':
      return { name: 'Taser', damage: 5, fireRate: 0.1, maxAmmo: 1, currentAmmo: 1, range: 5, spread: 0.01, pelletsPerShot: 1, fireMode: 'single' };
  }
}

export class Weapon {
  public group: THREE.Group;
  public stats: WeaponStats;
  public weaponType: WeaponType;

  private muzzleFlash: THREE.PointLight;
  private muzzleFlashMesh: THREE.Mesh;
  private lastFireTime = 0;
  private recoilAmount = 0;
  private recoilYaw = 0;
  private originalPosition: THREE.Vector3;

  private swayTime = 0;

  private leftHand: THREE.Group;
  private rightHand: THREE.Group;
  private magazine: THREE.Mesh;
  private magRestPos = new THREE.Vector3();

  private isReloading_ = false;
  private reloadProgress = 0;
  private readonly reloadDuration = 1.6;

  private smokeParticles: THREE.Mesh[] = [];

  // Shotgun pump animation state
  public isPumping = false;
  private pumpProgress = 0;
  private readonly pumpDuration = 0.7;

  // Shotgun shell-by-shell reload
  private reloadShellsLoaded = 0;
  private shellReloadTimer = 0;
  private readonly shellReloadTime = 0.6;

  // Pistol slide animation
  private slideOffset = 0;
  private slideLocked = false;
  private slideMesh: THREE.Mesh | null = null;

  // Taser state
  private wireReloadTimer = 0;
  private sparkMesh: THREE.Mesh | null = null;
  private sparkFlickerTimer = 0;
  private sparkFlickerInterval = 0.15;

  constructor(team: WeaponTeam = 'guard', weaponType: WeaponType = 'ak47') {
    this.group = new THREE.Group();
    this.weaponType = weaponType;
    this.stats = getStatsForType(weaponType);

    this.magazine = new THREE.Mesh();
    this.leftHand = new THREE.Group();
    this.rightHand = new THREE.Group();

    this.buildGunForType();
    this.buildHands(team);

    this.group.position.set(0.18, -0.18, -0.38);
    this.originalPosition = this.group.position.clone();

    this.muzzleFlash = new THREE.PointLight(0xffaa00, 0, 3);
    this.muzzleFlash.position.set(0, 0.02, -0.7);
    this.group.add(this.muzzleFlash);

    const flashSize = weaponType === 'shotgun' ? 0.24 : weaponType === 'pistol' ? 0.08 : weaponType === 'taser' ? 0 : 0.12;
    if (flashSize > 0) {
      const flashTexture = this.createMuzzleFlashTexture();
      const flashMat = new THREE.MeshBasicMaterial({
        map: flashTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      this.muzzleFlashMesh = new THREE.Mesh(new THREE.PlaneGeometry(flashSize, flashSize), flashMat);
      this.muzzleFlashMesh.position.set(0, 0.02, -0.7);
      this.muzzleFlashMesh.visible = false;
      this.group.add(this.muzzleFlashMesh);
    } else {
      this.muzzleFlashMesh = new THREE.Mesh();
    }
  }

  private buildGunForType() {
    switch (this.weaponType) {
      case 'ak47': this.buildGun(); break;
      case 'shotgun': this.buildShotgun(); break;
      case 'pistol': this.buildPistol(); break;
      case 'taser': this.buildTaser(); break;
    }
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

  private buildShotgun() {
    const mt = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.85 });
    const wd = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.85 });

    const b = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      this.group.add(mesh);
      return mesh;
    };

    // Long barrel
    b(0.03, 0.03, 0.5, mt, 0, 0.02, -0.45);
    // Receiver
    b(0.06, 0.065, 0.2, mt, 0, 0, -0.1);
    // Pump handguard (fore-end) - attached to leftHand for animation
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.15), wd);
    pump.position.set(0, -0.015, -0.33);
    this.group.add(pump);
    // Folding stock
    b(0.04, 0.05, 0.18, mt, 0, -0.01, 0.14);
    b(0.035, 0.06, 0.015, mt, 0, -0.01, 0.24);
    // Front sight with red dot
    b(0.008, 0.025, 0.008, mt, 0, 0.045, -0.65);
    const redDot = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    redDot.position.set(0, 0.06, -0.65);
    this.group.add(redDot);
    // Buttpad
    b(0.042, 0.06, 0.015, new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }), 0, -0.01, 0.255);

    // Magazine (tube magazine visual)
    this.magazine = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), mt);
    this.magazine.rotation.x = Math.PI / 2;
    this.magazine.position.set(0, -0.01, -0.35);
    this.magRestPos.copy(this.magazine.position);
    this.group.add(this.magazine);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.035), mt);
    grip.position.set(0, -0.06, 0.02); grip.rotation.x = -0.2;
    this.group.add(grip);
  }

  private buildPistol() {
    const mt = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.35, metalness: 0.85 });
    const bk = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.8 });

    // Slide (top)
    this.slideMesh = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.16), mt);
    this.slideMesh.position.set(0, 0.025, -0.22);
    this.group.add(this.slideMesh);

    // Frame (lower)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.024, 0.12), mt);
    frame.position.set(0, 0.0, -0.2);
    this.group.add(frame);

    // Barrel (short)
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 8), mt);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.025, -0.33);
    this.group.add(barrel);

    // Grip with bakelite
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.07, 0.03), bk);
    grip.position.set(0, -0.04, -0.16); grip.rotation.x = -0.3;
    this.group.add(grip);

    // Trigger guard
    const tGuard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.035), mt);
    tGuard.position.set(0, -0.015, -0.2);
    this.group.add(tGuard);

    // Small sights
    const fSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.006), mt);
    fSight.position.set(0, 0.045, -0.28);
    this.group.add(fSight);
    const rSight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.006), mt);
    rSight.position.set(0, 0.043, -0.15);
    this.group.add(rSight);

    // Magazine
    this.magazine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.025), mt);
    this.magazine.position.set(0, -0.06, -0.17);
    this.magRestPos.copy(this.magazine.position);
    this.group.add(this.magazine);

    // Adjust position closer to center for compact feel
    this.group.position.set(0.12, -0.15, -0.3);

    // Move muzzle flash position for pistol
    this.muzzleFlash.position.set(0, 0.025, -0.36);
    if (this.muzzleFlashMesh) this.muzzleFlashMesh.position.set(0, 0.025, -0.36);
  }

  private buildTaser() {
    const yellow = new THREE.MeshStandardMaterial({ color: 0xf0d000, roughness: 0.5, metalness: 0.3 });
    const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.4 });

    // Body - two-tone
    const bodyTop = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.12), yellow);
    bodyTop.position.set(0, 0.015, -0.2);
    this.group.add(bodyTop);
    const bodyBot = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.12), black);
    bodyBot.position.set(0, -0.01, -0.2);
    this.group.add(bodyBot);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.065, 0.03), black);
    grip.position.set(0, -0.045, -0.15); grip.rotation.x = -0.25;
    this.group.add(grip);

    // Two electrode prongs
    const prong1 = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.04, 6), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 }));
    prong1.rotation.x = Math.PI / 2;
    prong1.position.set(-0.008, 0.01, -0.28);
    this.group.add(prong1);
    const prong2 = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.04, 6), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 }));
    prong2.rotation.x = Math.PI / 2;
    prong2.position.set(0.008, 0.01, -0.28);
    this.group.add(prong2);

    // Spark mesh between electrodes
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x88ffff, transparent: true, opacity: 0.9 });
    this.sparkMesh = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 0.006), sparkMat);
    this.sparkMesh.position.set(0, 0.01, -0.29);
    this.sparkMesh.visible = false;
    this.group.add(this.sparkMesh);

    // Charge indicator dots (green emissive)
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    for (let i = 0; i < 3; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 6), dotMat);
      dot.position.set(0.022, 0.015, -0.17 + i * 0.02);
      this.group.add(dot);
    }

    // Magazine placeholder (not visually used but needed for reload anim)
    this.magazine = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), black);
    this.magazine.visible = false;
    this.magazine.position.set(0, -0.1, -0.2);
    this.magRestPos.copy(this.magazine.position);
    this.group.add(this.magazine);

    // Adjust position
    this.group.position.set(0.14, -0.15, -0.32);
    this.muzzleFlash.position.set(0, 0.01, -0.3);
  }

  private buildHands(team: WeaponTeam) {
    const skin = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.75 });
    const skinD = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.8 });

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

    // Right hand (on grip)
    this.rightHand = new THREE.Group();
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.2), sleeve), 0.06, -0.06, 0.2));
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.14), sleeve), 0.04, -0.03, 0.12));
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.025), cuff), 0.03, -0.01, 0.04));
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.058, 0.06), skin), 0.015, 0, -0.0));
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), skinD), 0.005, 0, -0.03));
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.045), skin), 0, -0.008, -0.055));
    for (let i = 0; i < 4; i++) {
      this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.025, 0.014), skinD), -0.02 + i * 0.013, -0.022, -0.045));
    }
    this.rightHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.028), skinD), -0.01, -0.018, -0.08));
    this.rightHand.position.set(0.02, -0.055, 0.02);
    this.rightHand.rotation.x = -0.25;
    this.group.add(this.rightHand);

    // Left hand (on foregrip / fore-end)
    this.leftHand = new THREE.Group();
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.18), sleeve), -0.08, -0.06, 0.15));
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.12), sleeve), -0.06, -0.03, 0.08));
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.025), cuff), -0.04, -0.01, 0.01));
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.058, 0.055), skin), -0.02, 0, -0.02));
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.035), skinD), -0.01, 0, -0.045));
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.03, 0.055), skin), 0, -0.01, -0.06));
    for (let i = 0; i < 4; i++) {
      this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.025, 0.014), skinD), -0.02 + i * 0.013, 0.012, -0.055));
    }
    this.leftHand.add(this.p(new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.013, 0.03), skinD), 0.03, 0.018, -0.055));
    this.leftHand.position.set(-0.02, -0.025, -0.28);
    this.group.add(this.leftHand);
  }

  private p(mesh: THREE.Mesh, x: number, y: number, z: number): THREE.Mesh {
    mesh.position.set(x, y, z);
    return mesh;
  }

  private createMuzzleFlashTexture(): THREE.CanvasTexture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;

    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * cx, cy + Math.sin(angle) * cy);
      grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
      grad.addColorStop(0.3, 'rgba(255, 180, 50, 0.8)');
      grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const spread = Math.PI / rayCount * 0.6;
      ctx.arc(cx, cy, cx, angle - spread, angle + spread);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx * 0.3);
    centerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    centerGrad.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = centerGrad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  canFire(): boolean {
    if (this.isReloading_) return false;
    if (this.isPumping) return false;
    if (this.weaponType === 'taser' && this.wireReloadTimer > 0) return false;
    return this.stats.currentAmmo > 0 && (performance.now() - this.lastFireTime) >= 1000 / this.stats.fireRate;
  }

  fire(): FireResult {
    const result: FireResult = { fired: false, mode: this.stats.fireMode, pelletsPerShot: this.stats.pelletsPerShot };
    if (!this.canFire()) return result;

    this.stats.currentAmmo--;
    this.lastFireTime = performance.now();
    this.recoilAmount = 0.06;
    this.recoilYaw = (Math.random() - 0.5) * 0.02;
    result.fired = true;

    // Enhanced muzzle flash
    if (this.weaponType !== 'taser') {
      this.muzzleFlash.intensity = this.weaponType === 'shotgun' ? 6 : 4;
      this.muzzleFlashMesh.visible = true;
      this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI * 2;
      setTimeout(() => {
        this.muzzleFlash.intensity = 0;
        this.muzzleFlashMesh.visible = false;
      }, 50);
      this.spawnSmokeParticle();
    }

    // Weapon-specific post-fire logic
    if (this.weaponType === 'shotgun') {
      this.isPumping = true;
      this.pumpProgress = 0;
    } else if (this.weaponType === 'pistol') {
      this.slideOffset = 0.03;
      if (this.stats.currentAmmo === 0) {
        this.slideLocked = true;
      }
    } else if (this.weaponType === 'taser') {
      this.wireReloadTimer = 10;
    }

    return result;
  }

  private spawnSmokeParticle() {
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), smokeMat);

    const muzzleWorldPos = new THREE.Vector3();
    this.muzzleFlash.getWorldPosition(muzzleWorldPos);
    smoke.position.copy(muzzleWorldPos);

    smoke.userData.lifetime = 0;
    smoke.userData.maxLifetime = 0.3;
    smoke.userData.velocityY = 0.3;

    const sceneObj = this.group.parent?.parent;
    if (sceneObj instanceof THREE.Scene) {
      sceneObj.add(smoke);
    } else if (this.group.parent) {
      let obj: THREE.Object3D | null = this.group.parent;
      while (obj && !(obj instanceof THREE.Scene)) {
        obj = obj.parent;
      }
      if (obj) obj.add(smoke);
    }
    this.smokeParticles.push(smoke);
  }

  getSmokeParticles(): THREE.Mesh[] {
    return this.smokeParticles;
  }

  updateSmoke(delta: number) {
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const smoke = this.smokeParticles[i];
      smoke.userData.lifetime += delta;
      smoke.position.y += smoke.userData.velocityY * delta;

      const progress = smoke.userData.lifetime / smoke.userData.maxLifetime;
      const mat = smoke.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 * (1 - progress);
      smoke.scale.setScalar(1 + progress);

      if (smoke.userData.lifetime >= smoke.userData.maxLifetime) {
        smoke.parent?.remove(smoke);
        smoke.geometry.dispose();
        mat.dispose();
        this.smokeParticles.splice(i, 1);
      }
    }
  }

  reload() {
    if (this.isReloading_ || this.stats.currentAmmo === this.stats.maxAmmo) return;
    if (this.weaponType === 'taser') return; // taser uses wire reload timer

    this.isReloading_ = true;
    this.reloadProgress = 0;

    if (this.weaponType === 'shotgun') {
      this.reloadShellsLoaded = 0;
      this.shellReloadTimer = 0;
    }
  }

  // Allow interrupting shotgun reload by firing
  interruptReload(): boolean {
    if (!this.isReloading_ || this.weaponType !== 'shotgun') return false;
    if (this.reloadShellsLoaded > 0) {
      this.isReloading_ = false;
      this.reloadProgress = 0;
      this.leftHand.position.set(-0.02, -0.025, -0.28);
      this.leftHand.rotation.set(0, 0, 0);
      return true;
    }
    return false;
  }

  isCurrentlyReloading() { return this.isReloading_; }

  update(delta: number, isMoving = false, isSprinting = false) {
    // Taser wire reload countdown
    if (this.weaponType === 'taser' && this.wireReloadTimer > 0) {
      this.wireReloadTimer -= delta;
      if (this.wireReloadTimer <= 0) {
        this.wireReloadTimer = 0;
        this.stats.currentAmmo = this.stats.maxAmmo;
      }
    }

    // Taser spark flicker
    if (this.weaponType === 'taser' && this.sparkMesh) {
      this.sparkFlickerTimer -= delta;
      if (this.sparkFlickerTimer <= 0) {
        this.sparkMesh.visible = !this.sparkMesh.visible;
        this.sparkFlickerInterval = 0.1 + Math.random() * 0.2;
        this.sparkFlickerTimer = this.sparkFlickerInterval;
      }
    }

    // Shotgun pump animation
    if (this.isPumping) {
      this.pumpProgress += delta / this.pumpDuration;
      if (this.pumpProgress >= 1) {
        this.isPumping = false;
        this.pumpProgress = 0;
        this.leftHand.position.z = -0.28;
      } else {
        const half = this.pumpProgress < 0.5 ? this.pumpProgress * 2 : (1 - this.pumpProgress) * 2;
        this.leftHand.position.z = -0.28 + half * 0.08;
      }
      // Skip normal update logic during pump (can still decay recoil)
    }

    // Pistol slide animation
    if (this.weaponType === 'pistol' && this.slideMesh) {
      if (this.slideLocked) {
        this.slideMesh.position.z = -0.22 + 0.03;
      } else if (this.slideOffset > 0.001) {
        this.slideOffset *= Math.max(0, 1 - delta * 30);
        this.slideMesh.position.z = -0.22 + this.slideOffset;
      } else {
        this.slideOffset = 0;
        this.slideMesh.position.z = -0.22;
      }
    }

    // Reload logic
    if (this.isReloading_) {
      if (this.weaponType === 'shotgun') {
        this.updateShotgunReload(delta);
      } else if (this.weaponType === 'pistol') {
        this.updatePistolReload(delta);
      } else {
        this.updateStandardReload(delta);
      }
      return;
    }

    if (this.recoilAmount > 0) {
      this.group.position.z = this.originalPosition.z + this.recoilAmount;
      this.group.rotation.x = -this.recoilAmount * 1.5;
      this.group.rotation.y = this.recoilYaw;
      this.recoilAmount -= delta * 0.4;
      this.recoilYaw *= (1 - delta * 8);
      if (this.recoilAmount <= 0) {
        this.recoilAmount = 0;
        this.recoilYaw = 0;
      }
    }

    // Weapon sway and bob
    this.swayTime += delta;
    const breathX = Math.sin(this.swayTime * 1.8) * 0.001;
    const breathY = Math.sin(this.swayTime * 1.3) * 0.0008;
    let swayX = breathX;
    let swayY = breathY;

    if (isMoving) {
      const bobAmp = isSprinting ? 1.5 : 1.0;
      swayY += Math.sin(this.swayTime * 10) * 0.003 * bobAmp;
      swayX += Math.cos(this.swayTime * 10) * 0.002 * bobAmp;
    }

    const targetX = this.originalPosition.x + swayX;
    const targetY = this.originalPosition.y + swayY;
    const targetZ = this.originalPosition.z;

    this.group.position.x += (targetX - this.group.position.x) * delta * 8;
    this.group.position.y += (targetY - this.group.position.y) * delta * 8;
    this.group.position.z += (targetZ - this.group.position.z) * delta * 8;
    this.group.rotation.x += (0 - this.group.rotation.x) * delta * 8;
    this.group.rotation.y += (0 - this.group.rotation.y) * delta * 8;
  }

  private updateShotgunReload(delta: number) {
    this.shellReloadTimer += delta;
    if (this.shellReloadTimer >= this.shellReloadTime) {
      this.shellReloadTimer = 0;
      this.reloadShellsLoaded++;
      this.stats.currentAmmo = Math.min(this.stats.maxAmmo, this.stats.currentAmmo + 1);

      if (this.stats.currentAmmo >= this.stats.maxAmmo) {
        this.isReloading_ = false;
        this.reloadShellsLoaded = 0;
        this.leftHand.position.set(-0.02, -0.025, -0.28);
        this.leftHand.rotation.set(0, 0, 0);
      }
    } else {
      // Animate hand moving to receiver area
      const t = this.shellReloadTimer / this.shellReloadTime;
      const wave = Math.sin(t * Math.PI);
      this.leftHand.position.set(-0.02 + wave * 0.02, -0.025 - wave * 0.02, -0.28 + wave * 0.1);
    }
  }

  private updatePistolReload(delta: number) {
    const totalDuration = 1.2;
    this.reloadProgress += delta / totalDuration;

    if (this.reloadProgress >= 1) {
      this.isReloading_ = false;
      this.reloadProgress = 0;
      this.stats.currentAmmo = this.stats.maxAmmo;
      this.magazine.position.copy(this.magRestPos);
      this.leftHand.position.set(-0.02, -0.025, -0.28);
      this.leftHand.rotation.set(0, 0, 0);
      // Release slide
      if (this.slideLocked) {
        this.slideLocked = false;
        this.slideOffset = 0;
        if (this.slideMesh) this.slideMesh.position.z = -0.22;
      }
    } else {
      const p = this.reloadProgress;
      if (p < 0.3) {
        // Mag drops out
        const t = p / 0.3;
        this.magazine.position.y = this.magRestPos.y - t * 0.15;
      } else if (p < 0.7) {
        // New mag inserts
        const t = (p - 0.3) / 0.4;
        this.magazine.position.y = this.magRestPos.y - 0.15 + t * 0.15;
        this.leftHand.position.set(-0.02, -0.025 - (1 - t) * 0.05, -0.28 + (1 - t) * 0.1);
      } else {
        // Slide release
        const t = (p - 0.7) / 0.3;
        this.magazine.position.copy(this.magRestPos);
        this.leftHand.position.set(-0.02, -0.025, -0.28);
        if (this.slideLocked && t > 0.5) {
          this.slideLocked = false;
          this.slideOffset = 0;
          if (this.slideMesh) this.slideMesh.position.z = -0.22;
        }
      }
    }
  }

  private updateStandardReload(delta: number) {
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
  }

  getAimDirection(camera: THREE.Camera, isMoving = false, isCrouching = false, isSprinting = false, extraSpread = 0): THREE.Vector3 {
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    let spread = 0.01;
    if (isMoving) spread += 0.02;
    if (isSprinting) spread += 0.03;
    if (isCrouching) spread *= 0.5;
    spread += extraSpread;
    d.x += (Math.random() - 0.5) * spread;
    d.y += (Math.random() - 0.5) * spread;
    d.z += (Math.random() - 0.5) * spread;
    return d.normalize();
  }

  getMuzzleWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.muzzleFlash.getWorldPosition(pos);
    return pos;
  }
}
