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
import './styles/apps/wallet.css';
import './styles/apps/antivirus.css';
import './styles/apps/vpn.css';
import './styles/apps/hacking-minigames.css';
import './styles/notifications.css';
import './styles/apps/messenger.css';
import './styles/apps/journal.css';
import './styles/apps/skills.css';

import { initFileSystem } from './core/fileSystem.js';
import { initDesktop } from './core/desktop.js';
import { initTaskbar } from './core/taskbar.js';
import { initStartMenu } from './core/startMenu.js';
import { initWindowManager } from './core/windowManager.js';
import { initTheme } from './apps/settings.js';
import { initNotifications } from './core/notifications.js';
import { initLevelSystem } from './core/levelSystem.js';
import { initQuestSystem } from './core/questSystem.js';

function init() {
  initFileSystem();
  initWindowManager();
  initTheme();
  initNotifications();
  initDesktop();
  initTaskbar();
  initStartMenu();
  initLevelSystem();
  initQuestSystem();
}

document.addEventListener('DOMContentLoaded', init);
