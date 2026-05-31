import { createWindow } from '../core/windowManager.js';
import * as storage from '../core/storage.js';
import { updateQuestStep } from '../core/questSystem.js';
import { addMessageFromNpc } from './messenger.js';
import { hasSkillEffect } from '../core/skillSystem.js';
import { addXP } from '../core/levelSystem.js';

export function open() {
  const win = createWindow({
    title: 'Антивирус',
    icon: '/icons/antivirus.svg',
    appId: 'antivirus',
    width: 650,
    height: 500,
    content: '<div class="app-antivirus"></div>'
  });

  const container = win.element.querySelector('.app-antivirus');
  renderApp(container);
}

function renderApp(container) {
  const state = {
    activeTab: 'dashboard'
  };

  function render() {
    const threats = storage.get('system_threats') || [];
    const firewallActive = storage.get('firewall_active') || false;
    const protectionLevel = storage.get('protection_level') || 'standard';
    const lastScan = storage.get('last_scan_time');

    container.innerHTML = `
      <div class="av-tabs">
        <button class="av-tab ${state.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">Панель</button>
        <button class="av-tab ${state.activeTab === 'scan' ? 'active' : ''}" data-tab="scan">Проверка</button>
        <button class="av-tab ${state.activeTab === 'threats' ? 'active' : ''}" data-tab="threats">Угрозы${threats.length > 0 ? ' (' + threats.length + ')' : ''}</button>
      </div>
      <div class="av-content">
        ${state.activeTab === 'dashboard' ? renderDashboard(threats, firewallActive, protectionLevel, lastScan) : ''}
        ${state.activeTab === 'scan' ? renderScan() : ''}
        ${state.activeTab === 'threats' ? renderThreats(threats) : ''}
      </div>
    `;

    container.querySelectorAll('.av-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.activeTab = tab.dataset.tab;
        render();
      });
    });

    if (state.activeTab === 'dashboard') {
      setupDashboard(container, render);
    } else if (state.activeTab === 'scan') {
      setupScan(container, render);
    } else if (state.activeTab === 'threats') {
      setupThreats(container, render);
    }
  }

  render();
}

