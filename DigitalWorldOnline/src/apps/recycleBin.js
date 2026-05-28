import { createWindow } from '../core/windowManager.js';
import * as fileSystem from '../core/fileSystem.js';

export function open() {
  const win = createWindow({
    title: 'Корзина',
    icon: '/icons/recycle-bin.svg',
    appId: 'recycleBin',
    width: 700,
    height: 450,
    content: '<div class="app-file-explorer app-recycle-bin"></div>'
  });

  const container = win.element.querySelector('.app-recycle-bin');
  render(container);
}

function render(container) {
  const recycleBinNode = fileSystem.getNode('/Recycle Bin');
  const deletedItems = (recycleBinNode && recycleBinNode.deletedItems) || [];
  const items = fileSystem.listFolder('/Recycle Bin') || [];

  container.innerHTML = `
    <div class="file-explorer-toolbar">
      <button class="rb-restore-btn" title="Восстановить">&#8634; Восстановить</button>
      <button class="rb-delete-btn" title="Удалить">&#10006; Удалить</button>
      <button class="rb-empty-btn" title="Очистить">&#128465; Очистить</button>
    </div>
    <div class="file-explorer-body">
      <div class="file-explorer-files rb-files"></div>
    </div>
  `;

  const filesArea = container.querySelector('.rb-files');
  let selectedItem = null;

  if (items.length === 0) {
    filesArea.innerHTML = '<div style="padding:20px;color:var(--text-secondary);font-size:13px;">Корзина пуста</div>';
  } else {
    filesArea.innerHTML = items.map(item => {
      const info = deletedItems.find(d => d.name === item.name);
      const originalPath = info ? info.originalPath : 'Unknown';
      return `
        <div class="file-explorer-item rb-item" data-name="${item.name}" data-type="${item.type}">
          <img src="${item.type === 'folder' ? '/icons/folder.svg' : '/icons/file.svg'}" alt="" />
          <span>${item.name}</span>
          <span style="font-size:10px;color:var(--text-secondary);text-align:center;">${originalPath}</span>
        </div>
      `;
    }).join('');

    filesArea.querySelectorAll('.rb-item').forEach(el => {
      el.addEventListener('click', () => {
        filesArea.querySelectorAll('.rb-item').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
        selectedItem = el.dataset.name;
      });

      el.addEventListener('dblclick', () => {
        const name = el.dataset.name;
        if (fileSystem.restoreFile(name)) {
          render(container);
        }
      });
    });
  }

  // Toolbar actions
  container.querySelector('.rb-restore-btn').addEventListener('click', () => {
    if (!selectedItem) {
      alert('Выберите элемент для восстановления.');
      return;
    }
    if (fileSystem.restoreFile(selectedItem)) {
      selectedItem = null;
      render(container);
    }
  });

  container.querySelector('.rb-delete-btn').addEventListener('click', () => {
    if (!selectedItem) {
      alert('Выберите элемент для удаления.');
      return;
    }
    if (confirm('Удалить навсегда "' + selectedItem + '"?')) {
      fileSystem.permanentDelete('/Recycle Bin/' + selectedItem);
      selectedItem = null;
      render(container);
    }
  });

  container.querySelector('.rb-empty-btn').addEventListener('click', () => {
    if (items.length === 0) return;
    if (confirm('Удалить все элементы из Корзины навсегда?')) {
      items.forEach(item => {
        fileSystem.permanentDelete('/Recycle Bin/' + item.name);
      });
      selectedItem = null;
      render(container);
    }
  });
}
