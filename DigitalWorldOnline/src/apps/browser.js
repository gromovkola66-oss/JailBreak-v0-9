import { createWindow } from '../core/windowManager.js';
import { getBalance, getTransactions, addMoney, canAfford, spendMoney } from '../core/economy.js';
import * as storage from '../core/storage.js';

export function open() {
  const win = createWindow({
    title: '\u0411\u0440\u0430\u0443\u0437\u0435\u0440',
    icon: '/icons/browser.svg',
    appId: 'browser',
    width: 900,
    height: 600,
    content: '<div class="app-browser"></div>'
  });

  const container = win.element.querySelector('.app-browser');
  const state = {
    tabs: [{ id: 1, url: 'searchall.dw', title: '\u041f\u043e\u0438\u0441\u043a\u0412\u0441\u0451', history: ['searchall.dw'], historyIndex: 0 }],
    activeTab: 1,
    nextTabId: 2,
    activeJob: null,
    jobTimer: null,
    wikiArticle: 'digital_world',
    freelanceCategory: 'all',
    marketCategory: 'all'
  };

  render(container, state, win);
}

function render(container, state, win) {
  container.innerHTML = `
    <div class="browser-tab-bar">
      <div class="browser-tabs"></div>
      <button class="browser-new-tab-btn" title="\u041d\u043e\u0432\u0430\u044f \u0432\u043a\u043b\u0430\u0434\u043a\u0430">+</button>
    </div>
    <div class="browser-toolbar">
      <button class="browser-nav-btn browser-back-btn" title="\u041d\u0430\u0437\u0430\u0434">&#8592;</button>
      <button class="browser-nav-btn browser-forward-btn" title="\u0412\u043f\u0435\u0440\u0451\u0434">&#8594;</button>
      <button class="browser-nav-btn browser-refresh-btn" title="\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c">&#8635;</button>
      <input class="browser-url-bar" type="text" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0430\u0434\u0440\u0435\u0441..." value="" />
      <button class="browser-nav-btn browser-go-btn" title="\u041f\u0435\u0440\u0435\u0439\u0442\u0438">&#8594;</button>
    </div>
    <div class="browser-bookmarks-bar">
      <button class="browser-bookmark" data-url="searchall.dw">\u041f\u043e\u0438\u0441\u043a\u0412\u0441\u0451</button>
      <button class="browser-bookmark" data-url="news.dw">\u041d\u043e\u0432\u043e\u0441\u0442\u0438\u0414\u043d\u044f</button>
      <button class="browser-bookmark" data-url="wiki.dw">\u0412\u0438\u043a\u0438\u041c\u0438\u0440</button>
      <button class="browser-bookmark" data-url="bank.dw">\u041a\u0440\u0438\u043f\u0442\u043e\u0411\u0430\u043d\u043a</button>
      <button class="browser-bookmark" data-url="freelance.dw">\u0424\u0440\u0438\u043b\u0430\u043d\u0441\u0411\u0438\u0440\u0436\u0430</button>
      <button class="browser-bookmark" data-url="market.dw">\u041c\u0430\u0440\u043a\u0435\u0442\u041f\u043b\u0435\u0439\u0441</button>
    </div>
    <div class="browser-content"></div>
  `;

  renderTabs(container, state, win);
  setupNav(container, state, win);
  loadPage(container, state, win);
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
        loadPage(container, state, win);
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
        loadPage(container, state, win);
        updateUrlBar(container, state);
      });
    }

    tabsEl.appendChild(tabEl);
  });

  const newTabBtn = container.querySelector('.browser-new-tab-btn');
  newTabBtn.onclick = null;
  newTabBtn.addEventListener('click', () => {
    const newTab = { id: state.nextTabId++, url: 'searchall.dw', title: '\u041f\u043e\u0438\u0441\u043a\u0412\u0441\u0451', history: ['searchall.dw'], historyIndex: 0 };
    state.tabs.push(newTab);
    state.activeTab = newTab.id;
    renderTabs(container, state, win);
    loadPage(container, state, win);
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
      loadPage(container, state, win);
      updateUrlBar(container, state);
    }
  });

  fwdBtn.addEventListener('click', () => {
    const tab = getActiveTab(state);
    if (tab.historyIndex < tab.history.length - 1) {
      tab.historyIndex++;
      tab.url = tab.history[tab.historyIndex];
      loadPage(container, state, win);
      updateUrlBar(container, state);
    }
  });

  refreshBtn.addEventListener('click', () => {
    loadPage(container, state, win);
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
  loadPage(container, state, win);
  updateUrlBar(container, state);
  updateTabTitle(state);
  renderTabs(container, state, win);
}

function updateUrlBar(container, state) {
  const urlBar = container.querySelector('.browser-url-bar');
  const tab = getActiveTab(state);
  if (urlBar && tab) urlBar.value = tab.url;
}

function updateTabTitle(state) {
  const tab = getActiveTab(state);
  const titles = {
    'searchall.dw': '\u041f\u043e\u0438\u0441\u043a\u0412\u0441\u0451',
    'news.dw': '\u041d\u043e\u0432\u043e\u0441\u0442\u0438\u0414\u043d\u044f',
    'wiki.dw': '\u0412\u0438\u043a\u0438\u041c\u0438\u0440',
    'bank.dw': '\u041a\u0440\u0438\u043f\u0442\u043e\u0411\u0430\u043d\u043a',
    'freelance.dw': '\u0424\u0440\u0438\u043b\u0430\u043d\u0441\u0411\u0438\u0440\u0436\u0430',
    'market.dw': '\u041c\u0430\u0440\u043a\u0435\u0442\u041f\u043b\u0435\u0439\u0441'
  };
  tab.title = titles[tab.url] || tab.url;
}

function getActiveTab(state) {
  return state.tabs.find(t => t.id === state.activeTab);
}

function loadPage(container, state, win) {
  const content = container.querySelector('.browser-content');
  const tab = getActiveTab(state);
  if (!tab) return;

  const url = tab.url;

  if (url === 'searchall.dw') {
    renderSearchAll(content, container, state, win);
  } else if (url === 'news.dw') {
    renderNews(content, container, state, win);
  } else if (url === 'wiki.dw') {
    renderWiki(content, container, state, win);
  } else if (url === 'bank.dw') {
    renderBank(content);
  } else if (url === 'freelance.dw') {
    renderFreelance(content, container, state, win);
  } else if (url === 'market.dw') {
    renderMarket(content, container, state, win);
  } else {
    renderNotFound(content, url, container, state, win);
  }
}

function setupInternalLinks(content, container, state, win) {
  content.querySelectorAll('[data-link]').forEach(link => {
    link.style.cursor = 'pointer';
    link.style.color = 'var(--accent-color)';
    link.addEventListener('click', () => {
      navigateTo(container, state, link.dataset.link, win);
    });
  });
}

// ==================== Site 1: ПоискВсё ====================
function renderSearchAll(content, container, state, win) {
  content.innerHTML = `
    <div class="browser-homepage">
      <h1 class="browser-site-logo" style="font-size:48px;">ПоискВс<span style="color:var(--accent-color)">ё</span></h1>
      <form class="browser-search-form">
        <input class="browser-search-input" type="text" placeholder="Искать в сети..." />
        <button type="submit" class="browser-search-btn">Найти</button>
      </form>
      <div class="search-quick-links">
        <span data-link="news.dw">НовостиДня</span>
        <span data-link="wiki.dw">ВикиМир</span>
        <span data-link="bank.dw">КриптоБанк</span>
        <span data-link="freelance.dw">ФрилансБиржа</span>
        <span data-link="market.dw">МаркетПлейс</span>
      </div>
    </div>
  `;

  const form = content.querySelector('.browser-search-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = form.querySelector('.browser-search-input').value.trim().toLowerCase();
    if (query) {
      renderSearchResults(content, query, container, state, win);
    }
  });

  setupInternalLinks(content, container, state, win);
}

