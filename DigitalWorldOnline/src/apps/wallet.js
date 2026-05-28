import { createWindow, registerCleanup } from '../core/windowManager.js';
import { getBalance, getTransactions } from '../core/economy.js';

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

  // Sort newest first
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  container.innerHTML = `
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
