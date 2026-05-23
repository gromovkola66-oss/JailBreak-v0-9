import * as THREE from 'three';
import { PrisonMapDetailed as PrisonMap } from './PrisonMapDetailed';
import { FirstPersonController } from './FirstPersonController';
import { Hands } from './Hands';
import { Combat, CombatState } from './Combat';
import { TeamSystem, Team, PlayerInfo } from './TeamSystem';
import { RoundSystem, RoundState } from './RoundSystem';
import { DoorSystem, Door } from './DoorSystem';
import { CameraSystem, CameraSystemState } from './CameraSystem';
import { InventorySystem, InventoryState } from './InventorySystem';
import { ITEM_DEFS } from './ItemDefs';
import { soundSystem } from './SoundSystem';
import {
  applyToRenderer,
  getConfig,
  getRendererOptions,
  isFogEnabled,
  pruneShadowCasters,
} from './QualitySettings';

export interface DoorInteractionState {
  canInteract: boolean;
  door: Door | null;
  isGuard: boolean;
}

export class Game {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private prisonMap: PrisonMap;
  private controller: FirstPersonController;
  private hands: Hands;
  private combat: Combat;
  private doorSystem: DoorSystem;
  private cameraSystem: CameraSystem;
  private inventory: InventorySystem;
  public teamSystem: TeamSystem;
  public roundSystem: RoundSystem;

  private isRunning = false;
  private prevTime = 0;
  
  private currentTeam: Team = 'none';
  private spawnPoint: THREE.Vector3 = new THREE.Vector3(0, 1.7, 5);
  private inTerminalMode = false;

  private onStatsUpdate?: (fps: number, pos: THREE.Vector3) => void;
  private onCombatUpdate?: (state: CombatState) => void;
  private onRoundUpdate?: (state: RoundState) => void;
  private onDoorInteraction?: (state: DoorInteractionState) => void;
  private onCameraSystemUpdate?: (state: CameraSystemState) => void;
  private onInventoryUpdate?: (state: InventoryState) => void;
  
  private frameCount = 0;
  private fpsTime = 0;
  private currentFps = 0;
  
  // Шаги
  private footstepTimer = 0;
  private readonly FOOTSTEP_INTERVAL = 0.4; // секунды между шагами

  private raycaster = new THREE.Raycaster();

  private boundKeyDown = this.onKeyDown.bind(this);
  private boundWindowResize = this.onWindowResize.bind(this);

