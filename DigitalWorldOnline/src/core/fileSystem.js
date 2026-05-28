import * as storage from './storage.js';

const FS_KEY = 'filesystem';

const DEFAULT_STRUCTURE = {
  '/': {
    type: 'folder',
    children: ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Recycle Bin']
  },
  '/Desktop': { type: 'folder', children: [] },
  '/Documents': { type: 'folder', children: [] },
  '/Downloads': { type: 'folder', children: [] },
  '/Pictures': { type: 'folder', children: [] },
  '/Recycle Bin': { type: 'folder', children: [], deletedItems: [] }
};

let fs = null;

export function initFileSystem() {
  const saved = storage.get(FS_KEY);
  if (saved) {
    fs = saved;
  } else {
    fs = JSON.parse(JSON.stringify(DEFAULT_STRUCTURE));
    save();
  }
}

function save() {
  storage.set(FS_KEY, fs);
}

function normalizePath(path) {
  if (!path.startsWith('/')) path = '/' + path;
  if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);
  return path;
}

function getParentPath(path) {
  const parts = path.split('/');
  parts.pop();
  return parts.length <= 1 ? '/' : parts.join('/');
}

function getFileName(path) {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function createFile(path, content = '') {
  path = normalizePath(path);
  if (fs[path]) return false;

  const parentPath = getParentPath(path);
  const parent = fs[parentPath];
  if (!parent || parent.type !== 'folder') return false;

  fs[path] = { type: 'file', content, createdAt: Date.now(), modifiedAt: Date.now() };
  parent.children.push(getFileName(path));
  save();
  return true;
}

export function createFolder(path) {
  path = normalizePath(path);
  if (fs[path]) return false;

  const parentPath = getParentPath(path);
  const parent = fs[parentPath];
  if (!parent || parent.type !== 'folder') return false;

  fs[path] = { type: 'folder', children: [] };
  parent.children.push(getFileName(path));
  save();
  return true;
}

export function readFile(path) {
  path = normalizePath(path);
  const node = fs[path];
  if (!node || node.type !== 'file') return null;
  return node.content;
}

export function writeFile(path, content) {
  path = normalizePath(path);
  const node = fs[path];
  if (!node || node.type !== 'file') return false;
  node.content = content;
  node.modifiedAt = Date.now();
  save();
  return true;
}

export function deleteFile(path) {
  path = normalizePath(path);
  const node = fs[path];
  if (!node) return false;

  const parentPath = getParentPath(path);
  const parent = fs[parentPath];
  const fileName = getFileName(path);

  if (parentPath === '/Recycle Bin') {
    permanentDelete(path);
    return true;
  }

  // Move to Recycle Bin
  const recycleBin = fs['/Recycle Bin'];
  const newPath = '/Recycle Bin/' + fileName;

  // Store original location for restore
  if (!recycleBin.deletedItems) recycleBin.deletedItems = [];
  recycleBin.deletedItems.push({ originalPath: path, name: fileName });

  fs[newPath] = node;
  recycleBin.children.push(fileName);

  // Remove from parent
  if (parent) {
    parent.children = parent.children.filter(c => c !== fileName);
  }
  delete fs[path];

  // If it was a folder, move all children too
  if (node.type === 'folder') {
    moveChildrenToRecycleBin(path, newPath, node);
  }

  save();
  return true;
}

function moveChildrenToRecycleBin(oldBasePath, newBasePath, node) {
  if (node.children) {
    node.children.forEach(child => {
      const oldChildPath = oldBasePath + '/' + child;
      const newChildPath = newBasePath + '/' + child;
      if (fs[oldChildPath]) {
        fs[newChildPath] = fs[oldChildPath];
        if (fs[oldChildPath].type === 'folder') {
          moveChildrenToRecycleBin(oldChildPath, newChildPath, fs[oldChildPath]);
        }
        delete fs[oldChildPath];
      }
    });
  }
}

export function permanentDelete(path) {
  path = normalizePath(path);
  const node = fs[path];
  if (!node) return false;

  const parentPath = getParentPath(path);
  const parent = fs[parentPath];
  const fileName = getFileName(path);

  if (node.type === 'folder' && node.children) {
    node.children.forEach(child => {
      permanentDelete(path + '/' + child);
    });
  }

  if (parent) {
    parent.children = parent.children.filter(c => c !== fileName);
  }

  if (parent && parent.deletedItems) {
    parent.deletedItems = parent.deletedItems.filter(item => item.name !== fileName);
  }

  delete fs[path];
  save();
  return true;
}

export function restoreFile(fileName) {
  const recycleBin = fs['/Recycle Bin'];
  if (!recycleBin || !recycleBin.deletedItems) return false;

  const itemInfo = recycleBin.deletedItems.find(item => item.name === fileName);
  if (!itemInfo) return false;

  const recyclePath = '/Recycle Bin/' + fileName;
  const node = fs[recyclePath];
  if (!node) return false;

  const originalParent = getParentPath(itemInfo.originalPath);
  if (!fs[originalParent]) return false;

  fs[itemInfo.originalPath] = node;
  fs[originalParent].children.push(fileName);

  recycleBin.children = recycleBin.children.filter(c => c !== fileName);
  recycleBin.deletedItems = recycleBin.deletedItems.filter(item => item.name !== fileName);
  delete fs[recyclePath];

  save();
  return true;
}

export function listFolder(path) {
  path = normalizePath(path);
  const node = fs[path];
  if (!node || node.type !== 'folder') return null;

  return node.children.map(name => {
    const childPath = path === '/' ? '/' + name : path + '/' + name;
    const child = fs[childPath];
    return {
      name,
      path: childPath,
      type: child ? child.type : 'unknown'
    };
  });
}

export function moveFile(from, to) {
  from = normalizePath(from);
  to = normalizePath(to);

  const node = fs[from];
  if (!node) return false;

  const fromParent = getParentPath(from);
  const fromName = getFileName(from);
  const toParent = getParentPath(to);
  const toName = getFileName(to);

  if (!fs[toParent] || fs[toParent].type !== 'folder') return false;

  // Remove from source
  if (fs[fromParent]) {
    fs[fromParent].children = fs[fromParent].children.filter(c => c !== fromName);
  }

  // Add to destination
  fs[to] = node;
  fs[toParent].children.push(toName);
  delete fs[from];

  save();
  return true;
}

export function exists(path) {
  path = normalizePath(path);
  return !!fs[path];
}

export function getNode(path) {
  path = normalizePath(path);
  return fs[path] || null;
}
