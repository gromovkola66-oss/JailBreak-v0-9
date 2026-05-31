// NOTE: Circular dependency with ../apps/messenger.js (messenger imports updateQuestStep from here).
// This works in ES modules because both sides only call the imported function inside event handlers,
// never at module-evaluation time.
import * as storage from './storage.js';
import { addMoney } from './economy.js';
import { addWhiteRep, addBlackRep } from './reputation.js';
import { updateRelationship, addNpcPost } from './npcSystem.js';
import { showNotification } from './notifications.js';
import { addMessageFromNpc } from '../apps/messenger.js';
import { addXP, getLevel } from './levelSystem.js';
import { hasSkillEffect } from './skillSystem.js';

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
  },
  {
    id: 'skill_path_hacker',
    title: 'Путь хакера',
    description: 'Изучи 3 навыка в ветке "Хакинг".',
    giver: 'ghost',
    type: 'side',
    steps: [
      { desc: 'Изучить 3 навыка в ветке Хакинг', type: 'learn_hacking_skills', current: 0, required: 3 }
    ],
    rewards: { dc: 400, blackRep: 20 },
    requirements: { minLevel: 3 }
  },
  {
    id: 'skill_shield_sword',
    title: 'Щит и меч',
    description: 'Изучи 2 навыка в ветке "Защита".',
    giver: 'igor',
    type: 'side',
    steps: [
      { desc: 'Изучить 2 навыка в ветке Защита', type: 'learn_defense_skills', current: 0, required: 2 }
    ],
    rewards: { dc: 300, whiteRep: 15 },
    requirements: { minLevel: 3 }
  },
  {
    id: 'skill_own_business',
    title: 'Свой бизнес',
    description: 'Изучи навык "Предприниматель" и создай свой магазин.',
    giver: 'elena',
    type: 'side',
    steps: [
      { desc: 'Изучить навык Предприниматель', type: 'learn_entrepreneur', current: 0, required: 1 },
      { desc: 'Создать свой магазин', type: 'create_shop', current: 0, required: 1 }
    ],
    rewards: { dc: 1000 },
    requirements: { minLevel: 5 }
  },
  {
    id: 'skill_first_script',
    title: 'Первый скрипт',
    description: 'Изучи навык "Скрипты" и напиши скрипт в терминале.',
    giver: 'alexey',
    type: 'side',
    steps: [
      { desc: 'Изучить навык Скрипты', type: 'learn_scripts', current: 0, required: 1 },
      { desc: 'Выполнить команду script в терминале', type: 'use_script_command', current: 0, required: 1 }
    ],
    rewards: { dc: 250, whiteRep: 10 },
    requirements: { minLevel: 3 }
  },
  {
    id: 'skill_master_communication',
    title: 'Мастер общения',
    description: 'Изучи навык "Общительность" и добавь 5 друзей.',
    giver: 'anna',
    type: 'side',
    steps: [
      { desc: 'Изучить навык Общительность', type: 'learn_sociability', current: 0, required: 1 },
      { desc: 'Добавить 5 друзей в СетьЛайф', type: 'add_friends_count', current: 0, required: 5 }
    ],
    rewards: { dc: 200, relationship: { anna: 30, alexey: 30, marina: 30, elena: 30, igor: 30 } },
    requirements: { minLevel: 4 }
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
  const xpReward = quest.type === 'main' ? 200 : 100;
  addXP(xpReward, 'Квест: ' + quest.title);

  const dcReward = quest.rewards.dc ? Math.floor(quest.rewards.dc * (hasSkillEffect('better_rewards') ? 1.5 : 1)) : 0;
  if (dcReward) {
    addMoney(dcReward, `Награда за квест: ${quest.title}`);
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
    description: `${quest.title}${dcReward ? ` (+${dcReward} DC)` : ''}`
  });

  // NPC posts react to quest completion
  if (id === 'first_steps') {
    addNpcPost('alexey', '\u0415\u0449\u0451 \u043e\u0434\u0438\u043d \u043d\u043e\u0432\u0438\u0447\u043e\u043a \u043e\u0441\u0432\u043e\u0438\u043b\u0441\u044f! \u0420\u0430\u0434 \u043f\u043e\u043c\u043e\u0447\u044c \u{1F389}');
    addMessageFromNpc('alexey', 'Отлично! Теперь ты знаешь основы. Попробуй заработать на ФрилансБирже.');
  } else if (id === 'freelance_beginner') {
    addMessageFromNpc('alexey', 'Фриланс - хороший старт. Но есть способы заработать больше... Установи VPN и загляни на ХакФорум.');
  } else if (id === 'first_hack') {
    addNpcPost('ghost', '\u041d\u043e\u0432\u044b\u0439 \u043a\u0430\u0434\u0440 \u0432 \u0434\u0435\u043b\u0435. \u0412\u043f\u0435\u0447\u0430\u0442\u043b\u044f\u0435\u0442.');
    addMessageFromNpc('ghost', 'Чисто сработано. Ты мне нравишься. У меня будет для тебя ещё работа.');
  } else if (id === 'journalist_investigation') {
    addNpcPost('marina', '\u041f\u043e\u043b\u0443\u0447\u0438\u043b\u0430 \u0432\u0430\u0436\u043d\u044b\u0435 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b. \u0421\u043a\u043e\u0440\u043e \u0431\u0443\u0434\u0435\u0442 \u0433\u0440\u043e\u043c\u043a\u0430\u044f \u0441\u0442\u0430\u0442\u044c\u044f!');
    addMessageFromNpc('marina', 'Спасибо! Эти документы - именно то, что нужно. Ты очень помог.');
  } else if (id === 'help_with_virus') {
    addNpcPost('anna', '\u0421\u043f\u0430\u0441\u0438\u0431\u043e \u0437\u0430 \u043f\u043e\u043c\u043e\u0449\u044c \u0441 \u0432\u0438\u0440\u0443\u0441\u043e\u043c! \u0422\u0435\u043f\u0435\u0440\u044c \u0432\u0441\u0451 \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u{1F60A}');
  }

  // Check if new quests become available
  checkAndUnlockQuests();
  return true;
}

function checkAndUnlockQuests() {
  const state = getState();
  const currentLevel = getLevel();
  for (const quest of quests) {
    if (state.completed.includes(quest.id)) continue;
    if (state.active[quest.id]) continue;
    if (state.available.includes(quest.id)) continue;

    // Check requirements
    if (quest.requirements.previousQuests) {
      const allMet = quest.requirements.previousQuests.every(qId => state.completed.includes(qId));
      if (!allMet) continue;
    }

    if (quest.requirements.minLevel && currentLevel < quest.requirements.minLevel) continue;

    state.available.push(quest.id);
    showNotification({
      type: 'quest',
      title: '\u041d\u043e\u0432\u044b\u0439 \u043a\u0432\u0435\u0441\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d',
      description: quest.title
    });
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
