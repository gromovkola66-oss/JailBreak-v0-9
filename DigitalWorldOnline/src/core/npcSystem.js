import * as storage from './storage.js';

const NPC_REL_KEY = 'npc_relationships';
const NPC_POSTS_KEY = 'npc_posts';

const npcs = [
  {
    id: 'alexey',
    name: 'Алексей "Кодер" Волков',
    avatar: '\u{1F468}\u200D\u{1F4BB}',
    age: 28,
    occupation: 'Программист',
    personality: 'friendly',
    bio: 'Помогаю новичкам в цифровом мире. Пишу код 24/7.',
    posts: [
      { text: 'Запустил новый проект на Python. Автоматизация рутины - это кайф!', time: '2ч назад' },
      { text: 'Кто-нибудь пробовал новый фреймворк? Делитесь впечатлениями.', time: '5ч назад' },
      { text: 'Сегодня помог трём новичкам настроить окружение. Приятно быть полезным.', time: '1д назад' },
      { text: 'Git push --force - это путь к тёмной стороне. Не делайте так.', time: '2д назад' }
    ],
    onlineStatus: 'online',
    defaultRelationship: 20
  },
  {
    id: 'marina',
    name: 'Марина Соколова',
    avatar: '\u{1F469}\u200D\u{1F4BC}',
    age: 32,
    occupation: 'Журналист',
    personality: 'secretive',
    bio: 'Ищу правду в цифровом шуме. Расследую коррупцию.',
    posts: [
      { text: 'Новая статья почти готова. Некоторым людям это не понравится.', time: '1ч назад' },
      { text: 'Источники подтверждают утечку данных из крупной компании.', time: '4ч назад' },
      { text: 'Журналистика в цифровую эпоху - это война за информацию.', time: '1д назад' },
      { text: 'Кто контролирует данные - контролирует мир.', time: '3д назад' }
    ],
    onlineStatus: 'online',
    defaultRelationship: 20
  },
  {
    id: 'ghost',
    name: 'Дмитрий "Ghost" Теневой',
    avatar: '\u{1F47B}',
    age: 25,
    occupation: 'Хакер',
    personality: 'secretive',
    bio: 'Меня не существует. Но я везде.',
    posts: [
      { text: '...', time: '???' },
      { text: 'Безопасность - это иллюзия. Всё можно взломать.', time: '???' },
      { text: 'Новый эксплоит в ядре. Патчите, пока не поздно.', time: '???' }
    ],
    onlineStatus: 'online',
    defaultRelationship: 0,
    hidden: true
  },
  {
    id: 'elena',
    name: 'Елена Красикова',
    avatar: '\u{1F469}\u200D\u{1F4BC}',
    age: 35,
    occupation: 'Владелица магазина',
    personality: 'friendly',
    bio: 'Торгую цифровыми товарами. Лучшие цены в сети!',
    posts: [
      { text: 'Новое поступление программ! Скидки для постоянных клиентов.', time: '30мин назад' },
      { text: 'Спасибо всем за поддержку! 1000 довольных клиентов!', time: '3ч назад' },
      { text: 'Осторожно: появились поддельные магазины. Покупайте только у проверенных продавцов.', time: '1д назад' },
      { text: 'Акция дня: антивирус со скидкой 30%!', time: '2д назад' }
    ],
    onlineStatus: 'online',
    defaultRelationship: 20
  },
  {
    id: 'igor',
    name: 'Игорь "Щит" Петров',
    avatar: '\u{1F6E1}\uFE0F',
    age: 40,
    occupation: 'Кибербезопасность',
    personality: 'helpful',
    bio: 'Защищаю системы от угроз. 15 лет в индустрии.',
    posts: [
      { text: 'Напоминание: обновите пароли. Используйте двухфакторную аутентификацию.', time: '1ч назад' },
      { text: 'Обнаружена новая фишинговая кампания. Будьте бдительны.', time: '6ч назад' },
      { text: 'Провёл аудит безопасности для трёх компаний на этой неделе.', time: '1д назад' },
      { text: 'Безопасность - это не продукт, а процесс.', time: '3д назад' }
    ],
    onlineStatus: 'away',
    defaultRelationship: 20
  },
  {
    id: 'anna',
    name: 'Анна Морозова',
    avatar: '\u{1F469}\u200D\u{1F393}',
    age: 20,
    occupation: 'Студентка',
    personality: 'friendly',
    bio: 'Учусь на программиста. Люблю котиков и код.',
    posts: [
      { text: 'Сдала экзамен по алгоритмам! Ура!!! \u{1F389}', time: '1ч назад' },
      { text: 'Кто-нибудь может объяснить рекурсию? Чтобы объяснить рекурсию, нужно понять рекурсию...', time: '4ч назад' },
      { text: 'Мой кот опять лёг на клавиатуру. Теперь у меня в коде "ааааааа".', time: '1д назад' },
      { text: 'Ищу стажировку! Знаю Python, JS, немного C++.', time: '2д назад' },
      { text: 'Новый семестр - новые вызовы! Готова к учёбе!', time: '3д назад' }
    ],
    onlineStatus: 'online',
    defaultRelationship: 20
  },
  {
    id: 'victor',
    name: 'Виктор Крысин',
    avatar: '\u{1F98A}',
    age: 33,
    occupation: 'Мошенник',
    personality: 'secretive',
    bio: 'Предприниматель. Всегда есть выгодное предложение.',
    posts: [
      { text: 'Уникальная возможность! Удвойте свои DC за 24 часа! Пишите в личку.', time: '2ч назад' },
      { text: 'Продаю базы данных. Дёшево. Надёжно.', time: '8ч назад' },
      { text: 'Кто хочет заработать быстро - знает куда обращаться.', time: '1д назад' }
    ],
    onlineStatus: 'away',
    defaultRelationship: 20
  },
  {
    id: 'olga',
    name: 'Ольга "Firewall" Жукова',
    avatar: '\u{1F469}\u200D\u{1F4BB}',
    age: 29,
    occupation: 'Системный администратор',
    personality: 'aggressive',
    bio: 'Администрирую серверы. Не люблю, когда лезут без разрешения.',
    posts: [
      { text: 'Опять кто-то пытался взломать мой сервер. Забанен навечно.', time: '45мин назад' },
      { text: 'Обновила firewall. Попробуйте пробиться теперь.', time: '3ч назад' },
      { text: 'Логи показывают подозрительную активность. Слежу.', time: '1д назад' },
      { text: 'Если ваш пароль "123456" - вы заслуживаете быть взломанным.', time: '2д назад' }
    ],
    onlineStatus: 'online',
    defaultRelationship: 20
  },
  {
    id: 'maxim',
    name: 'Максим Денисов',
    avatar: '\u{1F4C8}',
    age: 37,
    occupation: 'Трейдер',
    personality: 'helpful',
    bio: 'Торгую криптовалютой и цифровыми активами. Консультирую.',
    posts: [
      { text: 'DC растёт! Кто купил на прошлой неделе - поздравляю.', time: '1ч назад' },
      { text: 'Анализ рынка: ожидаю коррекцию в ближайшие дни.', time: '5ч назад' },
      { text: 'Правило №1: никогда не инвестируй больше, чем готов потерять.', time: '1д назад' },
      { text: 'Новичкам рекомендую начать с малых сумм. Рынок жесток.', time: '2д назад' }
    ],
    onlineStatus: 'online',
    defaultRelationship: 20
  },
  {
    id: 'svetlana',
    name: 'Светлана Новикова',
    avatar: '\u{1F469}\u200D\u2696\uFE0F',
    age: 45,
    occupation: 'Политик',
    personality: 'secretive',
    bio: 'Работаю над регулированием цифрового пространства.',
    posts: [
      { text: 'Новый законопроект о защите данных граждан на рассмотрении.', time: '3ч назад' },
      { text: 'Встреча с представителями IT-сектора прошла продуктивно.', time: '1д назад' },
      { text: 'Цифровая безопасность - приоритет государства.', time: '2д назад' },
      { text: 'Анонимность в сети не должна быть щитом для преступников.', time: '4д назад' }
    ],
    onlineStatus: 'away',
    defaultRelationship: 20
  },
  {
    id: 'artem',
    name: 'Артём "Virus" Чёрный',
    avatar: '\u{1F9A0}',
    age: 22,
    occupation: 'Создатель вирусов',
    personality: 'aggressive',
    bio: 'Код - это искусство. Вирус - это шедевр.',
    posts: [
      { text: 'Новый проект почти готов. Мир содрогнётся.', time: '6ч назад' },
      { text: 'Антивирусы - это костыли для тех, кто не понимает систему.', time: '1д назад' },
      { text: 'Тестирую новый полиморфный движок. Результаты впечатляют.', time: '3д назад' }
    ],
    onlineStatus: 'offline',
    defaultRelationship: 0
  },
  {
    id: 'natalya',
    name: 'Наталья Белова',
    avatar: '\u{1F3E6}',
    age: 38,
    occupation: 'Банкир',
    personality: 'helpful',
    bio: 'Управляю цифровыми финансами. Помогаю с инвестициями.',
    posts: [
      { text: 'Новые условия по вкладам! До 15% годовых в DC.', time: '2ч назад' },
      { text: 'Финансовая грамотность - основа благополучия в цифровом мире.', time: '5ч назад' },
      { text: 'Провела вебинар по безопасным транзакциям. Запись доступна.', time: '1д назад' },
      { text: 'Никогда не сообщайте свои ключи третьим лицам!', time: '2д назад' }
    ],
    onlineStatus: 'online',
    defaultRelationship: 20
  }
];

