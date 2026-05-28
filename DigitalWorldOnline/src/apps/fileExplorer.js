import { createWindow, registerCleanup } from '../core/windowManager.js';
import * as fileSystem from '../core/fileSystem.js';

export function open(startPath) {
  const win = createWindow({
    title: 'File Explorer',
    icon: '/icons/file-explorer.svg',
    appId: 'fileExplorer',
    width: 850,
    height: 550,
    content: '<div class="app-file-explorer"></div>'
  });

  const container = win.element.querySelector('.app-file-explorer');
  const state = {
    currentPath: startPath || '/Desktop',
    history: [startPath || '/Desktop'],
    historyIndex: 0
  };

  render(container, state, win);

  // Register cleanup to remove any orphaned context menus on window close
  registerCleanup(win.id, () => {
    document.querySelectorAll(`.fe-context-menu[data-window-id="${win.id}"]`).forEach(el => el.remove());
  });
}

function render(container, state, win) {
  container.innerHTML = `
    <div class="file-explorer-toolbar">
      <button class="fe-btn-back" title="Back">&#8592;</button>
      <button class="fe-btn-forward" title="Forward">&#8594;</button>
      <button class="fe-btn-new-folder" title="New Folder">&#128193;+</button>
      <button class="fe-btn-new-file" title="New File">&#128196;+</button>
      <input class="file-explorer-path" type="text" value="${state.currentPath}" />
    </div>
    <div class="file-explorer-body">
      <div class="file-explorer-sidebar"></div>
      <div class="file-explorer-files"></div>
    </div>
  `;

  renderSidebar(container, state, win);
  renderFiles(container, state, win);
  setupToolbar(container, state, win);
  setupContextMenu(container, state, win);
}

function renderSidebar(container, state, win) {
  const sidebar = container.querySelector('.file-explorer-sidebar');
  const folders = ['Desktop', 'Documents', 'Downloads', 'Pictures'];

  sidebar.innerHTML = folders.map(folder => `
    <div class="file-explorer-sidebar-item ${state.currentPath === '/' + folder ? 'active' : ''}" data-path="/${folder}">
      <img src="/icons/folder.svg" alt="" />
      <span>${folder}</span>
    </div>
  `).join('');

  sidebar.querySelectorAll('.file-explorer-sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(container, state, item.dataset.path, win);
    });
  });
}

function renderFiles(container, state, win) {
  const filesArea = container.querySelector('.file-explorer-files');
  const items = fileSystem.listFolder(state.currentPath);

  if (!items || items.length === 0) {
    filesArea.innerHTML = '<div style="padding:20px;color:var(--text-secondary);font-size:13px;">This folder is empty</div>';
    return;
  }

  filesArea.innerHTML = items.map(item => `
    <div class="file-explorer-item" data-path="${item.path}" data-type="${item.type}" data-name="${item.name}">
      <img src="${item.type === 'folder' ? '/icons/folder.svg' : '/icons/file.svg'}" alt="" />
      <span>${item.name}</span>
    </div>
  `).join('');

  filesArea.querySelectorAll('.file-explorer-item').forEach(el => {
    el.addEventListener('dblclick', () => {
      const path = el.dataset.path;
      const type = el.dataset.type;
      if (type === 'folder') {
        navigateTo(container, state, path, win);
      } else if (el.dataset.name.endsWith('.txt')) {
        import('./notepad.js').then(m => m.open(path));
      }
    });

    el.addEventListener('click', (e) => {
      filesArea.querySelectorAll('.file-explorer-item').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
    });
  });
}

function setupToolbar(container, state, win) {
  const backBtn = container.querySelector('.fe-btn-back');
  const fwdBtn = container.querySelector('.fe-btn-forward');
  const newFolderBtn = container.querySelector('.fe-btn-new-folder');
  const newFileBtn = container.querySelector('.fe-btn-new-file');
  const pathInput = container.querySelector('.file-explorer-path');

  backBtn.addEventListener('click', () => {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      state.currentPath = state.history[state.historyIndex];
      render(container, state, win);
    }
  });

  fwdBtn.addEventListener('click', () => {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      state.currentPath = state.history[state.historyIndex];
      render(container, state, win);
    }
  });

  newFolderBtn.addEventListener('click', () => {
    const name = prompt('Folder name:');
    if (name && name.trim()) {
      const path = state.currentPath === '/' ? '/' + name.trim() : state.currentPath + '/' + name.trim();
      fileSystem.createFolder(path);
      renderFiles(container, state, win);
    }
  });

  newFileBtn.addEventListener('click', () => {
    const name = prompt('File name:', 'New File.txt');
    if (name && name.trim()) {
      const path = state.currentPath === '/' ? '/' + name.trim() : state.currentPath + '/' + name.trim();
      fileSystem.createFile(path, '');
      renderFiles(container, state, win);
    }
  });

  pathInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const newPath = pathInput.value.trim();
      if (fileSystem.getNode(newPath) && fileSystem.getNode(newPath).type === 'folder') {
        navigateTo(container, state, newPath, win);
      }
    }
  });
}

function setupContextMenu(container, state, win) {
  const filesArea = container.querySelector('.file-explorer-files');
  filesArea.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const existing = container.querySelector('.fe-context-menu');
    if (existing) existing.remove();
    // Also remove any body-level context menus for this window
    document.querySelectorAll(`.fe-context-menu[data-window-id="${win.id}"]`).forEach(el => el.remove());

    const menu = document.createElement('div');
    menu.className = 'fe-context-menu';
    menu.dataset.windowId = win.id;
    menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);padding:4px;z-index:9999;min-width:150px;`;
    menu.innerHTML = `
      <div class="fe-ctx-item" data-action="new-folder" style="padding:6px 12px;cursor:pointer;font-size:13px;border-radius:var(--radius-sm);">New Folder</div>
      <div class="fe-ctx-item" data-action="new-file" style="padding:6px 12px;cursor:pointer;font-size:13px;border-radius:var(--radius-sm);">New Text File</div>
      <div style="height:1px;background:var(--border-color);margin:4px 0;"></div>
      <div class="fe-ctx-item" data-action="refresh" style="padding:6px 12px;cursor:pointer;font-size:13px;border-radius:var(--radius-sm);">Refresh</div>
    `;

    document.body.appendChild(menu);

    menu.querySelectorAll('.fe-ctx-item').forEach(item => {
      item.addEventListener('mouseenter', () => { item.style.background = 'var(--bg-secondary)'; });
      item.addEventListener('mouseleave', () => { item.style.background = ''; });
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (action === 'new-folder') {
          const name = prompt('Folder name:');
          if (name && name.trim()) {
            const path = state.currentPath === '/' ? '/' + name.trim() : state.currentPath + '/' + name.trim();
            fileSystem.createFolder(path);
            renderFiles(container, state, win);
          }
        } else if (action === 'new-file') {
          const name = prompt('File name:', 'New File.txt');
          if (name && name.trim()) {
            const path = state.currentPath === '/' ? '/' + name.trim() : state.currentPath + '/' + name.trim();
            fileSystem.createFile(path, '');
            renderFiles(container, state, win);
          }
        } else if (action === 'refresh') {
          renderFiles(container, state, win);
        }
        menu.remove();
      });
    });

    const closeMenu = (e2) => {
      if (!menu.contains(e2.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  });
}

function navigateTo(container, state, path, win) {
  state.currentPath = path;
  state.historyIndex++;
  state.history = state.history.slice(0, state.historyIndex);
  state.history.push(path);
  render(container, state, win);
}