function renderSearchResults(content, query, container, state, win) {
  const sites = [
    { url: 'news.dw', title: 'НовостиДня - Новости цифрового мира', desc: 'Последние новости, обновления серверов, рейтинги гильдий и события.', keywords: ['новости', 'события', 'обновления', 'гильдии', 'news'] },
    { url: 'wiki.dw', title: 'ВикиМир - Энциклопедия цифрового мира', desc: 'Статьи о цифровом мире, валюте, безопасности и фрилансе.', keywords: ['вики', 'статьи', 'информация', 'мир', 'wiki', 'знания'] },
    { url: 'bank.dw', title: 'КриптоБанк - Онлайн банкинг', desc: 'Управление балансом, история транзакций, переводы.', keywords: ['банк', 'деньги', 'баланс', 'транзакции', 'bank', 'оплата'] },
    { url: 'freelance.dw', title: 'ФрилансБиржа - Заработок в цифровом мире', desc: 'Найдите работу: дизайн, программирование, тексты, тестирование.', keywords: ['работа', 'фриланс', 'заработок', 'задания', 'freelance', 'деньги'] },
    { url: 'market.dw', title: 'МаркетПлейс - Цифровой магазин', desc: 'Софт, обои, утилиты. Покупки за ДигиКоины.', keywords: ['магазин', 'купить', 'софт', 'обои', 'market', 'покупки'] },
    { url: 'searchall.dw', title: 'ПоискВсё - Поисковая система', desc: 'Поиск информации в цифровом мире.', keywords: ['поиск', 'найти', 'search'] }
  ];

  const results = sites.filter(s => {
    return s.keywords.some(k => k.includes(query) || query.includes(k)) ||
           s.title.toLowerCase().includes(query) ||
           s.desc.toLowerCase().includes(query);
  });

  content.innerHTML = `
    <div class="search-results-page">
      <div class="search-results-header">
        <h1 class="browser-site-logo" style="font-size:24px;">ПоискВс<span style="color:var(--accent-color)">ё</span></h1>
        <form class="browser-search-form" style="max-width:100%;">
          <input class="browser-search-input" type="text" value="${query}" />
          <button type="submit" class="browser-search-btn">Найти</button>
        </form>
      </div>
      <div class="search-results-count">Найдено результатов: ${results.length}</div>
      <div class="search-results-list">
        ${results.length > 0 ? results.map(r => `
          <div class="search-result-item">
            <a class="search-result-url" data-link="${r.url}">${r.url}</a>
            <h3 class="search-result-title" data-link="${r.url}">${r.title}</h3>
            <p class="search-result-desc">${r.desc}</p>
          </div>
        `).join('') : '<p class="search-no-results">По вашему запросу ничего не найдено.</p>'}
      </div>
    </div>
  `;

  const form = content.querySelector('.browser-search-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newQuery = form.querySelector('.browser-search-input').value.trim().toLowerCase();
    if (newQuery) renderSearchResults(content, newQuery, container, state, win);
  });

  setupInternalLinks(content, container, state, win);
}