function getRelationships() {
  return storage.get(NPC_REL_KEY) || {};
}

function saveRelationships(rels) {
  storage.set(NPC_REL_KEY, rels);
}

export function getNpcs() {
  return npcs.filter(npc => !npc.hidden);
}

export function getAllNpcs() {
  return npcs;
}

export function getNpcById(id) {
  return npcs.find(npc => npc.id === id) || null;
}

export function getRelationship(npcId) {
  const rels = getRelationships();
  if (rels[npcId] !== undefined) return rels[npcId];
  const npc = getNpcById(npcId);
  return npc ? npc.defaultRelationship : 0;
}

export function updateRelationship(npcId, delta) {
  const rels = getRelationships();
  const current = rels[npcId] !== undefined ? rels[npcId] : (getNpcById(npcId)?.defaultRelationship || 0);
  rels[npcId] = Math.max(0, Math.min(100, current + delta));
  saveRelationships(rels);
  return rels[npcId];
}

export function getNpcPosts(npcId) {
  const customPosts = storage.get(NPC_POSTS_KEY) || {};
  const npc = getNpcById(npcId);
  if (!npc) return [];
  const base = npc.posts.map((post, idx) => ({
    ...post,
    id: post.id || `${npcId}_static_${idx}`
  }));
  if (customPosts[npcId]) {
    const custom = customPosts[npcId].map(post => ({
      ...post,
      id: post.id || `${npcId}_custom_${post.time}_${post.text.substring(0, 10)}`
    }));
    return [...custom, ...base];
  }
  return base;
}

export function addNpcPost(npcId, text) {
  const customPosts = storage.get(NPC_POSTS_KEY) || {};
  if (!customPosts[npcId]) customPosts[npcId] = [];
  customPosts[npcId].unshift({ text, time: 'только что', id: `${npcId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` });
  storage.set(NPC_POSTS_KEY, customPosts);
}
