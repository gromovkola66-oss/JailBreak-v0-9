import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FirstPersonController } from '../game/FirstPersonController';
import { Hands } from '../game/Hands';
import { Combat, CombatState } from '../game/Combat';
import { CameraSystem, CameraSystemState } from '../game/CameraSystem';
import { InventorySystem, InventoryState } from '../game/InventorySystem';
import { DoorSystem } from '../game/DoorSystem';
import { GarageDoorSystem } from '../game/GarageDoorSystem';
import { MapData } from './MapEditor';
import { getObjectById } from './EditorObjects';
import { soundSystem } from '../game/SoundSystem';
import { ITEM_DEFS } from '../game/ItemDefs';
import { WalletSystem, WalletState } from '../game/economy/WalletSystem';
import { RentalDoorSystem, RentalDoor } from '../game/RentalDoorSystem';
import {
  applyToRenderer,
  configureSunShadow,
  getRendererOptions,
  isFogEnabled,
  pruneShadowCasters,
} from '../game/QualitySettings';
import { DayNightCycle } from '../game/DayNightCycle';

export class PlaytestMode {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private controller: FirstPersonController;
  private hands: Hands;
  private combat: Combat;
  private cameraSystem: CameraSystem;
  private inventory: InventorySystem;
  private wallet: WalletSystem;
  private doorSystem: DoorSystem;
  private garageDoorSystem: GarageDoorSystem;
  private rentalDoorSystem: RentalDoorSystem;
  private team: 'guard' | 'prisoner';
  private colliders: THREE.Box3[] = [];
  private doorColliders: Map<string, THREE.Box3[]> = new Map();
  private garageDoorColliders: Map<string, THREE.Box3[]> = new Map();
  private rentalDoorColliders: Map<string, THREE.Box3[]> = new Map();
  private inTerminalMode = false;

  private isRunning = false;
  private prevTime = 0;
  private footstepTimer = 0;
  private readonly FOOTSTEP_INTERVAL = 0.4;

  private raycaster = new THREE.Raycaster();
  private boundOnResize = this.onResize.bind(this);
  private boundAnimate = this.animate.bind(this);
  private lastNearbyRentalDoorId: string | null = null;

  // Dropped items (non-weapon pickables)
  private droppedItems: { mesh: THREE.Group; itemType: string; position: THREE.Vector3 }[] = [];

  private dayNightCycle: DayNightCycle;
  private skyMesh: THREE.Mesh;
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;

  public onStatsUpdate?: (fps: number, pos: THREE.Vector3) => void;
  public onCombatUpdate?: (state: CombatState) => void;
  public onCameraSystemUpdate?: (state: CameraSystemState) => void;
  public onInventoryUpdate?: (state: InventoryState) => void;
  public onDoorStateUpdate?: (cellsOpen: boolean) => void;
  public onGarageDoorLockUpdate?: (state: { state: 'unlocked' | 'locked' | 'temp_locked'; remainingSeconds: number | null }) => void;
  public onDoorLocked?: () => void;
  public onWalletUpdate?: (state: WalletState) => void;
  public onShowRentalMenu?: (door: RentalDoor) => void;
  public onRentalExpired?: (door: RentalDoor) => void;
  public onRentalDoorNearby?: (info: { cellLabel: string; ownerId: string | null; expiresAt: number | null } | null) => void;

  private frameCount = 0;
  private fpsTime = 0;
  private currentFps = 0;

  constructor(container: HTMLElement, mapData: MapData, team: 'guard' | 'prisoner') {
    // Сцена
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(800, 32, 32);
    const skyUniforms = {
      uTime: { value: 0 } as THREE.IUniform<number>,
      uSunPosition: { value: new THREE.Vector3(0, 1, 0) } as THREE.IUniform<THREE.Vector3>,
      uElapsedSeconds: { value: 0 } as THREE.IUniform<number>,
    };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uElapsedSeconds;
        uniform vec3 uSunPosition;
        varying vec3 vWorldPosition;

        // Simple hash for stars/clouds
        float hash(vec3 p) {
          p = fract(p * vec3(443.897, 441.423, 437.195));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }

        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float n = mix(
            mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
            f.z);
          return n;
        }

