export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  type: 'weapon' | 'melee' | 'consumable' | 'tool' | 'empty';
}

export interface InventoryState {
  isOpen: boolean;
  slots: (InventoryItem | null)[];
  equippedSlot: number;
  hoveredSlot: number | null;
}

const FISTS_ITEM: InventoryItem = {
  id: 'fists',
  name: 'Кулаки',
  icon: '👊',
  type: 'melee',
};

export class InventorySystem {
  private slots: (InventoryItem | null)[] = [FISTS_ITEM, null, null, null, null, null];
  private isOpen = false;
  private equippedSlot = 0;
  private hoveredSlot: number | null = null;

  public onStateChange?: (state: InventoryState) => void;
  public onOpen?: () => void;
  public onClose?: () => void;
  public onEquip?: (item: InventoryItem | null, slotIndex: number) => void;

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.onOpen?.();
    this.notifyStateChange();
  }

  close() {
    this.isOpen = false;
    this.hoveredSlot = null;
    this.onClose?.();
    this.notifyStateChange();
  }

  addItem(item: InventoryItem): boolean {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] === null) {
        this.slots[i] = item;
        this.notifyStateChange();
        return true;
      }
    }
    return false;
  }

  removeItem(id: string) {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i]?.id === id) {
        this.slots[i] = null;
        if (this.equippedSlot === i) {
          this.equippedSlot = 0;
          this.onEquip?.(this.slots[0], 0);
        }
        this.notifyStateChange();
        return;
      }
    }
  }

  equipSlot(index: number) {
    if (index < 0 || index >= this.slots.length) return;
    this.equippedSlot = index;
    this.onEquip?.(this.slots[index], index);
    this.notifyStateChange();
    if (this.isOpen) {
      this.close();
    }
  }

  setHoveredSlot(index: number | null) {
    this.hoveredSlot = index;
    this.notifyStateChange();
  }

  getState(): InventoryState {
    return {
      isOpen: this.isOpen,
      slots: [...this.slots],
      equippedSlot: this.equippedSlot,
      hoveredSlot: this.hoveredSlot,
    };
  }

  getIsOpen(): boolean {
    return this.isOpen;
  }

  reset() {
    this.slots = [FISTS_ITEM, null, null, null, null, null];
    this.equippedSlot = 0;
    if (this.isOpen) {
      this.isOpen = false;
      this.hoveredSlot = null;
    }
    this.notifyStateChange();
  }

  private notifyStateChange() {
    this.onStateChange?.(this.getState());
  }
}
