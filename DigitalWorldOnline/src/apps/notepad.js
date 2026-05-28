import { createWindow, registerCleanup } from '../core/windowManager.js';
import * as fileSystem from '../core/fileSystem.js';

export function open(filePath) {
  const state = {
    filePath: filePath || null,
    fileName: filePath ? filePath.split('/').pop() : 'Untitled',
    content: filePath ? (fileSystem.readFile(filePath) || '') : '',
    wordWrap: true,
    modified: false
  };

  const title = state.fileName;
  const win = createWindow({
    title: title + ' - Блокнот',
    icon: '/icons/notepad.svg',
    appId: 'notepad',
    width: 700,
    height: 500,
    content: '<div class="app-notepad"></div>'
  });

  const container = win.element.querySelector('.app-notepad');
  render(container, state, win);

  // Register cleanup to remove any orphaned overlays on window close
  registerCleanup(win.id, () => {
    document.querySelectorAll(`.notepad-dropdown[data-window-id="${win.id}"], .notepad-file-picker[data-window-id="${win.id}"]`).forEach(el => el.remove());
  });
}

function render(container, state, win) {
  container.innerHTML = `
    <div class="notepad-menubar">
      <div class="notepad-menu-group">
        <button class="notepad-menu-btn" data-menu="file">Файл</button>
        <button class="notepad-menu-btn" data-menu="format">Формат</button>
      </div>
    </div>
    <textarea class="notepad-textarea" spellcheck="false">${escapeHtml(state.content)}</textarea>
    <div class="notepad-statusbar">
      <span class="notepad-status-file">${state.filePath || 'Новый файл'}</span>
      <span class="notepad-status-wrap">${state.wordWrap ? 'Перенос: Вкл' : 'Перенос: Выкл'}</span>
    </div>
  `;

  const textarea = container.querySelector('.notepad-textarea');
  textarea.style.whiteSpace = state.wordWrap ? 'pre-wrap' : 'pre';
  textarea.style.overflowX = state.wordWrap ? 'hidden' : 'auto';

  textarea.addEventListener('input', () => {
    state.content = textarea.value;
    state.modified = true;
    updateTitle(win, state);
  });

  setupMenus(container, state, win, textarea);
}

function setupMenus(container, state, win, textarea) {
  const fileBtn = container.querySelector('[data-menu="file"]');
  const formatBtn = container.querySelector('[data-menu="format"]');

  fileBtn.addEventListener('click', (e) => {
    showDropdown(e.target, [
      { label: 'Новый', action: () => doNew(container, state, win) },
      { label: 'Открыть...', action: () => doOpen(container, state, win) },
      { label: 'Сохранить', action: () => doSave(state, win) },
      { label: 'Сохранить как...', action: () => doSaveAs(state, win) }
    ], win.id);
  });

  formatBtn.addEventListener('click', (e) => {
    showDropdown(e.target, [
      { label: state.wordWrap ? '  Перенос по словам (Вкл)' : '  Перенос по словам (Выкл)', action: () => {
        state.wordWrap = !state.wordWrap;
        textarea.style.whiteSpace = state.wordWrap ? 'pre-wrap' : 'pre';
        textarea.style.overflowX = state.wordWrap ? 'hidden' : 'auto';
        container.querySelector('.notepad-status-wrap').textContent = state.wordWrap ? 'Перенос: Вкл' : 'Перенос: Выкл';
      }}
    ], win.id);
  });
}

