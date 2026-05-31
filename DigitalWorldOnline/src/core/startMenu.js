import { openApp } from './desktop.js';
import { getLevel } from './levelSystem.js';

const apps = [
  { id: 'fileExplorer', name: 'Проводник', icon: '/icons/file-explorer.svg' },
  { id: 'notepad', name: 'Блокнот', icon: '/icons/notepad.svg' },
  { id: 'terminal', name: 'Терминал', icon: '/icons/terminal.svg' },
  { id: 'browser', name: 'Браузер', icon: '/icons/browser.svg' },
  { id: 'settings', name: 'Настройки', icon: '/icons/settings.svg' },
  { id: 'calculator', name: 'Калькулятор', icon: '/icons/calculator.svg' },
  { id: 'recycleBin', name: 'Корзина', icon: '/icons/recycle-bin.svg' },
  { id: 'wallet', name: 'Кошелёк', icon: '/icons/wallet.svg' },
  { id: 'antivirus', name: 'Антивирус', icon: '/icons/antivirus.svg' },
  { id: 'vpn', name: 'VPN', icon: '/icons/vpn.svg' },
  { id: 'messenger', name: 'Мессенджер', icon: '/icons/messenger.svg' },
  { id: 'journal', name: '\u0416\u0443\u0440\u043d\u0430\u043b', icon: '/icons/journal.svg' },
  { id: 'skills', name: '\u041d\u0430\u0432\u044b\u043a\u0438', icon: '/icons/skills.svg' }
];

let startMenuEl = null;
let showingAllApps = false;

export function initStartMenu() {
  startMenuEl = document.getElementById('start-menu');
  renderStartMenu();
  setupOutsideClick();
}

function renderStartMenu() {
  startMenuEl.innerHTML = `
    <div class="start-menu-content">
      <div class="start-menu-search">
        <img src="/icons/search.svg" alt="" class="start-search-icon" />
        <input type="text" placeholder="Введите для поиска" class="start-search-input" id="start-search" />
      </div>
      <div class="start-menu-section">
        <div class="start-menu-section-header">
          <span>Закреплённые</span>
          <button class="start-all-apps-btn" id="all-apps-btn">Все приложения &rarr;</button>
        </div>
        <div class="start-menu-grid" id="start-pinned-grid"></div>
      </div>
      <div class="start-menu-all-apps" id="start-all-apps" style="display:none;">
        <div class="start-menu-section-header">
          <button class="start-all-apps-btn" id="back-to-pinned-btn">&larr; Назад</button>
          <span>Все приложения</span>
        </div>
        <div class="start-all-apps-list" id="start-all-apps-list"></div>
      </div>
      <div class="start-menu-footer">
        <div class="start-menu-user">
          <div class="start-user-avatar"></div>
          <span>User | Ур. ${getLevel()}</span>
        </div>
        <div class="start-menu-power">
          <button class="start-power-btn" id="start-power-btn" aria-label="Power">
            <img src="/icons/power.svg" alt="Power" />
          </button>
          <div class="power-menu" id="power-menu" style="display:none;">
            <button class="power-menu-item" data-action="sleep">Спящий режим</button>
            <button class="power-menu-item" data-action="restart">Перезагрузка</button>
            <button class="power-menu-item" data-action="shutdown">Выключение</button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderPinnedGrid();
  renderAllAppsList();
  setupSearch();
  setupAllAppsToggle();
  setupPower();
}

function renderPinnedGrid() {
  const grid = document.getElementById('start-pinned-grid');
  apps.forEach(app => {
    const tile = document.createElement('button');
    tile.className = 'start-app-tile';
    tile.innerHTML = `
      <img src="${app.icon}" alt="${app.name}" class="start-app-icon" />
      <span class="start-app-name">${app.name}</span>
    `;
    tile.addEventListener('click', () => {
      openApp(app.id, app.name, app.icon);
      closeStartMenu();
    });
    grid.appendChild(tile);
  });
}

function renderAllAppsList() {
  const list = document.getElementById('start-all-apps-list');
  const sorted = [...apps].sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach(app => {
    const item = document.createElement('button');
    item.className = 'start-all-apps-item';
    item.innerHTML = `
      <img src="${app.icon}" alt="${app.name}" />
      <span>${app.name}</span>
    `;
    item.addEventListener('click', () => {
      openApp(app.id, app.name, app.icon);
      closeStartMenu();
    });
    list.appendChild(item);
  });
}

function setupSearch() {
  const input = document.getElementById('start-search');
  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const tiles = document.querySelectorAll('.start-app-tile');
    tiles.forEach(tile => {
      const name = tile.querySelector('.start-app-name').textContent.toLowerCase();
      tile.style.display = name.includes(query) ? '' : 'none';
    });
  });
}

function setupAllAppsToggle() {
  const allAppsBtn = document.getElementById('all-apps-btn');
  const backBtn = document.getElementById('back-to-pinned-btn');

  allAppsBtn.addEventListener('click', () => {
    document.getElementById('start-pinned-grid').parentElement.style.display = 'none';
    document.getElementById('start-all-apps').style.display = 'block';
    showingAllApps = true;
  });

  backBtn.addEventListener('click', () => {
    document.getElementById('start-pinned-grid').parentElement.style.display = '';
    document.getElementById('start-all-apps').style.display = 'none';
    showingAllApps = false;
  });
}

function setupPower() {
  const powerBtn = document.getElementById('start-power-btn');
  const powerMenu = document.getElementById('power-menu');

  powerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    powerMenu.style.display = powerMenu.style.display === 'none' ? 'block' : 'none';
  });

  powerMenu.querySelectorAll('.power-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      performPowerAction(action);
    });
  });
}

function performPowerAction(action) {
  closeStartMenu();
  const overlay = document.createElement('div');
  overlay.className = 'power-overlay';

  switch (action) {
    case 'shutdown':
      overlay.innerHTML = '<div class="power-text">Завершение работы...</div>';
      break;
    case 'restart':
      overlay.innerHTML = '<div class="power-text">Перезагрузка...</div>';
      break;
    case 'sleep':
      overlay.innerHTML = '';
      break;
  }

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('power-overlay-active'));

  setTimeout(() => {
    if (action === 'restart') {
      window.location.reload();
    } else {
      setTimeout(() => {
        overlay.classList.remove('power-overlay-active');
        setTimeout(() => overlay.remove(), 500);
      }, 2000);
    }
  }, 1500);
}

function closeStartMenu() {
  startMenuEl.classList.remove('start-menu-visible');
}

function setupOutsideClick() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
      closeStartMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeStartMenu();
    }
  });
}
