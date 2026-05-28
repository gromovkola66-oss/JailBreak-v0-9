import * as storage from './storage.js';

const ECONOMY_KEY = 'economy';

function getState() {
  const saved = storage.get(ECONOMY_KEY);
  if (saved) return saved;
  // Default state
  const initial = {
    balance: 500,
    transactions: [
      { id: 1, type: 'income', amount: 500, description: 'Начальный баланс', timestamp: Date.now() }
    ],
    nextId: 2
  };
  storage.set(ECONOMY_KEY, initial);
  return initial;
}

function saveState(state) {
  storage.set(ECONOMY_KEY, state);
}

export function getBalance() {
  return getState().balance;
}

export function getTransactions() {
  return getState().transactions;
}

export function canAfford(amount) {
  return getState().balance >= amount;
}

export function addMoney(amount, description) {
  const state = getState();
  state.balance += amount;
  state.transactions.push({
    id: state.nextId++,
    type: 'income',
    amount,
    description,
    timestamp: Date.now()
  });
  saveState(state);
  return state.balance;
}

export function spendMoney(amount, description) {
  const state = getState();
  if (state.balance < amount) return false;
  state.balance -= amount;
  state.transactions.push({
    id: state.nextId++,
    type: 'expense',
    amount,
    description,
    timestamp: Date.now()
  });
  saveState(state);
  return state.balance;
}