        float fbm(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float h = dir.y;

          // Sun elevation factor: >0 day, <0 night
          float sunElev = uSunPosition.y;

          // Day colors
          vec3 dayTop = vec3(0.2, 0.5, 0.95);
          vec3 dayHorizon = vec3(0.7, 0.85, 1.0);

          // Night colors
          vec3 nightTop = vec3(0.02, 0.02, 0.12);
          vec3 nightHorizon = vec3(0.05, 0.05, 0.2);

          // Dawn/dusk colors
          vec3 dawnColor = vec3(1.0, 0.5, 0.2);
          vec3 duskPurple = vec3(0.6, 0.2, 0.5);

          // Sky gradient base
          float dayFactor = smoothstep(-0.1, 0.3, sunElev);
          vec3 topColor = mix(nightTop, dayTop, dayFactor);
          vec3 horizonColor = mix(nightHorizon, dayHorizon, dayFactor);

          vec3 sky;
          if (h > 0.0) {
            sky = mix(horizonColor, topColor, pow(h, 0.6));
          } else {
            sky = horizonColor;
          }

          // Dawn/dusk glow near horizon when sun is near horizon
          float horizonGlow = smoothstep(0.3, 0.0, abs(sunElev)) * smoothstep(-0.3, 0.1, h) * smoothstep(0.4, 0.0, h);
          vec3 glowColor = mix(duskPurple, dawnColor, smoothstep(-0.1, 0.1, sunElev));
          sky = mix(sky, glowColor, horizonGlow * 0.7);

          // Sun disc
          float sunDist = length(dir - normalize(uSunPosition));
          float sunDisc = smoothstep(0.04, 0.02, sunDist);
          float sunGlow = smoothstep(0.4, 0.0, sunDist) * 0.3;
          vec3 sunColor = vec3(1.0, 0.95, 0.8);
          sky += sunColor * (sunDisc + sunGlow) * step(0.0, sunElev);

          // Moon (opposite side from sun)
          vec3 moonDir = -normalize(uSunPosition);
          moonDir.y = abs(moonDir.y); // keep moon above horizon at night
          float moonDist = length(dir - moonDir);
          float moonDisc = smoothstep(0.035, 0.025, moonDist);
          float moonGlow = smoothstep(0.2, 0.0, moonDist) * 0.15;
          float nightFactor = smoothstep(0.1, -0.1, sunElev);
          sky += vec3(0.8, 0.85, 1.0) * (moonDisc + moonGlow) * nightFactor;

          // Stars
          float starField = 0.0;
          if (h > 0.0) {
            vec3 starCoord = dir * 200.0;
            float starHash = hash(floor(starCoord));
            float starBright = step(0.985, starHash);
            float twinkle = sin(uTime * 100.0 + starHash * 6.28) * 0.3 + 0.7;
            starField = starBright * twinkle * nightFactor * smoothstep(0.0, 0.2, h);
          }
          sky += vec3(1.0) * starField;

          // Clouds (layered noise, visible in day, faint at night)
          if (h > 0.0) {
            vec3 cloudCoord = dir / max(h, 0.01) * 3.0;
            float cloud = fbm(cloudCoord + vec3(uElapsedSeconds * 0.02, 0.0, uElapsedSeconds * 0.005));
            cloud = smoothstep(0.4, 0.7, cloud);
            float cloudAlpha = cloud * 0.6 * smoothstep(0.0, 0.15, h);
            vec3 cloudColor = mix(vec3(0.1, 0.1, 0.2), vec3(1.0), dayFactor);
            sky = mix(sky, cloudColor, cloudAlpha);
          }

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);
    if (isFogEnabled()) {
      this.scene.fog = new THREE.Fog(0xc8e0f0, 20, 200);
    }

    // Рендерер
    this.renderer = new THREE.WebGLRenderer(getRendererOptions());
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    applyToRenderer(this.renderer);
    container.appendChild(this.renderer.domElement);

    // Камера
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Контроллер
    this.controller = new FirstPersonController(camera);

    // Руки
    this.hands = new Hands(team);
    camera.add(this.hands.group);
    this.scene.add(camera);

    // Боевая система
    this.combat = new Combat(camera, this.scene, this.hands, {
      spawnDefaultWeapons: false,
      team,
    });
    this.combat.onStateChange = (state) => {
      this.onCombatUpdate?.(state);
    };
    this.combat.onWeaponPickedUp = () => {
      this.inventory.addItem({ id: 'weapon_ak47', name: 'AK-47', icon: '\u{1F52B}', type: 'weapon' });
    };
    this.combat.onWeaponDropped = () => {
      this.inventory.removeItem('weapon_ak47');
    };

