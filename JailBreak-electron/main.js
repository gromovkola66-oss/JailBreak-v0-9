const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    title: 'JailBreak',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Remove the menu bar
  Menu.setApplicationMenu(null);

  // Load the built game
  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Register keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // F11 - toggle fullscreen
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }

    // Escape - exit fullscreen
    if (input.key === 'Escape' && input.type === 'keyDown') {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
        event.preventDefault();
      }
    }

    // Alt+F4 - quit
    if (input.key === 'F4' && input.alt && input.type === 'keyDown') {
      app.quit();
      event.preventDefault();
    }

    // Disable DevTools shortcut in production
    if (!app.isPackaged) return;
    if (input.key === 'F12' && input.type === 'keyDown') {
      event.preventDefault();
    }
    if (input.key === 'I' && input.control && input.shift && input.type === 'keyDown') {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
