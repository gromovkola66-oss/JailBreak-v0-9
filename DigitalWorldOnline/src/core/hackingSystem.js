import * as storage from './storage.js';

const TARGETS_KEY = 'hacking_targets';
const TOOLS_KEY = 'hacking_tools';

const DEFAULT_TARGETS = [
  {
    name: 'Домашний ПК Виктора',
    ip: '192.168.1.10',
    difficulty: 1,
    ports: [
      { port: 22, service: 'SSH', vulnerability: 'weak_password' },
      { port: 80, service: 'HTTP', vulnerability: 'weak_password' }
    ],
    files: [
      { name: 'passwords.txt', content: 'admin:qwerty123\nroot:password1\nvk.com:viktor1990' },
      { name: 'notes.txt', content: 'Не забыть оплатить интернет до 15 числа\nПароль от WiFi: homenet2023' }
    ],
    reward: 50,
    fullyHacked: false,
    hackedPorts: []
  },
  {
    name: 'Сервер интернет-кафе',
    ip: '192.168.1.25',
    difficulty: 1,
    ports: [
      { port: 80, service: 'HTTP', vulnerability: 'default_credentials' },
      { port: 3306, service: 'MySQL', vulnerability: 'default_credentials' },
      { port: 21, service: 'FTP', vulnerability: 'anonymous_access' }
    ],
    files: [
      { name: 'users_db.csv', content: 'id,login,password,email\n1,admin,admin123,admin@cafe.local\n2,user1,qwerty,user1@mail.dw\n3,user2,12345678,user2@mail.dw' },
      { name: 'config.ini', content: '[database]\nhost=localhost\nuser=root\npassword=cafe2023\ndb=cafe_users' }
    ],
    reward: 75,
    fullyHacked: false,
    hackedPorts: []
  },
  {
    name: 'Ноутбук бухгалтера',
    ip: '10.0.0.15',
    difficulty: 2,
    ports: [
      { port: 22, service: 'SSH', vulnerability: 'outdated_ssh' },
      { port: 445, service: 'SMB', vulnerability: 'outdated_smb' }
    ],
    files: [
      { name: 'financial_report.xlsx', content: 'Квартальный отчёт 2024\nДоход: 1,250,000 руб\nРасход: 890,000 руб\nЧистая прибыль: 360,000 руб' },
      { name: 'passwords.txt', content: 'Банк-клиент: buh_anna:Qwerty2024!\nПочта: anna.buh@company.dw:Anna1985\n1C: admin:enterprise' },
      { name: 'contracts.doc', content: 'Договор поставки #145 от 01.03.2024\nСумма: 500,000 руб\nКонтрагент: ООО ДигиТех' }
    ],
    reward: 120,
    fullyHacked: false,
    hackedPorts: []
  },
  {
    name: 'Сервер малого бизнеса',
    ip: '10.0.1.100',
    difficulty: 2,
    ports: [
      { port: 80, service: 'HTTP', vulnerability: 'sql_injection' },
      { port: 22, service: 'SSH', vulnerability: 'weak_password' },
      { port: 5432, service: 'PostgreSQL', vulnerability: 'sql_injection' }
    ],
    files: [
      { name: 'client_database.db', content: 'Клиентская база: 1547 записей\nТоп клиенты:\n- ООО Альфа (540,000 DC)\n- ИП Смирнов (230,000 DC)\n- ООО Бета (180,000 DC)' },
      { name: 'backup.sql', content: '-- PostgreSQL dump\n-- Database: business_crm\nCREATE TABLE clients (id serial, name varchar, balance decimal);\nINSERT INTO clients VALUES (1, \'ООО Альфа\', 540000);' },
      { name: 'admin_panel.conf', content: 'admin_user=superadmin\nadmin_pass=Business2024!\nsecret_key=a8f3k2j5m9x1' }
    ],
    reward: 200,
    fullyHacked: false,
    hackedPorts: []
  },
  {
    name: 'Почтовый сервер компании',
    ip: '172.16.0.5',
    difficulty: 3,
    ports: [
      { port: 25, service: 'SMTP', vulnerability: 'buffer_overflow' },
      { port: 143, service: 'IMAP', vulnerability: 'buffer_overflow' },
      { port: 443, service: 'HTTPS', vulnerability: 'ssl_misconfiguration' }
    ],
    files: [
      { name: 'email_archive.mbox', content: 'From: director@company.dw\nTo: all@company.dw\nSubject: Секретный проект\n\nКоллеги, проект "Феникс" запускается 1 мая.\nБюджет: 5,000,000 DC. Не разглашать.' },
      { name: 'employee_list.csv', content: 'Имя,Должность,Зарплата\nИванов И.И.,Директор,500000\nПетрова А.С.,Финансист,250000\nСидоров К.М.,Разработчик,300000' },
      { name: 'internal_memo.pdf', content: 'СЛУЖЕБНАЯ ЗАПИСКА\nО результатах аудита безопасности\nОбнаружено 12 критических уязвимостей\nСрок устранения: 30 дней' }
    ],
    reward: 350,
    fullyHacked: false,
    hackedPorts: []
  },
  {
    name: 'Банковский терминал',
    ip: '172.16.50.1',
    difficulty: 4,
    ports: [
      { port: 443, service: 'HTTPS', vulnerability: 'zero_day' },
      { port: 8443, service: 'API', vulnerability: 'authentication_bypass' },
      { port: 22, service: 'SSH', vulnerability: 'zero_day' }
    ],
    files: [
      { name: 'transactions.db', content: 'Последние транзакции:\n#89012: 1,000,000 DC -> Счёт X4429\n#89013: 500,000 DC -> Счёт A2281\n#89014: 2,300,000 DC -> Счёт K7750' },
      { name: 'access_keys.dat', content: 'MASTER_KEY=Xk9#mP2$vL5@nQ8\nAPI_SECRET=9f8e7d6c5b4a3210\nVAULT_TOKEN=vtk-a8b7c6d5e4f3' },
      { name: 'vault_codes.enc', content: '[ЗАШИФРОВАНО] Требуется дешифровка\nАлгоритм: AES-256\nПодсказка: Год основания банка' }
    ],
    reward: 800,
    fullyHacked: false,
    hackedPorts: []
  },
  {
    name: 'Правительственный сервер',
    ip: '10.255.0.1',
    difficulty: 5,
    ports: [
      { port: 443, service: 'HTTPS', vulnerability: 'chain_exploit' },
      { port: 22, service: 'SSH', vulnerability: 'chain_exploit' },
      { port: 8080, service: 'AdminPanel', vulnerability: 'chain_exploit' }
    ],
    files: [
      { name: 'classified_docs.enc', content: '[ЗАШИФРОВАНО] СОВЕРШЕННО СЕКРЕТНО\nУровень допуска: Альфа\nПроект: Цифровой Щит' },
      { name: 'surveillance_data.bin', content: 'Система наблюдения "Око"\nАктивных камер: 15,000\nОтслеживаемых объектов: 3,200\nСтатус: Активна' },
      { name: 'budget_2024.xlsx', content: 'Государственный бюджет на кибербезопасность\nОбщий фонд: 50,000,000 DC\nИсполнено: 32,000,000 DC\nОстаток: 18,000,000 DC' }
    ],
    reward: 2000,
    fullyHacked: false,
    hackedPorts: []
  }
];

