export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  type: 'melee' | 'tool' | 'consumable';
}

export const ITEM_DEFS: Record<string, ItemDef> = {
  'item_shiv': { id: 'item_shiv', name: '\u0417\u0430\u0442\u043e\u0447\u043a\u0430', icon: '\u{1F5E1}\uFE0F', type: 'melee' },
  'item_baton': { id: 'item_baton', name: '\u0414\u0443\u0431\u0438\u043d\u043a\u0430', icon: '\u{1F3CF}', type: 'melee' },
  'item_shield': { id: 'item_shield', name: '\u0429\u0438\u0442', icon: '\u{1F6E1}\uFE0F', type: 'melee' },
  'item_flashlight': { id: 'item_flashlight', name: '\u0424\u043e\u043d\u0430\u0440\u0438\u043a', icon: '\u{1F526}', type: 'tool' },
  'item_medkit': { id: 'item_medkit', name: '\u0410\u043f\u0442\u0435\u0447\u043a\u0430', icon: '\u{1F48A}', type: 'consumable' },
  'item_bandage': { id: 'item_bandage', name: '\u0411\u0438\u043d\u0442\u044b', icon: '\u{1FA79}', type: 'consumable' },
};
