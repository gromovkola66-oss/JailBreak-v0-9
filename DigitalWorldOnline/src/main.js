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
import { initNotifications, showNotification } from './core/notifications.js';
import { initLevelSystem } from './core/levelSystem.js';
import { initQuestSystem } from './core/questSystem.js';
import { hasSkillEffect } from './core/skillSystem.js';
import { addMoney } from './core/economy.js';

let intervalsStarted = false;

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

  if (!intervalsStarted) {
    intervalsStarted = true;

    // Intrusion detection skill effect
    setInterval(() => {
      if (hasSkillEffect('intrusion_detect') && Math.random() < 0.3) {
        showNotification({ type: 'warning', title: 'Обнаружение вторжений', description: 'Попытка сетевой атаки отражена!' });
      }
    }, 90000);

    // Passive income skill effect
    setInterval(() => {
      if (hasSkillEffect('passive_income')) {
        addMoney(50, 'Пассивный доход');
        showNotification({ type: 'money', title: 'Пассивный доход', description: '+50 DC' });
      }
    }, 60000);
  }
}

document.addEventListener('DOMContentLoaded', init);