  constructor(container: HTMLElement) {
    // Создаём сцену
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(400, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 topColor = vec3(0.04, 0.1, 0.29);
          vec3 midColor = vec3(0.29, 0.56, 0.85);
          vec3 horizonColor = vec3(0.78, 0.88, 0.94);
          vec3 warmBand = vec3(1.0, 0.83, 0.63);

          vec3 color;
          if (h > 0.3) {
            color = mix(midColor, topColor, (h - 0.3) / 0.7);
          } else if (h > 0.0) {
            color = mix(horizonColor, midColor, h / 0.3);
          } else if (h > -0.1) {
            color = mix(warmBand, horizonColor, (h + 0.1) / 0.1);
          } else {
            color = warmBand;
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));
    if (isFogEnabled()) {
      this.scene.fog = new THREE.Fog(0xc8e0f0, 20, 80);
    }

    // Рендерер
    this.renderer = new THREE.WebGLRenderer(getRendererOptions());
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    applyToRenderer(this.renderer);
    container.appendChild(this.renderer.domElement);

    // Камера
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Контроллер
    this.controller = new FirstPersonController(camera);

    // Карта
    const qc = getConfig();
    this.prisonMap = new PrisonMap({
      shadows: qc.shadowsEnabled,
      shadowMapSize: qc.shadowMapSize || 1024,
    });
    this.scene.add(this.prisonMap.group);
    this.controller.setColliders(this.prisonMap.colliders);
    // Strip castShadow from tiny decorative meshes (grout lines, dials, seams).
    // Drops shadow caster count from thousands to hundreds — slashes the
    // shadow-pass cost on a built-in detailed prison map.
    pruneShadowCasters(this.prisonMap.group);

    // Система дверей
    this.doorSystem = new DoorSystem(this.scene);
    
    // Создаём двери для всех камер
    for (const doorPos of this.prisonMap.cellDoorPositions) {
      this.doorSystem.createCellDoor(doorPos.cellIndex, doorPos.position);
    }

    // Система камер наблюдения
    this.cameraSystem = new CameraSystem(this.scene, this.renderer);
    this.cameraSystem.onStateChange = (state) => {
      this.inTerminalMode = state.inTerminalMode;
      if (this.onCameraSystemUpdate) {
        this.onCameraSystemUpdate(state);
      }
    };
    this.setupSecurityCameras();

    // Руки
    this.hands = new Hands();
    camera.add(this.hands.group);
    this.scene.add(camera);

    // Урон от падения и приземление
    this.controller.onFallDamage = (damage) => {
      this.combat.takeDamage(damage);
    };
    this.controller.onLand = () => {
      soundSystem.playLand();
    };

    // Боевая система
    this.combat = new Combat(camera, this.scene, this.hands);
    this.combat.setMapColliders(this.prisonMap.colliders);
    this.combat.onStateChange = (state) => {
      if (this.onCombatUpdate) {
        this.onCombatUpdate(state);
      }
    };
    this.combat.onDeath = () => {
      if (this.currentTeam !== 'none') {
        this.roundSystem.playerDied(this.currentTeam);
      }
    };
    this.combat.onCameraRecoil = (amount) => {
      this.controller.addRecoil(amount);
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

    // Система команд
    this.teamSystem = new TeamSystem();
    this.teamSystem.onTeamSelected = (info: PlayerInfo) => {
      this.onTeamSelected(info);
    };

    // Система раундов
    this.roundSystem = new RoundSystem();
    this.roundSystem.onStateChange = (state) => {
      if (this.onRoundUpdate) {
        this.onRoundUpdate(state);
      }
    };
    this.roundSystem.onRespawn = () => {
      this.respawnPlayer();
    };
    this.roundSystem.onRoundStart = () => {
      // Закрываем все двери в начале раунда
      this.doorSystem.closeAllDoors();
      soundSystem.playRoundStart();
    };
    this.roundSystem.onRoundEnd = () => {
      soundSystem.playRoundEnd();
    };

    // Обработка нажатия E для дверей
    document.addEventListener('keydown', this.boundKeyDown);

    // Обработка изменения размера окна
    window.addEventListener('resize', this.boundWindowResize);
  }

  private onKeyDown(event: KeyboardEvent) {
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
      // Try to interact with terminal first
      // Note: Any team (guard or prisoner) can use security terminals - this is intentional.
      if (this.cameraSystem.terminalHighlighted) {
        const playerPos = this.controller.camera.position;
        this.cameraSystem.enterTerminalMode(playerPos);
        return;
      }
      // Try to pick up dropped items
      this.tryPickupDroppedItem();
      this.tryInteractWithDoor();
    }
  }

  private tryPickupDroppedItem() {
    const pickedUp = this.combat.tryPickupItem(this.controller.camera);
    if (pickedUp) {
      const def = ITEM_DEFS[pickedUp.itemType];
      if (def) {
        this.inventory.addItem(def);
      }
    }
  }

  private tryInteractWithDoor() {
    // Только охрана может открывать двери
    if (this.currentTeam !== 'guard') return;
    
    const playerPos = this.controller.camera.position;
    const { canInteract, door } = this.doorSystem.canInteract(playerPos);
    
    if (canInteract && door) {
      const willOpen = !door.isOpen;
      this.doorSystem.toggleDoor(door.id);
      soundSystem.playDoor(willOpen);
    }
  }

