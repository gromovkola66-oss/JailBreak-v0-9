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
  hotbarIndex: number;
  vestEquipped: boolean;
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
  ];
  private isOpen = false;
  private equippedSlot = 0;
  private hotbarIndex = 0;
  private vestEquipped = false;
  private hoveredSlot: number | null = null;
  private dragFromSlot: number | null = null;
  private activeCategory: string | null = null;
  private notifications: InventoryNotification[] = [];

  public onStateChange?: (state: InventoryState) => void;
  public onOpen?: () => void;
  public onClose?: () => void;
  public onEquip?: (item: InventoryItem | null, slotIndex: number) => void;
  public onVestEquip?: () => void;

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

  setHotbarIndex(index: number) {
    if (index < 0 || index > 3) return;
    this.hotbarIndex = index;
    this.equippedSlot = index;
    this.onEquip?.(this.slots[index], index);
    this.notifyStateChange();
  }

  cycleHotbar(direction: number) {
    let newIndex = this.hotbarIndex + (direction > 0 ? 1 : -1);
    if (newIndex < 0) newIndex = 3;
    if (newIndex > 3) newIndex = 0;
    this.setHotbarIndex(newIndex);
  }

  equipVest(): boolean {
    const vestIndex = this.slots.findIndex(s => s?.id === 'item_vest');
    if (vestIndex < 0) return false;
    this.slots[vestIndex] = null;
    this.vestEquipped = true;
    if (this.equippedSlot === vestIndex) {
      this.equippedSlot = 0;
      this.hotbarIndex = 0;
      this.onEquip?.(this.slots[0], 0);
    }
    this.onVestEquip?.();
    this.notifyStateChange();
    return true;
  }

  unequipVest(): boolean {
    if (!this.vestEquipped) return false;
    // Find an empty slot to return the vest item
    const emptyIndex = this.slots.findIndex(s => s === null);
    if (emptyIndex < 0) return false; // No empty slot, keep vest equipped
    this.slots[emptyIndex] = {
      id: 'item_vest',
      name: '\u0411\u0440\u043e\u043d\u0435\u0436\u0438\u043b\u0435\u0442',
      icon: '\u{1F9BA}',
      type: 'tool',
      quantity: 1,
      stackable: false,
      maxStack: 1,
      description: '\u0417\u0430\u0449\u0438\u0442\u043d\u044b\u0439 \u0431\u0440\u043e\u043d\u0435\u0436\u0438\u043b\u0435\u0442. \u041f\u043e\u0433\u043b\u043e\u0449\u0430\u0435\u0442 \u0443\u0440\u043e\u043d \u0441\u043e\u0437\u0434\u0430\u0432\u0430\u044f \u0449\u0438\u0442 \u0431\u0440\u043e\u043d\u0438.',
      rarity: 'rare',
      category: 'tool',
    };
    this.vestEquipped = false;
    this.notifyStateChange();
    return true;
  }

  addItem(item: InventoryItem | { id: string; name: string; icon: string; type: string }): boolean {
    // Prevent vest duplication: reject if vest already equipped or in inventory
    if (item.id === 'item_vest') {
      if (this.vestEquipped) return false;
      if (this.slots.some(s => s?.id === 'item_vest')) return false;
    }

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
          this.hotbarIndex = 0;
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
    this.hotbarIndex = Math.min(index, 3);
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
    if (from === 0 || to === 0) return; // Fists locked in slot 0
    const temp = this.slots[from];
    this.slots[from] = this.slots[to];
    this.slots[to] = temp;
    // Update equippedSlot if it was swapped
    if (this.equippedSlot === from) {
      this.equippedSlot = to;
    } else if (this.equippedSlot === to) {
      this.equippedSlot = from;
    }
    // Update hotbarIndex if it was swapped
    if (this.hotbarIndex === from) {
      this.hotbarIndex = to;
    } else if (this.hotbarIndex === to) {
      this.hotbarIndex = from;
    }
    this.hotbarIndex = Math.min(this.hotbarIndex, 3);
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
      this.hotbarIndex = 0;
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
      hotbarIndex: this.hotbarIndex,
      vestEquipped: this.vestEquipped,
      hoveredSlot: this.hoveredSlot,
      dragFromSlot: this.dragFromSlot,
      activeCategory: this.activeCategory,
      notifications: [...this.notifications],
    };
  }

  getIsOpen(): boolean {
    return this.isOpen;
  }

  getVestEquipped(): boolean {
    return this.vestEquipped;
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
    this.hotbarIndex = 0;
    this.notifyStateChange();
    return dropped;
  }

  reset() {
    this.slots = [
      FISTS_ITEM, null, null, null,
      null, null, null, null,
    ];
    this.equippedSlot = 0;
    this.hotbarIndex = 0;
    this.vestEquipped = false;
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
