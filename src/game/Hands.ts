import * as THREE from 'three';

export class Hands {
  public group: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;

  private walkTime = 0;
  private idleTime = 0;
  private isWalking = false;
  private isVisible = true;

  private isPunching = false;
  private punchProgress = 0;
  private readonly punchDuration = 0.35;
  private punchHand: 'right' | 'left' = 'right';

  // Item holding state
  private heldItem: 'none' | 'shiv' | 'baton' | 'shield' | 'flashlight' | 'medkit' | 'bandage' = 'none';
  private itemModel: THREE.Group | null = null;

  // Melee attack animation
  private isMeleeAttacking = false;
  private meleeProgress = 0;
  private readonly meleeDuration = 0.4;

  // Use animation (consumables)
  private isUsing = false;
  private useProgress = 0;
  private useDuration = 2;

  // Flashlight toggle animation
  private isTogglingFlashlight = false;
  private toggleProgress = 0;
  private readonly toggleDuration = 0.2;

  // Item base position tracking for melee sync
  private itemBasePosition = new THREE.Vector3();
  private itemBaseRotationX = 0;

  // Руки вытянуты вперёд, рукава уходят за нижний край экрана
  private readonly leftRest = new THREE.Vector3(-0.24, -0.2, -0.5);
  private readonly rightRest = new THREE.Vector3(0.24, -0.2, -0.5);

