let windows = [];
let activeWindowId = null;
let zIndexCounter = 100;
let windowIdCounter = 0;
let container = null;

const listeners = {
  create: [],
  close: [],
  minimize: [],
  restore: [],
  focus: []
};

export function initWindowManager() {
  container = document.getElementById('window-container');
}

export function on(event, callback) {
  if (listeners[event]) {
    listeners[event].push(callback);
  }
}

function emit(event, data) {
  if (listeners[event]) {
    listeners[event].forEach(cb => cb(data));
  }
}

export function getWindows() {
  return windows;
}

export function getActiveWindowId() {
  return activeWindowId;
}

export function createWindow(options = {}) {
  const id = 'window-' + (++windowIdCounter);
  const {
    title = 'Window',
    icon = '/icons/file.svg',
    width = 800,
    height = 500,
    minWidth = 400,
    minHeight = 300,
    content = '',
    onClose = null,
    appId = ''
  } = options;

  const win = document.createElement('div');
  win.className = 'window window-opening';
  win.id = id;
  win.dataset.appId = appId;
  win.style.width = width + 'px';
  win.style.height = height + 'px';
  win.style.left = (window.innerWidth / 2 - width / 2) + 'px';
  win.style.top = (window.innerHeight / 2 - height / 2 - 24) + 'px';

  win.innerHTML = `
    <div class="window-titlebar">
      <div class="window-titlebar-left">
        <img class="window-icon" src="${icon}" alt="" />
        <span class="window-title">${title}</span>
      </div>
      <div class="window-titlebar-buttons">
        <button class="window-btn window-btn-minimize" aria-label="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="5.5" width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button class="window-btn window-btn-maximize" aria-label="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg>
        </button>
        <button class="window-btn window-btn-close" aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.2"/></svg>
        </button>
      </div>
    </div>
    <div class="window-content">${content}</div>
    <div class="resize-handle resize-n"></div>
    <div class="resize-handle resize-s"></div>
    <div class="resize-handle resize-e"></div>
    <div class="resize-handle resize-w"></div>
    <div class="resize-handle resize-ne"></div>
    <div class="resize-handle resize-nw"></div>
    <div class="resize-handle resize-se"></div>
    <div class="resize-handle resize-sw"></div>
  `;

  container.appendChild(win);

  const windowData = {
    id,
    title,
    icon,
    appId,
    element: win,
    minimized: false,
    maximized: false,
    prevBounds: null,
    onClose
  };

  windows.push(windowData);

  setTimeout(() => win.classList.remove('window-opening'), 200);

  // Focus on creation
  focusWindow(id);

  // Event listeners
  setupDrag(win, windowData);
  setupResize(win, windowData);
  setupTitleBarButtons(win, windowData);

  win.addEventListener('mousedown', () => focusWindow(id));

  emit('create', windowData);
  return windowData;
}

export function closeWindow(id) {
  const idx = windows.findIndex(w => w.id === id);
  if (idx === -1) return;

  const windowData = windows[idx];
  const win = windowData.element;

  win.classList.add('window-closing');
  setTimeout(() => {
    win.remove();
    windows.splice(idx, 1);
    if (windowData.onClose) windowData.onClose();
    emit('close', windowData);

    if (activeWindowId === id) {
      activeWindowId = null;
      if (windows.length > 0) {
        const topWindow = windows.filter(w => !w.minimized).sort((a, b) => {
          return (parseInt(b.element.style.zIndex) || 0) - (parseInt(a.element.style.zIndex) || 0);
        })[0];
        if (topWindow) focusWindow(topWindow.id);
      }
    }
  }, 150);
}

export function minimizeWindow(id) {
  const windowData = windows.find(w => w.id === id);
  if (!windowData) return;

  windowData.minimized = true;
  windowData.element.classList.add('window-minimizing');
  setTimeout(() => {
    windowData.element.style.display = 'none';
    windowData.element.classList.remove('window-minimizing');
  }, 200);

  if (activeWindowId === id) {
    activeWindowId = null;
  }

  emit('minimize', windowData);
}

export function restoreWindow(id) {
  const windowData = windows.find(w => w.id === id);
  if (!windowData) return;

  windowData.minimized = false;
  windowData.element.style.display = '';
  windowData.element.classList.add('window-opening');
  setTimeout(() => windowData.element.classList.remove('window-opening'), 200);

  focusWindow(id);
  emit('restore', windowData);
}

