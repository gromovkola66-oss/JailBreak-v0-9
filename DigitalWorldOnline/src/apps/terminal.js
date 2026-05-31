import { createWindow } from '../core/windowManager.js';
import * as fileSystem from '../core/fileSystem.js';
import * as hackingSystem from '../core/hackingSystem.js';
import * as reputation from '../core/reputation.js';
import * as storage from '../core/storage.js';
import { addMoney } from '../core/economy.js';
import { bruteforceMinigame, decryptMinigame, exploitMinigame } from './hackingMinigames.js';
import { updateQuestStep, getActiveQuests } from '../core/questSystem.js';
import { addMessageFromNpc } from './messenger.js';
import { addXP } from '../core/levelSystem.js';
import { hasSkillEffect } from '../core/skillSystem.js';

export function open() {
  const win = createWindow({
    title: 'Терминал',
    icon: '/icons/terminal.svg',
    appId: 'terminal',
    width: 750,
    height: 480,
    content: '<div class="app-terminal"></div>'
  });

  const container = win.element.querySelector('.app-terminal');
  const state = {
    currentPath: '/Desktop',
    history: [],
    historyIndex: -1,
    textColor: '#cccccc',
    connectedTo: null
  };

  render(container, state);
}

function render(container, state) {
  container.innerHTML = `
    <div class="terminal-output"></div>
    <div class="terminal-input-line">
      <span class="terminal-prompt">${getPrompt(state)}</span>
      <input class="terminal-input" type="text" spellcheck="false" autocomplete="off" />
      <span class="terminal-cursor"></span>
    </div>
  `;

  const output = container.querySelector('.terminal-output');
  const input = container.querySelector('.terminal-input');
  const promptEl = container.querySelector('.terminal-prompt');

  applyVpnStyle(state, input);

  appendLine(output, 'Цифровой Мир Онлайн [Версия 10.0.22631.1234]', state.textColor);
  appendLine(output, '(c) Digital World Online. Все права защищены.', state.textColor);
  appendLine(output, '', state.textColor);

  input.focus();
  container.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value;
      state.history.push(cmd);
      state.historyIndex = state.history.length;

      appendLine(output, getPrompt(state) + cmd, state.textColor);
      input.value = '';

      processCommand(cmd.trim(), output, state, container);
      promptEl.textContent = getPrompt(state);

      output.scrollTop = output.scrollHeight;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.historyIndex > 0) {
        state.historyIndex--;
        input.value = state.history[state.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        input.value = state.history[state.historyIndex];
      } else {
        state.historyIndex = state.history.length;
        input.value = '';
      }
    }
  });
}

function getPrompt(state) {
  const vpnPrefix = storage.get('vpn_active') ? '[VPN] ' : '';
  if (state.connectedTo) {
    return vpnPrefix + `root@${state.connectedTo} $> `;
  }
  return vpnPrefix + `C:\\Users\\User${state.currentPath.replace(/\//g, '\\')}> `;
}

function applyVpnStyle(state, inputEl) {
  if (storage.get('vpn_active')) {
    state.textColor = '#00ff88';
    inputEl.style.color = '#00ff88';
  }
}

