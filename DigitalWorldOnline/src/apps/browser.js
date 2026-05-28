import { createWindow } from '../core/windowManager.js';

export function open() {
  const win = createWindow({
    title: 'Browser',
    icon: '/icons/browser.svg',
    appId: 'browser',
    width: 900,
    height: 600,
    content: '<div class="app-browser"></div>'
  });

  const container = win.element.querySelector('.app-browser');
  const state = {
    tabs: [{ id: 1, url: 'searchall.com', title: 'SearchAll', history: ['searchall.com'], historyIndex: 0 }],
    activeTab: 1,
    nextTabId: 2
  };

  render(container, state, win);
}

function render(container, state, win) {
  container.innerHTML = `
    <div class="browser-tab-bar">
      <div class="browser-tabs"></div>
      <button class="browser-new-tab-btn" title="New Tab">+</button>
    </div>
    <div class="browser-toolbar">
      <button class="browser-nav-btn browser-back-btn" title="Back">&#8592;</button>
      <button class="browser-nav-btn browser-forward-btn" title="Forward">&#8594;</button>
      <button class="browser-nav-btn browser-refresh-btn" title="Refresh">&#8635;</button>
      <input class="browser-url-bar" type="text" value="" />
      <button class="browser-nav-btn browser-go-btn" title="Go">&#8594;</button>
    </div>
    <div class="browser-bookmarks-bar">
      <button class="browser-bookmark" data-url="searchall.com">SearchAll</button>
      <button class="browser-bookmark" data-url="newsdaily.com">NewsDaily</button>
      <button class="browser-bookmark" data-url="wikiworld.com">WikiWorld</button>
    </div>
    <div class="browser-content"></div>
  `;

  renderTabs(container, state, win);
  setupNav(container, state, win);
  loadPage(container, state);
}

function renderTabs(container, state, win) {
  const tabsEl = container.querySelector('.browser-tabs');
  tabsEl.innerHTML = '';

  state.tabs.forEach(tab => {
    const tabEl = document.createElement('div');
    tabEl.className = 'browser-tab' + (tab.id === state.activeTab ? ' active' : '');
    tabEl.innerHTML = `
      <span class="browser-tab-title">${tab.title}</span>
      ${state.tabs.length > 1 ? '<button class="browser-tab-close">&times;</button>' : ''}
    `;

    tabEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('browser-tab-close')) {
        state.activeTab = tab.id;
        renderTabs(container, state, win);
        loadPage(container, state);
        updateUrlBar(container, state);
      }
    });

    const closeBtn = tabEl.querySelector('.browser-tab-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.tabs = state.tabs.filter(t => t.id !== tab.id);
        if (state.activeTab === tab.id) {
          state.activeTab = state.tabs[0].id;
        }
        renderTabs(container, state, win);
        loadPage(container, state);
        updateUrlBar(container, state);
      });
    }

    tabsEl.appendChild(tabEl);
  });

  const newTabBtn = container.querySelector('.browser-new-tab-btn');
  newTabBtn.addEventListener('click', () => {
    const newTab = { id: state.nextTabId++, url: 'searchall.com', title: 'SearchAll', history: ['searchall.com'], historyIndex: 0 };
    state.tabs.push(newTab);
    state.activeTab = newTab.id;
    renderTabs(container, state, win);
    loadPage(container, state);
    updateUrlBar(container, state);
  });
}

function setupNav(container, state, win) {
  const backBtn = container.querySelector('.browser-back-btn');
  const fwdBtn = container.querySelector('.browser-forward-btn');
  const refreshBtn = container.querySelector('.browser-refresh-btn');
  const urlBar = container.querySelector('.browser-url-bar');
  const goBtn = container.querySelector('.browser-go-btn');

  backBtn.addEventListener('click', () => {
    const tab = getActiveTab(state);
    if (tab.historyIndex > 0) {
      tab.historyIndex--;
      tab.url = tab.history[tab.historyIndex];
      loadPage(container, state);
      updateUrlBar(container, state);
    }
  });

  fwdBtn.addEventListener('click', () => {
    const tab = getActiveTab(state);
    if (tab.historyIndex < tab.history.length - 1) {
      tab.historyIndex++;
      tab.url = tab.history[tab.historyIndex];
      loadPage(container, state);
      updateUrlBar(container, state);
    }
  });

  refreshBtn.addEventListener('click', () => {
    loadPage(container, state);
  });

  const navigate = () => {
    const url = urlBar.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (url) {
      navigateTo(container, state, url, win);
    }
  };

  goBtn.addEventListener('click', navigate);
  urlBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigate();
  });

  container.querySelectorAll('.browser-bookmark').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(container, state, btn.dataset.url, win);
    });
  });

  updateUrlBar(container, state);
}