function showDropdown(anchor, items, windowId) {
  const existing = document.querySelector('.notepad-dropdown');
  if (existing) existing.remove();

  const rect = anchor.getBoundingClientRect();
  const dropdown = document.createElement('div');
  dropdown.className = 'notepad-dropdown';
  if (windowId) dropdown.dataset.windowId = windowId;
  dropdown.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.bottom}px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);padding:4px;z-index:99999;min-width:140px;`;

  items.forEach(item => {
    const el = document.createElement('div');
    el.style.cssText = 'padding:6px 12px;cursor:pointer;font-size:13px;border-radius:var(--radius-sm);';
    el.textContent = item.label;
    el.addEventListener('mouseenter', () => { el.style.background = 'var(--bg-secondary)'; });
    el.addEventListener('mouseleave', () => { el.style.background = ''; });
    el.addEventListener('click', () => {
      item.action();
      dropdown.remove();
    });
    dropdown.appendChild(el);
  });

  document.body.appendChild(dropdown);
  const close = (e) => {
    if (!dropdown.contains(e.target) && e.target !== anchor) {
      dropdown.remove();
      document.removeEventListener('click', close);
    }
  };
  setTimeout(() => document.addEventListener('click', close), 0);
}

function doNew(container, state, win) {
  state.filePath = null;
  state.fileName = 'Untitled';
  state.content = '';
  state.modified = false;
  render(container, state, win);
  updateTitle(win, state);
}

function doOpen(container, state, win) {
  const files = getAllTextFiles('/');
  if (files.length === 0) {
    alert('Текстовые файлы не найдены.');
    return;
  }

  const existing = document.querySelector('.notepad-file-picker');
  if (existing) existing.remove();

  const picker = document.createElement('div');
  picker.className = 'notepad-file-picker';
  picker.dataset.windowId = win.id;
  picker.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);padding:16px;z-index:99999;min-width:300px;max-height:400px;overflow-y:auto;';
  picker.innerHTML = `<h3 style="margin-bottom:12px;font-size:14px;">Открыть файл</h3>`;

  files.forEach(f => {
    const item = document.createElement('div');
    item.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:13px;border-radius:var(--radius-sm);';
    item.textContent = f;
    item.addEventListener('mouseenter', () => { item.style.background = 'var(--bg-secondary)'; });
    item.addEventListener('mouseleave', () => { item.style.background = ''; });
    item.addEventListener('click', () => {
      state.filePath = f;
      state.fileName = f.split('/').pop();
      state.content = fileSystem.readFile(f) || '';
      state.modified = false;
      render(container, state, win);
      updateTitle(win, state);
      picker.remove();
    });
    picker.appendChild(item);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Отмена';
  cancelBtn.style.cssText = 'margin-top:12px;padding:6px 16px;border:1px solid var(--border-color);background:var(--bg-secondary);border-radius:var(--radius-sm);cursor:pointer;font-size:13px;';
  cancelBtn.addEventListener('click', () => picker.remove());
  picker.appendChild(cancelBtn);

  document.body.appendChild(picker);
}

function doSave(state, win) {
  if (!state.filePath) {
    doSaveAs(state, win);
    return;
  }
  const node = fileSystem.getNode(state.filePath);
  if (node) {
    fileSystem.writeFile(state.filePath, state.content);
  } else {
    fileSystem.createFile(state.filePath, state.content);
  }
  state.modified = false;
  updateTitle(win, state);
}

function doSaveAs(state, win) {
  const path = prompt('Сохранить как (полный путь):', state.filePath || '/Documents/file.txt');
  if (!path) return;
  state.filePath = path;
  state.fileName = path.split('/').pop();
  const node = fileSystem.getNode(path);
  if (node) {
    fileSystem.writeFile(path, state.content);
  } else {
    fileSystem.createFile(path, state.content);
  }
  state.modified = false;
  updateTitle(win, state);
}

function updateTitle(win, state) {
  const titleEl = win.element.querySelector('.window-title');
  const prefix = state.modified ? '*' : '';
  titleEl.textContent = prefix + state.fileName + ' - Блокнот';
}

function getAllTextFiles(path) {
  const results = [];
  const items = fileSystem.listFolder(path);
  if (!items) return results;
  items.forEach(item => {
    if (item.type === 'file' && item.name.endsWith('.txt')) {
      results.push(item.path);
    } else if (item.type === 'folder' && !item.path.includes('Recycle Bin')) {
      results.push(...getAllTextFiles(item.path));
    }
  });
  return results;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
