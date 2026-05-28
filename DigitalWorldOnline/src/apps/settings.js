import { createWindow } from '../core/windowManager.js';
import { setWallpaper } from '../core/desktop.js';
import * as storage from '../core/storage.js';

export function open() {
  const win = createWindow({
    title: 'Settings',
    icon: '/icons/settings.svg',
    appId: 'settings',
    width: 800,
    height: 550,
    content: '<div class="app-settings"></div>'
  });

  const container = win.element.querySelector('.app-settings');
  const state = { page: 'personalization' };
  render(container, state);
}

function render(container, state) {
  container.innerHTML = `
    <div class="settings-sidebar">
      <div class="settings-sidebar-item ${state.page === 'personalization' ? 'active' : ''}" data-page="personalization">
        <span>&#127912;</span>
        <span>Personalization</span>
      </div>
      <div class="settings-sidebar-item ${state.page === 'system' ? 'active' : ''}" data-page="system">
        <span>&#128187;</span>
        <span>System</span>
      </div>
      <div class="settings-sidebar-item ${state.page === 'about' ? 'active' : ''}" data-page="about">
        <span>&#8505;</span>
        <span>About</span>
      </div>
    </div>
    <div class="settings-content"></div>
  `;

  container.querySelectorAll('.settings-sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      state.page = item.dataset.page;
      render(container, state);
    });
  });

  const content = container.querySelector('.settings-content');
  switch (state.page) {
    case 'personalization':
      renderPersonalization(content);
      break;
    case 'system':
      renderSystem(content);
      break;
    case 'about':
      renderAbout(content);
      break;
  }
}

function renderPersonalization(content) {
  const currentWallpaper = storage.get('wallpaper') || 'default';
  const currentTheme = storage.get('theme') || 'light';
  const currentAccent = storage.get('accent') || '#0078D4';

  const wallpapers = [
    { name: 'Default', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Ocean', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
    { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    { name: 'Night', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
    { name: 'Autumn', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
    { name: 'Sky', value: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
    { name: 'Dark', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' }
  ];

  const accents = ['#0078D4', '#FF8C00', '#E81123', '#0B6A0B', '#8764B8', '#00B7C3', '#767676', '#CA5010'];

  content.innerHTML = `
    <h2>Personalization</h2>
    <div class="settings-section">
      <h3>Wallpaper</h3>
      <div class="settings-color-grid" style="grid-template-columns:repeat(4,1fr);">
        ${wallpapers.map(w => `
          <div class="settings-color-swatch ${currentWallpaper === w.value ? 'active' : ''}" 
               data-wallpaper="${w.value}" 
               style="background:${w.value};height:60px;" 
               title="${w.name}"></div>
        `).join('')}
      </div>
    </div>
    <div class="settings-section">
      <h3>Theme</h3>
      <div class="settings-option">
        <span>Dark mode</span>
        <div class="settings-toggle ${currentTheme === 'dark' ? 'active' : ''}" data-toggle="theme"></div>
      </div>
    </div>
    <div class="settings-section">
      <h3>Accent Color</h3>
      <div class="settings-color-grid">
        ${accents.map(c => `
          <div class="settings-color-swatch ${currentAccent === c ? 'active' : ''}" 
               data-accent="${c}" 
               style="background:${c};"></div>
        `).join('')}
      </div>
    </div>
  `;

  // Wallpaper clicks
  content.querySelectorAll('[data-wallpaper]').forEach(swatch => {
    swatch.addEventListener('click', () => {
      content.querySelectorAll('[data-wallpaper]').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      setWallpaper(swatch.dataset.wallpaper);
    });
  });

  // Theme toggle
  const toggle = content.querySelector('[data-toggle="theme"]');
  toggle.addEventListener('click', () => {
    const isDark = toggle.classList.toggle('active');
    const theme = isDark ? 'dark' : 'light';
    storage.set('theme', theme);
    applyTheme(theme);
  });

  // Accent color clicks
  content.querySelectorAll('[data-accent]').forEach(swatch => {
    swatch.addEventListener('click', () => {
      content.querySelectorAll('[data-accent]').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const color = swatch.dataset.accent;
      storage.set('accent', color);
      document.documentElement.style.setProperty('--accent-color', color);
    });
  });
}

function renderSystem(content) {
  content.innerHTML = `
    <h2>System</h2>
    <div class="settings-section">
      <h3>Device specifications</h3>
      <div class="settings-option"><span>Device name</span><span>DIGITAL-WORLD-PC</span></div>
      <div class="settings-option"><span>Processor</span><span>Intel Core i9-13900K @ 5.80 GHz</span></div>
      <div class="settings-option"><span>Installed RAM</span><span>32.0 GB</span></div>
      <div class="settings-option"><span>System type</span><span>64-bit operating system, x64-based processor</span></div>
      <div class="settings-option"><span>Display</span><span>2560 x 1440 @ 165Hz</span></div>
    </div>
    <div class="settings-section">
      <h3>Storage</h3>
      <div class="settings-option"><span>Drive C:</span><span>512 GB NVMe SSD (234 GB free)</span></div>
      <div class="settings-option"><span>Drive D:</span><span>2 TB HDD (1.4 TB free)</span></div>
    </div>
  `;
}

function renderAbout(content) {
  content.innerHTML = `
    <h2>About</h2>
    <div class="settings-section">
      <h3>Digital World Online</h3>
      <div class="settings-option"><span>Edition</span><span>Digital World Online</span></div>
      <div class="settings-option"><span>Version</span><span>1.0.0</span></div>
      <div class="settings-option"><span>OS build</span><span>22631.1234</span></div>
    </div>
    <div class="settings-section">
      <h3>Device specifications</h3>
      <div class="settings-option"><span>Device name</span><span>DIGITAL-WORLD-PC</span></div>
      <div class="settings-option"><span>Processor</span><span>Intel Core i9-13900K @ 5.80 GHz</span></div>
      <div class="settings-option"><span>Installed RAM</span><span>32.0 GB</span></div>
      <div class="settings-option"><span>System type</span><span>64-bit operating system, x64-based processor</span></div>
    </div>
  `;
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.style.setProperty('--bg-primary', '#1e1e1e');
    root.style.setProperty('--bg-secondary', '#2d2d2d');
    root.style.setProperty('--bg-tertiary', '#3d3d3d');
    root.style.setProperty('--text-primary', '#ffffff');
    root.style.setProperty('--text-secondary', '#aaaaaa');
    root.style.setProperty('--border-color', '#404040');
  } else {
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f3f3f3');
    root.style.setProperty('--bg-tertiary', '#e5e5e5');
    root.style.setProperty('--text-primary', '#1a1a1a');
    root.style.setProperty('--text-secondary', '#616161');
    root.style.setProperty('--border-color', '#e0e0e0');
  }
}

// Apply saved theme on module load
export function initTheme() {
  const theme = storage.get('theme') || 'light';
  const accent = storage.get('accent') || '#0078D4';
  applyTheme(theme);
  document.documentElement.style.setProperty('--accent-color', accent);
}