export function maximizeWindow(id) {
  const windowData = windows.find(w => w.id === id);
  if (!windowData) return;

  if (windowData.maximized) {
    // Restore
    const b = windowData.prevBounds;
    windowData.element.style.left = b.left;
    windowData.element.style.top = b.top;
    windowData.element.style.width = b.width;
    windowData.element.style.height = b.height;
    windowData.element.classList.remove('window-maximized');
    windowData.maximized = false;
  } else {
    // Maximize
    windowData.prevBounds = {
      left: windowData.element.style.left,
      top: windowData.element.style.top,
      width: windowData.element.style.width,
      height: windowData.element.style.height
    };
    windowData.element.style.left = '0px';
    windowData.element.style.top = '0px';
    windowData.element.style.width = '100vw';
    windowData.element.style.height = 'calc(100vh - 48px)';
    windowData.element.classList.add('window-maximized');
    windowData.maximized = true;
  }
}

export function focusWindow(id) {
  const windowData = windows.find(w => w.id === id);
  if (!windowData) return;

  windows.forEach(w => w.element.classList.remove('window-focused'));
  windowData.element.style.zIndex = ++zIndexCounter;
  windowData.element.classList.add('window-focused');
  activeWindowId = id;
  emit('focus', windowData);
}

function setupTitleBarButtons(win, windowData) {
  const minimizeBtn = win.querySelector('.window-btn-minimize');
  const maximizeBtn = win.querySelector('.window-btn-maximize');
  const closeBtn = win.querySelector('.window-btn-close');

  minimizeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    minimizeWindow(windowData.id);
  });

  maximizeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    maximizeWindow(windowData.id);
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeWindow(windowData.id);
  });

  // Double-click titlebar to maximize
  const titlebar = win.querySelector('.window-titlebar');
  titlebar.addEventListener('dblclick', () => {
    maximizeWindow(windowData.id);
  });
}

function setupDrag(win, windowData) {
  const titlebar = win.querySelector('.window-titlebar');
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  titlebar.addEventListener('mousedown', (e) => {
    if (e.target.closest('.window-btn')) return;
    if (windowData.maximized) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(win.style.left) || 0;
    startTop = parseInt(win.style.top) || 0;
    win.classList.add('window-dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    win.style.left = (startLeft + dx) + 'px';
    win.style.top = (startTop + dy) + 'px';
  });

  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    win.classList.remove('window-dragging');

    // Snap detection
    const x = e.clientX;
    const y = e.clientY;
    const screenW = window.innerWidth;

    if (x <= 5) {
      // Snap left
      win.style.left = '0px';
      win.style.top = '0px';
      win.style.width = '50vw';
      win.style.height = 'calc(100vh - 48px)';
    } else if (x >= screenW - 5) {
      // Snap right
      win.style.left = '50vw';
      win.style.top = '0px';
      win.style.width = '50vw';
      win.style.height = 'calc(100vh - 48px)';
    } else if (y <= 5) {
      // Snap maximize
      maximizeWindow(windowData.id);
    }
  });
}

function setupResize(win, windowData) {
  const handles = win.querySelectorAll('.resize-handle');

  handles.forEach(handle => {
    let isResizing = false;
    let startX, startY, startW, startH, startLeft, startTop;
    let direction = '';

    handle.addEventListener('mousedown', (e) => {
      if (windowData.maximized) return;
      e.preventDefault();
      e.stopPropagation();

      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = win.offsetWidth;
      startH = win.offsetHeight;
      startLeft = parseInt(win.style.left) || 0;
      startTop = parseInt(win.style.top) || 0;

      if (handle.classList.contains('resize-n')) direction = 'n';
      else if (handle.classList.contains('resize-s')) direction = 's';
      else if (handle.classList.contains('resize-e')) direction = 'e';
      else if (handle.classList.contains('resize-w')) direction = 'w';
      else if (handle.classList.contains('resize-ne')) direction = 'ne';
      else if (handle.classList.contains('resize-nw')) direction = 'nw';
      else if (handle.classList.contains('resize-se')) direction = 'se';
      else if (handle.classList.contains('resize-sw')) direction = 'sw';

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
      if (!isResizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const minW = 400;
      const minH = 300;

      if (direction.includes('e')) {
        win.style.width = Math.max(minW, startW + dx) + 'px';
      }
      if (direction.includes('w')) {
        const newW = Math.max(minW, startW - dx);
        if (newW > minW) {
          win.style.width = newW + 'px';
          win.style.left = (startLeft + dx) + 'px';
        }
      }
      if (direction.includes('s')) {
        win.style.height = Math.max(minH, startH + dy) + 'px';
      }
      if (direction.includes('n')) {
        const newH = Math.max(minH, startH - dy);
        if (newH > minH) {
          win.style.height = newH + 'px';
          win.style.top = (startTop + dy) + 'px';
        }
      }
    }

    function onMouseUp() {
      isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  });
}
