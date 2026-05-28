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

  appendLine(output, 'Microsoft Windows [Version 10.0.22631.1234]', state.textColor);
  appendLine(output, '(c) Digital World Online. All rights reserved.', state.textColor);
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
      appendLine(output, 'The current date is: ' + new Date().toLocaleDateString(), state.textColor);
      break;
    case 'time':
      appendLine(output, 'The current time is: ' + new Date().toLocaleTimeString(), state.textColor);
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
      appendLine(output, `'${cmd}' is not recognized as an internal or external command.`, '#f44747');
      break;
  }
}

function printHelp(output, state) {
  const lines = [
    'Available commands:',
    '  help      - Show this help message',
    '  dir       - List files and folders in current directory',
    '  cd <path> - Change directory (cd .. to go up)',
    '  mkdir <n> - Create a new directory',
    '  echo <t>  - Print text to terminal',
    '  cls       - Clear the terminal screen',
    '  date      - Show current date',
    '  time      - Show current time',
    '  whoami    - Display current user',
    '  color <c> - Change text color (0a=green, 0b=cyan, 0c=red, 0e=yellow)',
    '  ipconfig  - Show network configuration',
    '  ping <a>  - Ping an address'
  ];
  lines.forEach(l => appendLine(output, l, state.textColor));
}

function printDir(output, state) {
  const items = fileSystem.listFolder(state.currentPath);
  appendLine(output, ' Directory of C:\\Users\\User' + state.currentPath.replace(/\//g, '\\'), state.textColor);
  appendLine(output, '', state.textColor);

  if (!items || items.length === 0) {
    appendLine(output, '  (empty)', state.textColor);
  } else {
    items.forEach(item => {
      const type = item.type === 'folder' ? '<DIR>' : '     ';
      appendLine(output, `  ${type}  ${item.name}`, state.textColor);
    });
  }
  appendLine(output, `        ${items ? items.length : 0} item(s)`, state.textColor);
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
    appendLine(output, 'The system cannot find the path specified.', '#f44747');
  }
}

function makeDir(args, output, state) {
  if (!args) {
    appendLine(output, 'The syntax of the command is incorrect.', '#f44747');
    return;
  }
  const path = state.currentPath === '/' ? '/' + args : state.currentPath + '/' + args;
  const result = fileSystem.createFolder(path);
  if (!result) {
    appendLine(output, 'A subdirectory or file already exists.', '#f44747');
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
    appendLine(output, 'Color changed.', state.textColor);
  } else if (args) {
    appendLine(output, 'Invalid color code. Try: 0a, 0b, 0c, 0d, 0e, 0f, 07', '#f44747');
  } else {
    appendLine(output, 'Usage: color <code> (e.g., 0a for green)', state.textColor);
  }
}

function printIpconfig(output, state) {
  const lines = [
    '',
    'Windows IP Configuration',
    '',
    'Ethernet adapter Ethernet:',
    '',
    '   Connection-specific DNS Suffix  . : digitalworld.local',
    '   IPv4 Address. . . . . . . . . . . : 192.168.1.100',
    '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
    '   Default Gateway . . . . . . . . . : 192.168.1.1',
    ''
  ];
  lines.forEach(l => appendLine(output, l, state.textColor));
}

function doPing(address, output, state, container) {
  if (!address) {
    appendLine(output, 'Usage: ping <address>', '#f44747');
    return;
  }

  const inputEl = container.querySelector('.terminal-input');
  inputEl.disabled = true;

  appendLine(output, '', state.textColor);
  appendLine(output, `Pinging ${address} with 32 bytes of data:`, state.textColor);

  let count = 0;
  const interval = setInterval(() => {
    const time = Math.floor(Math.random() * 20) + 5;
    appendLine(output, `Reply from ${address}: bytes=32 time=${time}ms TTL=128`, state.textColor);
    output.scrollTop = output.scrollHeight;
    count++;
    if (count >= 4) {
      clearInterval(interval);
      appendLine(output, '', state.textColor);
      appendLine(output, `Ping statistics for ${address}:`, state.textColor);
      appendLine(output, '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)', state.textColor);
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
