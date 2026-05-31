import * as storage from './storage.js';
import { showNotification } from './notifications.js';

const STORAGE_KEY = 'player_level';
const MAX_LEVEL = 30;

let state = {
  level: 1,
  xp: 0,
  totalSkillPointsEarned: 0,
  skillPointsSpent: 0
};

export function initLevelSystem() {
  const saved = storage.get(STORAGE_KEY);
  if (saved) {
    state = { ...state, ...saved };
  } else {
    saveState();
  }
}

function saveState() {
  storage.set(STORAGE_KEY, state);
}

export function getLevel() {
  return state.level;
}

export function getXP() {
  return state.xp;
}

export function getXPForNextLevel() {
  if (state.level >= MAX_LEVEL) return 0;
  return state.level * 100;
}

export function addXP(amount, source) {
  if (state.level >= MAX_LEVEL) return;
  if (amount <= 0) return;

  state.xp += amount;

  let leveledUp = false;
  while (state.level < MAX_LEVEL && state.xp >= getXPForNextLevel()) {
    state.xp -= getXPForNextLevel();
    state.level++;
    state.totalSkillPointsEarned++;
    leveledUp = true;

    showNotification({
      type: 'quest',
      title: 'Уровень повышен!',
      description: `Поздравляем! Вы достигли уровня ${state.level}!`
    });
  }

  if (state.level >= MAX_LEVEL) {
    state.xp = 0;
  }

  saveState();
  return leveledUp;
}

export function getSkillPoints() {
  return state.totalSkillPointsEarned - state.skillPointsSpent;
}

export function hasSkillPoints() {
  return getSkillPoints() > 0;
}

export function spendSkillPoint() {
  if (getSkillPoints() <= 0) return false;
  state.skillPointsSpent++;
  saveState();
  return true;
}

export function getTotalSkillPoints() {
  return state.totalSkillPointsEarned;
}

export function getLevelUnlocks() {
  return {
    harderFreelance: state.level >= 3,
    newHackingTargets: state.level >= 5,
    advancedDarknet: state.level >= 8,
    newNpcContacts: state.level >= 10,
    eliteTier: state.level >= 15
  };
}
