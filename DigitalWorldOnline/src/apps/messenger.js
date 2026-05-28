import { createWindow, registerCleanup } from '../core/windowManager.js';
import * as storage from '../core/storage.js';
import { getNpcById } from '../core/npcSystem.js';
import { showNotification } from '../core/notifications.js';
import { updateQuestStep } from '../core/questSystem.js';
import { addMoney, spendMoney } from '../core/economy.js';

const MSG_KEY = 'messenger_messages';
const UNREAD_KEY = 'messenger_unread';
const DIALOG_STATE_KEY = 'messenger_dialog_state';

const dialogues = {
  alexey: [
    {
      id: 'initial',
      trigger: 'auto',
      responses: [
        {
          text: 'Привет! Да, я тут недавно',
          reply: 'Отлично! Тогда слушай: открой Терминал и набери "help" - там всё основное. Если что - пиши, помогу!',
          nextDialogue: 'after_greeting'
        },
        {
          text: 'Кто ты?',
          reply: 'Я Алексей, но друзья зовут Кодер. Программист, помогаю новичкам освоиться. Попробуй открыть Терминал и набрать "help" для начала.',
          nextDialogue: 'after_greeting'
        },
        {
          text: 'Мне не нужна помощь',
          reply: 'Окей, как знаешь! Но если передумаешь - пиши. Удачи в цифровом мире!',
          nextDialogue: 'after_greeting'
        }
      ]
    },
    {
      id: 'after_greeting',
      trigger: 'manual',
      responses: [
        {
          text: 'Как заработать деньги?',
          reply: 'Самый простой способ - фриланс. Открой Браузер и зайди на ФрилансБиржу. Там есть простые задания для новичков.',
          nextDialogue: null
        },
        {
          text: 'Что тут можно делать?',
          reply: 'Много чего! Работать на фрилансе, исследовать сеть, общаться с людьми. А если хочешь острых ощущений... ну, это потом.',
          nextDialogue: null
        }
      ]
    }
  ],
  anna: [
    {
      id: 'initial',
      trigger: 'auto',
      responses: [
        {
          text: 'Привет! Вроде нет, но приятно познакомиться',
          reply: 'Мне тоже! Я Анна, учусь на программиста. Кстати, у меня тут проблема с вирусом... Не поможешь? Нужно просто запустить антивирус.',
          nextDialogue: 'after_intro'
        },
        {
          text: 'Привет, а ты кто?',
          reply: 'Я Анна, студентка! Учусь программировать. Слушай, у меня тут вирус на компе... Можешь помочь? Просто запусти антивирус и просканируй систему.',
          nextDialogue: 'after_intro'
        }
      ]
    },
    {
      id: 'after_intro',
      trigger: 'manual',
      responses: [
        {
          text: 'Конечно помогу!',
          reply: 'Спасибо! Ты просто запусти Антивирус и сделай сканирование. Я буду ждать результат!',
          nextDialogue: null
        },
        {
          text: 'Чем занимаешься?',
          reply: 'Учусь в универе на IT-направлении. Пишу на Python и JS. А ещё у меня кот, который любит лежать на клавиатуре \u{1F431}',
          nextDialogue: null
        }
      ]
    }
  ],
  ghost: [
    {
      id: 'initial',
      trigger: 'quest_dark_side',
      responses: [
        {
          text: 'Привет, Ghost. Что за форум?',
          reply: 'ХакФорум. Там собираются те, кто знает настоящую цену информации. Зайди через Браузер, адрес: hackforum.dw. Но сначала включи VPN.',
          nextDialogue: 'after_forum'
        },
        {
          text: 'Откуда ты меня знаешь?',
          reply: 'Я знаю всех, кто представляет интерес. Кодер рассказал о тебе. Заходи на ХакФорум - поговорим о делах.',
          nextDialogue: 'after_forum'
        }
      ]
    },
    {
      id: 'after_forum',
      trigger: 'manual',
      responses: [
        {
          text: 'Что мне делать на форуме?',
          reply: 'Осмотрись. Почитай. Когда будешь готов к настоящему делу - я найду тебя сам.',
          nextDialogue: null
        }
      ]
    }
  ],
  maxim: [
    {
      id: 'initial',
      trigger: 'auto',
      responses: [
        {
          text: 'Расскажи подробнее',
          reply: 'Вложи 200 DC, через некоторое время получишь 400. Гарантирую... ну, почти. Рынок - штука непредсказуемая.',
          nextDialogue: 'invest_confirm'
        },
        {
          text: 'Не интересует',
          reply: 'Как знаешь. Но предложение остаётся в силе.',
          nextDialogue: null
        }
      ]
    },
    {
      id: 'invest_confirm',
      trigger: 'manual',
      responses: [
        {
          text: 'Вложить 200 DC',
          action: 'invest',
          reply: 'Отлично! Деньги в работе. Жди результат...',
          nextDialogue: null
        },
        {
          text: 'Подумаю ещё',
          reply: 'Не затягивай, возможности не ждут!',
          nextDialogue: null
        }
      ]
    }
  ],
  victor: [
    {
      id: 'initial',
      trigger: 'auto',
      responses: [
        {
          text: 'Что за предложение?',
          reply: 'У меня есть покупатели на данные. Если у тебя есть что-нибудь интересное из взломов - я куплю. 800 DC прямо сейчас.',
          nextDialogue: 'sell_confirm'
        },
        {
          text: 'Нет, спасибо',
          reply: 'Зря. Деньги на дороге не валяются.',
          nextDialogue: null
        }
      ]
    },
    {
      id: 'sell_confirm',
      trigger: 'manual',
      responses: [
        {
          text: 'Продать данные (800 DC, -20 белая репутация)',
          action: 'sell_data',
          reply: 'Сделка! Деньги на твоём счету. Приятно иметь дело с деловым человеком.',
          nextDialogue: null
        },
        {
          text: 'Нет, это слишком рискованно',
          reply: 'Трусишь? Ладно, ещё передумаешь.',
          nextDialogue: null
        }
      ]
    }
  ],
  olga: [
    {
      id: 'initial',
      trigger: 'auto',
      responses: [
        {
          text: 'Работать вместе? Как?',
          reply: 'Я специалист по защите. Ты - по атаке. Вместе мы можем тестировать системы. Подумай об этом.',
          nextDialogue: null
        },
        {
          text: 'Извини за скан',
          reply: 'Не извиняйся. Это комплимент! Мало кто решается. Уважаю.',
          nextDialogue: null
        }
      ]
    }
  ]
};

