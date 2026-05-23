import * as THREE from 'three';
import { WalletSystem } from './economy/WalletSystem';
import { ECONOMY } from './economy/EconomyConfig';

export interface RentalOption {
  id: string;
  label: string;
  cost: number;
  durationMs: number;
}

export interface RentalDoor {
  id: string;
  cellLabel: string;
  mesh: THREE.Object3D;
  isOpen: boolean;
  openPosition: THREE.Vector3;
  closedPosition: THREE.Vector3;
  ownerId: string | null;
  expiresAt: number | null;
}

export const RENTAL_OPTIONS: RentalOption[] = [
  { id: 'rent_1h', label: 'Аренда 1 час', cost: ECONOMY.RENT_1H_COST, durationMs: 3600000 },
  { id: 'rent_24h', label: 'Аренда 24 часа', cost: ECONOMY.RENT_24H_COST, durationMs: 86400000 },
  { id: 'buy', label: 'Купить навсегда', cost: ECONOMY.BUY_COST, durationMs: Infinity },
];

export class RentalDoorSystem {
  private doors: RentalDoor[] = [];
  private interactionRange = 3;

  public onDoorStateChange?: (doorId: string, isOpen: boolean) => void;
  public onShowRentalMenu?: (door: RentalDoor) => void;
  public onRentalExpired?: (door: RentalDoor) => void;

  registerDoor(id: string, cellLabel: string, mesh: THREE.Object3D, position: THREE.Vector3, rotationY: number): RentalDoor {
    const doorWidth = 1.2;

    const slideX = Math.cos(rotationY) * (doorWidth + 0.3);
    const slideZ = -Math.sin(rotationY) * (doorWidth + 0.3);

    const closedPos = position.clone();
    const openPos = position.clone();
    openPos.x += slideX;
    openPos.z += slideZ;

    const door: RentalDoor = {
      id,
      cellLabel,
      mesh,
      isOpen: false,
      openPosition: openPos,
      closedPosition: closedPos,
      ownerId: null,
      expiresAt: null,
    };

    this.doors.push(door);

    mesh.userData.isDoor = true;
    mesh.userData.doorId = door.id;

    return door;
  }

  interact(position: THREE.Vector3, team: 'guard' | 'prisoner'): { type: 'toggle' | 'menu' | 'none'; door?: RentalDoor } {
    const door = this.findNearest(position);
    if (!door) return { type: 'none' };

    if (team === 'guard') {
      return { type: 'toggle', door };
    }

    // Prisoner: if owned by player, toggle; otherwise show menu
    if (door.ownerId === 'player') {
      return { type: 'toggle', door };
    }

    return { type: 'menu', door };
  }

  rent(doorId: string, optionId: string, wallet: WalletSystem): boolean {
    const door = this.doors.find(d => d.id === doorId);
    if (!door) return false;

    const option = RENTAL_OPTIONS.find(o => o.id === optionId);
    if (!option) return false;

    if (!wallet.spendMoney(option.cost)) return false;

    door.ownerId = 'player';
    door.expiresAt = option.durationMs === Infinity ? null : Date.now() + option.durationMs;

    return true;
  }

  toggleDoor(doorId: string, team: 'guard' | 'prisoner'): boolean {
    const door = this.doors.find(d => d.id === doorId);
    if (!door) return false;

    if (team === 'prisoner' && door.ownerId !== 'player') return false;

    door.isOpen = !door.isOpen;

    this.onDoorStateChange?.(doorId, door.isOpen);

    return true;
  }

  update(delta: number) {
    const speed = 5;

    for (const door of this.doors) {
      const targetPos = door.isOpen ? door.openPosition : door.closedPosition;
      door.mesh.position.lerp(targetPos, delta * speed);

      // Check expiry
      if (door.expiresAt !== null && Date.now() > door.expiresAt) {
        door.ownerId = null;
        door.expiresAt = null;
        if (door.isOpen) {
          door.isOpen = false;
          this.onDoorStateChange?.(door.id, false);
        }
        this.onRentalExpired?.(door);
      }
    }
  }

  findNearest(position: THREE.Vector3): RentalDoor | null {
    let nearest: RentalDoor | null = null;
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

  canInteract(position: THREE.Vector3): { canInteract: boolean; door: RentalDoor | null } {
    const door = this.findNearest(position);
    return {
      canInteract: door !== null,
      door,
    };
  }
}
