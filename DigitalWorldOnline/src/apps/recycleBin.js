import { createWindow } from '../core/windowManager.js';
import * as fileSystem from '../core/fileSystem.js';

export function open() {
  const win = createWindow({
    title: 'Recycle Bin',
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
      <button class="rb-restore-btn" title="Restore selected">&#8634; Restore</button>
      <button class="rb-delete-btn" title="Delete permanently">&#10006; Delete</button>
      <button class="rb-empty-btn" title="Empty Recycle Bin">&#128465; Empty</button>
    </div>
    <div class="file-explorer-body">
      <div class="file-explorer-files rb-files"></div>
    </div>
  `;

  const filesArea = container.querySelector('.rb-files');
  let selectedItem = null;

  if (items.length === 0) {
    filesArea.innerHTML = '<div style="padding:20px;color:var(--text-secondary);font-size:13px;">Recycle Bin is empty</div>';
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
      alert('Please select an item to restore.');
      return;
    }
    if (fileSystem.restoreFile(selectedItem)) {
      selectedItem = null;
      render(container);
    }
  });

  container.querySelector('.rb-delete-btn').addEventListener('click', () => {
    if (!selectedItem) {
      alert('Please select an item to delete.');
      return;
    }
    if (confirm('Permanently delete "' + selectedItem + '"?')) {
      fileSystem.permanentDelete('/Recycle Bin/' + selectedItem);
      selectedItem = null;
      render(container);
    }
  });

  container.querySelector('.rb-empty-btn').addEventListener('click', () => {
    if (items.length === 0) return;
    if (confirm('Permanently delete all items in the Recycle Bin?')) {
      items.forEach(item => {
        fileSystem.permanentDelete('/Recycle Bin/' + item.name);
      });
      selectedItem = null;
      render(container);
    }
  });
}
