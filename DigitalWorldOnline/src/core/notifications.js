const ICONS = {
  message: '\u{1F4AC}',
  quest: '\u{1F4CB}',
  money: '\u{1F4B0}',
  warning: '\u26A0\uFE0F'
};

const MAX_VISIBLE = 3;
let container = null;
let activeNotifications = [];
let queue = [];

export function initNotifications() {
  container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }
}

export function showNotification({ type = 'message', title = '', description = '', onClick = null }) {
  const notification = { type, title, description, onClick };

  if (activeNotifications.length >= MAX_VISIBLE) {
    queue.push(notification);
    return;
  }

  renderNotification(notification);
}

function renderNotification(notification) {
  const { type, title, description, onClick } = notification;
  const el = document.createElement('div');
  el.className = `notification notification-${type} notification-enter`;

  el.innerHTML = `
    <div class="notification-icon">${ICONS[type] || ICONS.message}</div>
    <div class="notification-body">
      <div class="notification-title">${title}</div>
      <div class="notification-description">${description}</div>
    </div>
    <button class="notification-close">\u00D7</button>
  `;

  el.addEventListener('click', (e) => {
    if (e.target.closest('.notification-close')) {
      dismissNotification(el);
      return;
    }
    if (onClick) onClick();
    dismissNotification(el);
  });

  container.appendChild(el);
  activeNotifications.push(el);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    el.classList.remove('notification-enter');
    el.classList.add('notification-visible');
  });

  // Auto-dismiss after 5 seconds
  const timer = setTimeout(() => {
    dismissNotification(el);
  }, 5000);

  el._timer = timer;
}

function dismissNotification(el) {
  if (!el || !el.parentNode) return;
  clearTimeout(el._timer);
  el.classList.remove('notification-visible');
  el.classList.add('notification-exit');

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
    const idx = activeNotifications.indexOf(el);
    if (idx > -1) activeNotifications.splice(idx, 1);

    // Show queued notification
    if (queue.length > 0 && activeNotifications.length < MAX_VISIBLE) {
      renderNotification(queue.shift());
    }
  }, 300);
}
