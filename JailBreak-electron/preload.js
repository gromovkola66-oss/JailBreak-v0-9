// Preload script - placeholder for future multiplayer IPC
// This file is intentionally minimal. It will be used later to expose
// IPC channels between the renderer process and main process for
// multiplayer networking features.

const { contextBridge } = require('electron');

// Expose a minimal API to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.env.npm_package_version || '0.9.0'
});