// ==================== Site 2: НовостиДня ====================
const newsArticles = [
  {
    id: 1,
    title: 'Обнаружен новый сектор в цифровом мире',
    desc: 'Исследователи нашли ранее неизвестный регион, обещающий новые ресурсы и испытания.',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    full: 'Группа опытных исследователей обнаружила новый сектор в глубинах цифрового мира. Сектор получил название «Кристальные Пустоши» благодаря уникальной визуальной эстетике, напоминающей кристаллические структуры.\n\nПо предварительным данным, в новом секторе содержатся редкие ресурсы, которые ранее были недоступны игрокам. Среди них кристаллизованные данные, которые могут использоваться для создания мощного оборудования.\n\nАдминистрация сервера подтвердила, что сектор будет официально открыт для всех игроков после завершения тестирования безопасности. Ожидается, что это произойдет в течение ближайших двух недель.'
  },
  {
    id: 2,
    title: 'Обновление сервера: улучшение производительности',
    desc: 'Команда разработчиков анонсирует техническое обслуживание для повышения стабильности.',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    full: 'Команда разработчиков Digital World Online объявила о плановом техническом обслуживании серверов. Обновление направлено на улучшение производительности и стабильности системы.\n\nОсновные изменения включают оптимизацию сетевого кода, уменьшение задержки при переходе между секторами и исправление нескольких критических ошибок, о которых сообщали игроки.\n\nСервер будет недоступен в течение 4 часов. Все игроки получат компенсацию в размере 100 DC за неудобства.'
  },
  {
    id: 3,
    title: 'Рейтинг гильдий обновлён: топ-10',
    desc: 'Ежемесячный рейтинг гильдий опубликован. Команда «Нексус» снова на первом месте.',
    gradient: 'linear-gradient(135deg, #11998e, #38ef7d)',
    full: 'Опубликован ежемесячный рейтинг гильдий цифрового мира. Гильдия «Нексус» третий месяц подряд удерживает первое место благодаря успешным рейдам и активному участию в мировых событиях.\n\nНа втором месте расположилась гильдия «Тёмные Данные», совершившая прорыв в рейтинге после обнаружения секретного подземелья. Третье место заняли «Хранители Кода».\n\nРейтинг учитывает активность участников, выполненные задания, вклад в экономику мира и участие в PvP-турнирах.'
  },
  {
    id: 4,
    title: 'Экономические изменения: новый курс ДигиКоина',
    desc: 'Виртуальная валюта укрепила свои позиции после последнего обновления экономической системы.',
    gradient: 'linear-gradient(135deg, #f5af19, #f12711)',
    full: 'После введения новой экономической модели курс ДигиКоина стабилизировался. Разработчики внедрили механизмы защиты от инфляции и улучшили систему вознаграждений за задания.\n\nТеперь игроки могут зарабатывать больше за сложные задания, а цены на рынке стали более сбалансированными. Система автоматически корректирует стоимость товаров в зависимости от спроса.\n\nЭкономисты цифрового мира прогнозируют стабильный рост покупательной способности ДигиКоина в ближайшие месяцы.'
  },
  {
    id: 5,
    title: 'Предупреждение безопасности: новая угроза',
    desc: 'Обнаружена новая вредоносная программа, нацеленная на незащищённые аккаунты.',
    gradient: 'linear-gradient(135deg, #c31432, #240b36)',
    full: 'Служба безопасности цифрового мира выпустила предупреждение о новой угрозе. Вредоносная программа «ShadowByte» способна обходить стандартные файрволы и получать доступ к незащищённым аккаунтам.\n\nВсем игрокам рекомендуется обновить свои защитные системы и активировать двухфакторную аутентификацию. Бесплатное обновление антивируса уже доступно в МаркетПлейсе.\n\nКоманда безопасности работает над устранением уязвимости и обещает выпустить патч в ближайшее время.'
  },
  {
    id: 6,
    title: 'Общественное событие: Турнир кода',
    desc: 'Регистрация открыта на ежегодный турнир программистов с призовым фондом.',
    gradient: 'linear-gradient(135deg, #2193b0, #6dd5ed)',
    full: 'Открыта регистрация на ежегодный Турнир Кода, крупнейшее соревнование программистов цифрового мира. Призовой фонд составляет 50,000 DC.\n\nУчастники будут соревноваться в решении алгоритмических задач, создании инструментов и оптимизации кода. Турнир проводится в несколько этапов: отборочные, четвертьфинал, полуфинал и финал.\n\nДля участия необходимо зарегистрироваться на ФрилансБирже и выполнить минимум 5 заданий категории «Программирование».'
  },
  {
    id: 7,
    title: 'Новые функции: обновление интерфейса',
    desc: 'Разработчики представили обновлённый дизайн рабочего стола и новые виджеты.',
    gradient: 'linear-gradient(135deg, #834d9b, #d04ed6)',
    full: 'В последнем обновлении разработчики представили значительные улучшения пользовательского интерфейса. Новый дизайн рабочего стола стал более интуитивным и настраиваемым.\n\nСреди нововведений: улучшенный менеджер окон, новые темы оформления, виджеты для мониторинга системы и обновлённый файловый менеджер с поддержкой вкладок.\n\nВсе обновления уже доступны для скачивания в МаркетПлейсе. Базовые темы бесплатны, а премиальные доступны за ДигиКоины.'
  },
  {
    id: 8,
    title: 'История цифрового мира: как всё начиналось',
    desc: 'Ретроспективный материал о создании и развитии виртуальной вселенной.',
    gradient: 'linear-gradient(135deg, #373b44, #4286f4)',
    full: 'Десять лет назад группа учёных создала первый прототип цифрового мира. То, что начиналось как эксперимент по моделированию виртуальных сред, превратилось в полноценную вселенную.\n\nПервая версия мира состояла всего из одного сектора с базовыми функциями. Сегодня цифровой мир насчитывает сотни секторов, миллионы пользователей и развитую экономическую систему.\n\nСоздатели мира продолжают работу над расширением вселенной. В планах введение межсерверных путешествий и создание новых типов взаимодействия между игроками.'
  }
];

