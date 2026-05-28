import { createWindow } from './windowManager.js';
import * as storage from './storage.js';
import { open as openFileExplorer } from '../apps/fileExplorer.js';
import { open as openNotepad } from '../apps/notepad.js';
import { open as openTerminal } from '../apps/terminal.js';
import { open as openBrowser } from '../apps/browser.js';
import { open as openSettings } from '../apps/settings.js';
import { open as openCalculator } from '../apps/calculator.js';
import { open as openRecycleBin } from '../apps/recycleBin.js';

const appOpeners = {
  fileExplorer: openFileExplorer,
  notepad: openNotepad,
  terminal: openTerminal,
  browser: openBrowser,
  settings: openSettings,
  calculator: openCalculator,
  recycleBin: openRecycleBin
};

const desktopIcons = [
  { id: 'file-explorer', name: 'Проводник', icon: '/icons/file-explorer.svg', appId: 'fileExplorer' },
  { id: 'notepad', name: 'Блокнот', icon: '/icons/notepad.svg', appId: 'notepad' },
  { id: 'terminal', name: 'Терминал', icon: '/icons/terminal.svg', appId: 'terminal' },
  { id: 'browser', name: 'Браузер', icon: '/icons/browser.svg', appId: 'browser' },
  { id: 'settings', name: 'Настройки', icon: '/icons/settings.svg', appId: 'settings' },
  { id: 'recycle-bin', name: 'Корзина', icon: '/icons/recycle-bin.svg', appId: 'recycleBin' },
  { id: 'calculator', name: 'Калькулятор', icon: '/icons/calculator.svg', appId: 'calculator' }
];

let desktopEl = null;
let contextMenuEl = null;

export function initDesktop() {
  desktopEl = document.getElementById('desktop');
  contextMenuEl = document.getElementById('context-menu');

  applyWallpaper();
  renderIcons();
  setupContextMenu();
  setupClickOutside();
}

function applyWallpaper() {
  const wallpaper = storage.get('wallpaper') || 'default';
  if (wallpaper === 'default') {
    desktopEl.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  } else {
    desktopEl.style.background = wallpaper;
  }
}

export function setWallpaper(value) {
  storage.set('wallpaper', value);
  applyWallpaper();
}

function renderIcons() {
  const iconsContainer = document.createElement('div');
  iconsContainer.className = 'desktop-icons';

  desktopIcons.forEach(iconData => {
    const iconEl = document.createElement('div');
    iconEl.className = 'desktop-icon';
    iconEl.dataset.appId = iconData.appId;
    iconEl.innerHTML = `
      <img src="${iconData.icon}" alt="${iconData.name}" class="desktop-icon-img" />
      <span class="desktop-icon-label">${iconData.name}</span>
    `;

    iconEl.addEventListener('dblclick', () => {
      openApp(iconData.appId, iconData.name, iconData.icon);
    });

    iconsContainer.appendChild(iconEl);
  });

  desktopEl.appendChild(iconsContainer);
}

export function openApp(appId, title, icon) {
  const opener = appOpeners[appId];
  if (opener) {
    opener();
  } else {
    createWindow({
      title: title || appId,
      icon: icon || '/icons/file.svg',
      appId,
      content: `<div class="app-container" data-app="${appId}"><p style="padding:20px;color:#666;">App "${appId}" loading...</p></div>`
    });
  }
}

function setupContextMenu() {
  desktopEl.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.desktop-icon')) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY);
  });
}

function showContextMenu(x, y) {
  contextMenuEl.innerHTML = `
    <div class="context-menu-content">
      <div class="context-menu-item context-menu-submenu">
        <span>Создать</span>
        <span class="context-menu-arrow">&#9656;</span>
        <div class="context-submenu">
          <div class="context-menu-item" data-action="new-folder">Папку</div>
          <div class="context-menu-item" data-action="new-file">Текстовый документ</div>
        </div>
      </div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" data-action="refresh">Обновить</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" data-action="display-settings">Параметры экрана</div>
      <div class="context-menu-item" data-action="personalize">Персонализация</div>
    </div>
  `;

  contextMenuEl.style.left = x + 'px';
  contextMenuEl.style.top = y + 'px';
  contextMenuEl.style.display = 'block';

  // Handle menu actions
  contextMenuEl.querySelectorAll('[data-action]').forEach(item => {
    item.addEventListener('click', () => {
      handleContextAction(item.dataset.action);
      hideContextMenu();
    });
  });
}

function hideContextMenu() {
  contextMenuEl.style.display = 'none';
}

function handleContextAction(action) {
  switch (action) {
    case 'new-folder':
      // Will be handled by file system in FEAT-002
      break;
    case 'new-file':
      break;
    case 'refresh':
      break;
    case 'display-settings':
      openApp('settings', 'Настройки', '/icons/settings.svg');
      break;
    case 'personalize':
      openApp('settings', 'Настройки', '/icons/settings.svg');
      break;
  }
}

function setupClickOutside() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#context-menu')) {
      hideContextMenu();
    }
  });
}
