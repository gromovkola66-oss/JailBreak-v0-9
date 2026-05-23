import * as THREE from 'three';

export interface Door {
  id: string;
  mesh: THREE.Object3D;
  isOpen: boolean;
  openPosition: THREE.Vector3;
  closedPosition: THREE.Vector3;
  cellIndex: number; // К какой камере относится дверь
}

export class DoorSystem {
  private doors: Door[] = [];
  private scene: THREE.Scene;
  private interactionRange = 3;
  
  // Callbacks
  public onDoorStateChange?: (doorId: string, isOpen: boolean) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Создание двери камеры
  createCellDoor(cellIndex: number, position: THREE.Vector3): Door {
    const doorWidth = 1.2;
    const doorHeight = 3;
    const doorDepth = 0.15;
    
    // Создаём дверь из решётки
    const doorGroup = new THREE.Group();
    
    // Рама двери
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.8
    });
    
    // Вертикальные прутья
    const barCount = 6;
    for (let i = 0; i < barCount; i++) {
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, doorHeight, 8),
        frameMaterial
      );
      bar.position.set(
        -doorWidth/2 + 0.1 + i * (doorWidth - 0.2) / (barCount - 1),
        0,
        0
      );
      doorGroup.add(bar);
    }
    
    // Горизонтальные перекладины
    for (let y of [-doorHeight/2 + 0.1, 0, doorHeight/2 - 0.1]) {
      const crossbar = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, 0.08, 0.08),
        frameMaterial
      );
      crossbar.position.set(0, y, 0);
      doorGroup.add(crossbar);
    }
    
    // Замок
    const lock = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 })
    );
    lock.position.set(doorWidth/2 - 0.15, 0, 0.1);
    doorGroup.add(lock);
    
    // Создаём меш-контейнер для двери
    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth),
      new THREE.MeshBasicMaterial({ visible: false }) // Невидимый хитбокс
    );
    doorMesh.add(doorGroup);
    doorMesh.position.copy(position);
    doorMesh.position.y = doorHeight / 2;
    
    this.scene.add(doorMesh);
    
    // Позиции открытой и закрытой двери
    const closedPos = doorMesh.position.clone();
    const openPos = closedPos.clone();
    openPos.x -= doorWidth + 0.3; // Сдвиг влево при открытии
    
    const door: Door = {
      id: `cell_door_${cellIndex}`,
      mesh: doorMesh,
      isOpen: false,
      openPosition: openPos,
      closedPosition: closedPos,
      cellIndex
    };
    
    this.doors.push(door);
    
    // Добавляем метаданные для взаимодействия
    doorMesh.userData.isDoor = true;
    doorMesh.userData.doorId = door.id;
    
    return door;
  }

  // Регистрация существующей двери (из редактора)
  registerDoor(cellIndex: number, group: THREE.Object3D, position: THREE.Vector3, rotationY: number): Door {
    const doorWidth = 1.2;

    // Направление сдвига перпендикулярно двери
    const slideX = Math.cos(rotationY) * (doorWidth + 0.3);
    const slideZ = -Math.sin(rotationY) * (doorWidth + 0.3);

    const closedPos = position.clone();
    const openPos = position.clone();
    openPos.x += slideX;
    openPos.z += slideZ;

    const door: Door = {
      id: `bars_door_${cellIndex}`,
      mesh: group,
      isOpen: false,
      openPosition: openPos,
      closedPosition: closedPos,
      cellIndex
    };

    this.doors.push(door);

    group.userData.isDoor = true;
    group.userData.doorId = door.id;

    return door;
  }

  // Открытие/закрытие двери
  toggleDoor(doorId: string): boolean {
    const door = this.doors.find(d => d.id === doorId);
    if (!door) return false;
    
    door.isOpen = !door.isOpen;
    
    if (this.onDoorStateChange) {
      this.onDoorStateChange(doorId, door.isOpen);
    }
    
    return true;
  }

  // Открыть все двери
  openAllDoors() {
    for (const door of this.doors) {
      if (!door.isOpen) {
        door.isOpen = true;
        if (this.onDoorStateChange) {
          this.onDoorStateChange(door.id, true);
        }
      }
    }
  }

  // Закрыть все двери
  closeAllDoors() {
    for (const door of this.doors) {
      if (door.isOpen) {
        door.isOpen = false;
        if (this.onDoorStateChange) {
          this.onDoorStateChange(door.id, false);
        }
      }
    }
  }

  // Найти ближайшую дверь к позиции
  findNearestDoor(position: THREE.Vector3): Door | null {
    let nearest: Door | null = null;
    let minDistance = this.interactionRange;
    
    for (const door of this.doors) {
      const distance = position.distanceTo(door.closedPosition);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = door;
      }
    }
    
    return nearest;
  }

  // Проверка возможности взаимодействия
  canInteract(position: THREE.Vector3): { canInteract: boolean; door: Door | null } {
    const door = this.findNearestDoor(position);
    return {
      canInteract: door !== null,
      door
    };
  }

  // Обновление анимации дверей
  update(delta: number) {
    const speed = 5;
    
    for (const door of this.doors) {
      const targetPos = door.isOpen ? door.openPosition : door.closedPosition;
      
      // Плавное перемещение к целевой позиции
      door.mesh.position.lerp(targetPos, delta * speed);
    }
  }

  getDoors(): Door[] {
    return this.doors;
  }

  getDoorState(doorId: string): boolean | null {
    const door = this.doors.find(d => d.id === doorId);
    return door ? door.isOpen : null;
  }
}
