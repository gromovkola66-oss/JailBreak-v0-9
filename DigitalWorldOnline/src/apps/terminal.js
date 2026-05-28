import { createWindow } from '../core/windowManager.js';
import * as fileSystem from '../core/fileSystem.js';

export function open() {
  const win = createWindow({
    title: 'Terminal',
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
    textColor: '#cccccc'
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
  return `C:\\Users\\User${state.currentPath.replace(/\//g, '\\')}> `;
}

function processCommand(input, output, state, container) {
  if (!input) return;

  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  switch (cmd) {
    case 'help':
      printHelp(output, state);
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
    default:
      appendLine(output, `'${cmd}' не распознана как внутренняя или внешняя команда.`, '#f44747');
      break;
  }
}

function printHelp(output, state) {
  const lines = [
    'Available commands:',
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
    '  ping <адрес> - Пинг адреса'
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

function appendLine(output, text, color) {
  const line = document.createElement('div');
  line.className = 'terminal-line-output';
  line.style.color = color || '#cccccc';
  line.textContent = text;
  output.appendChild(line);
}