function renderNews(content, container, state, win) {
  content.innerHTML = `
    <div class="browser-site-header news-header">
      <h1 class="browser-site-logo">Новости<span style="color:#c00">Дня</span></h1>
      <p class="browser-site-subtitle">Ваш источник новостей цифрового мира</p>
    </div>
    <div class="news-grid">
      ${newsArticles.map(a => `
        <div class="news-card" data-article-id="${a.id}">
          <div class="news-card-img" style="background:${a.gradient}"></div>
          <div class="news-card-body">
            <h3 class="news-card-title">${a.title}</h3>
            <p class="news-card-desc">${a.desc}</p>
            <span class="news-card-link">Читать далее &rarr;</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  content.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.articleId);
      renderNewsArticle(content, id, container, state, win);
    });
  });
}

function renderNewsArticle(content, id, container, state, win) {
  const article = newsArticles.find(a => a.id === id);
  if (!article) return;

  const paragraphs = article.full.split('\n\n').map(p => `<p class="news-article-para">${p}</p>`).join('');

  content.innerHTML = `
    <div class="news-article-page">
      <button class="news-back-btn">&larr; Назад к новостям</button>
      <div class="news-article-img" style="background:${article.gradient}"></div>
      <h1 class="news-article-title">${article.title}</h1>
      <div class="news-article-content">${paragraphs}</div>
    </div>
  `;

  content.querySelector('.news-back-btn').addEventListener('click', () => {
    renderNews(content, container, state, win);
  });
}