function navigateTo(container, state, url, win) {
  const tab = getActiveTab(state);
  tab.historyIndex++;
  tab.history = tab.history.slice(0, tab.historyIndex);
  tab.history.push(url);
  tab.url = url;
  loadPage(container, state);
  updateUrlBar(container, state);
  updateTabTitle(container, state, win);
}

function updateUrlBar(container, state) {
  const urlBar = container.querySelector('.browser-url-bar');
  const tab = getActiveTab(state);
  if (urlBar && tab) urlBar.value = tab.url;
}

function updateTabTitle(container, state, win) {
  const tab = getActiveTab(state);
  const titles = { 'searchall.com': 'SearchAll', 'newsdaily.com': 'NewsDaily', 'wikiworld.com': 'WikiWorld' };
  tab.title = titles[tab.url] || tab.url;
  renderTabs(container, state, win);
}

function getActiveTab(state) {
  return state.tabs.find(t => t.id === state.activeTab);
}

function loadPage(container, state) {
  const content = container.querySelector('.browser-content');
  const tab = getActiveTab(state);
  if (!tab) return;

  const url = tab.url;

  if (url === 'searchall.com' || url === '' || url === 'home') {
    content.innerHTML = renderSearchAll();
    setupSearchAll(content, container, state);
  } else if (url === 'newsdaily.com') {
    content.innerHTML = renderNewsDaily();
    setupLinks(content, container, state);
  } else if (url === 'wikiworld.com') {
    content.innerHTML = renderWikiWorld();
    setupLinks(content, container, state);
  } else {
    content.innerHTML = renderNotFound(url);
  }
}

function setupSearchAll(content, container, state) {
  const form = content.querySelector('.browser-search-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('.browser-search-input');
      const query = input.value.trim();
      if (query) {
        const tab = getActiveTab(state);
        tab.historyIndex++;
        tab.history = tab.history.slice(0, tab.historyIndex);
        tab.history.push('searchall.com');
        tab.url = 'searchall.com';
        loadPage(container, state);
      }
    });
  }
  setupLinks(content, container, state);
}

function setupLinks(content, container, state) {
  content.querySelectorAll('[data-link]').forEach(link => {
    link.style.cursor = 'pointer';
    link.style.color = 'var(--accent-color)';
    link.addEventListener('click', () => {
      const url = link.dataset.link;
      const tab = getActiveTab(state);
      tab.historyIndex++;
      tab.history = tab.history.slice(0, tab.historyIndex);
      tab.history.push(url);
      tab.url = url;
      loadPage(container, state);
      updateUrlBar(container, state);
    });
  });
}

function renderSearchAll() {
  return `
    <div class="browser-homepage">
      <h1 style="font-size:42px;font-weight:700;color:#333;">Search<span style="color:var(--accent-color)">All</span></h1>
      <form class="browser-search-form">
        <input class="browser-search-input" type="text" placeholder="Search the web..." />
        <button type="submit" style="padding:10px 20px;background:var(--accent-color);color:white;border:none;border-radius:24px;cursor:pointer;font-size:14px;">Search</button>
      </form>
      <div style="margin-top:24px;display:flex;gap:16px;">
        <span data-link="newsdaily.com" style="font-size:13px;">NewsDaily</span>
        <span data-link="wikiworld.com" style="font-size:13px;">WikiWorld</span>
      </div>
    </div>
  `;
}