function getMessages() {
  return storage.get(MSG_KEY) || {};
}

function saveMessages(msgs) {
  storage.set(MSG_KEY, msgs);
}

function getUnread() {
  return storage.get(UNREAD_KEY) || {};
}

function saveUnread(unread) {
  storage.set(UNREAD_KEY, unread);
}

function getDialogState() {
  return storage.get(DIALOG_STATE_KEY) || {};
}

function saveDialogState(state) {
  storage.set(DIALOG_STATE_KEY, state);
}

function getCurrentDialogue(npcId) {
  const state = getDialogState();
  const currentId = state[npcId] || 'initial';
  const npcDialogues = dialogues[npcId];
  if (!npcDialogues) return null;
  return npcDialogues.find(d => d.id === currentId) || null;
}

function advanceDialogue(npcId, nextId) {
  if (!nextId) return;
  const state = getDialogState();
  state[npcId] = nextId;
  saveDialogState(state);
}

export function addMessageFromNpc(npcId, text) {
  const msgs = getMessages();
  if (!msgs[npcId]) msgs[npcId] = [];
  msgs[npcId].push({
    id: Date.now() + Math.random(),
    sender: npcId,
    text,
    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    type: 'text'
  });
  saveMessages(msgs);

  // Update unread count
  const unread = getUnread();
  unread[npcId] = (unread[npcId] || 0) + 1;
  saveUnread(unread);

  // Show notification
  const npc = getNpcById(npcId);
  if (npc) {
    showNotification({
      type: 'message',
      title: npc.name,
      description: text.length > 50 ? text.substring(0, 50) + '...' : text,
      onClick: () => open()
    });
  }
}

function addPlayerMessage(npcId, text) {
  const msgs = getMessages();
  if (!msgs[npcId]) msgs[npcId] = [];
  msgs[npcId].push({
    id: Date.now() + Math.random(),
    sender: 'player',
    text,
    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    type: 'text'
  });
  saveMessages(msgs);
}