// ==================== Site 3: ВикиМир ====================
const wikiArticles = {
  digital_world: {
    title: 'Цифровой мир',
    sections: [
      { heading: 'Обзор', text: 'Цифровой мир - это обширная виртуальная вселенная, существующая внутри глобальной сети. Он представляет собой сложную экосистему, состоящую из множества секторов, каждый из которых имеет уникальную структуру и свойства. Миллионы пользователей ежедневно взаимодействуют в этом пространстве, создавая динамичное сообщество.' },
      { heading: 'Структура', text: 'Мир разделён на сектора, каждый из которых управляется искусственным интеллектом. Сектора соединены между собой через Магистрали Данных - высокоскоростные каналы связи. Чем глубже сектор расположен в иерархии, тем сложнее к нему получить доступ и тем ценнее ресурсы, которые он содержит.' },
      { heading: 'История создания', text: 'Цифровой мир был создан группой учёных-исследователей, которые разработали технологию переноса сознания в виртуальную среду. Первая версия мира была запущена как эксперимент, но быстро привлекла миллионы пользователей. С тех пор мир непрерывно расширяется и развивается.' },
      { heading: 'Экономика', text: 'В цифровом мире действует собственная экономическая система, основанная на валюте ДигиКоин (DC). Игроки могут зарабатывать валюту выполняя задания, торгуя ресурсами и предоставляя услуги другим пользователям. Экономика регулируется встроенными алгоритмами для предотвращения инфляции.' }
    ],
    related: ['digicoin', 'hacking', 'security']
  },
  digicoin: {
    title: 'ДигиКоин',
    sections: [
      { heading: 'Описание', text: 'ДигиКоин (DC) - основная валюта цифрового мира. Используется для всех торговых операций, оплаты услуг и приобретения товаров на МаркетПлейсе. Курс ДигиКоина стабилизируется алгоритмической системой контроля.' },
      { heading: 'Способы заработка', text: 'Существует несколько способов получения ДигиКоинов: выполнение фриланс-заданий на бирже, торговля ресурсами, участие в мировых событиях и турнирах, а также вознаграждения за обнаружение уязвимостей в системе безопасности.' },
      { heading: 'Применение', text: 'ДигиКоины можно потратить на покупку программного обеспечения, улучшение системы безопасности, приобретение косметических предметов и оплату различных услуг. Также существует система переводов между пользователями.' },
      { heading: 'История', text: 'ДигиКоин был введён в обращение в первый год существования мира. Изначально все операции были бартерными, но растущая экономика потребовала стандартизированной валюты. С тех пор система прошла несколько крупных обновлений для повышения стабильности.' }
    ],
    related: ['digital_world', 'freelance', 'security']
  },
  hacking: {
    title: 'Хакерство',
    sections: [
      { heading: 'Концепция', text: 'В цифровом мире хакерство представляет собой набор навыков и инструментов для взаимодействия с защищёнными системами. Это легальная деятельность, если направлена на тестирование и улучшение безопасности.' },
      { heading: 'Инструменты', text: 'Хакеры используют различные программные средства: сканеры уязвимостей, декрипторы, обходчики файрволов и анализаторы пакетов данных. Многие из этих инструментов можно приобрести на МаркетПлейсе или создать самостоятельно.' },
      { heading: 'Этика', text: 'Сообщество цифрового мира строго разделяет этичное хакерство (белые шляпы) от вредоносного (чёрные шляпы). Этичные хакеры помогают укреплять безопасность системы и получают вознаграждения. Вредоносная деятельность преследуется системой безопасности.' },
      { heading: 'Обучение', text: 'Для начинающих хакеров существуют обучающие программы и симуляторы, позволяющие развивать навыки в безопасной среде. Продвинутые пользователи могут участвовать в соревнованиях CTF (Capture The Flag) и зарабатывать ДигиКоины.' }
    ],
    related: ['security', 'digital_world', 'freelance']
  },
  security: {
    title: 'Безопасность',
    sections: [
      { heading: 'Основы', text: 'Безопасность в цифровом мире - это комплекс мер по защите данных, аккаунтов и ресурсов пользователей. Каждый пользователь отвечает за настройку собственной системы защиты.' },
      { heading: 'Файрволы', text: 'Файрволы - первая линия обороны. Они фильтруют входящие и исходящие соединения, блокируя подозрительную активность. Существуют файрволы разных уровней - от базовых бесплатных до продвинутых платных решений.' },
      { heading: 'Антивирусное ПО', text: 'Антивирусные программы сканируют систему на наличие вредоносного кода и нейтрализуют угрозы. Регулярное обновление баз данных необходимо для защиты от новых типов атак.' },
      { heading: 'Рекомендации', text: 'Для максимальной безопасности рекомендуется: использовать сложные пароли, активировать двухфакторную аутентификацию, регулярно обновлять защитное ПО и не открывать подозрительные файлы от незнакомых пользователей.' }
    ],
    related: ['hacking', 'digital_world', 'digicoin']
  },
  freelance: {
    title: 'Фриланс',
    sections: [
      { heading: 'Описание', text: 'Фриланс в цифровом мире - это система выполнения заданий за вознаграждение. ФрилансБиржа предоставляет платформу, где заказчики размещают задания, а исполнители их выполняют.' },
      { heading: 'Категории работ', text: 'Основные категории фриланс-заданий: дизайн (создание визуальных элементов), программирование (разработка модулей и скриптов), тексты (написание статей и документации), тестирование (проверка программ на ошибки).' },
      { heading: 'Уровни сложности', text: 'Задания делятся на три уровня сложности: Лёгкие (быстрое выполнение, небольшое вознаграждение), Средние (умеренная сложность и оплата) и Сложные (требуют значительных усилий, но хорошо оплачиваются).' },
      { heading: 'Советы новичкам', text: 'Начинающим фрилансерам рекомендуется начинать с лёгких заданий для набора опыта и репутации. По мере роста навыков можно переходить к более сложным и высокооплачиваемым проектам. Регулярное выполнение заданий открывает доступ к эксклюзивным предложениям.' }
    ],
    related: ['digicoin', 'digital_world', 'hacking']
  }
};

