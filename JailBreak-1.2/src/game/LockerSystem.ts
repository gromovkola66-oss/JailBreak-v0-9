/**
 * LockerSystem - Система хранения шкафов
 *
 * Механизм привязки: каждый storage_locker на карте имеет поле label (строка),
 * которое совпадает с cellLabel арендной двери (bars_door_rental). Если игрок
 * арендовал камеру (дверь с соответствующим cellLabel имеет ownerId === 'player'),
 * то он может открыть шкаф с таким же label. Охранники могут открывать любые шкафы.
 *
 * Шкаф хранит до 30 предметов (слоты) и неограниченное количество денег.
 */

import * as THREE from 'three';
import { InventoryItem, InventorySystem } from './InventorySystem';
import { WalletSystem } from './economy/WalletSystem';
import { RentalDoorSystem } from './RentalDoorSystem';

export interface LockerState {
  isOpen: boolean;
  slots: (InventoryItem | null)[];
  storedMoney: number;
  linkedGroupId: number;
  lockerObjectId: string;
}

interface LockerData {
  id: string;
  groupId: number;
  position: THREE.Vector3;
  slots: (InventoryItem | null)[];
  storedMoney: number;
}

export class LockerSystem {
  private lockers: Map<string, LockerData> = new Map();
  private interactionRange = 2.5;
  private openLockerId: string | null = null;

  public onStateChange?: (state: LockerState | null) => void;

  registerLocker(id: string, groupId: number, position: THREE.Vector3): void {
    const slots: (InventoryItem | null)[] = new Array(30).fill(null);
    this.lockers.set(id, {
      id,
      groupId,
      position: position.clone(),
      slots,
      storedMoney: 0,
    });
  }

  findNearest(position: THREE.Vector3): LockerData | null {
    let nearest: LockerData | null = null;
    let minDist = this.interactionRange;

    for (const locker of this.lockers.values()) {
      const dist = position.distanceTo(locker.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = locker;
      }
    }

    return nearest;
  }

  canInteract(position: THREE.Vector3): { canInteract: boolean; lockerId: string | null } {
    const locker = this.findNearest(position);
    if (!locker) return { canInteract: false, lockerId: null };
    return { canInteract: true, lockerId: locker.id };
  }

  tryOpen(lockerId: string, team: 'guard' | 'prisoner', rentalDoorSystem: RentalDoorSystem): boolean {
    const locker = this.lockers.get(lockerId);
    if (!locker) return false;

    // Охранники всегда могут открыть
    if (team === 'guard') {
      this.open(lockerId);
      return true;
    }

    // Заключенные - проверяем, арендована ли камера с таким groupId
    // groupId <= 0 означает ненастроенный шкаф - запрещаем доступ
    if (locker.groupId <= 0) return false;
    if (!rentalDoorSystem.isDoorOwnedByPlayerByGroupId(locker.groupId)) return false;

    this.open(lockerId);
    return true;
  }

  open(lockerId: string): void {
    this.openLockerId = lockerId;
    this.emitState();
  }

  close(): void {
    this.openLockerId = null;
    this.onStateChange?.(null);
  }

  isOpen(): boolean {
    return this.openLockerId !== null;
  }

  getOpenLockerId(): string | null {
    return this.openLockerId;
  }

  depositMoney(lockerId: string, amount: number, walletSystem: WalletSystem): boolean {
    const locker = this.lockers.get(lockerId);
    if (!locker) return false;
    if (amount <= 0) return false;

    if (!walletSystem.spendMoney(amount)) return false;

    locker.storedMoney += amount;
    this.emitState();
    return true;
  }

  withdrawMoney(lockerId: string, amount: number, walletSystem: WalletSystem): boolean {
    const locker = this.lockers.get(lockerId);
    if (!locker) return false;
    if (amount <= 0) return false;
    if (locker.storedMoney < amount) return false;

    locker.storedMoney -= amount;
    walletSystem.addMoney(amount);
    this.emitState();
    return true;
  }

  depositItem(lockerId: string, inventorySlotIndex: number, inventorySystem: InventorySystem): boolean {
    const locker = this.lockers.get(lockerId);
    if (!locker) return false;

    const state = inventorySystem.getState();
    const item = state.slots[inventorySlotIndex];
    if (!item || item.id === 'fists') return false;

    // Найти свободный слот в шкафу
    const emptyIdx = locker.slots.findIndex(s => s === null);
    if (emptyIdx < 0) return false;

    // Удалить из инвентаря
    const dropped = inventorySystem.dropItem(inventorySlotIndex);
    if (!dropped) return false;

    locker.slots[emptyIdx] = dropped;
    this.emitState();
    return true;
  }

  withdrawItem(lockerId: string, lockerSlotIndex: number, inventorySystem: InventorySystem): boolean {
    const locker = this.lockers.get(lockerId);
    if (!locker) return false;

    const item = locker.slots[lockerSlotIndex];
    if (!item) return false;

    // Попытка добавить в инвентарь
    const added = inventorySystem.addItem(item);
    if (!added) return false;

    locker.slots[lockerSlotIndex] = null;
    this.emitState();
    return true;
  }

  private emitState(): void {
    if (!this.openLockerId) {
      this.onStateChange?.(null);
      return;
    }

    const locker = this.lockers.get(this.openLockerId);
    if (!locker) {
      this.onStateChange?.(null);
      return;
    }

    this.onStateChange?.({
      isOpen: true,
      slots: [...locker.slots],
      storedMoney: locker.storedMoney,
      linkedGroupId: locker.groupId,
      lockerObjectId: locker.id,
    });
  }
}