function processCommand(input, output, state, container) {
  if (!input) return;

  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  // Handle connected state commands first
  if (state.connectedTo) {
    switch (cmd) {
      case 'ls':
        connectedLs(output, state);
        return;
      case 'cat':
        connectedCat(args, output, state);
        return;
      case 'download':
        connectedDownload(args, output, state);
        return;
      case 'disconnect':
        state.connectedTo = null;
        appendLine(output, 'Соединение разорвано.', state.textColor);
        return;
      default:
        break;
    }
  }

  switch (cmd) {
    case 'help':
      printHelp(output, state);
      // Quest trigger: terminal_help
      updateQuestStep('first_steps', 'terminal_help', null);
      break;
    case 'dir':
      printDir(output, state);
      break;
    case 'cd':
      changeDir(args, output, state);
      break;
    case 'mkdir':
      makeDir(args, output, state);
      break;
    case 'echo':
      appendLine(output, args, state.textColor);
      break;
    case 'cls':
      output.innerHTML = '';
      break;
    case 'date':
      appendLine(output, 'Текущая дата: ' + new Date().toLocaleDateString('ru-RU'), state.textColor);
      break;
    case 'time':
      appendLine(output, 'Текущее время: ' + new Date().toLocaleTimeString('ru-RU'), state.textColor);
      break;
    case 'whoami':
      appendLine(output, 'User', state.textColor);
      break;
    case 'color':
      changeColor(args, output, state, container);
      break;
    case 'ipconfig':
      printIpconfig(output, state);
      break;
    case 'ping':
      doPing(args, output, state, container);
      break;
    case 'scan':
      doScan(args, output, state);
      break;
    case 'bruteforce':
      doBruteforce(parts, output, state, container);
      break;
    case 'connect':
      doConnect(args, output, state);
      break;
    case 'exploit':
      doExploit(parts, output, state, container);
      break;
    case 'trace':
      doTrace(output, state);
      break;
    case 'decrypt':
      doDecrypt(args, output, state, container);
      break;
    case 'vpn':
      doVpn(args, output, state, container);
      break;
    case 'script':
      doScript(output, state);
      break;
    case 'ai':
      doAi(output, state);
      break;
    case 'sniff':
      doSniff(args, output, state);
      break;
    case 'craft':
      doCraft(args, output, state);
      break;
    default:
      appendLine(output, `'${cmd}' не распознана как внутренняя или внешняя команда.`, '#f44747');
      break;
  }
}

// ============ Connected state commands ============

function connectedLs(output, state) {
  const files = hackingSystem.getTargetFiles(state.connectedTo);
  if (!files || files.length === 0) {
    appendLine(output, '  (пусто)', state.textColor);
    return;
  }
  files.forEach(f => {
    appendLine(output, '  ' + f.name, state.textColor);
  });
}

function connectedCat(filename, output, state) {
  if (!filename) {
    appendLine(output, 'Использование: cat <имя_файла>', '#f44747');
    return;
  }
  const files = hackingSystem.getTargetFiles(state.connectedTo);
  const file = files.find(f => f.name === filename);
  if (!file) {
    appendLine(output, `Файл '${filename}' не найден.`, '#f44747');
    return;
  }
  file.content.split('\n').forEach(line => {
    appendLine(output, line, state.textColor);
  });
}

function connectedDownload(filename, output, state) {
  if (!filename) {
    appendLine(output, 'Использование: download <имя_файла>', '#f44747');
    return;
  }
  const files = hackingSystem.getTargetFiles(state.connectedTo);
  const file = files.find(f => f.name === filename);
  if (!file) {
    appendLine(output, `Файл '${filename}' не найден.`, '#f44747');
    return;
  }
  const created = fileSystem.createFile('/Downloads/' + filename, file.content);
  if (!created) {
    appendLine(output, 'Файл уже был загружен ранее.', '#ffff00');
    return;
  }
  appendLine(output, 'Файл загружен: ' + filename, '#00ff88');

  // Quest trigger: download_file
  const activeQs = getActiveQuests();
  activeQs.forEach(q => {
    q.steps.forEach(s => {
      if (s.type === 'download_file' && s.target === filename) {
        updateQuestStep(q.id, 'download_file', filename);
      }
    });
  });

  addMoney(10, 'Скачивание: ' + filename);
  reputation.addBlackRep(5, 'Скачивание файлов');

  if (Math.random() < 0.2) {
    const threats = storage.get('system_threats') || [];
    const threatNames = ['Троян.DownloadHelper', 'Шпион.DataGrab', 'Вирус.CryptoHook', 'Червь.NetCrawl'];
    threats.push({
      id: Date.now(),
      name: threatNames[Math.floor(Math.random() * threatNames.length)],
      severity: Math.random() > 0.5 ? 'medium' : 'low',
      source: filename,
      timestamp: Date.now()
    });
    storage.set('system_threats', threats);
    appendLine(output, '\u26A0 ВНИМАНИЕ: Антивирус обнаружил подозрительную активность!', '#ff4444');
  }
}

// ============ Hacking commands ============

