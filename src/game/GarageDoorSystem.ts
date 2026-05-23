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

  private lockState: 'unlocked' | 'locked' | 'temp_locked' = 'unlocked';
  private tempLockEndTime: number = 0;

  public onDoorStateChange?: (doorId: string, isOpen: boolean) => void;
  public onAutoClose?: (doorId: string) => void;
  public onLockStateChange?: (state: { state: 'unlocked' | 'locked' | 'temp_locked'; remainingSeconds: number | null }) => void;

  registerDoor(id: string, mesh: THREE.Object3D, position: THREE.Vector3, doorHeight: number): GarageDoor {
    const closedPos = position.clone();
    const openPos = position.clone();
    // Door sinks below ground level when open (garage shutter sliding down out of view)
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

  toggleDoor(doorId: string, isGuard: boolean = false): boolean {
    const door = this.doors.find(d => d.id === doorId);
    if (!door) return false;

    // If locked, only guards can override
    if (!isGuard && (this.lockState === 'locked' || this.lockState === 'temp_locked')) {
      return false;
    }

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

  dispose() {
    for (const timer of this.autoCloseTimers.values()) {
      clearTimeout(timer);
    }
    this.autoCloseTimers.clear();
  }

  lockDoors() {
    this.lockState = 'locked';
    this.emitLockState();
  }

  unlockDoors() {
    this.lockState = 'unlocked';
    this.tempLockEndTime = 0;
    this.emitLockState();
  }

  tempLockDoors(durationMs: number) {
    this.lockState = 'temp_locked';
    this.tempLockEndTime = Date.now() + durationMs;
    this.emitLockState();
  }

  getLockState(): { state: 'unlocked' | 'locked' | 'temp_locked'; remainingSeconds: number | null } {
    if (this.lockState === 'temp_locked') {
      const remaining = Math.max(0, Math.ceil((this.tempLockEndTime - Date.now()) / 1000));
      return { state: 'temp_locked', remainingSeconds: remaining };
    }
    return { state: this.lockState, remainingSeconds: null };
  }

  private emitLockState() {
    if (this.onLockStateChange) {
      this.onLockStateChange(this.getLockState());
    }
  }

  update(delta: number) {
    // Check temp lock expiration
    if (this.lockState === 'temp_locked' && Date.now() >= this.tempLockEndTime) {
      this.lockState = 'unlocked';
      this.tempLockEndTime = 0;
      this.emitLockState();
    }

    const speed = 3;

    for (const door of this.doors) {
      const targetPos = door.isOpen ? door.openPosition : door.closedPosition;
      door.mesh.position.lerp(targetPos, delta * speed);
    }
  }
}
