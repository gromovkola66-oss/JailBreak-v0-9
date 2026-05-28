import * as storage from './storage.js';

const REP_KEY = 'reputation';

function loadRep() {
  const saved = storage.get(REP_KEY);
  if (saved) return saved;
  const rep = { white: 0, black: 0, history: [] };
  storage.set(REP_KEY, rep);
  return rep;
}

function saveRep(rep) {
  storage.set(REP_KEY, rep);
}

export function getReputation() {
  const rep = loadRep();
  return { white: rep.white, black: rep.black };
}

export function addWhiteRep(amount, reason) {
  const rep = loadRep();
  rep.white += amount;
  rep.history.push({ type: 'white', amount, reason, timestamp: Date.now() });
  saveRep(rep);
}

export function addBlackRep(amount, reason) {
  const rep = loadRep();
  rep.black += amount;
  rep.history.push({ type: 'black', amount, reason, timestamp: Date.now() });
  saveRep(rep);
}

export function getRepHistory() {
  const rep = loadRep();
  return rep.history;
}
