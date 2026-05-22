import * as THREE from 'three';
import { Weapon } from './Weapon';
import { Hands } from './Hands';
import { soundSystem } from './SoundSystem';

export interface CombatState {
  hp: number;
  maxHp: number;
  hasWeapon: boolean;
  ammo: number;
  maxAmmo: number;
  isDead: boolean;
  isReloading: boolean;
}

export type CombatTeam = 'guard' | 'prisoner';

export interface CombatOptions {
  spawnDefaultWeapons?: boolean;
  team?: CombatTeam;
}

export class Combat {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private team: CombatTeam;
  private mapColliders: THREE.Box3[] = [];
  
  public weapon: Weapon | null = null;
  public hands: Hands;
  public droppedWeapons: THREE.Group[] = [];
  public droppedItems: THREE.Group[] = [];
  
  private hp = 100;
  private maxHp = 100;
  private isDead = false;
  
  // Состояние атаки
  private isPunching = false;
  private punchCooldown = 0;
  public punchDamage = 20;
  private punchRange = 2;
  private punchCooldownTime = 0.5; // секунды между ударами
  
  private storedWeapon: Weapon | null = null;

  // Item system
  public heldItemType: string = 'none';
  private flashlightOn = false;
  private flashlight: THREE.SpotLight | null = null;
  private isUsingConsumable = false;
  private consumableTimer = 0;
  private consumableDuration = 0;
  private consumableType: string = '';
  private shieldEquipped = false;
  private bandageRegenTimer = 0;
  private bandageRegenActive = false;
  private bandageHealAccumulator = 0;

  // Callbacks
  public onStateChange?: (state: CombatState) => void;
  public onHit?: (damage: number) => void;
  public onDeath?: () => void;
  public onCameraRecoil?: (amount: number) => void;
  public onWeaponPickedUp?: (weaponName: string) => void;
  public onWeaponDropped?: () => void;
  public onItemUsed?: (itemId: string) => void;
  public onItemDropped?: (itemId: string) => void;
  
