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
import { LockerSystem, LockerState } from '../game/LockerSystem';
import { TerrainSystem } from '../game/TerrainSystem';
import { WaterSystem } from '../game/WaterSystem';
import {
  applyToRenderer,
  configureSunShadow,
  getRendererOptions,
  isFogEnabled,
  pruneShadowCasters,
  configurePointLightShadow,
  configureSpotLightShadow,
  updateLightShadows,
} from '../game/QualitySettings';
import { DayNightCycle } from '../game/DayNightCycle';
import { MultiplayerClient } from '../game/multiplayer/MultiplayerClient';
import { RemotePlayerManager } from '../game/multiplayer/RemotePlayerManager';
import { SEND_RATE_MS } from '../game/multiplayer/MultiplayerConstants';

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
  private lockerSystem: LockerSystem;
  private team: 'guard' | 'prisoner';
  private colliders: THREE.Box3[] = [];
  private doorColliders: Map<string, THREE.Box3[]> = new Map();
  private garageDoorColliders: Map<string, THREE.Box3[]> = new Map();
  private rentalDoorColliders: Map<string, THREE.Box3[]> = new Map();
  private lockerMeshes: Map<string, THREE.Object3D> = new Map();
  private inTerminalMode = false;

  // Flag to indicate pointer lock was released by a UI panel (not ESC)
  public uiPointerLockRelease = false;

  // Armory locker
  private armoryLockerPositions: THREE.Vector3[] = [];
  private armoryOpen = false;

  // Terrain & Water
  private terrainSystem: TerrainSystem | null = null;
  private waterSystem: WaterSystem | null = null;
  private waterDamageAccumulator = 0;
  private placedLights: THREE.Light[] = [];

  private isRunning = false;
  private prevTime = 0;
  private footstepTimer = 0;
  private readonly FOOTSTEP_INTERVAL = 0.4;

  // Death/respawn state
  private isDead = false;
  private deathTimer = 0;
  private readonly RESPAWN_DELAY = 5;
  private spawnPoint: THREE.Vector3 | null = null;
  private spawnPoints: THREE.Vector3[] = [];

  private raycaster = new THREE.Raycaster();
  private boundOnResize = this.onResize.bind(this);
  private boundOnWheel: ((event: WheelEvent) => void) | null = null;
  private boundAnimate = this.animate.bind(this);
  private lastNearbyRentalDoorId: string | null = null;
  private lastNearbyRentalOwnerId: string | null = null;
  private lastNearbyRentalExpiresAt: number | null = null;
  private cachedRentalInteractResult: { canInteract: boolean; door: RentalDoor | null } = { canInteract: false, door: null };

  // Dropped items (non-weapon pickables)
  private droppedItems: { mesh: THREE.Group; itemType: string; position: THREE.Vector3 }[] = [];

  // Interactive object zones
  private ladderZones: { box: THREE.Box3; topY: number }[] = [];
  private windowObjects: { group: THREE.Group; glassMesh: THREE.Mesh | null; broken: boolean; glassCollider: THREE.Box3 | null }[] = [];
  private barbedWireZones: { box: THREE.Box3; damagePerSecond: number }[] = [];
  private climbSoundTimer = 0;
  private barbedWireDamageAccumulator = 0;
  private barbedWireSoundTimer = 0;

  private dayNightCycle: DayNightCycle;
  private skyMesh: THREE.Mesh;
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;

  // Multiplayer
  private multiplayerClient: MultiplayerClient | null = null;
  private remotePlayerManager: RemotePlayerManager | null = null;
  private lastPositionSendTime = 0;

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
  public onDeathStateChange?: (state: { isDead: boolean; respawnCountdown: number }) => void;
  public onLockerUpdate?: (state: LockerState | null) => void;
  public onLockerAccessDenied?: () => void;
  public onArmoryOpen?: () => void;
  public onMultiplayerPlayersUpdate?: (count: number) => void;

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
    this.combat.onWeaponPickedUp = (weaponName: string) => {
      // Map weapon name to item ID
      let itemId = 'weapon_ak47';
      let icon = '\u{1F52B}';
      if (weaponName === 'SPAS-12') { itemId = 'weapon_shotgun'; }
      else if (weaponName === 'Makarov PM') { itemId = 'weapon_pistol'; }
      else if (weaponName === 'Taser') { itemId = 'weapon_taser'; icon = '\u26A1'; }
      const weaponItem = { id: itemId, name: weaponName, icon, type: 'weapon' as const, quantity: 1 };
      this.inventory.addItem(weaponItem);
      this.inventory.addNotification(weaponItem);
    };
    this.combat.onWeaponDropped = (weaponType: string) => {
      // Map weapon type to inventory item ID and remove only that weapon
      const weaponTypeToItemId: Record<string, string> = {
        'ak47': 'weapon_ak47',
        'shotgun': 'weapon_shotgun',
        'pistol': 'weapon_pistol',
        'taser': 'weapon_taser',
      };
      const itemId = weaponTypeToItemId[weaponType];
      if (itemId) {
        this.inventory.removeItem(itemId);
      }
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

    // Wire camera recoil to controller
    this.combat.onCameraRecoil = (pitch: number, yaw: number) => {
      this.controller.addRecoil(pitch, yaw);
    };

    // Handle glass hit (window breaking)
    this.combat.onGlassHit = (glassMesh: THREE.Mesh) => {
      for (const win of this.windowObjects) {
        if (win.broken) continue;
        if (win.glassMesh === glassMesh) {
          win.broken = true;
          glassMesh.visible = false;
          // Remove glass collider so player can pass through
          if (win.glassCollider) {
            const idx = this.colliders.indexOf(win.glassCollider);
            if (idx >= 0) {
              this.colliders.splice(idx, 1);
              this.controller.setColliders(this.colliders);
            }
          }
          soundSystem.playGlassBreak();
          break;
        }
      }
    };

    // Death handling
    this.combat.onDeath = () => {
      this.isDead = true;
      this.deathTimer = this.RESPAWN_DELAY;

      // Close locker if open
      if (this.lockerSystem.isOpen()) {
        this.lockerSystem.close();
      }

      // Unequip vest on death
      if (this.inventory.getVestEquipped()) {
        this.inventory.unequipVest();
      }

      // Drop money
      const droppedMoney = this.wallet.dropOnDeath();
      if (droppedMoney > 0) {
        const playerPos = this.controller.camera.position.clone();
        playerPos.y -= 0.5;
        const moneyObj = getObjectById('money_bag');
        if (moneyObj) {
          const mesh = moneyObj.create();
          mesh.position.copy(playerPos);
          mesh.userData.isItem = true;
          mesh.userData.itemType = 'money_bag';
          mesh.userData.moneyAmount = droppedMoney;
          this.scene.add(mesh);
          this.droppedItems.push({ mesh, itemType: 'money_bag', position: playerPos.clone() });
        }
      }

      // Drop all inventory items
      const droppedInvItems = this.inventory.dropAllItems();
      const playerDropPos = this.controller.camera.position.clone();
      playerDropPos.y -= 0.5;
      for (let i = 0; i < droppedInvItems.length; i++) {
        const item = droppedInvItems[i];
        if (item.type === 'weapon') {
          // Weapon is already dropped by Combat.die()
          continue;
        }
        const itemPos = playerDropPos.clone();
        const angle = (i / droppedInvItems.length) * Math.PI * 2;
        const spread = 0.5; // meters
        const offsetX = Math.cos(angle) * spread;
        const offsetZ = Math.sin(angle) * spread;
        itemPos.x += offsetX;
        itemPos.z += offsetZ;
        this.combat.createDroppedItemMesh(itemPos, item.id);
      }

      // Play death sound
      soundSystem.playDeath();

      // Exit pointer lock
      this.uiPointerLockRelease = true;
      document.exitPointerLock();

      // Notify UI
      this.onDeathStateChange?.({ isDead: true, respawnCountdown: this.deathTimer });
    };

    // Fall damage
    this.controller.onFallDamage = (damage: number) => {
      this.combat.takeDamage(damage);
    };

    // Inventory system
    this.inventory = new InventorySystem();
    this.inventory.onStateChange = (state) => {
      this.onInventoryUpdate?.(state);
    };
    this.inventory.onOpen = () => {
      this.uiPointerLockRelease = true;
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

    // Vest equip wiring
    this.inventory.onVestEquip = () => {
      this.combat.equipArmor();
    };

    // Mouse wheel for hotbar cycling
    this.boundOnWheel = (event: WheelEvent) => {
      if (document.pointerLockElement === null) return;
      if (this.inventory.getIsOpen()) return;
      this.inventory.cycleHotbar(event.deltaY > 0 ? 1 : -1);
    };
    document.addEventListener('wheel', this.boundOnWheel);

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

    // Система шкафов хранения
    this.lockerSystem = new LockerSystem();
    this.lockerSystem.onStateChange = (state) => {
      this.onLockerUpdate?.(state);
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
    if (event.code === 'Tab') {
      event.preventDefault();
      if (document.pointerLockElement !== null || this.inventory.getIsOpen()) {
        this.inventory.toggle();
      }
      return;
    }
    // Number keys 1-8 for hotbar selection
    if (event.code.startsWith('Digit') && !this.inventory.getIsOpen()) {
      const digit = parseInt(event.code.charAt(5), 10);
      if (digit >= 1 && digit <= 4) {
        this.inventory.setHotbarIndex(digit - 1);
        return;
      }
    }
    if (event.code === 'KeyE') {
      // Terminal exit does NOT require pointer lock (pointer lock is released while in terminal mode)
      if (this.inTerminalMode) {
        this.cameraSystem.startShutdown();
        return;
      }
      // If locker is open, don't process E here - React handles close
      if (this.lockerSystem.isOpen()) {
        return;
      }
      // If armory is open, close it
      if (this.armoryOpen) {
        this.armoryClose();
        return;
      }
      // All other E interactions require pointer lock
      if (document.pointerLockElement === null) return;
      if (this.cameraSystem.terminalHighlighted) {
        const playerPos = this.controller.camera.position;
        this.uiPointerLockRelease = true;
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
      // Locker interaction (before rental door so locker takes priority when both are nearby)
      {
        // Raycast from camera to check if player is looking at a locker within range
        const lockerRaycaster = new THREE.Raycaster();
        lockerRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.controller.camera);
        lockerRaycaster.far = 2.5;
        const lockerObjects: THREE.Object3D[] = [];
        for (const obj of this.lockerMeshes.values()) {
          lockerObjects.push(obj);
        }
        const lockerHits = lockerRaycaster.intersectObjects(lockerObjects, true);
        if (lockerHits.length > 0) {
          // Find which locker was hit
          const hitObject = lockerHits[0].object;
          let hitLockerId: string | null = null;
          for (const [lockerId, lockerObj] of this.lockerMeshes.entries()) {
            let obj: THREE.Object3D | null = hitObject;
            while (obj) {
              if (obj === lockerObj) {
                hitLockerId = lockerId;
                break;
              }
              obj = obj.parent;
            }
            if (hitLockerId) break;
          }
          if (hitLockerId) {
            const opened = this.lockerSystem.tryOpen(hitLockerId, this.team, this.rentalDoorSystem);
            if (!opened) {
              this.onLockerAccessDenied?.();
            } else {
              this.uiPointerLockRelease = true;
              document.exitPointerLock();
            }
            return;
          }
        }
      }
      // Armory locker interaction
      {
        const playerPos = this.controller.camera.position;
        for (const lockerPos of this.armoryLockerPositions) {
          const dx = playerPos.x - lockerPos.x;
          const dz = playerPos.z - lockerPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 2.5) {
            this.armoryOpen = true;
            this.onArmoryOpen?.();
            this.uiPointerLockRelease = true;
            document.exitPointerLock();
            return;
          }
        }
      }
      // Rental door interaction (use cached result from animate loop)
      {
        const canRental = this.cachedRentalInteractResult.canInteract;
        const rentalDoor = this.cachedRentalInteractResult.door;
        if (canRental && rentalDoor) {
          if (this.team === 'guard') {
            this.rentalDoorSystem.toggleDoor(rentalDoor.id, 'guard');
          } else {
            const result = this.rentalDoorSystem.interact(this.controller.camera.position, this.team);
            if (result.type === 'toggle') {
              this.rentalDoorSystem.toggleDoor(rentalDoor.id, 'prisoner');
            } else if (result.type === 'menu') {
              this.onShowRentalMenu?.(rentalDoor);
              this.uiPointerLockRelease = true;
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

    // Check for nearby dropped weapons
    for (let i = 0; i < this.combat.droppedWeapons.length; i++) {
      const droppedWeapon = this.combat.droppedWeapons[i];
      const dx = playerPos.x - droppedWeapon.position.x;
      const dz = playerPos.z - droppedWeapon.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < pickupRange) {
        // Can't carry two weapons - skip if already have one
        if (this.combat.weapon || this.combat.getStoredWeapon()) {
          break;
        }

        const weaponType = droppedWeapon.userData.weaponType || 'ak47';

        // Remove from scene and array
        this.scene.remove(droppedWeapon);
        this.combat.droppedWeapons.splice(i, 1);

        // Determine weapon info for inventory
        const weaponTypeToInfo: Record<string, { id: string; name: string; icon: string }> = {
          'ak47': { id: 'weapon_ak47', name: 'AK-47', icon: '\u{1F52B}' },
          'shotgun': { id: 'weapon_shotgun', name: 'SPAS-12', icon: '\u{1F52B}' },
          'pistol': { id: 'weapon_pistol', name: 'Makarov PM', icon: '\u{1F52B}' },
          'taser': { id: 'weapon_taser', name: '\u0422\u0430\u0437\u0435\u0440', icon: '\u26A1' },
        };
        const info = weaponTypeToInfo[weaponType] || weaponTypeToInfo['ak47'];

        // Add weapon to inventory first
        const weaponItem = { id: info.id, name: info.name, icon: info.icon, type: 'weapon' as const, quantity: 1 };
        this.inventory.addItem(weaponItem);
        this.inventory.addNotification(weaponItem);

        // Store weapon in combat storedWeapon
        this.combat.storeWeaponForPickup(weaponType);

        // Find the slot and equip it (triggers onEquip -> takeOutWeapon)
        const state = this.inventory.getState();
        const weaponIdx = state.slots.findIndex(s => s?.id === info.id);
        if (weaponIdx >= 0) {
          this.inventory.equipSlot(weaponIdx);
        }

        // Fallback: if weapon still not in hands after equipSlot chain, force it
        if (!this.combat.weapon && this.combat.getStoredWeapon()) {
          this.combat.takeOutWeapon();
        }

        soundSystem.playPickup();
        return true;
      }
    }

    // Check physics-dropped items from combat system first
    const pickedUp = this.combat.tryPickupItem(this.controller.camera);
    if (pickedUp) {
      const def = ITEM_DEFS[pickedUp.itemType];
      if (def) {
        // Safeguard: if picking up a vest and one is already equipped, consume the pickup but don't add to inventory
        if (pickedUp.itemType === 'item_vest' && this.inventory.getVestEquipped()) {
          // Vest already equipped - consume pickup (world item already removed by combat) but don't duplicate
        } else {
          this.inventory.addItem(def);
          this.inventory.addNotification({ id: def.id, name: def.name, icon: def.icon, type: def.type, quantity: 1, rarity: def.rarity, category: def.category });
        }
      }
      // Clean stale entries from droppedItems whose mesh is no longer in the scene
      for (let i = this.droppedItems.length - 1; i >= 0; i--) {
        if (this.droppedItems[i].mesh.parent === null) {
          this.droppedItems.splice(i, 1);
        }
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
          const amount = item.mesh.userData.moneyAmount || 1000;
          const added = this.wallet.addMoney(amount);
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
          this.inventory.addNotification({ id: def.id, name: def.name, icon: def.icon, type: def.type, quantity: 1, rarity: def.rarity, category: def.category });
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
    const spawnPointCandidates: THREE.Vector3[] = [];
    const spawnType = team === 'guard' ? 'spawn_guard' : 'spawn_prisoner';
    let cameraCount = 0;
    let doorCellIndex = 0;

    // Terrain system
    if (mapData.terrain) {
      this.terrainSystem = new TerrainSystem(this.scene, mapData.terrain.size, mapData.terrain.resolution);
      this.terrainSystem.importData(mapData.terrain);
      this.controller.terrainHeightFn = this.terrainSystem.getHeightAt.bind(this.terrainSystem);
    }

    // Water system
    if (mapData.waterZones && mapData.waterZones.length > 0) {
      this.waterSystem = new WaterSystem(this.scene);
      this.waterSystem.importData(mapData.waterZones);
    }

    for (const objData of mapData.objects) {
      const objType = getObjectById(objData.type);
      if (!objType) continue;

      // Скрипты — не рендерим визуально, но обрабатываем логику
      if (objData.type === 'spawn_prisoner' || objData.type === 'spawn_guard') {
        if (objData.type === spawnType) {
          spawnPointCandidates.push(new THREE.Vector3(objData.position.x, objData.position.y + 1.7, objData.position.z));
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
      if (objData.type === 'weapon_shotgun') {
        this.combat.createDroppedWeaponAt(
          new THREE.Vector3(objData.position.x, objData.position.y + 0.5, objData.position.z),
          'shotgun'
        );
        continue;
      }
      if (objData.type === 'weapon_pistol') {
        this.combat.createDroppedWeaponAt(
          new THREE.Vector3(objData.position.x, objData.position.y + 0.5, objData.position.z),
          'pistol'
        );
        continue;
      }
      if (objData.type === 'weapon_taser') {
        this.combat.createDroppedWeaponAt(
          new THREE.Vector3(objData.position.x, objData.position.y + 0.5, objData.position.z),
          'taser'
        );
        continue;
      }

      // Money bag pickup
      if (objData.type === 'money_bag') {
        const itemPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const obj = objType.create();
        obj.position.copy(itemPos);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        obj.userData.__interactive = true;
        this.scene.add(obj);
        this.droppedItems.push({ mesh: obj, itemType: 'money_bag', position: itemPos });
        continue;
      }

      // Item pickups (melee, tools, consumables)
      if (objData.type === 'item_shiv' || objData.type === 'item_baton' ||
          objData.type === 'item_shield' || objData.type === 'item_flashlight' ||
          objData.type === 'item_medkit' || objData.type === 'item_bandage' ||
          objData.type === 'item_vest') {
        const itemPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const obj = objType.create();
        obj.position.copy(itemPos);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
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
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
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
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        this.scene.add(obj);
        // Offset the viewpoint forward along the camera's facing direction
        // so the view clears the camera model geometry.
        const rotRad = THREE.MathUtils.degToRad(objData.rotation || 0);
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
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);

        const prevLen = this.colliders.length;
        this.addColliders(obj);
        const doorBoxes = this.colliders.slice(prevLen);

        const rotRad = THREE.MathUtils.degToRad(objData.rotation || 0);
        const pos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const door = this.doorSystem.registerDoor(doorCellIndex, obj, pos, rotRad);
        this.doorColliders.set(door.id, doorBoxes);
        doorCellIndex++;
        continue;
      }

      // Шкаф хранения — регистрируем в системе шкафов
      if (objData.type === 'storage_locker') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);
        this.addColliders(obj);
        const lockerPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const lockerId = `locker_${objData.id}`;
        this.lockerSystem.registerLocker(lockerId, objData.groupId || 0, lockerPos);
        this.lockerMeshes.set(lockerId, obj);
        continue;
      }

      // Оружейный шкаф — регистрируем позицию для взаимодействия
      if (objData.type === 'armory_locker') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);
        this.addColliders(obj);
        this.armoryLockerPositions.push(new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z));
        continue;
      }

      // Решётка-аренда — регистрируем в системе арендных дверей
      if (objData.type === 'bars_door_rental') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);

        const prevLen = this.colliders.length;
        this.addColliders(obj);
        const doorBoxes = this.colliders.slice(prevLen);

        const rotRad = THREE.MathUtils.degToRad(objData.rotation || 0);
        const doorPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        const rentalDoorId = `rental_door_${objData.id}`;
        const rDoor = this.rentalDoorSystem.registerDoor(rentalDoorId, objData.label || '\u041a\u0430\u043c\u0435\u0440\u0430', obj, doorPos, rotRad, objData.groupId || 0);
        this.rentalDoorColliders.set(rDoor.id, doorBoxes);
        continue;
      }

      // Лестница — интерактивный объект с карабканьем
      if (objData.type === 'ladder') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);
        const ladderBox = new THREE.Box3().setFromObject(obj);
        const topY = ladderBox.max.y;
        this.ladderZones.push({ box: ladderBox, topY });
        this.addColliders(obj);
        continue;
      }

      // Окно с разбиваемым стеклом
      if (objData.type === 'window_glass') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);
        let glassMesh: THREE.Mesh | null = null;
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && child.userData.isGlass) {
            glassMesh = child;
          }
        });
        // Compute glass collider separately so it can be removed on break
        let glassCollider: THREE.Box3 | null = null;
        if (glassMesh) {
          const glassBox = new THREE.Box3().setFromObject(glassMesh);
          if (!glassBox.isEmpty()) {
            glassCollider = glassBox;
            this.colliders.push(glassCollider);
          }
        }
        // Add colliders for non-glass parts (frame)
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && !child.userData.isGlass) {
            const box = new THREE.Box3().setFromObject(child);
            if (box.isEmpty()) return;
            const size = new THREE.Vector3();
            box.getSize(size);
            if (size.x < 0.03 && size.z < 0.03) return;
            if (size.y < 0.15 && box.max.y < 0.3) return;
            this.colliders.push(box);
          }
        });
        this.windowObjects.push({ group: obj, glassMesh, broken: false, glassCollider });
        continue;
      }

      // Колючая проволока — зона урона
      if (objData.type === 'barbed_wire') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        this.scene.add(obj);
        obj.updateMatrixWorld(true);
        const wireBox = new THREE.Box3().setFromObject(obj);
        const dps = obj.userData.damagePerSecond || 5;
        this.barbedWireZones.push({ box: wireBox, damagePerSecond: dps });
        continue;
      }

      // Water objects - register as water zones for player mechanics
      if (objData.type === 'water_shallow' || objData.type === 'water_deep') {
        const obj = objType.create();
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
        this.scene.add(obj);
        // Register in water system for player interaction
        if (!this.waterSystem) {
          this.waterSystem = new WaterSystem(this.scene);
        }
        const waterType = objData.type === 'water_shallow' ? 'shallow' : 'deep';
        const waterPos = new THREE.Vector3(objData.position.x, objData.position.y, objData.position.z);
        this.waterSystem.addZone(waterPos, 4, 4, waterType);
        continue;
      }

      // Гаражные двери — регистрируем в системе гаражных дверей
      if (objData.type === 'garage_door_large' || objData.type === 'garage_door_medium') {
        const obj = objType.create();
        obj.userData.__interactive = true;
        obj.position.set(objData.position.x, objData.position.y, objData.position.z);
        obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
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
      obj.rotation.y = THREE.MathUtils.degToRad(objData.rotation || 0);
      if (objData.rotationX !== undefined) obj.rotation.x = THREE.MathUtils.degToRad(objData.rotationX);
      if (objData.rotationZ !== undefined) obj.rotation.z = THREE.MathUtils.degToRad(objData.rotationZ);
      if (objData.scaleX !== undefined || objData.scaleY !== undefined || objData.scaleZ !== undefined) {
        obj.scale.set(objData.scaleX ?? objData.scale ?? 1, objData.scaleY ?? objData.scale ?? 1, objData.scaleZ ?? objData.scale ?? 1);
      } else if (objData.scale) {
        obj.scale.setScalar(objData.scale);
      }
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

    // Exclude dropped weapons from merging so they remain pickable
    for (const dw of this.combat.droppedWeapons) {
      interactiveObjects.add(dw);
    }

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
          // Increase intensity so lights actually illuminate rooms
          if (light instanceof THREE.PointLight) {
            light.intensity *= 2;
            light.distance = (light.distance || 10) * 1.5;
            configurePointLightShadow(light);
          } else if (light instanceof THREE.SpotLight) {
            light.intensity *= 2;
            light.distance = (light.distance || 10) * 1.5;
            configureSpotLightShadow(light);
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
    this.placedLights = extractedLights;

    // Спавн
    this.spawnPoints = spawnPointCandidates;
    const spawnPoint = spawnPointCandidates.length > 0
      ? spawnPointCandidates[Math.floor(Math.random() * spawnPointCandidates.length)]
      : null;
    if (spawnPoint) {
      this.spawnPoint = spawnPoint.clone();
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
      if (this.spawnPoint) {
        this.spawnPoint.y = bestFloorY + 1.7;
      }
      this.controller.initFeetPosition();
    } else {
      this.spawnPoint = new THREE.Vector3(0, 1.7, 0);
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
    
    const hasCustomColliders = group.userData.hasCustomColliders === true;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // When custom colliders are defined, only use invisible meshes for collision
        if (hasCustomColliders) {
          if ((child.material as THREE.MeshBasicMaterial).visible !== false) return;
        }

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

  setMultiplayerClient(client: MultiplayerClient): void {
    this.multiplayerClient = client;
    this.remotePlayerManager = new RemotePlayerManager(this.scene);

    // Wire callbacks
    client.onPlayerJoined = (player) => {
      this.remotePlayerManager?.addPlayer(player.id, player.nickname);
      this.onMultiplayerPlayersUpdate?.(client.getPlayers().size);
    };

    client.onPlayerLeft = (id) => {
      this.remotePlayerManager?.removePlayer(id);
      this.onMultiplayerPlayersUpdate?.(client.getPlayers().size);
    };

    client.onPlayersUpdated = (players) => {
      for (const [id, p] of players) {
        this.remotePlayerManager?.updatePlayer(id, p.position, p.rotation);
      }
      this.onMultiplayerPlayersUpdate?.(players.size);
    };

    client.onDisconnected = () => {
      this.remotePlayerManager?.dispose();
      this.remotePlayerManager = null;
      this.multiplayerClient = null;
      this.onMultiplayerPlayersUpdate?.(0);
    };

    // Add already-connected players
    for (const [id, p] of client.getPlayers()) {
      this.remotePlayerManager.addPlayer(id, p.nickname);
      this.remotePlayerManager.updatePlayer(id, p.position, p.rotation);
    }
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
    this.placedLights = [];
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
      // Skip game logic when dead
      if (this.isDead) {
        this.deathTimer -= delta;
        this.onDeathStateChange?.({ isDead: true, respawnCountdown: Math.max(0, this.deathTimer) });

        if (this.deathTimer <= 0) {
          // Respawn
          this.isDead = false;
          this.combat.respawn();
          this.inventory.reset();

          // Teleport to random spawn point
          const respawnPoint = this.spawnPoints.length > 0
            ? this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)]
            : (this.spawnPoint ?? new THREE.Vector3(0, 1.7, 0));
          if (respawnPoint) {
            this.controller.camera.position.copy(respawnPoint);
            this.controller.initFeetPosition();
          }

          soundSystem.playRespawn();
          this.onDeathStateChange?.({ isDead: false, respawnCountdown: 0 });
        }
      } else {
      // Обновления
      this.controller.update(delta);

      // Ladder climbing
      let onLadder = false;
      const playerPos = this.controller.camera.position;
      const playerBox = new THREE.Box3(
        new THREE.Vector3(playerPos.x - 0.3, playerPos.y - 1.7, playerPos.z - 0.3),
        new THREE.Vector3(playerPos.x + 0.3, playerPos.y, playerPos.z + 0.3)
      );
      for (const ladder of this.ladderZones) {
        if (playerBox.intersectsBox(ladder.box)) {
          onLadder = true;
          if (this.controller.isPressingForward()) {
            this.controller.velocity.y = 3;
            this.climbSoundTimer += delta;
            if (this.climbSoundTimer >= 0.4) {
              soundSystem.playClimb();
              this.climbSoundTimer = 0;
            }
          } else {
            this.controller.velocity.y = 0;
          }
          break;
        }
      }
      if (!onLadder) {
        this.climbSoundTimer = 0;
      }
      this.controller.setClimbing(onLadder);

      // Barbed wire damage
      {
        const pPos = this.controller.camera.position;
        const pFeetY = pPos.y - 1.7;
        const pBox = new THREE.Box3(
          new THREE.Vector3(pPos.x - 0.3, pFeetY, pPos.z - 0.3),
          new THREE.Vector3(pPos.x + 0.3, pPos.y, pPos.z + 0.3)
        );
        let inBarbedWire = false;
        for (const wire of this.barbedWireZones) {
          if (pBox.intersectsBox(wire.box)) {
            inBarbedWire = true;
            this.barbedWireDamageAccumulator += wire.damagePerSecond * delta;
            if (this.barbedWireDamageAccumulator >= 1) {
              const dmg = Math.floor(this.barbedWireDamageAccumulator);
              this.combat.takeDamage(dmg);
              this.barbedWireDamageAccumulator -= dmg;
            }
            this.barbedWireSoundTimer += delta;
            if (this.barbedWireSoundTimer >= 0.8) {
              soundSystem.playBarbedWireDamage();
              this.barbedWireSoundTimer = 0;
            }
            break;
          }
        }
        if (!inBarbedWire) {
          this.barbedWireDamageAccumulator = 0;
          this.barbedWireSoundTimer = 0;
        }
      }

      // Water system update & player effects
      if (this.waterSystem) {
        this.waterSystem.update(time / 1000);
        const playerPos = this.controller.camera.position;
        const playerFeetPos = new THREE.Vector3(playerPos.x, playerPos.y - 1.7, playerPos.z);
        const waterCheck = this.waterSystem.isInWater(playerFeetPos);
        if (waterCheck.inWater) {
          if (waterCheck.type === 'shallow') {
            this.controller.speedMultiplier = 0.4;
            this.waterDamageAccumulator = 0;
          } else {
            this.controller.speedMultiplier = 0.3;
            // Deep water: 10 HP/sec damage
            this.waterDamageAccumulator += 10 * delta;
            if (this.waterDamageAccumulator >= 1) {
              const dmg = Math.floor(this.waterDamageAccumulator);
              this.combat.takeDamage(dmg);
              this.waterDamageAccumulator -= dmg;
            }
          }
        } else {
          this.controller.speedMultiplier = 1.0;
          this.waterDamageAccumulator = 0;
        }
      }

      const isMoving = this.controller.isMoving();
      this.hands.setWalking(isMoving);

      // Wall proximity for hands retraction
      const camDir = new THREE.Vector3();
      this.controller.camera.getWorldDirection(camDir);
      this.raycaster.set(this.controller.camera.position, camDir);
      this.raycaster.far = 0.7;
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      // Filter out intersections with camera children (hands, held items)
      const cam = this.controller.camera;
      const filteredIntersects = intersects.filter(hit => {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj === cam) return false;
          obj = obj.parent;
        }
        return true;
      });
      const wallDist = filteredIntersects.length > 0 ? filteredIntersects[0].distance : 999;
      this.hands.setWallProximity(wallDist);

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

      this.combat.setMovementState(this.controller.isMoving(), this.controller.getSprinting(), this.controller.getCrouching());
      this.combat.update(delta);

      // Door animation
      this.doorSystem.update(delta);

      // Garage door animation
      this.garageDoorSystem.update(delta);

      // Rental door animation
      this.rentalDoorSystem.update(delta);

      // Check nearby rental door for info panel (cache result for E-key reuse)
      this.cachedRentalInteractResult = this.rentalDoorSystem.canInteract(this.controller.camera.position);
      const nearbyDoor = this.cachedRentalInteractResult.door;
      const nearbyDoorId = nearbyDoor?.id ?? null;
      const nearbyOwnerId = nearbyDoor?.ownerId ?? null;
      const nearbyExpiresAt = nearbyDoor?.expiresAt ?? null;
      if (nearbyDoorId !== this.lastNearbyRentalDoorId ||
          nearbyOwnerId !== this.lastNearbyRentalOwnerId ||
          nearbyExpiresAt !== this.lastNearbyRentalExpiresAt) {
        this.lastNearbyRentalDoorId = nearbyDoorId;
        this.lastNearbyRentalOwnerId = nearbyOwnerId;
        this.lastNearbyRentalExpiresAt = nearbyExpiresAt;
        if (nearbyDoor) {
          this.onRentalDoorNearby?.({
            cellLabel: nearbyDoor.cellLabel,
            ownerId: nearbyDoor.ownerId,
            expiresAt: nearbyDoor.expiresAt,
          });
        } else {
          this.onRentalDoorNearby?.(null);
        }
      }

      // Terminal raycast
      this.raycaster.far = Infinity;
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.controller.camera);
      this.cameraSystem.checkRaycast(this.raycaster);

      // Multiplayer: send position and update remote players
      if (this.multiplayerClient?.isConnected) {
        const now = performance.now();
        if (now - this.lastPositionSendTime >= SEND_RATE_MS) {
          this.lastPositionSendTime = now;
          const pos = this.controller.camera.position;
          const euler = new THREE.Euler().setFromQuaternion(this.controller.camera.quaternion, 'YXZ');
          this.multiplayerClient.sendPosition(
            { x: pos.x, y: pos.y, z: pos.z },
            { x: euler.x, y: euler.y }
          );
        }
      }
      this.remotePlayerManager?.update(delta);
      }
    }

    this.onStatsUpdate?.(this.currentFps, this.controller.camera.position);

    // Always update camera system (renders terminal screen textures)
    this.cameraSystem.update(delta, this.controller.camera);

    // Update day/night cycle
    this.dayNightCycle.update(delta);

    // Keep sky dome centered on camera
    this.skyMesh.position.copy(this.controller.camera.position);

    // Update light shadow culling based on camera proximity
    if (this.placedLights.length > 0) {
      updateLightShadows(this.placedLights, this.controller.camera.position);
    }

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
      this.cameraSystem.startShutdown();
    }
  }

  terminalBootComplete() {
    this.cameraSystem.transitionToDesktop();
  }

  restartBoot() {
    this.cameraSystem.restartBoot();
  }

  // === PTZ Passthrough ===
  ptzPan(dx: number, dy: number) { this.cameraSystem.ptzPan(dx, dy); }
  ptzZoom(delta: number) { this.cameraSystem.ptzZoom(delta); }
  ptzReset() { this.cameraSystem.ptzReset(); }
  ptzSavePreset(slot: number) { this.cameraSystem.ptzSavePreset(slot); }
  ptzLoadPreset(slot: number) { this.cameraSystem.ptzLoadPreset(slot); }

  // === Night Vision ===
  toggleNightVision() { this.cameraSystem.toggleNightVision(); }

  // === Rewind Buffer ===
  getRewindBuffer(): string[] { return this.cameraSystem.getRewindBuffer(); }

  // === Sound System ===
  getSoundSystem() { return soundSystem; }

  inventoryEquipSlot(index: number) {
    this.inventory.equipSlot(index);
  }

  inventorySetHovered(index: number | null) {
    this.inventory.setHoveredSlot(index);
  }

  inventoryDropItem(slotIndex: number) {
    const item = this.inventory.dropItem(slotIndex);
    if (item) {
      // Create a dropped item mesh in the world near the player
      const playerPos = this.controller.camera.position.clone();
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.controller.camera.quaternion);
      forward.y = 0;
      forward.normalize();
      const dropPos = playerPos.clone().add(forward.clone().multiplyScalar(1.5));
      dropPos.y -= 0.5;

      // Use Combat system's proper 3D item models
      this.combat.createDroppedItemMesh(dropPos, item.id);
      // Get the last added dropped item from combat
      const lastDropped = this.combat.droppedItems[this.combat.droppedItems.length - 1];
      if (lastDropped) {
        // Give it throw velocity forward
        lastDropped.userData.velocityY = 1.5;
        const throwDir = new THREE.Vector3(0, 0, -1);
        throwDir.applyQuaternion(this.controller.camera.quaternion);
        throwDir.y = 0;
        throwDir.normalize();
        lastDropped.userData.velocityX = throwDir.x * 2;
        lastDropped.userData.velocityZ = throwDir.z * 2;
        lastDropped.userData.grounded = false;
      }
    }
  }

  inventorySwapSlots(from: number, to: number) {
    this.inventory.swapSlots(from, to);
  }

  inventorySetCategory(cat: string | null) {
    this.inventory.setActiveCategory(cat);
  }

  inventoryEquipVest(): boolean {
    return this.inventory.equipVest();
  }

  inventoryUnequipVest(): boolean {
    const result = this.inventory.unequipVest();
    if (result) {
      this.combat.unequipArmor();
    }
    return result;
  }

  inventoryStartDrag(slot: number) {
    this.inventory.startDrag(slot);
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

  getIsDead(): boolean {
    return this.isDead;
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

  // === Locker methods ===
  lockerDeposit(slotIndex: number): void {
    const lockerId = this.lockerSystem.getOpenLockerId();
    if (!lockerId) return;
    this.lockerSystem.depositItem(lockerId, slotIndex, this.inventory, this.team);
  }

  lockerWithdraw(lockerSlotIndex: number): void {
    const lockerId = this.lockerSystem.getOpenLockerId();
    if (!lockerId) return;
    this.lockerSystem.withdrawItem(lockerId, lockerSlotIndex, this.inventory);
  }

  lockerDepositMoney(amount: number): void {
    const lockerId = this.lockerSystem.getOpenLockerId();
    if (!lockerId) return;
    this.lockerSystem.depositMoney(lockerId, amount, this.wallet, this.team);
  }

  lockerWithdrawMoney(amount: number): void {
    const lockerId = this.lockerSystem.getOpenLockerId();
    if (!lockerId) return;
    this.lockerSystem.withdrawMoney(lockerId, amount, this.wallet, this.team);
  }

  lockerClose(): void {
    this.lockerSystem.close();
  }

  // === Armory methods ===
  armoryTakeItem(itemId: string): boolean {
    if (itemId === 'weapon_ak47') {
      // AK-47 is not in ITEM_DEFS, handle via combat system
      if (this.combat.weapon || this.combat.getStoredWeapon()) return false;
      const weaponItem = { id: 'weapon_ak47', name: 'AK-47', icon: '\u{1F52B}', type: 'weapon' as const, quantity: 1 };
      this.inventory.addItem(weaponItem);
      this.inventory.addNotification(weaponItem);
      this.combat.storeWeaponForPickup('ak47');
      const state = this.inventory.getState();
      const weaponIdx = state.slots.findIndex(s => s?.id === 'weapon_ak47');
      if (weaponIdx >= 0) this.inventory.equipSlot(weaponIdx);
      if (!this.combat.weapon && this.combat.getStoredWeapon()) this.combat.takeOutWeapon();
      return true;
    }
    // Check if it's a weapon type from ITEM_DEFS
    const def = ITEM_DEFS[itemId];
    if (!def) return false;
    if (def.type === 'weapon') {
      if (this.combat.weapon || this.combat.getStoredWeapon()) return false;
      const weaponItem = { id: def.id, name: def.name, icon: def.icon, type: 'weapon' as const, quantity: 1 };
      this.inventory.addItem(weaponItem);
      this.inventory.addNotification(weaponItem);
      const weaponTypeMap: Record<string, string> = { 'weapon_shotgun': 'shotgun', 'weapon_pistol': 'pistol', 'weapon_taser': 'taser' };
      const wType = weaponTypeMap[itemId];
      if (wType) {
        this.combat.storeWeaponForPickup(wType);
        const state = this.inventory.getState();
        const weaponIdx = state.slots.findIndex(s => s?.id === itemId);
        if (weaponIdx >= 0) this.inventory.equipSlot(weaponIdx);
        if (!this.combat.weapon && this.combat.getStoredWeapon()) this.combat.takeOutWeapon();
      }
      return true;
    }
    // Non-weapon items
    const added = this.inventory.addItem(def);
    if (added) {
      this.inventory.addNotification({ id: def.id, name: def.name, icon: def.icon, type: def.type, quantity: 1, rarity: def.rarity, category: def.category });
    }
    return added;
  }

  armoryClose(): void {
    this.armoryOpen = false;
    document.body.requestPointerLock();
  }

  dispose() {
    this.stop();
    if (this.multiplayerClient) {
      this.multiplayerClient.disconnect();
      this.multiplayerClient = null;
    }
    if (this.remotePlayerManager) {
      this.remotePlayerManager.dispose();
      this.remotePlayerManager = null;
    }
    if (this.terrainSystem) this.terrainSystem.dispose();
    if (this.waterSystem) this.waterSystem.dispose();
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
    if (this.boundOnWheel) {
      document.removeEventListener('wheel', this.boundOnWheel);
    }
    window.removeEventListener('resize', this.boundOnResize);
  }
}