const wikiArticleNames = {
  digital_world: 'Цифровой мир',
  digicoin: 'ДигиКоин',
  hacking: 'Хакерство',
  security: 'Безопасность',
  freelance: 'Фриланс'
};

function renderWiki(content, container, state, win) {
  const articleKey = state.wikiArticle || 'digital_world';
  const article = wikiArticles[articleKey];

  content.innerHTML = `
    <div class="browser-site-header wiki-header">
      <h1 class="browser-site-logo">Вики<span style="color:#36b">Мир</span></h1>
    </div>
    <div class="wiki-layout">
      <div class="wiki-sidebar">
        <h3>Статьи</h3>
        <ul class="wiki-nav-list">
          ${Object.keys(wikiArticles).map(key => `
            <li class="wiki-nav-item ${key === articleKey ? 'active' : ''}" data-article="${key}">${wikiArticleNames[key]}</li>
          `).join('')}
        </ul>
      </div>
      <div class="wiki-content">
        <h1 class="wiki-article-title">${article.title}</h1>
        ${article.sections.map(s => `
          <h2 class="wiki-section-heading">${s.heading}</h2>
          <p class="wiki-section-text">${s.text}</p>
        `).join('')}
        <div class="wiki-related">
          <h3>Смотрите также:</h3>
          <div class="wiki-related-links">
            ${article.related.map(key => `<span class="wiki-related-link" data-article="${key}">${wikiArticleNames[key]}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  content.querySelectorAll('[data-article]').forEach(el => {
    el.addEventListener('click', () => {
      state.wikiArticle = el.dataset.article;
      renderWiki(content, container, state, win);
    });
  });
}

// ==================== Site 4: КриптоБанк ====================
function renderBank(content) {
  const balance = getBalance();
  const transactions = getTransactions();
  const recent = transactions.slice(-10).reverse();

  content.innerHTML = `
    <div class="browser-site-header bank-header">
      <h1 class="browser-site-logo">Крипто<span style="color:#d4a017">Банк</span></h1>
      <p class="browser-site-subtitle">Ваш надёжный банк в цифровом мире</p>
    </div>
    <div class="bank-dashboard">
      <div class="bank-balance-card">
        <h2>Ваш баланс</h2>
        <div class="bank-balance-amount">${balance} DC</div>
      </div>
      <div class="bank-transactions">
        <h3>Последние операции</h3>
        <div class="bank-transaction-list">
          ${recent.length > 0 ? recent.map(t => {
            const date = new Date(t.timestamp);
            const dateStr = date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'});
            const isIncome = t.type === 'income';
            return `
              <div class="bank-transaction-item">
                <div class="bank-transaction-info">
                  <span class="bank-transaction-desc">${t.description}</span>
                  <span class="bank-transaction-date">${dateStr}</span>
                </div>
                <span class="bank-transaction-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${t.amount} DC</span>
              </div>
            `;
          }).join('') : '<p class="bank-no-transactions">Нет операций</p>'}
        </div>
      </div>
      <div class="bank-transfers">
        <h3>Переводы</h3>
        <p class="bank-transfers-placeholder">Переводы между пользователями будут доступны в будущем обновлении</p>
      </div>
    </div>
  `;
}

// ==================== Site 5: ФрилансБиржа ====================
const freelanceJobs = [
  { id: 1, title: 'Дизайн логотипа', desc: 'Создать минималистичный логотип для нового стартапа.', category: 'design', difficulty: 'easy', reward: 75 },
  { id: 2, title: 'Разработка модуля авторизации', desc: 'Написать модуль для двухфакторной аутентификации.', category: 'programming', difficulty: 'hard', reward: 350 },
  { id: 3, title: 'Написание статьи о безопасности', desc: 'Подготовить обзорную статью для ВикиМир.', category: 'texts', difficulty: 'medium', reward: 150 },
  { id: 4, title: 'Тестирование нового файрвола', desc: 'Провести полное тестирование обновлённого файрвола.', category: 'testing', difficulty: 'medium', reward: 180 },
  { id: 5, title: 'Дизайн интерфейса настроек', desc: 'Обновить визуальный стиль панели настроек.', category: 'design', difficulty: 'medium', reward: 120 },
  { id: 6, title: 'Скрипт автоматизации', desc: 'Написать скрипт для автоматического бэкапа данных.', category: 'programming', difficulty: 'easy', reward: 90 },
  { id: 7, title: 'Перевод документации', desc: 'Перевести техническую документацию на русский язык.', category: 'texts', difficulty: 'easy', reward: 60 },
  { id: 8, title: 'Оптимизация базы данных', desc: 'Провести профилирование и оптимизацию запросов.', category: 'programming', difficulty: 'hard', reward: 400 },
  { id: 9, title: 'Создание иконок', desc: 'Нарисовать набор из 10 иконок для приложений.', category: 'design', difficulty: 'hard', reward: 280 },
  { id: 10, title: 'Тестирование платёжной системы', desc: 'Проверить корректность всех транзакций.', category: 'testing', difficulty: 'hard', reward: 320 },
  { id: 11, title: 'Написание пресс-релиза', desc: 'Подготовить пресс-релиз для нового обновления.', category: 'texts', difficulty: 'medium', reward: 130 },
  { id: 12, title: 'Тестирование UI', desc: 'Проверить отображение интерфейса на разных экранах.', category: 'testing', difficulty: 'easy', reward: 55 }
];

