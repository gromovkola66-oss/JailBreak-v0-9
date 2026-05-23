import * as THREE from 'three';

export interface GarageDoor {
  id: string;
  mesh: THREE.Object3D;
  isOpen: boolean;
  openPosition: THREE.Vector3;
  closedPosition: THREE.Vector3;
  doorHeight: number;
}

export class GarageDoorSystem {
  private doors: GarageDoor[] = [];
  private autoCloseTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private interactionRange = 3.5;

  public onDoorStateChange?: (doorId: string, isOpen: boolean) => void;
  public onAutoClose?: (doorId: string) => void;

  registerDoor(id: string, mesh: THREE.Object3D, position: THREE.Vector3, doorHeight: number): GarageDoor {
    const closedPos = position.clone();
    const openPos = position.clone();
    openPos.y = closedPos.y - doorHeight;

    const door: GarageDoor = {
      id,
      mesh,
      isOpen: false,
      openPosition: openPos,
      closedPosition: closedPos,
      doorHeight,
    };

    this.doors.push(door);
    return door;
  }

  toggleDoor(doorId: string): boolean {
    const door = this.doors.find(d => d.id === doorId);
    if (!door) return false;

    door.isOpen = !door.isOpen;

    if (door.isOpen) {
      // Door was opened - start auto-close timer
      const timer = setTimeout(() => {
        this.autoCloseDoor(doorId);
      }, 5000);
      this.autoCloseTimers.set(doorId, timer);
    } else {
      // Door was manually closed - cancel any existing auto-close timer
      const existingTimer = this.autoCloseTimers.get(doorId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.autoCloseTimers.delete(doorId);
      }
    }

    if (this.onDoorStateChange) {
      this.onDoorStateChange(doorId, door.isOpen);
    }

    return door.isOpen;
  }

  private autoCloseDoor(doorId: string) {
    const door = this.doors.find(d => d.id === doorId);
    if (!door) return;
    if (!door.isOpen) return;

    door.isOpen = false;
    this.autoCloseTimers.delete(doorId);

    if (this.onDoorStateChange) {
      this.onDoorStateChange(doorId, false);
    }

    if (this.onAutoClose) {
      this.onAutoClose(doorId);
    }
  }

  canInteract(playerPosition: THREE.Vector3): { canInteract: boolean; door: GarageDoor | null } {
    let nearest: GarageDoor | null = null;
    let minDistance = this.interactionRange;

    for (const door of this.doors) {
      const distance = playerPosition.distanceTo(door.mesh.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = door;
      }
    }

    return {
      canInteract: nearest !== null,
      door: nearest,
    };
  }

  update(delta: number) {
    const speed = 3;

    for (const door of this.doors) {
      const targetPos = door.isOpen ? door.openPosition : door.closedPosition;
      door.mesh.position.lerp(targetPos, delta * speed);
    }
  }
}