function doScan(args, output, state) {
  if (!args) {
    appendLine(output, 'Использование: scan <ip-адрес>', '#f44747');
    return;
  }
  const ip = args.trim();

  // Special case: Olga's PC
  if (ip === '10.0.2.50') {
    appendLine(output, 'Сканирование 10.0.2.50...', state.textColor);
    appendLine(output, 'Цель: ПК Ольги "Firewall" Жуковой', state.textColor);
    appendLine(output, 'Обнаружена мощная защита. Все порты защищены.', state.textColor);
    appendLine(output, 'Файрвол уровня "военный". Взлом невозможен.', state.textColor);
    // Quest trigger: hack_attempt_olga
    updateQuestStep('stress_test', 'hack_attempt_olga', null);
    addMessageFromNpc('olga', 'Неплохая попытка! Я засекла твой скан. Не обижаюсь - уважаю смелость. Может, будем работать вместе?');
    return;
  }

  const target = hackingSystem.getTargetByIp(ip);
  if (!target) {
    appendLine(output, `Хост ${ip} не найден в сети.`, '#f44747');
    return;
  }
  const tools = hackingSystem.getHackingTools();
  appendLine(output, `Сканирование ${ip}...`, state.textColor);
  appendLine(output, `Цель: ${target.name}`, state.textColor);
  appendLine(output, '', state.textColor);
  target.ports.forEach(p => {
    let line = `Порт ${p.port} (${p.service}) - открыт`;
    if (tools.scannerPro) {
      line += ` [Уязвимость: ${p.vulnerability}]`;
    }
    appendLine(output, line, state.textColor);
  });
}

function doBruteforce(parts, output, state, container) {
  if (parts.length < 3) {
    appendLine(output, 'Использование: bruteforce <ip> <порт>', '#f44747');
    return;
  }
  const ip = parts[1];
  const port = Number(parts[2]);
  const target = hackingSystem.getTargetByIp(ip);
  if (!target) {
    appendLine(output, `Хост ${ip} не найден в сети.`, '#f44747');
    return;
  }
  const portInfo = target.ports.find(p => p.port === port);
  if (!portInfo) {
    appendLine(output, `Порт ${port} не найден на ${ip}.`, '#f44747');
    return;
  }
  if (hackingSystem.isPortHacked(ip, port)) {
    appendLine(output, `Порт ${port} уже взломан.`, '#ffff00');
    return;
  }

  const inputEl = container.querySelector('.terminal-input');
  inputEl.disabled = true;

  appendLine(output, `Подбор пароля к ${ip}:${port}...`, state.textColor);
  appendLine(output, 'Запуск модуля взлома...', state.textColor);

  const bfTools = hackingSystem.getHackingTools();
  bruteforceMinigame({ enhanced: !!bfTools.bruteforceV2 || hasSkillEffect('bruteforce_easier') }).then(success => {
    if (success) {
      hackingSystem.markPortHacked(ip, port);
      reputation.addBlackRep(5, `Взлом порта ${port} на ${ip}`);
      storage.set('last_hack_time', Date.now());
      appendLine(output, 'Успешно! Порт взломан.', '#00ff88');
      addXP(30 + target.difficulty * 20, 'Взлом порта');

      // Check if all ports are hacked
      const updatedTarget = hackingSystem.getTargetByIp(ip);
      const allHacked = updatedTarget.ports.every(p => updatedTarget.hackedPorts.includes(p.port));
      if (allHacked && !updatedTarget.fullyHacked) {
        hackingSystem.markTargetFullyHacked(ip);
        addMoney(updatedTarget.reward, 'Взлом: ' + updatedTarget.name);
        reputation.addBlackRep(updatedTarget.difficulty * 10, 'Взлом: ' + updatedTarget.name);
        appendLine(output, `Система полностью взломана! Получено ${updatedTarget.reward} DC`, '#00ff88');
        // Quest trigger: hack_target
        const activeQuests = getActiveQuests();
        activeQuests.forEach(q => {
          q.steps.forEach(s => {
            if (s.type === 'hack_target' && s.target === ip) {
              updateQuestStep(q.id, 'hack_target', ip);
            }
          });
        });
      }
    } else {
      appendLine(output, 'Подбор не удался.', '#f44747');
    }
    inputEl.disabled = false;
    inputEl.focus();
    output.scrollTop = output.scrollHeight;
  });
}

