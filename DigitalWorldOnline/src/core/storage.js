const PREFIX = 'dwo_';

export function get(key) {
  try {
    const value = localStorage.getItem(PREFIX + key);
    if (value === null) return null;
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage set error:', e);
  }
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key);
}

export function clear() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}