    // Handle consumed items removal
    this.combat.onItemUsed = (itemId: string) => {
      this.inventory.removeItem(itemId);
      this.combat.unequipItem();
    };

    // Handle dropped items removal from inventory
    this.combat.onItemDropped = (itemId: string) => {
      this.inventory.removeItem(itemId);
    };

    // Inventory system
    this.inventory = new InventorySystem();
    this.inventory.onStateChange = (state) => {
      this.onInventoryUpdate?.(state);
    };
    this.inventory.onOpen = () => {
      document.exitPointerLock();
    };
    this.inventory.onClose = () => {
      document.body.requestPointerLock();
    };
    this.inventory.onEquip = (item) => {
      if (item && item.type === 'weapon') {
        this.combat.unequipItem();
        this.combat.takeOutWeapon();
      } else if (item && (item.type === 'melee' || item.type === 'tool' || item.type === 'consumable')) {
        this.combat.putAwayWeapon();
        this.combat.equipItem(item.id);
      } else {
        this.combat.putAwayWeapon();
        this.combat.unequipItem();
      }
    };

    // Wallet system
    this.wallet = new WalletSystem();
    this.wallet.onStateChange = (state) => {
      this.onWalletUpdate?.(state);
    };

    // Система камер наблюдения
    this.cameraSystem = new CameraSystem(this.scene, this.renderer);
    this.cameraSystem.onStateChange = (state) => {
      this.inTerminalMode = state.inTerminalMode;
      if (state.inTerminalMode) {
        this.controller.setPointerLockEnabled(false);
      } else {
        this.controller.setPointerLockEnabled(true);
      }
      this.onCameraSystemUpdate?.(state);
    };

    // Система дверей
    this.doorSystem = new DoorSystem(this.scene);
    this.team = team;
    this.doorSystem.onDoorStateChange = (doorId, isOpen) => {
      const boxes = this.doorColliders.get(doorId);
      if (!boxes) return;
      if (isOpen) {
        for (const box of boxes) {
          const idx = this.colliders.indexOf(box);
          if (idx >= 0) this.colliders.splice(idx, 1);
        }
      } else {
        for (const box of boxes) {
          if (!this.colliders.includes(box)) {
            this.colliders.push(box);
          }
        }
      }
      this.controller.setColliders(this.colliders);
      this.onDoorStateUpdate?.(this.doorSystem.getDoors().every(d => d.isOpen));
    };

    // Система гаражных дверей
    this.garageDoorSystem = new GarageDoorSystem();
    this.garageDoorSystem.onDoorStateChange = (doorId, isOpen) => {
      const boxes = this.garageDoorColliders.get(doorId);
      if (!boxes) return;
      if (isOpen) {
        for (const box of boxes) {
          const idx = this.colliders.indexOf(box);
          if (idx >= 0) this.colliders.splice(idx, 1);
        }
      } else {
        for (const box of boxes) {
          if (!this.colliders.includes(box)) {
            this.colliders.push(box);
          }
        }
      }
      this.controller.setColliders(this.colliders);
    };
    this.garageDoorSystem.onAutoClose = (_doorId) => {
      soundSystem.playGarageDoor(false);
    };
    this.garageDoorSystem.onLockStateChange = (state) => {
      this.onGarageDoorLockUpdate?.(state);
    };

    // Система арендных дверей
    this.rentalDoorSystem = new RentalDoorSystem();
    this.rentalDoorSystem.onDoorStateChange = (doorId, isOpen) => {
      const boxes = this.rentalDoorColliders.get(doorId);
      if (!boxes) return;
      if (isOpen) {
        for (const box of boxes) {
          const idx = this.colliders.indexOf(box);
          if (idx >= 0) this.colliders.splice(idx, 1);
        }
      } else {
        for (const box of boxes) {
          if (!this.colliders.includes(box)) {
            this.colliders.push(box);
          }
        }
      }
      this.controller.setColliders(this.colliders);
      soundSystem.playDoor(isOpen);
    };
    this.rentalDoorSystem.onRentalExpired = (door) => {
      this.onRentalExpired?.(door);
    };