function doConnect(args, output, state) {
  if (!args) {
    appendLine(output, 'Использование: connect <ip-адрес>', '#f44747');
    return;
  }
  const ip = args.trim();
  const target = hackingSystem.getTargetByIp(ip);
  if (!target) {
    appendLine(output, `Хост ${ip} не найден в сети.`, '#f44747');
    return;
  }
  if (!target.hackedPorts || target.hackedPorts.length === 0) {
    appendLine(output, 'Нет взломанных портов. Сначала взломайте хотя бы один порт.', '#f44747');
    return;
  }
  state.connectedTo = ip;
  appendLine(output, `Подключено к ${target.name} (${ip})`, '#00ff88');
  appendLine(output, 'Доступные команды: ls, cat <файл>, download <файл>, disconnect', state.textColor);
}

function doExploit(parts, output, state, container) {
  if (parts.length < 3) {
    appendLine(output, 'Использование: exploit <ip> <уязвимость>', '#f44747');
    return;
  }
  const ip = parts[1];
  const vuln = parts[2];
  const tools = hackingSystem.getHackingTools();
  if (!tools.exploitKit && !hasSkillEffect('exploit_unlock')) {
    appendLine(output, 'Требуется инструмент: exploitKit. Приобретите его в магазине.', '#f44747');
    return;
  }
  const target = hackingSystem.getTargetByIp(ip);
  if (!target) {
    appendLine(output, `Хост ${ip} не найден в сети.`, '#f44747');
    return;
  }
  if (target.fullyHacked) {
    appendLine(output, 'Цель уже полностью взломана.', '#ffff00');
    return;
  }

  // zero_day_bypass allows exploit on any target regardless of vulnerability
  if (!hasSkillEffect('zero_day_bypass')) {
    const hasVuln = target.ports.some(p => p.vulnerability === vuln);
    if (!hasVuln) {
      appendLine(output, `Уязвимость '${vuln}' не найдена на ${ip}.`, '#f44747');
      return;
    }
  }

  const inputEl = container.querySelector('.terminal-input');
  inputEl.disabled = true;

  appendLine(output, 'Запуск модуля эксплойта...', state.textColor);

  exploitMinigame().then(success => {
    if (success) {
      hackingSystem.markTargetFullyHacked(ip);
      storage.set('last_hack_time', Date.now());
      addMoney(target.reward, 'Взлом: ' + target.name);
      reputation.addBlackRep(target.difficulty * 10, 'Взлом: ' + target.name);
      appendLine(output, `Эксплойт применён! Все порты на ${ip} взломаны.`, '#00ff88');
      appendLine(output, `Система полностью взломана! Получено ${target.reward} DC`, '#00ff88');
      addXP(target.difficulty * 30, 'Эксплойт');
      // Quest trigger: hack_target
      const activeQuests = getActiveQuests();
      activeQuests.forEach(q => {
        q.steps.forEach(s => {
          if (s.type === 'hack_target' && s.target === ip) {
            updateQuestStep(q.id, 'hack_target', ip);
          }
        });
      });
    } else {
      appendLine(output, 'Эксплойт не удался. Соединение сброшено.', '#f44747');
    }
    inputEl.disabled = false;
    inputEl.focus();
    output.scrollTop = output.scrollHeight;
  });
}

function doTrace(output, state) {
  const tools = hackingSystem.getHackingTools();
  const vpnActive = storage.get('vpn_active');
  const firewallActive = storage.get('firewall_active');
  if (tools.cryptor || vpnActive || firewallActive || hasSkillEffect('encryption_active')) {
    appendLine(output, 'Отслеживание: не обнаружено', '#00ff88');
    return;
  }
  const lastHack = storage.get('last_hack_time');
  const traceWindow = hasSkillEffect('trace_faster_decay') ? 2.5 * 60 * 1000 : 5 * 60 * 1000;
  if (lastHack && (Date.now() - lastHack) < traceWindow) {
    const target = hackingSystem.getTargets().find(t => t.hackedPorts && t.hackedPorts.length > 0);
    const danger = target ? target.difficulty : 1;
    appendLine(output, `ВНИМАНИЕ: Обнаружена активность трассировки! Уровень опасности: ${danger}`, '#f44747');
  } else {
    appendLine(output, 'Отслеживание: не обнаружено', '#00ff88');
  }
}