const DEFAULT_TOOLS = {
  scannerPro: false,
  bruteforceV2: false,
  exploitKit: false,
  cryptor: false
};

function loadTargets() {
  const saved = storage.get(TARGETS_KEY);
  if (saved) return saved;
  const targets = JSON.parse(JSON.stringify(DEFAULT_TARGETS));
  storage.set(TARGETS_KEY, targets);
  return targets;
}

function saveTargets(targets) {
  storage.set(TARGETS_KEY, targets);
}

function loadTools() {
  const saved = storage.get(TOOLS_KEY);
  if (saved) return saved;
  const tools = JSON.parse(JSON.stringify(DEFAULT_TOOLS));
  storage.set(TOOLS_KEY, tools);
  return tools;
}

function saveTools(tools) {
  storage.set(TOOLS_KEY, tools);
}

export function getTargets() {
  return loadTargets();
}

export function getTargetByIp(ip) {
  const targets = loadTargets();
  return targets.find(t => t.ip === ip) || null;
}

export function markPortHacked(ip, port) {
  const targets = loadTargets();
  const target = targets.find(t => t.ip === ip);
  if (!target) return false;
  const portNum = Number(port);
  if (!target.hackedPorts.includes(portNum)) {
    target.hackedPorts.push(portNum);
  }
  saveTargets(targets);
  return true;
}

export function isPortHacked(ip, port) {
  const targets = loadTargets();
  const target = targets.find(t => t.ip === ip);
  if (!target) return false;
  return target.hackedPorts.includes(Number(port));
}

export function markTargetFullyHacked(ip) {
  const targets = loadTargets();
  const target = targets.find(t => t.ip === ip);
  if (!target) return false;
  target.fullyHacked = true;
  target.hackedPorts = target.ports.map(p => p.port);
  saveTargets(targets);
  return true;
}

export function getTargetFiles(ip) {
  const targets = loadTargets();
  const target = targets.find(t => t.ip === ip);
  if (!target) return [];
  return target.files;
}

export function getHackedTargets() {
  const targets = loadTargets();
  return targets.filter(t => t.fullyHacked);
}

export function getHackingTools() {
  return loadTools();
}

export function purchaseTool(toolId) {
  const tools = loadTools();
  if (!(toolId in tools)) return false;
  tools[toolId] = true;
  saveTools(tools);
  return true;
}