function renderDashboard(threats, firewallActive, protectionLevel, lastScan) {
  const safe = threats.length === 0;
  const statusClass = safe ? 'av-status-safe' : 'av-status-danger';
  const statusText = safe ? 'Система защищена' : `Обнаружены угрозы! (${threats.length})`;
  const lastScanText = lastScan ? new Date(lastScan).toLocaleString('ru-RU') : 'Не проводилась';

  const levelOptions = [
    { value: 'basic', label: 'Базовый' },
    { value: 'standard', label: 'Стандартный' },
    { value: 'maximum', label: 'Максимальный' }
  ];

  return `
    <div class="av-dashboard">
      <div class="av-status-card ${statusClass}">
        <div class="av-status-icon">${safe ? '&#10004;' : '&#9888;'}</div>
        <div class="av-status-text">${statusText}</div>
      </div>
      <div class="av-info-grid">
        <div class="av-info-card">
          <div class="av-info-label">Последняя проверка</div>
          <div class="av-info-value">${lastScanText}</div>
        </div>
        <div class="av-info-card">
          <div class="av-info-label">Уровень защиты</div>
          <select class="av-protection-select" id="av-protection-level">
            ${levelOptions.map(o => `<option value="${o.value}" ${protectionLevel === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <div class="av-info-card">
          <div class="av-info-label">Файрвол: ${firewallActive ? 'Включён' : 'Выключён'}</div>
          <label class="av-toggle">
            <input type="checkbox" id="av-firewall-toggle" ${firewallActive ? 'checked' : ''} />
            <span class="av-toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `;
}

function renderScan() {
  return `
    <div class="av-scan">
      <div class="av-scan-buttons">
        <button class="av-scan-btn" id="av-quick-scan">Быстрая проверка</button>
        <button class="av-scan-btn av-scan-btn-full" id="av-full-scan">Полная проверка</button>
      </div>
      <div class="av-scan-progress" id="av-scan-progress" style="display:none;">
        <div class="av-scan-status" id="av-scan-status">Сканирование...</div>
        <div class="av-progress-bar">
          <div class="av-progress-fill" id="av-progress-fill"></div>
        </div>
      </div>
      <div class="av-scan-results" id="av-scan-results"></div>
    </div>
  `;
}

function renderThreats(threats) {
  if (threats.length === 0) {
    return `
      <div class="av-threats-empty">
        <div class="av-threats-empty-icon">&#10004;</div>
        <div>Угрозы не обнаружены</div>
      </div>
    `;
  }

  return `
    <div class="av-threats-list">
      ${threats.map(t => {
        const severityClass = t.severity === 'high' ? 'av-severity-high' : t.severity === 'medium' ? 'av-severity-medium' : 'av-severity-low';
        const severityLabel = t.severity === 'high' ? 'Высокая' : t.severity === 'medium' ? 'Средняя' : 'Низкая';
        return `
          <div class="av-threat-item">
            <div class="av-threat-info">
              <div class="av-threat-name">${t.name}</div>
              <div class="av-threat-meta">
                <span class="av-severity-badge ${severityClass}">${severityLabel}</span>
                <span class="av-threat-source">${t.source}</span>
              </div>
            </div>
            <button class="av-threat-remove" data-threat-id="${t.id}">Удалить</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function setupDashboard(container, render) {
  const protectionSelect = container.querySelector('#av-protection-level');
  if (protectionSelect) {
    protectionSelect.addEventListener('change', () => {
      storage.set('protection_level', protectionSelect.value);
    });
  }

  const firewallToggle = container.querySelector('#av-firewall-toggle');
  if (firewallToggle) {
    firewallToggle.addEventListener('change', () => {
      storage.set('firewall_active', firewallToggle.checked);
      render();
    });
  }
}

function setupScan(container, render) {
  const quickBtn = container.querySelector('#av-quick-scan');
  const fullBtn = container.querySelector('#av-full-scan');

  quickBtn.addEventListener('click', () => runScan(container, 3000, 0.3, render));
  fullBtn.addEventListener('click', () => runScan(container, 10000, 0.6, render));
}

function runScan(container, duration, threatChance, render) {
  const progressEl = container.querySelector('#av-scan-progress');
  const progressFill = container.querySelector('#av-progress-fill');
  const statusEl = container.querySelector('#av-scan-status');
  const resultsEl = container.querySelector('#av-scan-results');
  const quickBtn = container.querySelector('#av-quick-scan');
  const fullBtn = container.querySelector('#av-full-scan');

  progressEl.style.display = 'block';
  resultsEl.innerHTML = '';
  quickBtn.disabled = true;
  fullBtn.disabled = true;

  let progress = 0;
  const step = 100 / (duration / 100);

  const interval = setInterval(() => {
    progress += step;
    if (progress > 100) progress = 100;
    progressFill.style.width = progress + '%';
    statusEl.textContent = `Сканирование... ${Math.floor(progress)}%`;

    if (progress >= 100) {
      clearInterval(interval);
      storage.set('last_scan_time', Date.now());
      addXP(20, 'Сканирование');

      // Quest trigger: antivirus_scan
      const updated = updateQuestStep('help_with_virus', 'antivirus_scan', null);
      if (updated) {
        addMessageFromNpc('anna', 'Ой, спасибо огромное! Всё заработало! Ты лучший \u{1F60A}');
      }

      // virus_immune skill: always show clean
      if (hasSkillEffect('virus_immune')) {
        resultsEl.innerHTML = '<div class="av-scan-result-safe">Система чиста. Угрозы не обнаружены.</div>';
      } else {
        const found = Math.random() < threatChance;
        if (found) {
          const threat = generateThreat();
          const threats = storage.get('system_threats') || [];
          threats.push(threat);
          storage.set('system_threats', threats);
          resultsEl.innerHTML = `<div class="av-scan-result-danger">Обнаружена угроза: ${threat.name}</div>`;
        } else {
          resultsEl.innerHTML = '<div class="av-scan-result-safe">Угрозы не обнаружены</div>';
        }
      }

      quickBtn.disabled = false;
      fullBtn.disabled = false;
      statusEl.textContent = 'Проверка завершена';
    }
  }, 100);
}

function generateThreat() {
  const names = [
    'Троян.DownloadHelper',
    'Шпион.KeyLogger',
    'Вирус.CryptoMiner',
    'Червь.NetSpread',
    'Руткит.HideProc'
  ];
  const severities = ['low', 'medium', 'high'];
  const sources = ['Загрузки', 'Сеть', 'Вложение', 'Флеш-накопитель', 'Вредоносный сайт'];

  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name: names[Math.floor(Math.random() * names.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    source: sources[Math.floor(Math.random() * sources.length)],
    timestamp: Date.now()
  };
}

function setupThreats(container, render) {
  container.querySelectorAll('.av-threat-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.threatId;
      let threats = storage.get('system_threats') || [];
      threats = threats.filter(t => t.id !== id);
      storage.set('system_threats', threats);
      render();
    });
  });
}