export function getUnreadCount() {
  const unread = getUnread();
  return Object.values(unread).reduce((sum, n) => sum + n, 0);
}

export function open() {
  const win = createWindow({
    title: 'Мессенджер',
    icon: '/icons/messenger.svg',
    appId: 'messenger',
    width: 750,
    height: 500,
    content: `<div class="app-messenger"></div>`
  });

  const container = win.element.querySelector('.app-messenger');
  renderMessenger(container, win.id);

  registerCleanup(win.id, () => {});
}

function renderMessenger(container, winId) {
  container.innerHTML = `
    <div class="messenger-sidebar">
      <div class="messenger-sidebar-header">Сообщения</div>
      <div class="messenger-conversations"></div>
    </div>
    <div class="messenger-chat">
      <div class="messenger-chat-placeholder">Выберите беседу</div>
    </div>
  `;

  renderConversations(container);
}

function renderConversations(container) {
  const conversationsEl = container.querySelector('.messenger-conversations');
  const msgs = getMessages();
  const unread = getUnread();
  const npcIds = Object.keys(msgs);

  conversationsEl.innerHTML = '';

  if (npcIds.length === 0) {
    conversationsEl.innerHTML = '<div class="messenger-empty">Пока нет сообщений</div>';
    return;
  }

  npcIds.forEach(npcId => {
    const npc = getNpcById(npcId);
    if (!npc) return;

    const npcMessages = msgs[npcId] || [];
    const lastMsg = npcMessages[npcMessages.length - 1];
    const unreadCount = unread[npcId] || 0;

    const item = document.createElement('div');
    item.className = 'messenger-conv-item';
    item.dataset.npcId = npcId;

    const statusClass = npc.onlineStatus === 'online' ? 'status-online' :
                        npc.onlineStatus === 'away' ? 'status-away' : 'status-offline';

    item.innerHTML = `
      <div class="messenger-conv-avatar">
        <span>${npc.avatar}</span>
        <span class="messenger-status-dot ${statusClass}"></span>
      </div>
      <div class="messenger-conv-info">
        <div class="messenger-conv-name">${npc.name.split(' ')[0]}</div>
        <div class="messenger-conv-preview">${lastMsg ? (lastMsg.sender === 'player' ? 'Вы: ' : '') + lastMsg.text.substring(0, 30) + (lastMsg.text.length > 30 ? '...' : '') : ''}</div>
      </div>
      <div class="messenger-conv-meta">
        <div class="messenger-conv-time">${lastMsg ? lastMsg.time : ''}</div>
        ${unreadCount > 0 ? `<div class="messenger-unread-badge">${unreadCount}</div>` : ''}
      </div>
    `;

    item.addEventListener('click', () => {
      // Mark as read
      const currentUnread = getUnread();
      currentUnread[npcId] = 0;
      saveUnread(currentUnread);

      // Remove active class from all items
      conversationsEl.querySelectorAll('.messenger-conv-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      // Remove unread badge
      const badge = item.querySelector('.messenger-unread-badge');
      if (badge) badge.remove();

      openChat(container, npcId);
    });

    conversationsEl.appendChild(item);
  });
}

function openChat(container, npcId) {
  const chatEl = container.querySelector('.messenger-chat');
  const npc = getNpcById(npcId);
  if (!npc) return;

  const statusClass = npc.onlineStatus === 'online' ? 'status-online' :
                      npc.onlineStatus === 'away' ? 'status-away' : 'status-offline';
  const statusText = npc.onlineStatus === 'online' ? 'в сети' :
                     npc.onlineStatus === 'away' ? 'отошёл' : 'не в сети';

  chatEl.innerHTML = `
    <div class="messenger-chat-header">
      <div class="messenger-chat-avatar">
        <span>${npc.avatar}</span>
        <span class="messenger-status-dot ${statusClass}"></span>
      </div>
      <div class="messenger-chat-info">
        <div class="messenger-chat-name">${npc.name}</div>
        <div class="messenger-chat-status">${statusText}</div>
      </div>
    </div>
    <div class="messenger-messages"></div>
    <div class="messenger-input-area">
      <div class="messenger-choices"></div>
      <div class="messenger-input-row">
        <input type="text" class="messenger-input" placeholder="Написать сообщение..." />
        <button class="messenger-send-btn">Отправить</button>
      </div>
    </div>
  `;

  renderMessages(chatEl, npcId);
  renderChoices(chatEl, container, npcId);
  setupInput(chatEl, container, npcId);
}

function renderMessages(chatEl, npcId) {
  const messagesEl = chatEl.querySelector('.messenger-messages');
  const msgs = getMessages();
  const npcMessages = msgs[npcId] || [];

  messagesEl.innerHTML = '';

  npcMessages.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = `messenger-bubble ${msg.sender === 'player' ? 'messenger-bubble-player' : 'messenger-bubble-npc'}`;
    bubble.innerHTML = `
      <div class="messenger-bubble-text">${msg.text}</div>
      <div class="messenger-bubble-time">${msg.time}</div>
    `;
    messagesEl.appendChild(bubble);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderChoices(chatEl, container, npcId) {
  const choicesEl = chatEl.querySelector('.messenger-choices');
  const dialogue = getCurrentDialogue(npcId);

  choicesEl.innerHTML = '';

  if (!dialogue || !dialogue.responses || dialogue.responses.length === 0) return;

  dialogue.responses.forEach(response => {
    const btn = document.createElement('button');
    btn.className = 'messenger-choice-btn';
    btn.textContent = response.text;
    btn.addEventListener('click', () => {
      handlePlayerChoice(chatEl, container, npcId, response);
    });
    choicesEl.appendChild(btn);
  });
}

function handlePlayerChoice(chatEl, container, npcId, response) {
  // Add player message
  addPlayerMessage(npcId, response.text);
  renderMessages(chatEl, npcId);

  // Clear choices
  const choicesEl = chatEl.querySelector('.messenger-choices');
  choicesEl.innerHTML = '';

  // Handle special actions
  if (response.action === 'invest') {
    const success = spendMoney(200, 'Инвестиция Максима');
    if (success === false) {
      addMessageToHistory(npcId, 'У тебя недостаточно средств. Нужно 200 DC.');
      renderMessages(chatEl, npcId);
      setTimeout(() => renderChoices(chatEl, container, npcId), 300);
      return;
    }
    updateQuestStep('investment', 'invest_money', null);
    // Random outcome after 30 seconds
    setTimeout(() => {
      if (Math.random() < 0.5) {
        addMoney(400, 'Возврат инвестиции');
        addMessageFromNpc('maxim', 'Отличные новости! Инвестиция удвоилась! 400 DC на твоём счету. Я же говорил!');
      } else {
        addMessageFromNpc('maxim', 'Плохие новости... Рынок обвалился. Деньги потеряны. Извини, бро. В следующий раз повезёт.');
      }
    }, 30000);
  } else if (response.action === 'sell_data') {
    updateQuestStep('dubious_offer', 'sell_data', null);
  }

  // Show typing indicator
  const messagesEl = chatEl.querySelector('.messenger-messages');
  const typing = document.createElement('div');
  typing.className = 'messenger-typing';
  typing.innerHTML = '<span class="messenger-typing-text">печатает</span><span class="messenger-typing-dots"><span>.</span><span>.</span><span>.</span></span>';
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // NPC reply after delay
  const delay = 1000 + Math.random() * 1000;
  setTimeout(() => {
    typing.remove();
    addMessageToHistory(npcId, response.reply);
    renderMessages(chatEl, npcId);

    // Advance dialogue
    if (response.nextDialogue) {
      advanceDialogue(npcId, response.nextDialogue);
    }

    // Render new choices after a short delay
    setTimeout(() => {
      renderChoices(chatEl, container, npcId);
    }, 300);
  }, delay);
}

function addMessageToHistory(npcId, text) {
  const msgs = getMessages();
  if (!msgs[npcId]) msgs[npcId] = [];
  msgs[npcId].push({
    id: Date.now() + Math.random(),
    sender: npcId,
    text,
    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    type: 'text'
  });
  saveMessages(msgs);
}

function setupInput(chatEl, container, npcId) {
  const input = chatEl.querySelector('.messenger-input');
  const sendBtn = chatEl.querySelector('.messenger-send-btn');

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addPlayerMessage(npcId, text);
    input.value = '';
    renderMessages(chatEl, npcId);
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
}