const categoryNames = { all: 'Все', design: 'Дизайн', programming: 'Программирование', texts: 'Тексты', testing: 'Тестирование' };
const difficultyNames = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' };
const difficultyTimers = { easy: 5, medium: 10, hard: 15 };

function renderFreelance(content, container, state, win) {
  const completedJobs = storage.get('completed_jobs') || [];
  const availableJobs = freelanceJobs.filter(j => !completedJobs.includes(j.id));
  const activeCategory = state.freelanceCategory || 'all';
  const filteredJobs = activeCategory === 'all' ? availableJobs : availableJobs.filter(j => j.category === activeCategory);

  content.innerHTML = `
    <div class="browser-site-header freelance-header">
      <h1 class="browser-site-logo">Фриланс<span style="color:#2ecc71">Биржа</span></h1>
      <p class="browser-site-subtitle">Найди работу в цифровом мире</p>
    </div>
    <div class="freelance-categories">
      ${Object.keys(categoryNames).map(cat => `
        <button class="freelance-category-btn ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">${categoryNames[cat]}</button>
      `).join('')}
    </div>
    <div class="freelance-jobs">
      ${filteredJobs.length > 0 ? filteredJobs.map(job => `
        <div class="freelance-job-card" data-job-id="${job.id}">
          <div class="freelance-job-header">
            <h3 class="freelance-job-title">${job.title}</h3>
            <span class="freelance-badge freelance-badge-${job.category}">${categoryNames[job.category]}</span>
          </div>
          <p class="freelance-job-desc">${job.desc}</p>
          <div class="freelance-job-footer">
            <span class="freelance-difficulty freelance-diff-${job.difficulty}">${difficultyNames[job.difficulty]}</span>
            <span class="freelance-reward">${job.reward} DC</span>
            <button class="freelance-accept-btn" data-job-id="${job.id}" ${state.activeJob ? 'disabled' : ''}>Принять</button>
          </div>
          ${state.activeJob && state.activeJob.id === job.id ? `
            <div class="freelance-progress">
              <div class="freelance-progress-bar"><div class="freelance-progress-fill"></div></div>
              <span class="freelance-progress-text">Выполняется...</span>
            </div>
          ` : ''}
        </div>
      `).join('') : '<p class="freelance-no-jobs">Нет доступных заданий в этой категории</p>'}
    </div>
  `;

  // Category filters
  content.querySelectorAll('.freelance-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.freelanceCategory = btn.dataset.category;
      renderFreelance(content, container, state, win);
    });
  });

  // Accept buttons
  content.querySelectorAll('.freelance-accept-btn').forEach(btn => {
    if (state.activeJob) return;
    btn.addEventListener('click', () => {
      const jobId = parseInt(btn.dataset.jobId);
      const job = freelanceJobs.find(j => j.id === jobId);
      if (!job || state.activeJob) return;

      state.activeJob = job;
      renderFreelance(content, container, state, win);

      const duration = difficultyTimers[job.difficulty] * 1000;
      const startTime = Date.now();
      const progressFill = content.querySelector('.freelance-progress-fill');
      const progressText = content.querySelector('.freelance-progress-text');

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        if (progressFill) progressFill.style.width = (progress * 100) + '%';
        const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        if (progressText) progressText.textContent = `Выполняется... ${remaining}с`;

        if (progress >= 1) {
          clearInterval(interval);
          addMoney(job.reward, job.title);
          const completed = storage.get('completed_jobs') || [];
          completed.push(job.id);
          storage.set('completed_jobs', completed);
          state.activeJob = null;

          if (progressText) progressText.textContent = `Задание выполнено! +${job.reward} DC`;
          if (progressFill) progressFill.style.background = '#2ecc71';

          setTimeout(() => {
            renderFreelance(content, container, state, win);
          }, 1500);
        }
      }, 100);

      state.jobTimer = interval;
    });
  });
}

