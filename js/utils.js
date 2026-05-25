/** @type {Object} */
let player = { charge: 100, wisdom: 0, credits: 0, level: 1, xp: 0, cls: 'hacker' };
let debugMode = true;

/** @param {string} msg */
export function debugLog(msg) {
  if (!debugMode) return;
  const log = document.getElementById('terminal-log');
  if (log) {
    const span = document.createElement('span');
    span.textContent = `[DEBUG] ${msg}\n`;
    span.style.color = '#008f11';
    log.prepend(span);
    // Ограничиваем историю
    if (log.childNodes.length > 5) log.removeChild(log.lastChild);
  }
}

export function toggleDebug() {
  debugMode = !debugMode;
  debugLog(debugMode ? 'Режим отладки АКТИВИРОВАН' : 'Режим отладки ОТКЛЮЧЁН');
  return debugMode;
}

export function getDebugState() { return debugMode; }
export { player };