  private boundMouseDown = this.onMouseDown.bind(this);
  private boundMouseUp = this.onMouseUp.bind(this);
  private boundKeyDown = this.onKeyDown.bind(this);
  private isMouseDown = false;

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    hands: Hands,
    options: CombatOptions = {}
  ) {
    this.camera = camera;
    this.scene = scene;
    this.hands = hands;
    this.team = options.team || 'prisoner';
    
    this.setupInput();

    if (options.spawnDefaultWeapons !== false) {
      // Оружие в оружейной для подбора зеками при бунте
      this.createDroppedWeapon(new THREE.Vector3(9, 1, 0));
      this.createDroppedWeapon(new THREE.Vector3(9, 1, 2));
      this.createDroppedWeapon(new THREE.Vector3(9, 1, 4));
    }
  }

  setMapColliders(colliders: THREE.Box3[]) {
    this.mapColliders = colliders;
  }

  // Выдать оружие игроку (для охраны при спавне)
  giveWeapon() {
    if (this.weapon) return;
    
    this.weapon = new Weapon(this.team);
    this.camera.add(this.weapon.group);
    this.hands.setVisible(false);
    this.notifyStateChange();
    this.onWeaponPickedUp?.(this.weapon.stats.name);
  }

  // Создать подбираемое оружие в указанной позиции
  createDroppedWeaponAt(position: THREE.Vector3) {
    this.createDroppedWeapon(position);
  }

  // Убрать оружие у игрока (при респавне зека)
  removeWeapon() {
    if (!this.weapon) return;
    
    this.camera.remove(this.weapon.group);
    this.weapon = null;
    this.hands.setVisible(true);
    this.notifyStateChange();
  }

  // Put away weapon (hide from camera but keep reference for inventory)
  putAwayWeapon() {
    if (!this.weapon) return;
    this.camera.remove(this.weapon.group);
    this.storedWeapon = this.weapon;
    this.weapon = null;
    this.hands.setVisible(true);
    this.notifyStateChange();
  }

  // Take out stored weapon (re-attach to camera)
  takeOutWeapon() {
    if (!this.storedWeapon) return;
    this.weapon = this.storedWeapon;
    this.storedWeapon = null;
    this.camera.add(this.weapon.group);
    this.hands.setVisible(false);
    this.notifyStateChange();
  }

  private setupInput() {
    document.addEventListener('mousedown', this.boundMouseDown);
    document.addEventListener('mouseup', this.boundMouseUp);
    document.addEventListener('keydown', this.boundKeyDown);
  }

  private onMouseDown(event: MouseEvent) {
    if (document.pointerLockElement === null) return;
    
    if (event.button === 0) { // ЛКМ
      this.isMouseDown = true;
      if (this.weapon) {
        this.shoot();
      } else if (this.heldItemType === 'item_shiv') {
        this.meleeAttack('shiv');
      } else if (this.heldItemType === 'item_baton') {
        this.meleeAttack('baton');
      } else if (this.heldItemType === 'item_flashlight') {
        this.toggleFlashlight();
      } else if (this.heldItemType === 'item_shield') {
        // Shield has no attack action on click
      } else if (this.heldItemType === 'item_medkit') {
        this.useConsumable('item_medkit');
      } else if (this.heldItemType === 'item_bandage') {
        this.useConsumable('item_bandage');
      } else {
        this.punch();
      }
    }
  }

  private onMouseUp(event: MouseEvent) {
    if (event.button === 0) {
      this.isMouseDown = false;
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    if (document.pointerLockElement === null) return;
    
    switch (event.code) {
      case 'KeyE':
        this.tryPickupWeapon();
        break;
      case 'KeyG':
        if (this.weapon || this.storedWeapon) {
          this.dropWeapon();
        } else {
          this.dropItem();
        }
        break;
      case 'KeyR':
        if (this.weapon && !this.weapon.isCurrentlyReloading() && this.weapon.stats.currentAmmo < this.weapon.stats.maxAmmo) {
          this.weapon.reload();
          soundSystem.playReload();
          this.notifyStateChange();
        }
        break;
    }
  }

  private punch() {
    if (this.isPunching || this.punchCooldown > 0 || this.isDead) return;
    
    this.isPunching = true;
    this.punchCooldown = this.punchCooldownTime;
    
    // Звук удара
    soundSystem.playPunch();
    
    // Анимация удара через hands
    this.hands.startPunch();
    
    // Проверка попадания (raycast от камеры)
    setTimeout(() => {
      this.checkPunchHit();
      this.isPunching = false;
    }, 150);
  }

  private checkPunchHit() {
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    raycaster.set(this.camera.position, direction);
    raycaster.far = this.punchRange;
    
    // Здесь будет проверка попадания по другим игрокам
  }

  private shoot() {
    if (!this.weapon || this.isDead) return;
    
    if (this.weapon.fire()) {
      soundSystem.playGunshot();
      
      // Отдача камеры
      this.onCameraRecoil?.(0.03);
      
      const raycaster = new THREE.Raycaster();
      const direction = this.weapon.getAimDirection(this.camera);
      
      raycaster.set(this.camera.position, direction);
      raycaster.far = this.weapon.stats.range;
      
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      
      if (intersects.length > 0) {
        const hit = intersects[0];
        this.createBulletHole(hit.point, hit.face?.normal);
      }
      
      this.notifyStateChange();
    } else if (this.weapon.stats.currentAmmo <= 0 && !this.weapon.isCurrentlyReloading()) {
      // Сухой щелчок
      soundSystem.playDryFire();
    }
  }

  

  private createBulletHole(position: THREE.Vector3, normal?: THREE.Vector3) {
    const geometry = new THREE.CircleGeometry(0.05, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x111111,
      side: THREE.DoubleSide
    });
    const hole = new THREE.Mesh(geometry, material);
    hole.position.copy(position);
    
    if (normal) {
      hole.position.add(normal.multiplyScalar(0.01));
      hole.lookAt(position.clone().add(normal));
    }
    
    this.scene.add(hole);
    
    // Удаляем через 30 секунд
    setTimeout(() => {
      this.scene.remove(hole);
    }, 30000);
  }

  private createDroppedWeapon(position: THREE.Vector3) {
    const weaponGroup = new THREE.Group();
    
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.4,
      metalness: 0.8
    });
    
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.1
    });

    // Упрощённая модель AK на земле
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.8),
      metalMaterial
    );
    weaponGroup.add(body);

    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.3),
      woodMaterial
    );
    stock.position.set(0, 0, 0.4);
    weaponGroup.add(stock);

    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.15, 0.1),
      metalMaterial
    );
    magazine.position.set(0, -0.1, 0);
    weaponGroup.add(magazine);

    weaponGroup.position.copy(position);
    weaponGroup.rotation.z = Math.PI / 2;
    weaponGroup.rotation.y = Math.random() * Math.PI;
    
    // Метаданные для идентификации
    weaponGroup.userData.isWeapon = true;
    weaponGroup.userData.weaponType = 'AK-47';
    weaponGroup.userData.velocityY = 0;
    weaponGroup.userData.velocityX = 0;
    weaponGroup.userData.velocityZ = 0;
    weaponGroup.userData.grounded = false;
    
    this.scene.add(weaponGroup);
    this.droppedWeapons.push(weaponGroup);
  }

  private tryPickupWeapon() {
    if (this.weapon || this.storedWeapon || this.isDead) return;
    
    const playerPos = this.camera.position;
    const pickupRange = 2;
    
    for (let i = 0; i < this.droppedWeapons.length; i++) {
      const droppedWeapon = this.droppedWeapons[i];
      const dx = playerPos.x - droppedWeapon.position.x;
      const dz = playerPos.z - droppedWeapon.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < pickupRange) {
        // Подбираем оружие
        this.scene.remove(droppedWeapon);
        this.droppedWeapons.splice(i, 1);
        
        this.weapon = new Weapon(this.team);
        this.camera.add(this.weapon.group);
        
        // Скрываем руки
        this.hands.setVisible(false);
        
        // Звук подбора
        soundSystem.playPickup();
        
        this.notifyStateChange();
        this.onWeaponPickedUp?.('AK-47');
        return;
      }
    }
  }

  private dropWeapon() {
    if (this.isDead) return;

    // If weapon is holstered, take it out first so we can drop it
    if (!this.weapon && this.storedWeapon) {
      this.weapon = this.storedWeapon;
      this.storedWeapon = null;
    }

    if (!this.weapon) return;
    
    // Убираем оружие из камеры
    this.camera.remove(this.weapon.group);
    
    // Создаём выброшенное оружие перед игроком
    const dropDirection = new THREE.Vector3();
    this.camera.getWorldDirection(dropDirection);
    
    const dropPosition = this.camera.position.clone();
    dropPosition.y = this.camera.position.y - 0.5;
    const horizDir = new THREE.Vector3(dropDirection.x, 0, dropDirection.z).normalize();
    dropPosition.add(horizDir.clone().multiplyScalar(0.5));
    
    // If drop position is inside a collider, pull it back to player position
    const dropBox = new THREE.Box3(
      new THREE.Vector3(dropPosition.x - 0.1, dropPosition.y - 0.1, dropPosition.z - 0.1),
      new THREE.Vector3(dropPosition.x + 0.1, dropPosition.y + 0.1, dropPosition.z + 0.1)
    );
    for (const collider of this.mapColliders) {
      if (dropBox.intersectsBox(collider)) {
        // Drop at player feet instead
        dropPosition.copy(this.camera.position);
        dropPosition.y -= 0.5;
        break;
      }
    }
    
    this.createDroppedWeapon(dropPosition);
    
    // Give the dropped weapon initial throw velocity
    const lastDropped = this.droppedWeapons[this.droppedWeapons.length - 1];
    lastDropped.userData.velocityY = 2;
    lastDropped.userData.velocityX = dropDirection.x * 3;
    lastDropped.userData.velocityZ = dropDirection.z * 3;
    lastDropped.userData.grounded = false;
    
    this.weapon = null;
    
    // Показываем руки
    this.hands.setVisible(true);
    
    // Звук выброса
    soundSystem.playDrop();
    
    this.notifyStateChange();
    this.onWeaponDropped?.();
  }

  private dropItem() {
    if (this.isDead || this.heldItemType === 'none' || this.heldItemType === 'fists') return;
    if (this.isUsingConsumable) return;

    const itemType = this.heldItemType;

    // Calculate drop position (same logic as dropWeapon)
    const dropDirection = new THREE.Vector3();
    this.camera.getWorldDirection(dropDirection);
    const dropPosition = this.camera.position.clone();
    dropPosition.y = this.camera.position.y - 0.5;
    const horizDir = new THREE.Vector3(dropDirection.x, 0, dropDirection.z).normalize();
    dropPosition.add(horizDir.clone().multiplyScalar(0.5));

    // Check colliders
    const dropBox = new THREE.Box3(
      new THREE.Vector3(dropPosition.x - 0.1, dropPosition.y - 0.1, dropPosition.z - 0.1),
      new THREE.Vector3(dropPosition.x + 0.1, dropPosition.y + 0.1, dropPosition.z + 0.1)
    );
    for (const collider of this.mapColliders) {
      if (dropBox.intersectsBox(collider)) {
        dropPosition.copy(this.camera.position);
        dropPosition.y -= 0.5;
        break;
      }
    }

    this.createDroppedItemMesh(dropPosition, itemType);

    // Give throw velocity
    const lastDropped = this.droppedItems[this.droppedItems.length - 1];
    lastDropped.userData.velocityY = 2;
    lastDropped.userData.velocityX = dropDirection.x * 3;
    lastDropped.userData.velocityZ = dropDirection.z * 3;
    lastDropped.userData.grounded = false;

    // Clear equipped item
    this.unequipItem();

    // Play drop sound
    soundSystem.playDrop();

    // Notify inventory
    this.onItemDropped?.(itemType);
  }

  private createDroppedItemMesh(position: THREE.Vector3, itemType: string) {
    const itemGroup = new THREE.Group();

    switch (itemType) {
      case 'item_shiv': {
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.15, metalness: 0.9 });
        const tapeMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.14), bladeMat);
        itemGroup.add(blade);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.08), tapeMat);
        handle.position.set(0, 0, 0.11);
        itemGroup.add(handle);
        break;
      }
      case 'item_baton': {
        const rubber = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.013, 0.4, 8), rubber);
        body.rotation.x = Math.PI / 2;
        itemGroup.add(body);
        break;
      }
      case 'item_shield': {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.3, metalness: 0.85 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, roughness: 0.1, transparent: true, opacity: 0.35 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.02), frameMat);
        itemGroup.add(frame);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.01), glassMat);
        panel.position.set(0, 0.05, 0.01);
        itemGroup.add(panel);
        break;
      }
      case 'item_flashlight': {
        const metalDark = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.3, metalness: 0.85 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8), metalDark);
        body.rotation.x = Math.PI / 2;
        itemGroup.add(body);
        break;
      }
      case 'item_medkit': {
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 });
        const crossMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.12), boxMat);
        itemGroup.add(box);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.005, 0.025), crossMat);
        crossH.position.set(0, 0.051, 0);
        itemGroup.add(crossH);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.005, 0.06), crossMat);
        crossV.position.set(0, 0.051, 0);
        itemGroup.add(crossV);
        break;
      }
      case 'item_bandage': {
        const bandageMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.85 });
        const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), bandageMat);
        roll.rotation.z = Math.PI / 2;
        itemGroup.add(roll);
        break;
      }
    }

    itemGroup.position.copy(position);
    itemGroup.rotation.y = Math.random() * Math.PI;

    itemGroup.userData.isItem = true;
    itemGroup.userData.itemType = itemType;
    itemGroup.userData.velocityY = 0;
    itemGroup.userData.velocityX = 0;
    itemGroup.userData.velocityZ = 0;
    itemGroup.userData.grounded = false;

    this.scene.add(itemGroup);
    this.droppedItems.push(itemGroup);
  }

  public tryPickupItem(camera: THREE.Camera): { picked: boolean; itemType: string } | null {
    const playerPos = camera.position;
    const pickupRange = 2;
    const maxYDistance = 2;

    for (let i = 0; i < this.droppedItems.length; i++) {
      const item = this.droppedItems[i];
      if (Math.abs(playerPos.y - item.position.y) > maxYDistance) continue;
      const dx = playerPos.x - item.position.x;
      const dz = playerPos.z - item.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < pickupRange) {
        this.scene.remove(item);
        this.droppedItems.splice(i, 1);
        soundSystem.playPickup();
        return { picked: true, itemType: item.userData.itemType };
      }
    }
    return null;
  }

  private updateDroppedObjectPhysics(obj: THREE.Group, delta: number) {
    if (obj.userData.grounded) {
      obj.rotation.y += delta * 0.3;
      return;
    }

    // Apply gravity
    obj.userData.velocityY -= 15 * delta;

    // Compute new positions
    const newY = obj.position.y + obj.userData.velocityY * delta;
    const newX = obj.position.x + obj.userData.velocityX * delta;
    const newZ = obj.position.z + obj.userData.velocityZ * delta;

    // Check Y collision against map objects
    if (obj.userData.velocityY < 0) {
      const testBoxY = new THREE.Box3().setFromObject(obj);
      const deltaY = obj.userData.velocityY * delta;
      testBoxY.translate(new THREE.Vector3(0, deltaY, 0));
      let landedOnObject = false;
      for (const collider of this.mapColliders) {
        if (testBoxY.intersectsBox(collider) && collider.max.y <= obj.position.y) {
          obj.position.y = collider.max.y + 0.1;
          obj.userData.velocityY = 0;
          obj.userData.velocityX = 0;
          obj.userData.velocityZ = 0;
          obj.userData.grounded = true;
          landedOnObject = true;
          break;
        }
      }
      if (landedOnObject) return;
    }

    // Floor collision
    if (newY <= 0.1) {
      obj.position.y = 0.1;
      obj.userData.velocityY = 0;
      obj.userData.velocityX = 0;
      obj.userData.velocityZ = 0;
      obj.userData.grounded = true;
    } else {
      obj.position.y = newY;
    }

    // Horizontal movement with map collision check
    if (!obj.userData.grounded) {
      // Check X collision
      const testBoxX = new THREE.Box3().setFromObject(obj);
      testBoxX.translate(new THREE.Vector3(obj.userData.velocityX * delta, 0, 0));
      let hitX = false;
      for (const collider of this.mapColliders) {
        if (testBoxX.intersectsBox(collider)) { hitX = true; break; }
      }
      if (!hitX) obj.position.x = newX;
      else obj.userData.velocityX = 0;

      // Check Z collision
      const testBoxZ = new THREE.Box3().setFromObject(obj);
      testBoxZ.translate(new THREE.Vector3(0, 0, obj.userData.velocityZ * delta));
      let hitZ = false;
      for (const collider of this.mapColliders) {
        if (testBoxZ.intersectsBox(collider)) { hitZ = true; break; }
      }
      if (!hitZ) obj.position.z = newZ;
      else obj.userData.velocityZ = 0;
    }

    // Apply friction to horizontal velocity
    obj.userData.velocityX *= (1 - 3 * delta);
    obj.userData.velocityZ *= (1 - 3 * delta);

    // Slow rotation while in air
    obj.rotation.y += delta * 2;
  }

  private meleeAttack(type: 'shiv' | 'baton') {
    if (this.isPunching || this.punchCooldown > 0 || this.isDead || this.isUsingConsumable) return;

    this.isPunching = true;
    this.punchCooldown = this.punchCooldownTime;

    if (type === 'shiv') {
      soundSystem.playShivAttack();
    } else {
      soundSystem.playBatonAttack();
    }

    this.hands.startMeleeAttack();

    setTimeout(() => {
      this.checkPunchHit();
      this.isPunching = false;
    }, 150);
  }

  equipItem(itemType: string) {
    // If weapon is active, put it away first
    if (this.weapon) {
      this.putAwayWeapon();
    }

    this.heldItemType = itemType;
    this.hands.setHeldItem(itemType);
    this.shieldEquipped = itemType === 'item_shield';

    // Set melee damage multipliers
    if (itemType === 'item_shiv') {
      this.punchDamage = 40; // x2 of base 20
    } else if (itemType === 'item_baton') {
      this.punchDamage = 30; // x1.5 of base 20
    } else {
      this.punchDamage = 20; // reset to base
    }

    // If flashlight was on and we're switching away, remove the light
    if (itemType !== 'item_flashlight' && this.flashlight) {
      this.camera.remove(this.flashlight);
      this.camera.remove(this.flashlight.target);
      this.flashlight = null;
      this.flashlightOn = false;
    }
  }

  unequipItem() {
    if (this.flashlight) {
      this.camera.remove(this.flashlight);
      this.camera.remove(this.flashlight.target);
      this.flashlight = null;
      this.flashlightOn = false;
    }
    this.heldItemType = 'none';
    this.shieldEquipped = false;
    this.punchDamage = 20; // reset to base
    this.hands.setHeldItem('none');
  }

  private toggleFlashlight() {
    if (this.isDead) return;
    this.flashlightOn = !this.flashlightOn;
    soundSystem.playFlashlightToggle();
    this.hands.startFlashlightToggle();

    if (this.flashlightOn) {
      this.flashlight = new THREE.SpotLight(0xffffff, 2, 30, Math.PI / 6, 0.3, 1);
      this.flashlight.position.set(0, 0, -0.5);
      this.flashlight.target.position.set(0, 0, -5);
      this.camera.add(this.flashlight);
      this.camera.add(this.flashlight.target);
    } else {
      if (this.flashlight) {
        this.camera.remove(this.flashlight);
        this.camera.remove(this.flashlight.target);
        this.flashlight = null;
      }
    }
  }

  useConsumable(itemType: string) {
    if (this.isUsingConsumable || this.isDead) return;

    this.isUsingConsumable = true;
    this.consumableType = itemType;

    if (itemType === 'item_medkit') {
      this.consumableDuration = 2;
      this.hands.startUseAnimation('medkit');
    } else if (itemType === 'item_bandage') {
      this.consumableDuration = 3;
      this.hands.startUseAnimation('bandage');
    }
    this.consumableTimer = 0;
  }

  takeDamage(damage: number) {
    if (this.isDead) return;

    // Shield blocks all damage while equipped
    if (this.shieldEquipped) {
      soundSystem.playShieldBlock();
      return;
    }
    
    this.hp = Math.max(0, this.hp - damage);
    
    if (this.onHit) this.onHit(damage);
    
    if (this.hp <= 0) {
      this.die();
    }
    
    this.notifyStateChange();
  }

  private die() {
    this.isDead = true;
    if (this.onDeath) this.onDeath();

    // Clean up equipped item (flashlight, shield, etc.)
    this.unequipItem();
    
    // Выбрасываем оружие при смерти (check storedWeapon too)
    if (this.weapon || this.storedWeapon) {
      this.dropWeapon();
    }
  }

  heal(amount: number) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.notifyStateChange();
  }

  respawn() {
    this.hp = this.maxHp;
    this.isDead = false;
    this.heldItemType = 'none';
    this.shieldEquipped = false;
    this.bandageRegenActive = false;
    this.bandageHealAccumulator = 0;
    this.isUsingConsumable = false;
    this.notifyStateChange();
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  getState(): CombatState {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      hasWeapon: this.weapon !== null,
      ammo: this.weapon?.stats.currentAmmo ?? 0,
      maxAmmo: this.weapon?.stats.maxAmmo ?? 0,
      isDead: this.isDead,
      isReloading: this.weapon?.isCurrentlyReloading() ?? false
    };
  }

  update(delta: number) {
    // Обновляем кулдаун удара
    if (this.punchCooldown > 0) {
      this.punchCooldown -= delta;
    }

    // Consumable use timer
    if (this.isUsingConsumable) {
      // Cancel consumable if player died during use
      if (this.isDead) {
        this.isUsingConsumable = false;
        this.consumableType = '';
      } else {
        this.consumableTimer += delta;
        if (this.consumableTimer >= this.consumableDuration) {
          this.isUsingConsumable = false;
          if (this.consumableType === 'item_medkit') {
            this.heal(50);
            soundSystem.playHeal();
            this.onItemUsed?.(this.consumableType);
          } else if (this.consumableType === 'item_bandage') {
            soundSystem.playBandageWrap();
            this.bandageRegenActive = true;
            this.bandageRegenTimer = 0;
            this.bandageHealAccumulator = 0;
            this.onItemUsed?.(this.consumableType);
          }
          this.consumableType = '';
        }
      }
    }

    // Bandage regen over time (+3 HP/sec for ~7 seconds = +20 total)
    if (this.bandageRegenActive) {
      this.bandageRegenTimer += delta;
      if (this.bandageRegenTimer < 7) {
        this.bandageHealAccumulator += 3 * delta;
        while (this.bandageHealAccumulator >= 1.0) {
          this.heal(1);
          this.bandageHealAccumulator -= 1.0;
        }
      } else {
        this.bandageRegenActive = false;
        this.bandageHealAccumulator = 0;
      }
    }

    // Automatic fire while holding mouse button
    if (this.isMouseDown && this.weapon && document.pointerLockElement !== null) {
      this.shoot();
    }
    
    // Обновляем оружие
    if (this.weapon) {
      const wasReloading = this.weapon.isCurrentlyReloading();
      this.weapon.update(delta);
      const isReloading = this.weapon.isCurrentlyReloading();
      // Обновляем UI при смене состояния перезарядки
      if (wasReloading !== isReloading || (wasReloading && isReloading)) {
        this.notifyStateChange();
      }
    }
    
    // Вращение выброшенного оружия (для визуала)
    for (const dropped of this.droppedWeapons) {
      this.updateDroppedObjectPhysics(dropped, delta);
    }

    // Update dropped items physics
    for (const item of this.droppedItems) {
      this.updateDroppedObjectPhysics(item, delta);
    }
  }

  dispose() {
    document.removeEventListener('mousedown', this.boundMouseDown);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('keydown', this.boundKeyDown);
  }
}
