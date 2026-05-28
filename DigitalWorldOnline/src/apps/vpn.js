import { createWindow } from '../core/windowManager.js';
import * as storage from '../core/storage.js';
import { updateQuestStep } from '../core/questSystem.js';

const servers = [
  { name: 'Германия', prefix: '185.234' },
  { name: 'Нидерланды', prefix: '178.162' },
  { name: 'Швейцария', prefix: '194.126' },
  { name: 'Япония', prefix: '103.224' },
  { name: 'США', prefix: '104.238' }
];

export function open() {
  const win = createWindow({
    title: 'VPN',
    icon: '/icons/vpn.svg',
    appId: 'vpn',
    width: 450,
    height: 500,
    content: '<div class="app-vpn"></div>'
  });

  const container = win.element.querySelector('.app-vpn');
  renderApp(container);
}

function renderApp(container) {
  const state = {
    connecting: false,
    selectedServer: 0,
    currentIp: null
  };

  function render() {
    const isConnected = storage.get('vpn_active') || false;
    const server = servers[state.selectedServer];
    const fakeIp = isConnected
      ? (state.currentIp || '192.168.1.100')
      : '192.168.1.100';
    const speed = isConnected ? Math.floor(Math.random() * 150) + 50 : 0;

    container.innerHTML = `
      <div class="vpn-container ${isConnected ? 'vpn-connected' : ''}">
        <div class="vpn-status-text ${isConnected ? 'vpn-status-on' : 'vpn-status-off'}">
          ${state.connecting ? 'Подключение...' : (isConnected ? 'Подключён' : 'Отключён')}
        </div>
        <button class="vpn-connect-btn ${isConnected ? 'vpn-btn-active' : ''} ${state.connecting ? 'vpn-btn-connecting' : ''}" id="vpn-toggle-btn" ${state.connecting ? 'disabled' : ''}>
          <div class="vpn-btn-inner">
            ${state.connecting ? '<div class="vpn-spinner"></div>' : (isConnected ? '&#10004;' : '&#9654;')}
          </div>
        </button>
        <div class="vpn-server-section">
          <label class="vpn-label">Сервер</label>
          <select class="vpn-server-select" id="vpn-server-select" ${isConnected || state.connecting ? 'disabled' : ''}>
            ${servers.map((s, i) => `<option value="${i}" ${i === state.selectedServer ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="vpn-info">
          <div class="vpn-info-row">
            <span class="vpn-info-label">Ваш IP:</span>
            <span class="vpn-info-value">${fakeIp}</span>
          </div>
          <div class="vpn-info-row">
            <span class="vpn-info-label">Скорость:</span>
            <span class="vpn-info-value">${isConnected ? speed + ' Мбит/с' : '---'}</span>
          </div>
        </div>
      </div>
    `;

    const toggleBtn = container.querySelector('#vpn-toggle-btn');
    const serverSelect = container.querySelector('#vpn-server-select');

    toggleBtn.addEventListener('click', () => {
      if (isConnected) {
        storage.set('vpn_active', false);
        state.currentIp = null;
        render();
      } else {
        state.connecting = true;
        render();
        setTimeout(() => {
          state.connecting = false;
          storage.set('vpn_active', true);
          // Quest trigger: vpn_activate
          updateQuestStep('dark_side', 'vpn_activate', null);
          const srv = servers[state.selectedServer];
          state.currentIp = `${srv.prefix}.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 200) + 10}`;
          render();
        }, 2000);
      }
    });

    serverSelect.addEventListener('change', () => {
      state.selectedServer = Number(serverSelect.value);
    });
  }

  render();
}