// ==================== Site 6: МаркетПлейс ====================
const marketItems = [
  { id: 'w1', name: 'Космос', desc: 'Глубокий космический градиент для рабочего стола.', category: 'wallpapers', price: 50, gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { id: 'w2', name: 'Матрица', desc: 'Зелёный цифровой дождь в стиле киберпанк.', category: 'wallpapers', price: 75, gradient: 'linear-gradient(135deg, #000000 0%, #0a3d0a 50%, #003300 100%)' },
  { id: 'w3', name: 'Киберпанк', desc: 'Неоновые огни ночного города.', category: 'wallpapers', price: 100, gradient: 'linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%)' },
  { id: 'w4', name: 'Минимализм', desc: 'Чистый и спокойный светлый градиент.', category: 'wallpapers', price: 50, gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
  { id: 's1', name: 'Антивирус Pro', desc: 'Продвинутая защита от всех типов угроз.', category: 'software', price: 200, icon: '\u{1F6E1}' },
  { id: 's2', name: 'Файловый менеджер+', desc: 'Расширенное управление файлами с поддержкой вкладок.', category: 'software', price: 150, icon: '\u{1F4C2}' },
  { id: 's3', name: 'Медиаплеер', desc: 'Воспроизведение всех популярных форматов.', category: 'software', price: 100, icon: '\u{1F3B5}' },
  { id: 's4', name: 'Архиватор', desc: 'Сжатие и распаковка файлов любых форматов.', category: 'software', price: 120, icon: '\u{1F4E6}' },
  { id: 'u1', name: 'Виджет часов', desc: 'Стильные часы для рабочего стола.', category: 'utilities', price: 75, icon: '\u{1F550}' },
  { id: 'u2', name: 'Мониторинг системы', desc: 'Отслеживание ресурсов в реальном времени.', category: 'utilities', price: 150, icon: '\u{1F4CA}' },
  { id: 'u3', name: 'Заметки', desc: 'Быстрые заметки с синхронизацией.', category: 'utilities', price: 80, icon: '\u{1F4DD}' }
];

const marketCategoryNames = { all: 'Все', software: 'Софт', wallpapers: 'Обои', utilities: 'Утилиты' };

function renderMarket(content, container, state, win) {
  const activeCategory = state.marketCategory || 'all';
  const filteredItems = activeCategory === 'all' ? marketItems : marketItems.filter(i => i.category === activeCategory);
  const purchasedWallpapers = storage.get('purchased_wallpapers') || [];
  const purchasedSoftware = storage.get('purchased_software') || [];
  const purchasedIds = [...purchasedWallpapers.map(w => w.id), ...purchasedSoftware.map(s => s.id)];

  content.innerHTML = `
    <div class="browser-site-header market-header">
      <h1 class="browser-site-logo">Маркет<span style="color:#e74c3c">Плейс</span></h1>
      <p class="browser-site-subtitle">Цифровой магазин</p>
    </div>
    <div class="market-categories">
      ${Object.keys(marketCategoryNames).map(cat => `
        <button class="market-category-btn ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">${marketCategoryNames[cat]}</button>
      `).join('')}
    </div>
    <div class="market-balance">Ваш баланс: <strong>${getBalance()} DC</strong></div>
    <div class="market-grid">
      ${filteredItems.map(item => {
        const purchased = purchasedIds.includes(item.id);
        return `
          <div class="market-item">
            <div class="market-item-icon" style="${item.gradient ? 'background:' + item.gradient : ''}">${item.icon || ''}</div>
            <h3 class="market-item-name">${item.name}</h3>
            <p class="market-item-desc">${item.desc}</p>
            <div class="market-item-footer">
              <span class="market-item-price">${item.price} DC</span>
              ${purchased
                ? '<button class="market-buy-btn purchased" disabled>Куплено &#10003;</button>'
                : `<button class="market-buy-btn" data-item-id="${item.id}">Купить</button>`}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Category filters
  content.querySelectorAll('.market-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.marketCategory = btn.dataset.category;
      renderMarket(content, container, state, win);
    });
  });

  // Buy buttons
  content.querySelectorAll('.market-buy-btn:not(.purchased)').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.itemId;
      const item = marketItems.find(i => i.id === itemId);
      if (!item) return;

      if (!canAfford(item.price)) {
        alert('Недостаточно средств!');
        return;
      }

      spendMoney(item.price, item.name);

      if (item.category === 'wallpapers') {
        const wallpapers = storage.get('purchased_wallpapers') || [];
        wallpapers.push({ id: item.id, name: item.name, value: item.gradient });
        storage.set('purchased_wallpapers', wallpapers);
      } else {
        const software = storage.get('purchased_software') || [];
        software.push({ id: item.id, name: item.name, icon: item.icon });
        storage.set('purchased_software', software);
      }

      renderMarket(content, container, state, win);
    });
  });
}

// ==================== 404 Page ====================
function renderNotFound(content, url, container, state, win) {
  content.innerHTML = `
    <div class="browser-not-found">
      <h1 class="browser-not-found-code">404</h1>
      <p class="browser-not-found-text">Страница не найдена</p>
      <p class="browser-not-found-url">Адрес "${url}" недоступен.</p>
      <button class="browser-not-found-btn" data-link="searchall.dw">Перейти на ПоискВсё</button>
    </div>
  `;
  setupInternalLinks(content, container, state, win);
}
