import * as storage from './storage.js';
import { addMoney } from './economy.js';
import { addWhiteRep, addBlackRep } from './reputation.js';
import { updateRelationship } from './npcSystem.js';
import { showNotification } from './notifications.js';
import { addMessageFromNpc } from '../apps/messenger.js';

const QUEST_STATE_KEY = 'quest_state';

const quests = [
  // Main chain
  {
    id: 'first_steps',
    title: 'Первые шаги',
    description: 'Изучи основы работы в цифровом мире.',
    giver: 'alexey',
    type: 'main',
    steps: [
      { desc: 'Открыть терминал и выполнить команду help', type: 'terminal_help', current: 0, required: 1 }
    ],
    rewards: { dc: 100 },
    requirements: {}
  },
  {
    id: 'freelance_beginner',
    title: 'Фриланс для начинающих',
    description: 'Заработай свои первые деньги на фрилансе.',
    giver: 'alexey',
    type: 'main',
    steps: [
      { desc: 'Выполнить 2 задания на ФрилансБирже', type: 'freelance_complete', current: 0, required: 2 }
    ],
    rewards: { dc: 200 },
    requirements: { previousQuests: ['first_steps'] }
  },
  {
    id: 'dark_side',
    title: 'Тёмная сторона',
    description: 'Исследуй тёмную сторону цифрового мира.',
    giver: 'alexey',
    type: 'main',
    steps: [
      { desc: 'Установить VPN', type: 'vpn_activate', current: 0, required: 1 },
      { desc: 'Зайти на ХакФорум', type: 'visit_hackforum', current: 0, required: 1 }
    ],
    rewards: { dc: 150, blackRep: 10 },
    requirements: { previousQuests: ['freelance_beginner'] }
  },
  {
    id: 'first_hack',
    title: 'Первый взлом',
    description: 'Выполни свой первый взлом по заданию Ghost.',
    giver: 'ghost',
    type: 'main',
    steps: [
      { desc: 'Взломать Домашний ПК Виктора (192.168.1.10)', type: 'hack_target', target: '192.168.1.10', current: 0, required: 1 }
    ],
    rewards: { dc: 300, blackRep: 15 },
    requirements: { previousQuests: ['dark_side'] }
  },
  {
    id: 'journalist_investigation',
    title: 'Журналистское расследование',
    description: 'Помоги Марине с расследованием.',
    giver: 'marina',
    type: 'main',
    steps: [
      { desc: 'Взломать почтовый сервер (172.16.0.5)', type: 'hack_target', target: '172.16.0.5', current: 0, required: 1 },
      { desc: 'Скачать email_archive.mbox', type: 'download_file', target: 'email_archive.mbox', current: 0, required: 1 }
    ],
    rewards: { dc: 500, whiteRep: 20, blackRep: 10 },
    requirements: { previousQuests: ['first_hack'] }
  },
  // Side quests
  {
    id: 'help_with_virus',
    title: 'Помоги с вирусом',
    description: 'Анна просит помочь очистить её систему от вируса.',
    giver: 'anna',
    type: 'side',
    steps: [
      { desc: 'Просканировать систему антивирусом', type: 'antivirus_scan', current: 0, required: 1 }
    ],
    rewards: { dc: 100, relationship: { anna: 20 } },
    requirements: {}
  },
  {
    id: 'investment',
    title: 'Инвестиция',
    description: 'Максим предлагает вложить деньги в рискованное дело.',
    giver: 'maxim',
    type: 'side',
    steps: [
      { desc: 'Вложить 200 DC', type: 'invest_money', current: 0, required: 1 }
    ],
    rewards: { dc: 400 },
    requirements: {}
  },
  {
    id: 'dubious_offer',
    title: 'Сомнительное предложение',
    description: 'Виктор предлагает продать краденые данные.',
    giver: 'victor',
    type: 'side',
    steps: [
      { desc: 'Продать краденые данные', type: 'sell_data', current: 0, required: 1 }
    ],
    rewards: { dc: 800, whiteRep: -20 },
    requirements: {}
  },
  {
    id: 'stress_test',
    title: 'Тест на прочность',
    description: 'Ольга приглашает проверить её защиту.',
    giver: 'olga',
    type: 'side',
    steps: [
      { desc: 'Попытаться взломать ПК Ольги', type: 'hack_attempt_olga', current: 0, required: 1 }
    ],
    rewards: { relationship: { olga: 30 } },
    requirements: {}
  }
];

function getState() {
  const saved = storage.get(QUEST_STATE_KEY);
  if (saved) return saved;
  return { active: {}, completed: [], available: [] };
}

function saveState(state) {
  storage.set(QUEST_STATE_KEY, state);
}

export function getQuests() {
  return quests;
}