function doDecrypt(args, output, state, container) {
  if (!args) {
    appendLine(output, 'Использование: decrypt <имя_файла>', '#f44747');
    return;
  }
  const filename = args.trim();
  if (!filename.endsWith('.enc')) {
    appendLine(output, 'Только зашифрованные файлы (.enc) могут быть дешифрованы.', '#f44747');
    return;
  }

  if (!state.connectedTo) {
    appendLine(output, 'Необходимо подключиться к цели (connect <ip>).', '#f44747');
    return;
  }

  const files = hackingSystem.getTargetFiles(state.connectedTo);
  const file = files.find(f => f.name === filename);
  if (!file) {
    appendLine(output, `Файл '${filename}' не найден.`, '#f44747');
    return;
  }

  const inputEl = container.querySelector('.terminal-input');
  inputEl.disabled = true;

  appendLine(output, 'Запуск модуля дешифровки...', state.textColor);

  decryptMinigame().then(success => {
    if (success) {
      appendLine(output, 'Дешифровка успешна!', '#00ff88');
      file.content.split('\n').forEach(line => {
        appendLine(output, line, state.textColor);
      });
    } else {
      appendLine(output, 'Дешифровка не удалась. Попробуйте снова.', '#f44747');
    }
    inputEl.disabled = false;
    inputEl.focus();
    output.scrollTop = output.scrollHeight;
  });
}

function doVpn(args, output, state, container) {
  const arg = args.trim().toLowerCase();
  if (arg === 'on') {
    storage.set('vpn_active', true);
    state.textColor = '#00ff88';
    const inputEl = container.querySelector('.terminal-input');
    inputEl.style.color = '#00ff88';
    appendLine(output, '[VPN] VPN активирован. Соединение защищено.', '#00ff88');
    // Quest trigger: vpn_activate
    updateQuestStep('dark_side', 'vpn_activate', null);
  } else if (arg === 'off') {
    storage.set('vpn_active', false);
    state.textColor = '#cccccc';
    const inputEl = container.querySelector('.terminal-input');
    inputEl.style.color = '#cccccc';
    appendLine(output, 'VPN деактивирован.', state.textColor);
  } else {
    appendLine(output, 'Использование: vpn on|off', '#f44747');
  }
}

// ============ Original commands ============

function printHelp(output, state) {
  const lines = [
    'Системные команды:',
    '  help      - Показать справку',
    '  dir       - Список файлов и папок в текущей директории',
    '  cd <путь> - Сменить директорию (cd .. чтобы выйти)',
    '  mkdir <имя> - Создать новую директорию',
    '  echo <текст> - Вывести текст в терминал',
    '  cls       - Очистить экран терминала',
    '  date      - Показать текущую дату',
    '  time      - Показать текущее время',
    '  whoami    - Показать текущего пользователя',
    '  color <код> - Изменить цвет текста (0a=зелёный, 0b=голубой, 0c=красный, 0e=жёлтый)',
    '  ipconfig  - Показать сетевую конфигурацию',
    '  ping <адрес> - Пинг адреса',
    '',
    'Хакерские команды:',
    '  scan <ip>            - Сканировать порты цели',
    '  bruteforce <ip> <порт> - Подбор пароля к порту',
    '  connect <ip>         - Подключиться к взломанной цели',
    '  exploit <ip> <уязв>  - Применить эксплойт к цели',
    '  trace                - Проверить статус трассировки',
    '  decrypt <файл>       - Дешифровать зашифрованный файл',
    '  vpn on|off           - Включить/выключить VPN',
    '',
    'Навыковые команды:',
    '  script               - Автосканирование всех целей (навык: Скрипты)',
    '  ai                   - Подсказки AI-помощника (навык: ИИ)',
    '  sniff <ip>           - Перехват трафика (навык: Перехват трафика)',
    '  craft virus <имя>    - Создать вирус (навык: Создание вирусов)',
    '',
    'Команды при подключении (connect):',
    '  ls                   - Список файлов на цели',
    '  cat <файл>           - Просмотреть содержимое файла',
    '  download <файл>      - Скачать файл в /Downloads',
    '  disconnect           - Отключиться от цели'
  ];
  lines.forEach(l => appendLine(output, l, state.textColor));
}