  private onTeamSelected(info: PlayerInfo) {
    this.currentTeam = info.team;
    this.spawnPoint = info.spawnPoint.clone();
    
    // Пересоздаём боевую систему с правильной командой
    this.combat.dispose();
    const camera = this.controller.camera;
    const team = info.team === 'guard' ? 'guard' as const : 'prisoner' as const;

    // Recreate hands with correct team colors
    camera.remove(this.hands.group);
    this.hands = new Hands(team);
    camera.add(this.hands.group);

    this.combat = new Combat(camera, this.scene, this.hands, { team });
    this.combat.setMapColliders(this.prisonMap.colliders);
    this.combat.onStateChange = (state) => {
      if (this.onCombatUpdate) this.onCombatUpdate(state);
    };
    this.combat.onDeath = () => {
      if (this.currentTeam !== 'none') this.roundSystem.playerDied(this.currentTeam);
    };
    this.combat.onCameraRecoil = (amount) => {
      this.controller.addRecoil(amount);
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

    // Reset inventory on team switch
    this.inventory.reset();

    // Телепортируем
    camera.position.copy(info.spawnPoint);
    this.controller.initFeetPosition();

    // Если охрана — даём оружие и add to inventory
    if (info.team === 'guard') {
      this.combat.giveWeapon();
    }

    if (this.onCombatUpdate) {
      this.onCombatUpdate(this.combat.getState());
    }
  }

  private respawnPlayer() {
    this.controller.camera.position.copy(this.spawnPoint);
    this.controller.initFeetPosition();
    this.combat.respawn();
    
    if (this.currentTeam === 'guard') {
      this.combat.giveWeapon();
    } else {
      this.combat.removeWeapon();
      this.inventory.removeItem('weapon_ak47');
    }

    if (this.onCombatUpdate) {
      this.onCombatUpdate(this.combat.getState());
    }
  }

  startRounds(guardCount: number, prisonerCount: number) {
    this.roundSystem.setPlayerCounts(guardCount, prisonerCount);
    this.roundSystem.startGame();
  }

  openAllDoors() {
    this.doorSystem.openAllDoors();
  }

  closeAllDoors() {
    this.doorSystem.closeAllDoors();
  }

  setPointerLockEnabled(enabled: boolean) {
    this.controller.setPointerLockEnabled(enabled);
  }

  private onWindowResize() {
    const camera = this.controller.camera;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setOnStatsUpdate(callback: (fps: number, pos: THREE.Vector3) => void) {
    this.onStatsUpdate = callback;
  }

  setOnCombatUpdate(callback: (state: CombatState) => void) {
    this.onCombatUpdate = callback;
    callback(this.combat.getState());
  }

  setOnRoundUpdate(callback: (state: RoundState) => void) {
    this.onRoundUpdate = callback;
    callback(this.roundSystem.getState());
  }

  setOnDoorInteraction(callback: (state: DoorInteractionState) => void) {
    this.onDoorInteraction = callback;
  }

  setOnCameraSystemUpdate(callback: (state: CameraSystemState) => void) {
    this.onCameraSystemUpdate = callback;
    callback(this.cameraSystem.getState());
  }

  setOnInventoryUpdate(callback: (state: InventoryState) => void) {
    this.onInventoryUpdate = callback;
    callback(this.inventory.getState());
  }

  inventoryEquipSlot(index: number) {
    this.inventory.equipSlot(index);
  }

  inventorySetHovered(index: number | null) {
    this.inventory.setHoveredSlot(index);
  }

  selectSecurityCamera(index: number | null) {
    this.cameraSystem.selectCamera(index);
  }

  getTeam(): Team {
    return this.teamSystem.getTeam();
  }

  getTeamName(): string {
    return this.teamSystem.getTeamName();
  }

  start() {
    this.isRunning = true;
    this.prevTime = performance.now();
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  private setupSecurityCameras() {
    // Create terminal mesh and add to scene
    const terminalGroup = new THREE.Group();
    // Base
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.3, metalness: 0.85 });
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.1, metalness: 0.3, emissive: 0x0a1a3a, emissiveIntensity: 0.3 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.4), baseMat);
    base.position.set(0, 0.35, 0);
    terminalGroup.add(base);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.03), screenMat);
    screen.position.set(0, 1.05, -0.1);
    screen.rotation.x = -0.15;
    screen.userData.isTerminalScreen = true;
    terminalGroup.add(screen);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.3, metalness: 0.85 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.39, 0.02), frameMat);
    frame.position.set(0, 1.05, -0.12);
    frame.rotation.x = -0.15;
    terminalGroup.add(frame);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.06), baseMat);
    neck.position.set(0, 0.8, -0.1);
    terminalGroup.add(neck);
    // LED
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.6 });
    const led1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.01), ledMat);
    led1.position.set(-0.18, 0.74, -0.18);
    terminalGroup.add(led1);
    const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.01), ledMat);
    led2.position.set(-0.15, 0.74, -0.18);
    terminalGroup.add(led2);

    // Place terminal near the guard room (main corridor start)
    const terminalPos = new THREE.Vector3(2.5, 0, 12);
    terminalGroup.position.copy(terminalPos);
    this.scene.add(terminalGroup);

    this.cameraSystem.registerTerminal('terminal_1', terminalGroup, terminalPos, 1);

    // Register security cameras at strategic positions
    // Camera 1: Cell corridor
    this.cameraSystem.registerCamera(
      'cam_1',
      new THREE.Vector3(-10, 3.5, -5),
      new THREE.Euler(-0.3, Math.PI * 0.5, 0),
      1,
      'Коридор камер'
    );
    // Camera 2: Main corridor
    this.cameraSystem.registerCamera(
      'cam_2',
      new THREE.Vector3(-2.5, 3.5, -10),
      new THREE.Euler(-0.2, 0, 0),
      1,
      'Главный коридор'
    );
    // Camera 3: Yard entrance
    this.cameraSystem.registerCamera(
      'cam_3',
      new THREE.Vector3(-5, 4, -16),
      new THREE.Euler(-0.4, 0, 0),
      1,
      'Двор'
    );
    // Camera 4: Armory
    this.cameraSystem.registerCamera(
      'cam_4',
      new THREE.Vector3(8, 3.5, 2),
      new THREE.Euler(-0.2, -Math.PI * 0.5, 0),
      1,
      'Оружейная'
    );
  }

  private animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate.bind(this));

    const time = performance.now();
    const delta = Math.min((time - this.prevTime) / 1000, 0.1);
    this.prevTime = time;

    // FPS счётчик
    this.frameCount++;
    this.fpsTime += delta;
    if (this.fpsTime >= 1) {
      this.currentFps = Math.round(this.frameCount / this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = 0;
    }

    // Skip movement when in terminal mode
    if (!this.inTerminalMode) {
      // Обновляем контроллер
      this.controller.update(delta);

      // Проверяем движение для анимации рук
      const isMoving = this.controller.isMoving();
      this.hands.setWalking(isMoving);
      this.hands.update(delta);
      
      // Звуки шагов
      if (isMoving && document.pointerLockElement !== null) {
        this.footstepTimer += delta;
        if (this.footstepTimer >= this.FOOTSTEP_INTERVAL) {
          soundSystem.playFootstep();
          this.footstepTimer = 0;
        }
      } else {
        this.footstepTimer = 0;
      }

      // Обновляем боевую систему
      this.combat.update(delta);
    }

    // Обновляем систему раундов
    this.roundSystem.update(delta);

    // Обновляем двери
    this.doorSystem.update(delta);

    // Terminal raycast detection (when not in terminal mode)
    if (!this.inTerminalMode) {
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.controller.camera);
      this.cameraSystem.checkRaycast(this.raycaster);
    }

    // Проверяем возможность взаимодействия с дверью
    if (this.onDoorInteraction && !this.inTerminalMode) {
      const playerPos = this.controller.camera.position;
      const { canInteract, door } = this.doorSystem.canInteract(playerPos);
      this.onDoorInteraction({
        canInteract,
        door,
        isGuard: this.currentTeam === 'guard'
      });
    }

    // Отправляем статистику
    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.currentFps, this.controller.camera.position);
    }

    // Always update camera system (renders terminal screen textures)
    this.cameraSystem.update(delta, this.controller.camera);

    // Render: either from security camera or normal
    if (this.inTerminalMode && this.cameraSystem.selectedCameraIndex !== null) {
      // renderFromCamera already called inside update() above
    } else {
      this.renderer.render(this.scene, this.controller.camera);
    }
  }

  dispose() {
    this.stop();
    this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement);
    this.renderer.dispose();
    this.controller.dispose();
    this.combat.dispose();
    this.cameraSystem.dispose();
    document.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('resize', this.boundWindowResize);
  }
}
