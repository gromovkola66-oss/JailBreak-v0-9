export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  type: 'weapon' | 'melee' | 'consumable' | 'tool' | 'ammo' | 'empty';
  quantity: number;
  stackable?: boolean;
  maxStack?: number;
  description?: string;
  rarity?: string;
  category?: string;
}

export interface InventoryNotification {
  item: InventoryItem;
  timestamp: number;
}

export interface InventoryState {
  isOpen: boolean;
  slots: (InventoryItem | null)[];
  equippedSlot: number;
  hoveredSlot: number | null;
  dragFromSlot: number | null;
  activeCategory: string | null;
  notifications: InventoryNotification[];
}

const FISTS_ITEM: InventoryItem = {
  id: 'fists',
  name: '\u041a\u0443\u043b\u0430\u043a\u0438',
  icon: '\u{1F44A}',
  type: 'melee',
  quantity: 1,
};

export class InventorySystem {
  private slots: (InventoryItem | null)[] = [
    FISTS_ITEM, null, null, null,
    null, null, null, null,
    null, null, null, null,
    null, null, null, null,
  ];
  private isOpen = false;
  private equippedSlot = 0;
  private hoveredSlot: number | null = null;
  private dragFromSlot: number | null = null;
  private activeCategory: string | null = null;
  private notifications: InventoryNotification[] = [];

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
    this.dragFromSlot = null;
    this.onClose?.();
    this.notifyStateChange();
  }

  addItem(item: InventoryItem | { id: string; name: string; icon: string; type: string }): boolean {
    const invItem: InventoryItem = {
      id: item.id,
      name: item.name,
      icon: item.icon,
      type: (item as InventoryItem).type as InventoryItem['type'],
      quantity: (item as InventoryItem).quantity || 1,
      stackable: (item as InventoryItem).stackable,
      maxStack: (item as InventoryItem).maxStack,
      description: (item as InventoryItem).description,
      rarity: (item as InventoryItem).rarity,
      category: (item as InventoryItem).category,
    };

    // Try stacking first
    if (invItem.stackable) {
      for (let i = 0; i < this.slots.length; i++) {
        const slot = this.slots[i];
        if (slot && slot.id === invItem.id && slot.stackable) {
          const max = slot.maxStack || 1;
          if (slot.quantity < max) {
            slot.quantity = Math.min(slot.quantity + invItem.quantity, max);
            this.notifyStateChange();
            return true;
          }
        }
      }
    }

    // Find empty slot
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] === null) {
        this.slots[i] = invItem;
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

  swapSlots(from: number, to: number) {
    if (from < 0 || from >= this.slots.length) return;
    if (to < 0 || to >= this.slots.length) return;
    if (from === to) return;
    const temp = this.slots[from];
    this.slots[from] = this.slots[to];
    this.slots[to] = temp;
    // Update equippedSlot if it was swapped
    if (this.equippedSlot === from) {
      this.equippedSlot = to;
    } else if (this.equippedSlot === to) {
      this.equippedSlot = from;
    }
    this.notifyStateChange();
  }

  startDrag(slot: number) {
    if (slot < 0 || slot >= this.slots.length) return;
    this.dragFromSlot = slot;
    this.notifyStateChange();
  }

  endDrag(targetSlot: number | null) {
    if (this.dragFromSlot === null) return;
    if (targetSlot !== null && targetSlot !== this.dragFromSlot) {
      this.swapSlots(this.dragFromSlot, targetSlot);
    }
    this.dragFromSlot = null;
    this.notifyStateChange();
  }

  setActiveCategory(cat: string | null) {
    this.activeCategory = cat;
    this.notifyStateChange();
  }

  dropItem(slotIndex: number): InventoryItem | null {
    if (slotIndex < 0 || slotIndex >= this.slots.length) return null;
    const item = this.slots[slotIndex];
    if (!item || item.id === 'fists') return null;
    this.slots[slotIndex] = null;
    if (this.equippedSlot === slotIndex) {
      this.equippedSlot = 0;
      this.onEquip?.(this.slots[0], 0);
    }
    this.notifyStateChange();
    return item;
  }

  addNotification(item: InventoryItem) {
    const notification: InventoryNotification = { item, timestamp: Date.now() };
    this.notifications.push(notification);
    this.notifyStateChange();
    setTimeout(() => {
      const idx = this.notifications.indexOf(notification);
      if (idx >= 0) {
        this.notifications.splice(idx, 1);
        this.notifyStateChange();
      }
    }, 3000);
  }

  getState(): InventoryState {
    return {
      isOpen: this.isOpen,
      slots: [...this.slots],
      equippedSlot: this.equippedSlot,
      hoveredSlot: this.hoveredSlot,
      dragFromSlot: this.dragFromSlot,
      activeCategory: this.activeCategory,
      notifications: [...this.notifications],
    };
  }

  getIsOpen(): boolean {
    return this.isOpen;
  }

  dropAllItems(): InventoryItem[] {
    const dropped: InventoryItem[] = [];
    for (let i = 0; i < this.slots.length; i++) {
      const item = this.slots[i];
      if (item && item.id !== 'fists') {
        dropped.push(item);
        this.slots[i] = null;
      }
    }
    this.slots[0] = FISTS_ITEM;
    this.equippedSlot = 0;
    this.notifyStateChange();
    return dropped;
  }

  reset() {
    this.slots = [
      FISTS_ITEM, null, null, null,
      null, null, null, null,
      null, null, null, null,
      null, null, null, null,
    ];
    this.equippedSlot = 0;
    this.dragFromSlot = null;
    this.activeCategory = null;
    this.notifications = [];
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