  constructor(team?: 'guard' | 'prisoner') {
    this.group = new THREE.Group();

    const skin = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.75 });
    const skinD = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.8 });

    let sleeveColor: number;
    let cuffColor: number;
    if (team === 'guard') {
      sleeveColor = 0x1e3a6e;
      cuffColor = 0x162e58;
    } else {
      sleeveColor = 0xff6b35;
      cuffColor = 0xe05a2a;
    }

    const sleeve = new THREE.MeshStandardMaterial({ color: sleeveColor, roughness: 0.85 });
    const sleeveD = new THREE.MeshStandardMaterial({ color: cuffColor, roughness: 0.85 });

    this.leftArm = this.buildArm(true, skin, skinD, sleeve, sleeveD);
    this.rightArm = this.buildArm(false, skin, skinD, sleeve, sleeveD);

    this.leftArm.position.copy(this.leftRest);
    this.rightArm.position.copy(this.rightRest);

    this.group.add(this.leftArm, this.rightArm);
  }

  private buildArm(
    isLeft: boolean,
    skin: THREE.Material, skinD: THREE.Material,
    sleeve: THREE.Material, sleeveD: THREE.Material
  ): THREE.Group {
    const arm = new THREE.Group();
    const s = isLeft ? -1 : 1;

    // === ПЛЕЧЕВАЯ ЧАСТЬ — уходит за экран вниз-назад ===
    // Плечо (большой блок, уходит за нижний край)
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.25), sleeve);
    shoulder.position.set(s * 0.03, -0.06, 0.3);
    shoulder.rotation.x = 0.4;
    arm.add(shoulder);

    // Верхняя часть рукава (переход к плечу)
    const upperSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.18), sleeve);
    upperSleeve.position.set(s * 0.02, -0.04, 0.2);
    upperSleeve.rotation.x = 0.2;
    arm.add(upperSleeve);

    // Рукав (средняя часть)
    const midSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.14), sleeve);
    midSleeve.position.set(0, -0.01, 0.1);
    arm.add(midSleeve);

    // Манжета
    const cuffMesh = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.075, 0.03), sleeveD);
    cuffMesh.position.set(0, 0, 0.02);
    arm.add(cuffMesh);

    // === ПРЕДПЛЕЧЬЕ (кожа) ===
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.065, 0.1), skin);
    forearm.position.set(0, 0, -0.04);
    arm.add(forearm);

    // Запястье
    const wrist = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.058, 0.03), skinD);
    wrist.position.set(0, 0, -0.1);
    arm.add(wrist);

    // === КУЛАК ===
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.07), skin);
    palm.position.set(0, -0.005, -0.14);
    arm.add(palm);

    // Тыльная сторона ладони
    const backHand = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.01, 0.06), skinD);
    backHand.position.set(0, 0.02, -0.14);
    arm.add(backHand);

    // Костяшки
    for (let i = 0; i < 4; i++) {
      const kn = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 0.014), skinD);
      kn.position.set(-0.026 + i * 0.018, 0.015, -0.175);
      arm.add(kn);
    }

    // 4 пальца (согнуты в кулак)
    for (let i = 0; i < 4; i++) {
      const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.032, 0.016), skin);
      f1.position.set(-0.026 + i * 0.018, -0.01, -0.18);
      arm.add(f1);
      const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.022, 0.014), skinD);
      f2.position.set(-0.026 + i * 0.018, -0.025, -0.17);
      arm.add(f2);
    }

    // Большой палец
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.02), skin);
    thumb.position.set(s * 0.048, -0.005, -0.13);
    thumb.rotation.z = s * 0.4;
    arm.add(thumb);

    return arm;
  }

  setWalking(w: boolean) { this.isWalking = w; }
  setVisible(v: boolean) {
    this.isVisible = v;
    this.group.visible = v;
    if (!v) this.resetAnimationState();
  }

  resetAnimationState() {
    this.isUsing = false;
    this.useProgress = 0;
    this.isMeleeAttacking = false;
    this.meleeProgress = 0;
    this.isPunching = false;
    this.punchProgress = 0;
    this.isTogglingFlashlight = false;
    this.toggleProgress = 0;
    if (this.itemModel) {
      this.itemModel.position.copy(this.itemBasePosition);
      this.itemModel.rotation.x = this.itemBaseRotationX;
      this.itemModel.rotation.z = 0;
    }
    this.leftArm.position.copy(this.leftRest);
    this.leftArm.rotation.x = 0;
    this.rightArm.position.copy(this.rightRest);
    this.rightArm.rotation.x = 0;
  }

  startPunch() {
    if (this.isPunching) return;
    this.isPunching = true;
    this.punchProgress = 0;
  }

  setHeldItem(item: string) {
    // Reset any in-progress animations before switching items
    this.resetAnimationState();

    // Remove old item model
    if (this.itemModel) {
      this.group.remove(this.itemModel);
      this.itemModel = null;
    }

    const itemMap: Record<string, 'none' | 'shiv' | 'baton' | 'shield' | 'flashlight' | 'medkit' | 'bandage'> = {
      'item_shiv': 'shiv',
      'item_baton': 'baton',
      'item_shield': 'shield',
      'item_flashlight': 'flashlight',
      'item_medkit': 'medkit',
      'item_bandage': 'bandage',
      'none': 'none',
      'fists': 'none',
    };
    this.heldItem = itemMap[item] || 'none';

    if (this.heldItem === 'none') return;

    // Create item model in first-person view
    this.itemModel = this.createItemModel(this.heldItem);
    if (this.itemModel) {
      this.group.add(this.itemModel);
      this.itemBasePosition.copy(this.itemModel.position);
      this.itemBaseRotationX = this.itemModel.rotation.x;
    }
  }

  private createItemModel(type: string): THREE.Group {
    const g = new THREE.Group();
    const metalDark = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.3, metalness: 0.85 });
    const metalMid = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.35, metalness: 0.75 });
    const metalShiny = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.15, metalness: 0.9 });

    switch (type) {
      case 'shiv': {
        // Small blade with tape handle - positioned in right hand
        const tape = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.14), metalShiny);
        blade.position.set(0, 0, -0.1);
        g.add(blade);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.08), tape);
        handle.position.set(0, 0, 0.01);
        g.add(handle);
        g.position.set(0.24, -0.22, -0.55);
        g.rotation.x = -0.3;
        break;
      }
      case 'baton': {
        // Black rubber stick with grip
        const rubber = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.013, 0.4, 8), rubber);
        body.rotation.x = Math.PI / 2;
        body.position.set(0, 0, -0.15);
        g.add(body);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8), metalDark);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(0, 0, 0.05);
        g.add(cap);
        g.position.set(0.24, -0.2, -0.5);
        g.rotation.x = -0.2;
        break;
      }
      case 'shield': {
        // Large transparent riot shield - held centered with both hands
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.025), metalDark);
        g.add(frame);
        const glass = new THREE.MeshStandardMaterial({ color: 0xaaddff, roughness: 0.1, transparent: true, opacity: 0.25 });
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.015), glass);
        panel.position.set(0, 0.05, 0.01);
        g.add(panel);
        // Top metal strip
        const topStrip = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.02), metalMid);
        topStrip.position.set(0, 0.48, 0);
        g.add(topStrip);
        // Bottom metal strip
        const bottomStrip = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.02), metalMid);
        bottomStrip.position.set(0, -0.48, 0);
        g.add(bottomStrip);
        // Handle bars on back (two small cylinders)
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
        const handleLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), handleMat);
        handleLeft.position.set(-0.1, -0.05, 0.03);
        g.add(handleLeft);
        const handleRight = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), handleMat);
        handleRight.position.set(0.1, -0.05, 0.03);
        g.add(handleRight);
        g.position.set(0, -0.15, -0.3);
        break;
      }
      case 'flashlight': {
        // Cylindrical flashlight with lens
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8), metalDark);
        body.rotation.x = Math.PI / 2;
        body.position.set(0, 0, -0.05);
        g.add(body);
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.015, 0.04, 8), metalMid);
        head.rotation.x = Math.PI / 2;
        head.position.set(0, 0, -0.15);
        g.add(head);
        const lens = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 0.3 });
        const lensMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.005, 8), lens);
        lensMesh.rotation.x = Math.PI / 2;
        lensMesh.position.set(0, 0, -0.17);
        g.add(lensMesh);
        g.position.set(0.22, -0.2, -0.5);
        g.rotation.x = -0.1;
        break;
      }
      case 'medkit': {
        // Small box with cross
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 });
        const crossMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.12), boxMat);
        g.add(box);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.005, 0.025), crossMat);
        crossH.position.set(0, 0.051, 0);
        g.add(crossH);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.005, 0.06), crossMat);
        crossV.position.set(0, 0.051, 0);
        g.add(crossV);
        g.position.set(0.2, -0.25, -0.5);
        break;
      }
      case 'bandage': {
        // Roll of white cloth
        const bandageMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.85 });
        const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), bandageMat);
        roll.rotation.z = Math.PI / 2;
        g.add(roll);
        g.position.set(0.2, -0.22, -0.5);
        break;
      }
    }
    return g;
  }

  startMeleeAttack() {
    if (this.isMeleeAttacking || this.isPunching) return;
    this.isMeleeAttacking = true;
    this.meleeProgress = 0;
  }

  startUseAnimation(type: 'medkit' | 'bandage') {
    if (this.isUsing) return;
    this.isUsing = true;
    this.useProgress = 0;
    this.useDuration = type === 'medkit' ? 2 : 3;
  }

  startFlashlightToggle() {
    if (this.isTogglingFlashlight) return;
    this.isTogglingFlashlight = true;
    this.toggleProgress = 0;
  }

  private animateMedkitUse(p: number): void {
    const ease = (t: number) => t * t * (3 - 2 * t); // cubic smoothstep

    if (p < 0.2) {
      // Phase 1: Both hands come together toward center
      const t = ease(p / 0.2);
      this.rightArm.position.set(
        this.rightRest.x - t * 0.12,
        this.rightRest.y + t * 0.06,
        this.rightRest.z - t * 0.08
      );
      this.leftArm.position.set(
        this.leftRest.x + t * 0.12,
        this.leftRest.y + t * 0.06,
        this.leftRest.z - t * 0.08
      );
      this.rightArm.rotation.x = -t * 0.2;
      this.leftArm.rotation.x = -t * 0.2;
      if (this.itemModel) {
        this.itemModel.rotation.x = this.itemBaseRotationX + t * 0.1;
      }
    } else if (p < 0.4) {
      // Phase 2: Right hand tilts down (opening lid), left holds steady
      const t = ease((p - 0.2) / 0.2);
      this.rightArm.position.set(
        this.rightRest.x - 0.12,
        this.rightRest.y + 0.06 - t * 0.02,
        this.rightRest.z - 0.08
      );
      this.rightArm.rotation.x = -0.2 + t * 0.4;
      this.leftArm.position.set(
        this.leftRest.x + 0.12,
        this.leftRest.y + 0.06,
        this.leftRest.z - 0.08
      );
      this.leftArm.rotation.x = -0.2;
      if (this.itemModel) {
        this.itemModel.rotation.x = this.itemBaseRotationX + 0.1 + t * 0.3;
      }
    } else if (p < 0.6) {
      // Phase 3: Right hand lifts up and away (reaching inside)
      const t = ease((p - 0.4) / 0.2);
      this.rightArm.position.set(
        this.rightRest.x - 0.12 + t * 0.04,
        this.rightRest.y + 0.04 + t * 0.08,
        this.rightRest.z - 0.08 - t * 0.05
      );
      this.rightArm.rotation.x = 0.2 - t * 0.5;
      this.leftArm.position.set(
        this.leftRest.x + 0.12,
        this.leftRest.y + 0.06,
        this.leftRest.z - 0.08
      );
      this.leftArm.rotation.x = -0.2;
      if (this.itemModel) {
        this.itemModel.rotation.x = this.itemBaseRotationX + 0.4;
      }
    } else if (p < 0.8) {
      // Phase 4: Right hand moves to left arm (applying treatment)
      const t = ease((p - 0.6) / 0.2);
      this.rightArm.position.set(
        this.rightRest.x - 0.08 - t * 0.1,
        this.rightRest.y + 0.12 - t * 0.06,
        this.rightRest.z - 0.13 + t * 0.02
      );
      this.rightArm.rotation.x = -0.3 + t * 0.15;
      this.leftArm.position.set(
        this.leftRest.x + 0.12 - t * 0.04,
        this.leftRest.y + 0.06 - t * 0.02,
        this.leftRest.z - 0.08
      );
      this.leftArm.rotation.x = -0.2 + t * 0.1;
      if (this.itemModel) {
        this.itemModel.rotation.x = this.itemBaseRotationX + 0.4 - t * 0.2;
      }
    } else {
      // Phase 5: Both hands return to rest
      const t = ease((p - 0.8) / 0.2);
      this.rightArm.position.set(
        this.rightRest.x - 0.18 + t * 0.18,
        this.rightRest.y + 0.06 - t * 0.06,
        this.rightRest.z - 0.11 + t * 0.11
      );
      this.rightArm.rotation.x = -0.15 * (1 - t);
      this.leftArm.position.set(
        this.leftRest.x + 0.08 - t * 0.08,
        this.leftRest.y + 0.04 - t * 0.04,
        this.leftRest.z - 0.08 + t * 0.08
      );
      this.leftArm.rotation.x = -0.1 * (1 - t);
      if (this.itemModel) {
        this.itemModel.rotation.x = this.itemBaseRotationX + 0.2 * (1 - t);
      }
    }
  }

  private animateBandageUse(p: number): void {
    const ease = (t: number) => t * t * (3 - 2 * t); // cubic smoothstep

    if (p < 0.15) {
      // Phase 1: Left arm extends forward (arm being bandaged)
      const t = ease(p / 0.15);
      this.leftArm.position.set(
        this.leftRest.x,
        this.leftRest.y + t * 0.02,
        this.leftRest.z - t * 0.15
      );
      this.leftArm.rotation.x = -t * 0.3;
      this.rightArm.position.set(this.rightRest.x, this.rightRest.y, this.rightRest.z);
      this.rightArm.rotation.x = 0;
    } else if (p < 0.3) {
      // Phase 2: Right hand brings bandage to left forearm
      const t = ease((p - 0.15) / 0.15);
      this.leftArm.position.set(
        this.leftRest.x,
        this.leftRest.y + 0.02,
        this.leftRest.z - 0.15
      );
      this.leftArm.rotation.x = -0.3;
      this.rightArm.position.set(
        this.rightRest.x - t * 0.2,
        this.rightRest.y + t * 0.02,
        this.rightRest.z - t * 0.12
      );
      this.rightArm.rotation.x = -t * 0.2;
    } else if (p < 0.8) {
      // Phase 3: Right hand wraps in circular motion around left arm
      const wrapT = (p - 0.3) / 0.5;
      const angle = wrapT * Math.PI * 4; // 2 full wraps
      const radius = 0.04;
      const centerX = this.leftRest.x + 0.04;
      const centerY = this.leftRest.y + 0.02;
      const centerZ = this.leftRest.z - 0.15;

      this.leftArm.position.set(
        this.leftRest.x,
        this.leftRest.y + 0.02,
        this.leftRest.z - 0.15
      );
      this.leftArm.rotation.x = -0.3;
      this.rightArm.position.set(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
        centerZ - 0.02
      );
      this.rightArm.rotation.x = -0.2;
      // Spin the bandage roll model
      if (this.itemModel) {
        this.itemModel.rotation.z = angle * 0.5;
      }
    } else if (p < 0.9) {
      // Phase 4: Right hand pulls away (tearing)
      const t = ease((p - 0.8) / 0.1);
      this.leftArm.position.set(
        this.leftRest.x,
        this.leftRest.y + 0.02 * (1 - t),
        this.leftRest.z - 0.15 + t * 0.05
      );
      this.leftArm.rotation.x = -0.3 + t * 0.1;
      this.rightArm.position.set(
        this.leftRest.x + 0.04 + t * 0.2,
        this.leftRest.y + 0.02 + t * 0.08,
        this.leftRest.z - 0.17 + t * 0.05
      );
      this.rightArm.rotation.x = -0.2 + t * 0.1;
      if (this.itemModel) {
        this.itemModel.rotation.z = Math.PI * 4 * 0.5;
      }
    } else {
      // Phase 5: Both return to rest
      const t = ease((p - 0.9) / 0.1);
      this.leftArm.position.set(
        this.leftRest.x,
        this.leftRest.y + 0.02 * (1 - t),
        this.leftRest.z - 0.1 * (1 - t)
      );
      this.leftArm.rotation.x = -0.2 * (1 - t);
      this.rightArm.position.set(
        this.leftRest.x + 0.24 + t * (this.rightRest.x - this.leftRest.x - 0.24),
        this.rightRest.y + 0.1 * (1 - t),
        this.rightRest.z - 0.12 * (1 - t)
      );
      this.rightArm.rotation.x = -0.1 * (1 - t);
      if (this.itemModel) {
        this.itemModel.rotation.z = Math.PI * 4 * 0.5 * (1 - t);
      }
    }
  }

  update(delta: number) {
    if (!this.isVisible) return;
    this.idleTime += delta;

    // Flashlight toggle animation
    if (this.isTogglingFlashlight) {
      this.toggleProgress += delta / this.toggleDuration;
      if (this.toggleProgress >= 1) {
        this.isTogglingFlashlight = false;
        this.toggleProgress = 0;
      } else {
        const p = this.toggleProgress;
        const flick = Math.sin(p * Math.PI) * 0.05;
        this.rightArm.position.set(this.rightRest.x, this.rightRest.y + flick, this.rightRest.z - flick);
        return;
      }
    }

    // Consumable use animation
    if (this.isUsing) {
      this.useProgress += delta / this.useDuration;
      if (this.useProgress >= 1) {
        this.isUsing = false;
        this.useProgress = 0;
        // Reset item model
        if (this.itemModel) {
          this.itemModel.position.copy(this.itemBasePosition);
          this.itemModel.rotation.x = this.itemBaseRotationX;
          this.itemModel.rotation.z = 0;
        }
      } else {
        const p = this.useProgress;
        if (this.heldItem === 'medkit') {
          this.animateMedkitUse(p);
        } else if (this.heldItem === 'bandage') {
          this.animateBandageUse(p);
        } else {
          // fallback: original simple lift
          const lift = Math.sin(p * Math.PI) * 0.08;
          const fwd = Math.sin(p * Math.PI) * 0.05;
          this.rightArm.position.set(this.rightRest.x, this.rightRest.y + lift, this.rightRest.z - fwd);
          this.leftArm.position.set(this.leftRest.x, this.leftRest.y + lift * 0.8, this.leftRest.z - fwd * 0.8);
          this.rightArm.rotation.x = -lift;
          this.leftArm.rotation.x = -lift * 0.8;
        }
        return;
      }
    }

    // Melee attack animation
    if (this.isMeleeAttacking) {
      this.meleeProgress += delta / this.meleeDuration;
      if (this.meleeProgress >= 1) {
        this.isMeleeAttacking = false;
        this.meleeProgress = 0;
        // Reset item model to base position
        if (this.itemModel && (this.heldItem === 'shiv' || this.heldItem === 'baton')) {
          this.itemModel.position.copy(this.itemBasePosition);
          this.itemModel.rotation.x = this.itemBaseRotationX;
          this.itemModel.rotation.z = 0;
        }
      } else {
        const p = this.meleeProgress;
        const ease = (t: number) => 1 - (1 - t) ** 3;
        if (this.heldItem === 'shiv') {
          // Slashing motion (right to left)
          if (p < 0.25) {
            const t = ease(p / 0.25);
            this.rightArm.position.set(this.rightRest.x + t * 0.08, this.rightRest.y + t * 0.04, this.rightRest.z + t * 0.05);
            this.rightArm.rotation.z = t * 0.3;
          } else if (p < 0.5) {
            const t = ease((p - 0.25) / 0.25);
            this.rightArm.position.set(this.rightRest.x + 0.08 - t * 0.16, this.rightRest.y + 0.04 - t * 0.02, this.rightRest.z + 0.05 - t * 0.2);
            this.rightArm.rotation.z = 0.3 - t * 0.6;
          } else {
            const t = ease((p - 0.5) / 0.5);
            this.rightArm.position.set(this.rightRest.x - 0.08 + t * 0.08, this.rightRest.y + 0.02 * (1 - t), this.rightRest.z - 0.15 + t * 0.15);
            this.rightArm.rotation.z = -0.3 * (1 - t);
          }
        } else {
          // Overhead swing (baton)
          if (p < 0.3) {
            const t = ease(p / 0.3);
            this.rightArm.position.set(this.rightRest.x, this.rightRest.y + t * 0.1, this.rightRest.z + t * 0.1);
            this.rightArm.rotation.x = t * 0.5;
          } else if (p < 0.55) {
            const t = ease((p - 0.3) / 0.25);
            this.rightArm.position.set(this.rightRest.x, this.rightRest.y + 0.1 - t * 0.12, this.rightRest.z + 0.1 - t * 0.3);
            this.rightArm.rotation.x = 0.5 - t * 0.9;
          } else {
            const t = ease((p - 0.55) / 0.45);
            this.rightArm.position.set(this.rightRest.x, this.rightRest.y - 0.02 + t * 0.02, this.rightRest.z - 0.2 + t * 0.2);
            this.rightArm.rotation.x = -0.4 * (1 - t);
          }
        }
        // Left arm stays still during melee
        this.leftArm.position.copy(this.leftRest);
        this.leftArm.rotation.x = 0;

        // Sync item model with right arm during melee
        if (this.itemModel && (this.heldItem === 'shiv' || this.heldItem === 'baton')) {
          const dx = this.rightArm.position.x - this.rightRest.x;
          const dy = this.rightArm.position.y - this.rightRest.y;
          const dz = this.rightArm.position.z - this.rightRest.z;
          this.itemModel.position.set(
            this.itemBasePosition.x + dx,
            this.itemBasePosition.y + dy,
            this.itemBasePosition.z + dz
          );
          this.itemModel.rotation.x = this.itemBaseRotationX + this.rightArm.rotation.x;
          this.itemModel.rotation.z = this.rightArm.rotation.z || 0;
        }

        return;
      }
    }

    if (this.isPunching) {
      this.punchProgress += delta / this.punchDuration;
      if (this.punchProgress >= 1) {
        this.isPunching = false;
        this.punchProgress = 0;
        // Toggle hand for next punch
        this.punchHand = this.punchHand === 'right' ? 'left' : 'right';
      } else {
        const p = this.punchProgress;
        const ease = (t: number) => 1 - (1 - t) ** 3;

        if (this.punchHand === 'right') {
          // Right arm punch animation
          if (p < 0.2) {
            const t = ease(p / 0.2);
            this.rightArm.position.set(this.rightRest.x + t * 0.03, this.rightRest.y + t * 0.04, this.rightRest.z + t * 0.1);
            this.rightArm.rotation.x = t * 0.25;
          } else if (p < 0.45) {
            const t = ease((p - 0.2) / 0.25);
            this.rightArm.position.set(this.rightRest.x, this.rightRest.y + 0.04 * (1 - t), this.rightRest.z + 0.1 - t * 0.3);
            this.rightArm.rotation.x = 0.25 - t * 0.45;
          } else {
            const t = ease((p - 0.45) / 0.55);
            this.rightArm.position.set(this.rightRest.x, this.rightRest.y + 0.015 * (1 - t), this.rightRest.z - 0.2 + t * 0.2);
            this.rightArm.rotation.x = -0.2 * (1 - t);
          }
          // Left arm slight reactive motion
          const lr = Math.sin(p * Math.PI) * 0.015;
          this.leftArm.position.set(this.leftRest.x, this.leftRest.y + lr, this.leftRest.z - lr);
          this.leftArm.rotation.x = 0;
        } else {
          // Left arm punch animation (mirrored)
          if (p < 0.2) {
            const t = ease(p / 0.2);
            this.leftArm.position.set(this.leftRest.x - t * 0.03, this.leftRest.y + t * 0.04, this.leftRest.z + t * 0.1);
            this.leftArm.rotation.x = t * 0.25;
          } else if (p < 0.45) {
            const t = ease((p - 0.2) / 0.25);
            this.leftArm.position.set(this.leftRest.x, this.leftRest.y + 0.04 * (1 - t), this.leftRest.z + 0.1 - t * 0.3);
            this.leftArm.rotation.x = 0.25 - t * 0.45;
          } else {
            const t = ease((p - 0.45) / 0.55);
            this.leftArm.position.set(this.leftRest.x, this.leftRest.y + 0.015 * (1 - t), this.leftRest.z - 0.2 + t * 0.2);
            this.leftArm.rotation.x = -0.2 * (1 - t);
          }
          // Right arm slight reactive motion
          const rr = Math.sin(p * Math.PI) * 0.015;
          this.rightArm.position.set(this.rightRest.x, this.rightRest.y + rr, this.rightRest.z - rr);
          this.rightArm.rotation.x = 0;
        }
        return;
      }
    }

    const breathe = Math.sin(this.idleTime * 1.8) * 0.004;
    const sway = Math.sin(this.idleTime * 1.3) * 0.002;

    if (this.isWalking) {
      this.walkTime += delta * 7;
      const swL = Math.sin(this.walkTime) * 0.035;
      const swR = Math.sin(this.walkTime + Math.PI) * 0.035;
      const bob = Math.abs(Math.sin(this.walkTime)) * 0.012;

      this.leftArm.position.set(this.leftRest.x + sway, this.leftRest.y + bob, this.leftRest.z + swL);
      this.leftArm.rotation.x = swL * 0.6;
      this.rightArm.position.set(this.rightRest.x - sway, this.rightRest.y + bob, this.rightRest.z + swR);
      this.rightArm.rotation.x = swR * 0.6;
    } else {
      const sp = delta * 6;
      for (const [arm, rest] of [[this.leftArm, this.leftRest], [this.rightArm, this.rightRest]] as [THREE.Group, THREE.Vector3][]) {
        arm.position.x += (rest.x + sway - arm.position.x) * sp;
        arm.position.y += (rest.y + breathe - arm.position.y) * sp;
        arm.position.z += (rest.z - arm.position.z) * sp;
        arm.rotation.x += (0 - arm.rotation.x) * sp;
      }
    }

    // Shield grip override: both arms hold the shield handles
    if (this.heldItem === 'shield') {
      const sp = delta * 8;
      const leftTarget = new THREE.Vector3(-0.12, -0.18, -0.35);
      const rightTarget = new THREE.Vector3(0.12, -0.18, -0.35);
      this.leftArm.position.x += (leftTarget.x - this.leftArm.position.x) * sp;
      this.leftArm.position.y += (leftTarget.y - this.leftArm.position.y) * sp;
      this.leftArm.position.z += (leftTarget.z - this.leftArm.position.z) * sp;
      this.leftArm.rotation.x += (-0.15 - this.leftArm.rotation.x) * sp;
      this.rightArm.position.x += (rightTarget.x - this.rightArm.position.x) * sp;
      this.rightArm.position.y += (rightTarget.y - this.rightArm.position.y) * sp;
      this.rightArm.position.z += (rightTarget.z - this.rightArm.position.z) * sp;
      this.rightArm.rotation.x += (-0.15 - this.rightArm.rotation.x) * sp;
    }
  }
}