export function getQuestById(id) {
  return quests.find(q => q.id === id) || null;
}

export function getAvailableQuests() {
  const state = getState();
  return state.available.map(id => getQuestById(id)).filter(Boolean);
}

export function getActiveQuests() {
  const state = getState();
  return Object.keys(state.active).map(id => {
    const quest = getQuestById(id);
    if (!quest) return null;
    return { ...quest, steps: state.active[id].steps };
  }).filter(Boolean);
}

export function getCompletedQuests() {
  const state = getState();
  return state.completed.map(id => getQuestById(id)).filter(Boolean);
}

export function startQuest(id) {
  const state = getState();
  const quest = getQuestById(id);
  if (!quest) return false;
  if (state.active[id] || state.completed.includes(id)) return false;

  // Remove from available
  state.available = state.available.filter(qId => qId !== id);

  // Add to active with fresh step progress
  state.active[id] = {
    steps: quest.steps.map(s => ({ ...s, current: 0 })),
    startedAt: Date.now()
  };
  saveState(state);

  showNotification({
    type: 'quest',
    title: 'Новый квест',
    description: quest.title
  });

  return true;
}

export function updateQuestStep(questId, stepType, targetValue) {
  const state = getState();
  if (!state.active[questId]) return false;

  const activeQuest = state.active[questId];
  let updated = false;

  for (const step of activeQuest.steps) {
    if (step.type === stepType) {
      if (step.target && targetValue && step.target !== targetValue) continue;
      if (step.current < step.required) {
        step.current++;
        updated = true;
        break;
      }
    }
  }

  if (updated) {
    saveState(state);

    // Check if all steps complete
    const allDone = activeQuest.steps.every(s => s.current >= s.required);
    if (allDone) {
      completeQuest(questId);
    }
  }

  return updated;
}

export function completeQuest(id) {
  const state = getState();
  if (!state.active[id]) return false;

  const quest = getQuestById(id);
  if (!quest) return false;

  // Remove from active
  delete state.active[id];
  state.completed.push(id);
  saveState(state);

  // Grant rewards
  if (quest.rewards.dc) {
    addMoney(quest.rewards.dc, `Награда за квест: ${quest.title}`);
  }
  if (quest.rewards.whiteRep && quest.rewards.whiteRep > 0) {
    addWhiteRep(quest.rewards.whiteRep, `Квест: ${quest.title}`);
  }
  if (quest.rewards.whiteRep && quest.rewards.whiteRep < 0) {
    addWhiteRep(quest.rewards.whiteRep, `Квест: ${quest.title}`);
  }
  if (quest.rewards.blackRep) {
    addBlackRep(quest.rewards.blackRep, `Квест: ${quest.title}`);
  }
  if (quest.rewards.relationship) {
    for (const [npcId, amount] of Object.entries(quest.rewards.relationship)) {
      updateRelationship(npcId, amount);
    }
  }

  showNotification({
    type: 'money',
    title: 'Квест выполнен!',
    description: `${quest.title}${quest.rewards.dc ? ` (+${quest.rewards.dc} DC)` : ''}`
  });

  // Check if new quests become available
  checkAndUnlockQuests();
  return true;
}

function checkAndUnlockQuests() {
  const state = getState();
  for (const quest of quests) {
    if (state.completed.includes(quest.id)) continue;
    if (state.active[quest.id]) continue;
    if (state.available.includes(quest.id)) continue;

    // Check requirements
    if (quest.requirements.previousQuests) {
      const allMet = quest.requirements.previousQuests.every(qId => state.completed.includes(qId));
      if (!allMet) continue;
    }

    state.available.push(quest.id);
  }
  saveState(state);
}

export function checkAndAutoStart() {
  // Auto-start available quests that have no complex requirements
  // This is called periodically or on events
  checkAndUnlockQuests();
}

export function initQuestSystem() {
  const state = getState();
  const isFirstTime = state.available.length === 0 && state.completed.length === 0 && Object.keys(state.active).length === 0;

  if (isFirstTime) {
    state.available.push('first_steps');
    state.available.push('help_with_virus');
    state.available.push('investment');
    state.available.push('dubious_offer');
    state.available.push('stress_test');
    saveState(state);

    // Send initial messages from NPCs
    setTimeout(() => {
      addMessageFromNpc('alexey', 'Привет! Я заметил тебя в сети. Ты новенький? Если нужна помощь - пиши, подскажу что к чему.');
      setTimeout(() => {
        addMessageFromNpc('anna', 'Привет! Мы случайно не знакомы? Увидела тебя в рекомендациях \u{1F60A}');
      }, 2000);
    }, 3000);
  } else {
    // Re-check unlocks on load
    checkAndUnlockQuests();
  }
}