function printDir(output, state) {
  const items = fileSystem.listFolder(state.currentPath);
  appendLine(output, ' Директория C:\\Users\\User' + state.currentPath.replace(/\//g, '\\'), state.textColor);
  appendLine(output, '', state.textColor);

  if (!items || items.length === 0) {
    appendLine(output, '  (пусто)', state.textColor);
  } else {
    items.forEach(item => {
      const type = item.type === 'folder' ? '<DIR>' : '     ';
      appendLine(output, `  ${type}  ${item.name}`, state.textColor);
    });
  }
  appendLine(output, `        ${items ? items.length : 0} элемент(ов)`, state.textColor);
}

function changeDir(args, output, state) {
  if (!args) {
    appendLine(output, state.currentPath, state.textColor);
    return;
  }

  let newPath;
  if (args === '..') {
    const parts = state.currentPath.split('/');
    parts.pop();
    newPath = parts.length <= 1 ? '/' : parts.join('/');
  } else if (args.startsWith('/')) {
    newPath = args;
  } else {
    newPath = state.currentPath === '/' ? '/' + args : state.currentPath + '/' + args;
  }

  const node = fileSystem.getNode(newPath);
  if (node && node.type === 'folder') {
    state.currentPath = newPath;
  } else {
    appendLine(output, 'Система не может найти указанный путь.', '#f44747');
  }
}

function makeDir(args, output, state) {
  if (!args) {
    appendLine(output, 'Синтаксис команды неверен.', '#f44747');
    return;
  }
  const path = state.currentPath === '/' ? '/' + args : state.currentPath + '/' + args;
  const result = fileSystem.createFolder(path);
  if (!result) {
    appendLine(output, 'Подкаталог или файл уже существует.', '#f44747');
  }
}

function changeColor(args, output, state, container) {
  const colorMap = {
    '0a': '#00ff00',
    '0b': '#00ffff',
    '0c': '#ff4444',
    '0d': '#ff00ff',
    '0e': '#ffff00',
    '0f': '#ffffff',
    '07': '#cccccc'
  };

  const code = args.toLowerCase();
  if (colorMap[code]) {
    state.textColor = colorMap[code];
    container.querySelector('.terminal-input').style.color = state.textColor;
    appendLine(output, 'Цвет изменён.', state.textColor);
  } else if (args) {
    appendLine(output, 'Неверный код цвета. Попробуйте: 0a, 0b, 0c, 0d, 0e, 0f, 07', '#f44747');
  } else {
    appendLine(output, 'Использование: color <код> (напр., 0a для зелёного)', state.textColor);
  }
}

function printIpconfig(output, state) {
  const lines = [
    '',
    'Конфигурация IP Windows',
    '',
    'Адаптер Ethernet:',
    '',
    '   DNS-суффикс подключения . . . . . : digitalworld.local',
    '   IPv4-адрес. . . . . . . . . . . . : 192.168.1.100',
    '   Маска подсети . . . . . . . . . . : 255.255.255.0',
    '   Основной шлюз . . . . . . . . . . : 192.168.1.1',
    ''
  ];
  lines.forEach(l => appendLine(output, l, state.textColor));
}

function doPing(address, output, state, container) {
  if (!address) {
    appendLine(output, 'Использование: ping <адрес>', '#f44747');
    return;
  }

  const inputEl = container.querySelector('.terminal-input');
  inputEl.disabled = true;

  appendLine(output, '', state.textColor);
  appendLine(output, `Обмен пакетами с ${address} (32 байт):`, state.textColor);

  let count = 0;
  const interval = setInterval(() => {
    const time = Math.floor(Math.random() * 20) + 5;
    appendLine(output, `Ответ от ${address}: байт=32 время=${time}мс TTL=128`, state.textColor);
    output.scrollTop = output.scrollHeight;
    count++;
    if (count >= 4) {
      clearInterval(interval);
      appendLine(output, '', state.textColor);
      appendLine(output, `Статистика Ping для ${address}:`, state.textColor);
      appendLine(output, '    Пакетов: отправлено = 4, получено = 4, потеряно = 0 (0% потерь)', state.textColor);
      inputEl.disabled = false;
      inputEl.focus();
    }
  }, 600);
}

// ============ Skill-based commands ============

function doScript(output, state) {
  if (!hasSkillEffect('terminal_scripts')) {
    appendLine(output, 'Требуется навык: Скрипты', '#f44747');
    return;
  }
  appendLine(output, 'Запуск автосканирования всех известных целей...', state.textColor);
  appendLine(output, '', state.textColor);
  const targets = hackingSystem.getTargets();
  targets.forEach(target => {
    appendLine(output, `[${target.ip}] ${target.name} (сложность: ${target.difficulty})`, state.textColor);
    target.ports.forEach(p => {
      appendLine(output, `  Порт ${p.port} (${p.service}) - открыт`, state.textColor);
    });
    appendLine(output, '', state.textColor);
  });
  appendLine(output, `Сканирование завершено. Найдено целей: ${targets.length}`, '#00ff88');
  updateQuestStep('skill_first_script', 'use_script_command', null);
}

function doAi(output, state) {
  if (!hasSkillEffect('ai_hints')) {
    appendLine(output, 'Требуется навык: Искусственный интеллект', '#f44747');
    return;
  }
  const hints = [
    'Совет: Попробуйте просканировать 192.168.1.25, там слабые пароли',
    'Совет: Используйте bruteforce на открытых портах',
    'Совет: Подключитесь к взломанному серверу командой connect',
    'Совет: Включите VPN перед взломом для скрытия следов',
    'Совет: Скачивайте файлы с серверов для выполнения заказов на ХакФоруме'
  ];
  const hint = hints[Math.floor(Math.random() * hints.length)];
  appendLine(output, hint, '#00ffcc');
}

function doSniff(args, output, state) {
  if (!hasSkillEffect('traffic_sniff')) {
    appendLine(output, 'Требуется навык: Перехват трафика', '#f44747');
    return;
  }
  if (!args) {
    appendLine(output, 'Использование: sniff <ip-адрес>', '#f44747');
    return;
  }
  const ip = args.trim();
  const target = hackingSystem.getTargetByIp(ip);
  if (!target) {
    appendLine(output, `Хост ${ip} не найден в сети.`, '#f44747');
    return;
  }
  appendLine(output, `Перехват трафика ${ip}...`, state.textColor);
  appendLine(output, 'Перехваченные данные: login=admin, password=qwerty123', '#00ff88');
}

function doCraft(args, output, state) {
  const parts = args ? args.trim().split(/\s+/) : [];
  if (parts[0] !== 'virus' || parts.length < 2) {
    appendLine(output, 'Использование: craft virus <имя>', '#f44747');
    return;
  }
  if (!hasSkillEffect('craft_virus')) {
    appendLine(output, 'Требуется навык: Создание вирусов', '#f44747');
    return;
  }
  const virusName = parts.slice(1).join('_');
  const filename = 'virus_' + virusName + '.exe';
  const created = fileSystem.createFile('/Downloads/' + filename, 'Вирусный код...');
  if (created) {
    appendLine(output, `Вирус создан: ${filename}`, '#00ff88');
  } else {
    appendLine(output, `Файл ${filename} уже существует.`, '#ffff00');
  }
}

function appendLine(output, text, color) {
  const line = document.createElement('div');
  line.className = 'terminal-line-output';
  line.style.color = color || '#cccccc';
  line.textContent = text;
  output.appendChild(line);
}
