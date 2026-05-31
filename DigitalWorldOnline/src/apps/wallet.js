import { createWindow, registerCleanup } from '../core/windowManager.js';
import { getBalance, getTransactions } from '../core/economy.js';
import { getReputation } from '../core/reputation.js';
import { getLevel, getXP, getXPForNextLevel } from '../core/levelSystem.js';

export function open() {
  const win = createWindow({
    title: 'Кошелёк',
    icon: '/icons/wallet.svg',
    appId: 'wallet',
    width: 500,
    height: 550,
    minWidth: 380,
    minHeight: 400,
    content: '<div class="app-wallet"></div>'
  });

  const container = win.element.querySelector('.app-wallet');
  render(container);

  const pollInterval = setInterval(() => {
    render(container);
  }, 2000);

  registerCleanup(win.id, () => {
    clearInterval(pollInterval);
  });
}

function render(container) {
  const balance = getBalance();
  const transactions = getTransactions();
  const rep = getReputation();

  // Sort newest first
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  container.innerHTML = `
    <div class="wallet-level-info" style="display:flex;gap:12px;margin-bottom:16px;background:var(--surface-color, #2a2a3e);border-radius:12px;padding:12px 16px;align-items:center;">
      <span style="font-size:14px;font-weight:600;color:var(--text-primary,#fff);">Уровень ${getLevel()}</span>
      <span style="font-size:12px;color:#888;">XP: ${getXP()} / ${getXPForNextLevel()}</span>
    </div>
    <div class="wallet-balance-card">
      <div class="wallet-balance-label">Баланс</div>
      <div class="wallet-balance-amount">${balance} DC</div>
    </div>
    <div class="wallet-history-header">История операций</div>
    <div class="wallet-transactions">
      ${sorted.map(tx => {
        const isIncome = tx.type === 'income';
        const icon = isIncome ? '&#9650;' : '&#9660;';
        const iconClass = isIncome ? 'wallet-tx-icon-income' : 'wallet-tx-icon-expense';
        const sign = isIncome ? '+' : '-';
        const amountClass = isIncome ? 'wallet-tx-amount-income' : 'wallet-tx-amount-expense';
        const dateStr = formatDate(tx.timestamp);
        return `
          <div class="wallet-transaction-item">
            <div class="wallet-tx-icon ${iconClass}">${icon}</div>
            <div class="wallet-tx-info">
              <div class="wallet-tx-description">${tx.description}</div>
              <div class="wallet-tx-date">${dateStr}</div>
            </div>
            <div class="wallet-tx-amount ${amountClass}">${sign}${tx.amount} DC</div>
          </div>
        `;
      }).join('')}
    </div>
    <div style="margin-top:16px;background:var(--surface-color, #2a2a3e);border-radius:12px;padding:16px;">
      <div style="font-size:14px;font-weight:600;color:var(--text-primary, #fff);margin-bottom:12px;">Репутация</div>
      <div style="display:flex;gap:16px;">
        <div style="flex:1;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.3);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:#999;margin-bottom:4px;">Белая репутация</div>
          <div style="font-size:20px;font-weight:bold;color:#4ade80;">${rep.white}</div>
        </div>
        <div style="flex:1;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:#999;margin-bottom:4px;">Чёрная репутация</div>
          <div style="font-size:20px;font-weight:bold;color:#a855f7;">${rep.black}</div>
        </div>
      </div>
    </div>
  `;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
