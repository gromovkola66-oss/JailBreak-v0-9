import * as storage from './storage.js';
import { getLevel, getSkillPoints, spendSkillPoint } from './levelSystem.js';

const STORAGE_KEY = 'unlocked_skills';

const SKILLS = [
  // HACKING branch
  { id: 'basic_scan', branch: 'hacking', name: 'Базовое сканирование', description: 'Формализует доступ к команде scan', levelReq: 1, cost: 1, effects: ['scan_formalized'] },
  { id: 'advanced_bruteforce', branch: 'hacking', name: 'Продвинутый брутфорс', description: 'Мини-игра брутфорса замедлена (легче)', levelReq: 3, cost: 1, effects: ['bruteforce_easier'] },
  { id: 'network_exploits', branch: 'hacking', name: 'Сетевые эксплоиты', description: 'Открывает команду exploit для целей сложности 3+', levelReq: 5, cost: 2, effects: ['exploit_unlock'] },
  { id: 'traffic_intercept', branch: 'hacking', name: 'Перехват трафика', description: 'Можно перехватить пароли NPC в транзите', levelReq: 8, cost: 2, effects: ['traffic_sniff'] },
  { id: 'zero_day', branch: 'hacking', name: 'Нулевой день', description: 'Взлом целей сложности 5, обход всех файрволов', levelReq: 12, cost: 3, effects: ['zero_day_bypass'] },

  // DEFENSE branch
  { id: 'basic_firewall', branch: 'defense', name: 'Базовый файрвол', description: 'Файрвол блокирует базовые угрозы', levelReq: 1, cost: 1, effects: ['firewall_basic'] },
  { id: 'data_encryption', branch: 'defense', name: 'Шифрование данных', description: 'Файлы зашифрованы, сложнее отследить', levelReq: 3, cost: 1, effects: ['encryption_active'] },
  { id: 'intrusion_detection', branch: 'defense', name: 'Обнаружение вторжений', description: 'Предупреждение при попытке взлома', levelReq: 5, cost: 2, effects: ['intrusion_detect'] },
  { id: 'trace_cleaner', branch: 'defense', name: 'Следоочиститель', description: 'Уровень трассировки падает быстрее', levelReq: 8, cost: 2, effects: ['trace_faster_decay'] },
  { id: 'invulnerability', branch: 'defense', name: 'Неуязвимость', description: 'Полная защита от вирусов', levelReq: 12, cost: 3, effects: ['virus_immune'] },

  // BUSINESS branch
  { id: 'trade_skills', branch: 'business', name: 'Торговые навыки', description: 'Скидка 10% в магазине', levelReq: 1, cost: 1, effects: ['discount_10'] },
  { id: 'fast_freelance', branch: 'business', name: 'Быстрый фриланс', description: 'Задания на фрилансе выполняются на 30% быстрее', levelReq: 3, cost: 1, effects: ['freelance_faster'] },
  { id: 'investor', branch: 'business', name: 'Инвестор', description: 'Доступ к фондовому рынку в банке', levelReq: 5, cost: 2, effects: ['stock_market'] },
  { id: 'entrepreneur', branch: 'business', name: 'Предприниматель', description: 'Можно создать свой магазин', levelReq: 8, cost: 2, effects: ['own_shop'] },
  { id: 'magnate', branch: 'business', name: 'Магнат', description: 'Пассивный доход: 50 DC в минуту', levelReq: 12, cost: 3, effects: ['passive_income'] },

  // PROGRAMMING branch
  { id: 'scripts', branch: 'programming', name: 'Скрипты', description: 'Можно писать скрипты в терминале', levelReq: 1, cost: 1, effects: ['terminal_scripts'] },
  { id: 'web_dev', branch: 'programming', name: 'Веб-разработка', description: 'Можно создавать простые веб-сайты', levelReq: 3, cost: 1, effects: ['web_create'] },
  { id: 'bot_dev', branch: 'programming', name: 'Разработка ботов', description: 'Автовыполнение некоторых заданий', levelReq: 5, cost: 2, effects: ['auto_freelance'] },
  { id: 'create_viruses', branch: 'programming', name: 'Создание вирусов', description: 'Можно создавать вирусы для целей', levelReq: 8, cost: 2, effects: ['craft_virus'] },
  { id: 'ai_assistant', branch: 'programming', name: 'Искусственный интеллект', description: 'AI-помощник в терминале даёт подсказки', levelReq: 12, cost: 3, effects: ['ai_hints'] },

  // SOCIAL branch
  { id: 'sociability', branch: 'social', name: 'Общительность', description: 'Отношения растут на 20% быстрее', levelReq: 1, cost: 1, effects: ['relationship_boost'] },
  { id: 'persuasion', branch: 'social', name: 'Убеждение', description: 'Новые варианты диалогов с NPC', levelReq: 3, cost: 1, effects: ['new_dialogues'] },
  { id: 'manipulation', branch: 'social', name: 'Манипуляция', description: 'Получение информации без квестов', levelReq: 5, cost: 2, effects: ['info_extract'] },
  { id: 'leadership', branch: 'social', name: 'Лидерство', description: 'NPC предлагают лучшие награды за квесты', levelReq: 8, cost: 2, effects: ['better_rewards'] },
  { id: 'inspirator', branch: 'social', name: 'Вдохновитель', description: 'Открывает секретные квесты всех NPC', levelReq: 12, cost: 3, effects: ['secret_quests'] }
];

let unlockedSkills = [];

function loadState() {
  const saved = storage.get(STORAGE_KEY);
  if (saved && Array.isArray(saved)) {
    unlockedSkills = saved;
  }
}

function saveState() {
  storage.set(STORAGE_KEY, unlockedSkills);
}

// Initialize on module load
loadState();

export function getSkills() {
  return SKILLS;
}

export function getSkillsByBranch(branch) {
  return SKILLS.filter(s => s.branch === branch);
}

export function getSkillById(skillId) {
  return SKILLS.find(s => s.id === skillId) || null;
}

export function isSkillUnlocked(skillId) {
  return unlockedSkills.includes(skillId);
}

export function canUnlockSkill(skillId) {
  const skill = getSkillById(skillId);
  if (!skill) return false;
  if (isSkillUnlocked(skillId)) return false;
  if (getLevel() < skill.levelReq) return false;
  if (getSkillPoints() < skill.cost) return false;

  // Check prerequisite: previous skill in the same branch must be unlocked
  const branchSkills = getSkillsByBranch(skill.branch);
  const skillIndex = branchSkills.findIndex(s => s.id === skillId);
  if (skillIndex > 0) {
    const prevSkill = branchSkills[skillIndex - 1];
    if (!isSkillUnlocked(prevSkill.id)) return false;
  }

  return true;
}

export function unlockSkill(skillId) {
  if (!canUnlockSkill(skillId)) return false;

  const skill = getSkillById(skillId);
  for (let i = 0; i < skill.cost; i++) {
    if (!spendSkillPoint()) return false;
  }

  unlockedSkills.push(skillId);
  saveState();
  return true;
}

export function getUnlockedSkills() {
  return SKILLS.filter(s => unlockedSkills.includes(s.id));
}

export function hasSkillEffect(effectName) {
  return SKILLS.some(s => unlockedSkills.includes(s.id) && s.effects.includes(effectName));
}
