import './styles/main.css';
import './styles/desktop.css';
import './styles/taskbar.css';
import './styles/window.css';
import './styles/start-menu.css';
import './styles/apps/file-explorer.css';
import './styles/apps/notepad.css';
import './styles/apps/terminal.css';
import './styles/apps/browser.css';
import './styles/apps/settings.css';
import './styles/apps/calculator.css';

import { initFileSystem } from './core/fileSystem.js';
import { initDesktop } from './core/desktop.js';
import { initTaskbar } from './core/taskbar.js';
import { initStartMenu } from './core/startMenu.js';
import { initWindowManager } from './core/windowManager.js';

function init() {
  initFileSystem();
  initWindowManager();
  initDesktop();
  initTaskbar();
  initStartMenu();
}

document.addEventListener('DOMContentLoaded', init);
