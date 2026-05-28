import { on, getWindows, minimizeWindow, restoreWindow, focusWindow, getActiveWindowId } from './windowManager.js';

let taskbarEl = null;
let clockInterval = null;

const pinnedApps = [
  { id: 'fileExplorer', name: 'File Explorer', icon: '/icons/file-explorer.svg' },
  { id: 'browser', name: 'Browser', icon: '/icons/browser.svg' },
  { id: 'terminal', name: 'Terminal', icon: '/icons/terminal.svg' }
];

export function initTaskbar() {
  taskbarEl = document.getElementById('taskbar');
  renderTaskbar();
  setupWindowListeners();
  startClock();
}

function renderTaskbar() {
  taskbarEl.innerHTML = `
    <div class="taskbar-content">
      <div class="taskbar-center">
        <button class="taskbar-btn taskbar-start-btn" id="start-btn" aria-label="Start">
          <img src="/icons/start.svg" alt="Start" />
        </button>
        <div class="taskbar-pinned" id="taskbar-pinned"></div>
        <div class="taskbar-open-windows" id="taskbar-windows"></div>
      </div>
      <div class="taskbar-tray">
        <div class="tray-icons">
          <button class="tray-icon-btn" aria-label="Wi-Fi">
            <img src="/icons/wifi.svg" alt="Wi-Fi" />
          </button>
          <button class="tray-icon-btn" aria-label="Volume">
            <img src="/icons/volume.svg" alt="Volume" />
          </button>
          <button class="tray-icon-btn" aria-label="Battery">
            <img src="/icons/battery.svg" alt="Battery" />
          </button>
        </div>
        <div class="taskbar-clock" id="taskbar-clock"></div>
      </div>
    </div>
  `;

  renderPinnedApps();
  setupStartButton();
}

function renderPinnedApps() {
  const container = document.getElementById('taskbar-pinned');
  pinnedApps.forEach(app => {
    const btn = document.createElement('button');
    btn.className = 'taskbar-btn taskbar-app-btn';
    btn.dataset.appId = app.id;
    btn.setAttribute('aria-label', app.name);
    btn.innerHTML = `<img src="${app.icon}" alt="${app.name}" />`;
    btn.addEventListener('click', () => handleTaskbarAppClick(app.id));
    container.appendChild(btn);
  });
}

function handleTaskbarAppClick(appId) {
  const wins = getWindows().filter(w => w.appId === appId);
  if (wins.length === 0) {
    // Import desktop's openApp dynamically to avoid circular
    import('./desktop.js').then(m => {
      const app = pinnedApps.find(a => a.id === appId);
      m.openApp(appId, app.name, app.icon);
    });
    return;
  }

  const win = wins[0];
  if (win.minimized) {
    restoreWindow(win.id);
  } else if (getActiveWindowId() === win.id) {
    minimizeWindow(win.id);
  } else {
    focusWindow(win.id);
  }
}

function setupStartButton() {
  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', () => {
    const startMenu = document.getElementById('start-menu');
    startMenu.classList.toggle('start-menu-visible');
  });
}

function setupWindowListeners() {
  on('create', updateWindowButtons);
  on('close', updateWindowButtons);
  on('minimize', updateWindowButtons);
  on('restore', updateWindowButtons);
  on('focus', updateWindowButtons);
}

function updateWindowButtons() {
  const container = document.getElementById('taskbar-windows');
  if (!container) return;
  container.innerHTML = '';

  const wins = getWindows();
  // Group by appId, only show apps that aren't pinned
  const unpinnedWindows = wins.filter(w => !pinnedApps.some(p => p.id === w.appId));

  unpinnedWindows.forEach(win => {
    const btn = document.createElement('button');
    btn.className = 'taskbar-btn taskbar-window-btn';
    if (getActiveWindowId() === win.id) btn.classList.add('active');
    if (win.minimized) btn.classList.add('minimized');
    btn.innerHTML = `<img src="${win.icon}" alt="${win.title}" />`;
    btn.addEventListener('click', () => {
      if (win.minimized) {
        restoreWindow(win.id);
      } else if (getActiveWindowId() === win.id) {
        minimizeWindow(win.id);
      } else {
        focusWindow(win.id);
      }
    });
    container.appendChild(btn);
  });

  // Update pinned buttons active state
  const pinnedBtns = document.querySelectorAll('.taskbar-app-btn');
  pinnedBtns.forEach(btn => {
    const appId = btn.dataset.appId;
    const hasWindow = wins.some(w => w.appId === appId && !w.minimized);
    const isActive = wins.some(w => w.appId === appId && getActiveWindowId() === w.id);
    btn.classList.toggle('has-window', wins.some(w => w.appId === appId));
    btn.classList.toggle('active', isActive);
  });
}

function startClock() {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
  const clockEl = document.getElementById('taskbar-clock');
  if (!clockEl) return;
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  clockEl.innerHTML = `<span class="clock-time">${time}</span><span class="clock-date">${date}</span>`;
}