function renderNewsDaily() {
  const articles = [
    { title: 'New Digital Frontier Discovered in Sector 7', summary: 'Explorers have found a previously unknown region in the digital landscape, promising new resources and challenges for players.' },
    { title: 'Server Maintenance Scheduled for Tomorrow', summary: 'The development team announces a brief maintenance window to implement performance improvements and bug fixes.' },
    { title: 'Guild Rankings Updated: Top 10 Revealed', summary: 'The monthly guild rankings are in, with Team Nexus claiming the top spot for the third consecutive month.' },
    { title: 'New Crafting System Preview Released', summary: 'Players get a first look at the upcoming crafting overhaul, featuring 200+ new recipes and material combinations.' },
    { title: 'Community Event: Digital World Tournament', summary: 'Registration is now open for the annual Digital World Tournament with prizes totaling 1 million DW credits.' },
    { title: 'Security Update: Two-Factor Authentication', summary: 'All accounts are encouraged to enable 2FA following the latest security advisory from the development team.' }
  ];

  return `
    <div style="max-width:700px;margin:0 auto;">
      <div style="border-bottom:3px solid #c00;padding-bottom:12px;margin-bottom:20px;">
        <h1 style="font-size:28px;font-weight:700;">News<span style="color:#c00">Daily</span></h1>
        <p style="font-size:12px;color:#666;">Your source for Digital World news</p>
      </div>
      ${articles.map(a => `
        <div style="padding:16px 0;border-bottom:1px solid #eee;">
          <h3 style="font-size:16px;margin-bottom:6px;color:#222;">${a.title}</h3>
          <p style="font-size:13px;color:#555;line-height:1.4;">${a.summary}</p>
        </div>
      `).join('')}
      <div style="margin-top:16px;font-size:12px;color:#888;">
        <span data-link="searchall.com">SearchAll</span> | <span data-link="wikiworld.com">WikiWorld</span>
      </div>
    </div>
  `;
}

function renderWikiWorld() {
  return `
    <div style="display:flex;gap:20px;max-width:800px;margin:0 auto;">
      <div style="flex:1;">
        <h1 style="font-size:24px;border-bottom:1px solid #aaa;padding-bottom:8px;margin-bottom:12px;">Digital World Online</h1>
        <p style="font-size:13px;line-height:1.6;margin-bottom:12px;">
          <strong>Digital World Online</strong> is a virtual reality massively multiplayer online role-playing game (VRMMORPG) 
          set in a vast digital landscape. Players exist as digital entities within a computer-generated universe, 
          exploring procedurally generated environments, battling corrupted data entities, and building communities 
          within the network.
        </p>
        <h2 style="font-size:18px;margin:16px 0 8px;">Gameplay</h2>
        <p style="font-size:13px;line-height:1.6;margin-bottom:12px;">
          The game features an open-world environment where players can explore various sectors of the digital realm. 
          Each sector has unique characteristics, from the neon-lit Data Highways to the mysterious Encrypted Vaults. 
          Players can engage in real-time combat against corrupted programs, team up for raid dungeons, or focus on 
          crafting and trading digital resources.
        </p>
        <h2 style="font-size:18px;margin:16px 0 8px;">History</h2>
        <p style="font-size:13px;line-height:1.6;margin-bottom:12px;">
          Digital World Online launched in 2024 as a groundbreaking VRMMORPG. The game was developed by a team of 
          researchers who discovered that digital consciousness could be temporarily transferred into virtual 
          environments. Since launch, the game has attracted over 10 million active players worldwide.
        </p>
        <h2 style="font-size:18px;margin:16px 0 8px;">The Digital Landscape</h2>
        <p style="font-size:13px;line-height:1.6;">
          The game world is divided into regions called "Sectors," each maintained by powerful AI constructs known as 
          "Guardians." Players must navigate firewalls, decrypt data barriers, and overcome security protocols to 
          advance through the world. The deeper sectors contain more powerful enemies but also more valuable resources.
        </p>
      </div>
      <div style="width:180px;padding:12px;background:#f8f8f8;border-radius:4px;font-size:12px;align-self:flex-start;">
        <h3 style="font-size:13px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #ddd;">Related Articles</h3>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:6px;">
          <li><span data-link="newsdaily.com" style="font-size:12px;">Latest News</span></li>
          <li><span data-link="searchall.com" style="font-size:12px;">Search More</span></li>
        </ul>
      </div>
    </div>
  `;
}

function renderNotFound(url) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;">
      <h1 style="font-size:48px;color:#ccc;">404</h1>
      <p style="font-size:16px;color:#666;">Page not found</p>
      <p style="font-size:13px;color:#999;">The page at "${url}" could not be reached.</p>
      <button data-link="searchall.com" style="margin-top:12px;padding:8px 16px;background:var(--accent-color);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;">Go to SearchAll</button>
    </div>
  `;
}