    // Освещение
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambientLight);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.55);
    this.sunLight.position.set(20, 30, 10);
    configureSunShadow(this.sunLight, 42);
    this.scene.add(this.sunLight);

    // Day/Night cycle
    this.dayNightCycle = new DayNightCycle(this.ambientLight, this.sunLight, skyUniforms, this.scene.fog as THREE.Fog | null);

    // Загружаем карту
    this.loadMap(mapData, team);

    // Если охрана — даём оружие
    if (team === 'guard') {
      this.combat.giveWeapon();
      // Sync inventory equipped slot to weapon
      const state = this.inventory.getState();
      const weaponIdx = state.slots.findIndex(s => s?.type === 'weapon');
      if (weaponIdx >= 0) {
        this.inventory.equipSlot(weaponIdx);
      }
    }

    // Коллизии
    this.controller.setColliders(this.colliders);
    this.combat.setMapColliders(this.colliders);

    // E key for terminal interaction
    document.addEventListener('keydown', this.onKeyDown);

    // Ресайз
    window.addEventListener('resize', this.boundOnResize);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'KeyQ') {
      if (document.pointerLockElement !== null || this.inventory.getIsOpen()) {
        this.inventory.toggle();
      }
      return;
    }
    if (event.code === 'KeyE') {
      // Terminal exit does NOT require pointer lock (pointer lock is released while in terminal mode)
      if (this.inTerminalMode) {
        this.cameraSystem.exitTerminalMode();
        return;
      }
      // All other E interactions require pointer lock
      if (document.pointerLockElement === null) return;
      if (this.cameraSystem.terminalHighlighted) {
        const playerPos = this.controller.camera.position;
        this.cameraSystem.enterTerminalMode(playerPos);
        return;
      }
      // Item pickup
      if (this.tryPickupItem()) return;
      // Door interaction (guards only)
      if (this.team === 'guard') {
        const { canInteract, door } = this.doorSystem.canInteract(this.controller.camera.position);
        if (canInteract && door) {
          this.doorSystem.toggleDoor(door.id);
          return;
        }
      }
      // Garage door interaction (any team)
      {
        const { canInteract, door: gDoor } = this.garageDoorSystem.canInteract(this.controller.camera.position);
        if (canInteract && gDoor) {
          const wasOpen = gDoor.isOpen;
          this.garageDoorSystem.toggleDoor(gDoor.id, this.team === 'guard');
          if (gDoor.isOpen === wasOpen) {
            // Door state did not change - interaction was denied (locked)
            this.onDoorLocked?.();
          } else {
            soundSystem.playGarageDoor(gDoor.isOpen);
          }
        }
      }
      // Rental door interaction
      {
        const { canInteract: canRental, door: rentalDoor } = this.rentalDoorSystem.canInteract(this.controller.camera.position);
        if (canRental && rentalDoor) {
          if (this.team === 'guard') {
            this.rentalDoorSystem.toggleDoor(rentalDoor.id, 'guard');
          } else {
            const result = this.rentalDoorSystem.interact(this.controller.camera.position, this.team);
            if (result.type === 'toggle') {
              this.rentalDoorSystem.toggleDoor(rentalDoor.id, 'prisoner');
            } else if (result.type === 'menu') {
              this.onShowRentalMenu?.(rentalDoor);
              document.exitPointerLock();
            }
          }
          return;
        }
      }
    }
  };

  private tryPickupItem(): boolean {
    const playerPos = this.controller.camera.position;
    const pickupRange = 2;

    // Check physics-dropped items from combat system first
    const pickedUp = this.combat.tryPickupItem(this.controller.camera);
    if (pickedUp) {
      const def = ITEM_DEFS[pickedUp.itemType];
      if (def) {
        this.inventory.addItem(def);
      }
      return true;
    }

    // Check map-placed items
    for (let i = 0; i < this.droppedItems.length; i++) {
      const item = this.droppedItems[i];
      if (Math.abs(playerPos.y - item.position.y) > 2) continue;
      const dx = playerPos.x - item.position.x;
      const dz = playerPos.z - item.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < pickupRange) {
        // Money bag - special handling
        if (item.itemType === 'money_bag') {
          const added = this.wallet.addMoney(1000);
          if (added) {
            this.scene.remove(item.mesh);
            this.droppedItems.splice(i, 1);
            soundSystem.playPickup();
          }
          return true;
        }

        const def = ITEM_DEFS[item.itemType];
        if (!def) continue;

        const added = this.inventory.addItem(def);
        if (added) {
          this.scene.remove(item.mesh);
          this.droppedItems.splice(i, 1);
          soundSystem.playPickup();
        }
        return true;
      }
    }

    return false;
  }

  private loadMap(mapData: MapData, team: 'guard' | 'prisoner') {
    let spawnPoint: THREE.Vector3 | null = null;
    const spawnType = team === 'guard' ? 'spawn_guard' : 'spawn_prisoner';
    let cameraCount = 0;
    let doorCellIndex = 0;

    for (const objData of mapData.objects) {
      const objType = getObjectById(objData.type);
      if (!objType) continue;

      // Скрипты — не рендерим визуально, но обрабатываем логику
      if (objData.type === 'spawn_prisoner' || objData.type === 'spawn_guard') {
        if (objData.type === spawnType && !spawnPoint) {
          spawnPoint = new THREE.Vector3(objData.position.x, objData.position.y + 1.7, objData.position.z);
        }
        continue;
      }

      // Оружие — создаём подбираемое
      if (objData.type === 'weapon_ak47') {
        this.combat.createDroppedWeaponAt(
          new THREE.Vector3(objData.position.x, objData.position.y + 0.5, objData.position.z)
        );
        continue;
      }

      // Money bag pickup
      if (objData.type === 'money_bag') {
        const itemPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const obj = objType.create();
        obj.position.copy(itemPos);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation);
        obj.userData.__interactive = true;
        this.scene.add(obj);
        this.droppedItems.push({ mesh: obj, itemType: 'money_bag', position: itemPos });
        continue;
      }

      // Item pickups (melee, tools, consumables)
      if (objData.type === 'item_shiv' || objData.type === 'item_baton' ||
          objData.type === 'item_shield' || objData.type === 'item_flashlight' ||
          objData.type === 'item_medkit' || objData.type === 'item_bandage') {
        const itemPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const obj = objType.create();
        obj.position.copy(itemPos);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation);
        obj.userData.__interactive = true;
        this.scene.add(obj);
        this.droppedItems.push({ mesh: obj, itemType: objData.type, position: itemPos });
        continue;
      }

      // Terminal - register with camera system
      if (objData.type === 'terminal') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);
        this.addColliders(obj);
        const terminalPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        this.cameraSystem.registerTerminal(
          `terminal_${objData.id}`,
          obj,
          terminalPos,
          objData.groupId ?? 1
        );
        continue;
      }

      // Camera - register with camera system
      if (objData.type === 'camera') {
        cameraCount++;
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation);
        this.scene.add(obj);
        // Offset the viewpoint forward along the camera's facing direction
        // so the view clears the camera model geometry.
        const rotRad = THREE.MathUtils.degToRad(objData.rotation);
        const forwardOffset = 0.4;
        const camPos = new THREE.Vector3(
          objData.position.x + Math.sin(rotRad) * forwardOffset,
          objData.position.y + 3.4,
          objData.position.z + Math.cos(rotRad) * forwardOffset
        );
        // Camera looks forward from the model's front face. The model's visual "lens"
        // direction matches its local +Z, but Three.js cameras look along -Z,
        // so we add PI to flip the view direction to match the model's facing.
        // X rotation is 0 (level) since users place cameras straight.
        const camRot = new THREE.Euler(0, rotRad + Math.PI, 0);
        this.cameraSystem.registerCamera(
          `cam_${objData.id}`,
          camPos,
          camRot,
          objData.groupId ?? 1,
          objData.label || `Камера ${cameraCount}`
        );
        continue;
      }

      // Решётка-дверь — регистрируем в системе дверей
      if (objData.type === 'bars_door' || objData.type === 'bars_door_guard') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);

        const prevLen = this.colliders.length;
        this.addColliders(obj);
        const doorBoxes = this.colliders.slice(prevLen);

        const rotRad = THREE.MathUtils.degToRad(objData.rotation);
        const pos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const door = this.doorSystem.registerDoor(doorCellIndex, obj, pos, rotRad);
        this.doorColliders.set(door.id, doorBoxes);
        doorCellIndex++;
        continue;
      }

      // Решётка-аренда — регистрируем в системе арендных дверей
      if (objData.type === 'bars_door_rental') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);

        const prevLen = this.colliders.length;
        this.addColliders(obj);
        const doorBoxes = this.colliders.slice(prevLen);

        const rotRad = THREE.MathUtils.degToRad(objData.rotation);
        const doorPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const rentalDoorId = `rental_door_${objData.id}`;
        const rDoor = this.rentalDoorSystem.registerDoor(rentalDoorId, objData.label || '\u041a\u0430\u043c\u0435\u0440\u0430', obj, doorPos, rotRad);
        this.rentalDoorColliders.set(rDoor.id, doorBoxes);
        continue;
      }

      // Гаражные двери — регистрируем в системе гаражных дверей
      if (objData.type === 'garage_door_large' || objData.type === 'garage_door_medium') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);

        const prevLen = this.colliders.length;
        this.addColliders(obj);
        const garageDoorBoxes = this.colliders.slice(prevLen);

        const doorHeight = obj.userData.doorHeight as number;
        const doorPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const garageDoorId = `garage_door_${objData.id}`;
        const gDoor = this.garageDoorSystem.registerDoor(garageDoorId, obj, doorPos, doorHeight);
        this.garageDoorColliders.set(gDoor.id, garageDoorBoxes);
        continue;
      }

      // Обычные объекты — рендерим и делаем коллизии
      const obj = objType.create();
      obj.position.set(objData.position.x, objData.position.y, objData.position.z);
      obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation);
      this.scene.add(obj);
      obj.updateMatrixWorld(true);

      // Коллизии — берём bounding box каждого меша
      this.addColliders(obj);
    }

    // --- Static mesh merging ---
    // Collect interactive objects that should NOT be merged
    const interactiveObjects = new Set<THREE.Object3D>();
    for (const item of this.droppedItems) {
      interactiveObjects.add(item.mesh);
    }
    // Door system, terminal, camera objects are already handled via 'continue' above
    // so they were added to scene individually. We need to mark them too.
    // We'll collect all objects added via special-case handling by tracking them.
    // Since doors, terminals, cameras were added and continued, we gather them:
    this.scene.traverse((child) => {
      if (child.userData && child.userData.__interactive) {
        interactiveObjects.add(child);
      }
    });

    // Group meshes by material for merging
    const materialGroups = new Map<THREE.Material, THREE.Mesh[]>();
    const objectsToRemove: THREE.Object3D[] = [];

    this.scene.updateMatrixWorld(true);

    for (const child of [...this.scene.children]) {
      // Skip non-mesh containers we want to keep
      if (child instanceof THREE.Light) continue;
      if (child instanceof THREE.Camera) continue;
      // Skip sky dome (ShaderMaterial on a sphere)
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) continue;
      // Skip interactive objects
      if (interactiveObjects.has(child)) continue;
      // Skip if it's a descendant check (droppedItems are Groups at top level)
      let isInteractive = false;
      for (const io of interactiveObjects) {
        if (io === child) { isInteractive = true; break; }
      }
      if (isInteractive) continue;

      // Only process Groups (placed objects)
      if (!(child instanceof THREE.Group)) continue;

      // Collect all visible meshes from this group
      let hasVisibleMesh = false;
      child.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        if (!node.visible) return; // skip collision boxes
        hasVisibleMesh = true;
        const mat = node.material as THREE.Material;
        if (!materialGroups.has(mat)) {
          materialGroups.set(mat, []);
        }
        materialGroups.get(mat)!.push(node);
      });

      if (hasVisibleMesh) {
        objectsToRemove.push(child);
      }
    }

    // Merge each material group
    for (const [material, meshes] of materialGroups) {
      if (meshes.length === 0) continue;
      const geometries: THREE.BufferGeometry[] = [];
      for (const mesh of meshes) {
        const geo = mesh.geometry.clone();
        geo.applyMatrix4(mesh.matrixWorld);
        geometries.push(geo);
      }
      const merged = mergeGeometries(geometries, false);
      if (!merged) {
        for (const geo of geometries) geo.dispose();
        continue;
      }
      const mergedMesh = new THREE.Mesh(merged, material);
      mergedMesh.castShadow = true;
      mergedMesh.receiveShadow = true;
      this.scene.add(mergedMesh);
      // Dispose cloned geometries
      for (const geo of geometries) {
        geo.dispose();
      }
    }

    // Remove original individual objects (but first extract any lights)
    const extractedLights: THREE.Light[] = [];
    for (const obj of objectsToRemove) {
      obj.traverse((node) => {
        if (node instanceof THREE.Light) {
          const light = node.clone();
          // Apply world position to the cloned light
          const worldPos = new THREE.Vector3();
          node.getWorldPosition(worldPos);
          light.position.copy(worldPos);
          // Disable shadows for performance (many placed lights kill FPS)
          light.castShadow = false;
          // Increase intensity so lights actually illuminate rooms
          if (light instanceof THREE.PointLight) {
            light.intensity *= 3;
            light.distance = Math.max(light.distance, 14);
          } else if (light instanceof THREE.SpotLight) {
            light.intensity *= 2.5;
          }
          extractedLights.push(light);
        }
      });
      this.scene.remove(obj);
    }
    // Add extracted lights back to scene
    for (const light of extractedLights) {
      this.scene.add(light);
    }

    // Спавн
    if (spawnPoint) {
      this.controller.camera.position.copy(spawnPoint);
      // Adjust spawn height based on floor colliders below spawn point
      let bestFloorY = 0;
      for (const collider of this.colliders) {
        if (spawnPoint.x + 0.3 > collider.min.x &&
            spawnPoint.x - 0.3 < collider.max.x &&
            spawnPoint.z + 0.3 > collider.min.z &&
            spawnPoint.z - 0.3 < collider.max.z &&
            collider.max.y <= spawnPoint.y &&
            collider.max.y > bestFloorY) {
          bestFloorY = collider.max.y;
        }
      }
      this.controller.camera.position.y = bestFloorY + 1.7;
      this.controller.initFeetPosition();
    } else {
      this.controller.camera.position.set(0, 1.7, 0);
      this.controller.initFeetPosition();
    }

    // Strip castShadow from tiny decorative meshes (grout lines, dials,
    // seams). On a typical prison map this can drop the shadow caster
    // count from thousands to hundreds, slashing the shadow-pass cost.
    pruneShadowCasters(this.scene);
  }

  private addColliders(group: THREE.Object3D) {
    // Force full scene matrix update so all world matrices are correct
    this.scene.updateMatrixWorld(true);
    
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const box = new THREE.Box3().setFromObject(child);
        if (box.isEmpty()) return;
        
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Skip very thin decorative elements (seams, lines, overlays) - only if BOTH horizontal dims are tiny
        if (size.x < 0.03 && size.z < 0.03) return;
        // Skip flat surfaces at ground level (floor tiles, cracks, stains near y=0)
        // Elevated thin panels (floors at y>0.3) are kept as colliders
        if (size.y < 0.15 && box.max.y < 0.3) return;
        
        this.colliders.push(box);
      }
    });
  }

  private onResize() {
    this.controller.camera.aspect = window.innerWidth / window.innerHeight;
    this.controller.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    this.isRunning = true;
    this.prevTime = performance.now();
    // Emit initial state to all listeners — Game.setOnCombatUpdate does this via
    // its setter, but PlaytestMode exposes callbacks as public fields, so the
    // first state change must be pushed explicitly. Without this, React state
    // retains values from a previous playtest (e.g. starting as prisoner after
    // a guard run still shows AK-47 in the HUD until something changes).
    this.onCombatUpdate?.(this.combat.getState());
    this.onInventoryUpdate?.(this.inventory.getState());
    this.onCameraSystemUpdate?.(this.cameraSystem.getState());
    this.onDoorStateUpdate?.(this.areCellsOpen());
    this.onWalletUpdate?.(this.wallet.getState());
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  private animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(this.boundAnimate);

    const time = performance.now();
    const delta = Math.min((time - this.prevTime) / 1000, 0.1);
    this.prevTime = time;

    // FPS
    this.frameCount++;
    this.fpsTime += delta;
    if (this.fpsTime >= 1) {
      this.currentFps = Math.round(this.frameCount / this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = 0;
    }

    // Skip movement in terminal mode
    if (!this.inTerminalMode) {
      // Обновления
      this.controller.update(delta);

      const isMoving = this.controller.isMoving();
      this.hands.setWalking(isMoving);
      this.hands.update(delta);

      // Шаги
      if (isMoving && document.pointerLockElement !== null) {
        this.footstepTimer += delta;
        if (this.footstepTimer >= this.FOOTSTEP_INTERVAL) {
          soundSystem.playFootstep();
          this.footstepTimer = 0;
        }
      } else {
        this.footstepTimer = 0;
      }

      this.combat.update(delta);

      // Door animation
      this.doorSystem.update(delta);

      // Garage door animation
      this.garageDoorSystem.update(delta);

      // Rental door animation
      this.rentalDoorSystem.update(delta);

      // Check nearby rental door for info panel
      const nearbyResult = this.rentalDoorSystem.canInteract(this.controller.camera.position);
      const nearbyDoorId = nearbyResult.door?.id ?? null;
      if (nearbyDoorId !== this.lastNearbyRentalDoorId) {
        this.lastNearbyRentalDoorId = nearbyDoorId;
        if (nearbyResult.door) {
          this.onRentalDoorNearby?.({
            cellLabel: nearbyResult.door.cellLabel,
            ownerId: nearbyResult.door.ownerId,
            expiresAt: nearbyResult.door.expiresAt,
          });
        } else {
          this.onRentalDoorNearby?.(null);
        }
      }

      // Terminal raycast
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.controller.camera);
      this.cameraSystem.checkRaycast(this.raycaster);
    }

    this.onStatsUpdate?.(this.currentFps, this.controller.camera.position);

    // Always update camera system (renders terminal screen textures)
    this.cameraSystem.update(delta, this.controller.camera);

    // Update day/night cycle
    this.dayNightCycle.update(delta);

    // Keep sky dome centered on camera
    this.skyMesh.position.copy(this.controller.camera.position);

    // Render
    if (this.inTerminalMode && this.cameraSystem.selectedCameraIndex !== null) {
      // renderFromCamera already called inside update() above
    } else {
      this.renderer.render(this.scene, this.controller.camera);
    }
  }

  selectCamera(index: number | null) {
    this.cameraSystem.selectCamera(index);
  }

  openTerminalApp(app: 'cameras' | 'doors') {
    if (app === 'cameras') {
      this.cameraSystem.openCamerasApp();
    } else if (app === 'doors') {
      this.cameraSystem.openDoorsApp();
    }
  }

  backToTerminalDesktop() {
    this.cameraSystem.backToDesktop();
  }

  exitTerminal() {
    if (this.inTerminalMode) {
      this.cameraSystem.exitTerminalMode();
    }
  }

  inventoryEquipSlot(index: number) {
    this.inventory.equipSlot(index);
  }

  inventorySetHovered(index: number | null) {
    this.inventory.setHoveredSlot(index);
  }

  openAllDoors() {
    this.doorSystem.openAllDoors();
  }

  closeAllDoors() {
    this.doorSystem.closeAllDoors();
  }

  hasDoors(): boolean {
    return this.doorSystem.getDoors().length > 0;
  }

  areCellsOpen(): boolean {
    const doors = this.doorSystem.getDoors();
    return doors.length > 0 && doors.every(d => d.isOpen);
  }

  lockGarageDoors() {
    this.garageDoorSystem.lockDoors();
  }

  unlockGarageDoors() {
    this.garageDoorSystem.unlockDoors();
  }

  tempLockGarageDoors(minutes: number) {
    this.garageDoorSystem.tempLockDoors(minutes * 60 * 1000);
  }

  getGarageDoorLockState(): { state: 'unlocked' | 'locked' | 'temp_locked'; remainingSeconds: number | null } {
    return this.garageDoorSystem.getLockState();
  }

  rentDoor(doorId: string, optionId: string): boolean {
    return this.rentalDoorSystem.rent(doorId, optionId, this.wallet);
  }

  closeRentalMenu() {
    document.body.requestPointerLock();
  }

  dispose() {
    this.stop();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
    this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement);
    this.renderer.dispose();
    this.controller.dispose();
    this.combat.dispose();
    this.cameraSystem.dispose();
    this.garageDoorSystem.dispose();
    this.garageDoorSystem.onDoorStateChange = undefined;
    this.garageDoorSystem.onLockStateChange = undefined;
    this.rentalDoorSystem.onDoorStateChange = undefined;
    this.rentalDoorSystem.onRentalExpired = undefined;
    document.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.boundOnResize);
  }
}
