/**
 * @typedef {Object} PlayerStats
 * @property {number} charge
 * @property {number} wisdom
 * @property {number} credits
 * @property {number} level
 * @property {number} xp
 * @property {string} cls
 * @property {number} maxCharge
 */

/** @type {PlayerStats} */
let player = { 
  charge: 100, 
  wisdom: 0, 
  credits: 0, 
  level: 1, 
  xp: 0, 
  cls: 'hacker',
  maxCharge: 100
};

let debugMode = true;

/**
 * Простой детерминированный хеш для прототипа
 * @param {string} data
 * @returns {string}
 */
export function simpleHash(data) {
  let h = 0;
  for (let i = 0; i < data.length; i++) { 
    h = ((h << 5) - h) + data.charCodeAt(i); 
    h |= 0; 
  }
  return btoa(Math.abs(h).toString()).slice(0, 12);
}

/** 
 * @param {string} seed 
 * @returns {() => number}
 */
export function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s |= 0; 
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** 
 * Debug логирование
 * @param {string} msg 
 */
export function debugLog(msg) {
  if (!debugMode) return;
  
  const logEl = document.getElementById('terminal-log');
  if (!logEl) {
    console.log('[DEBUG]', msg);
    return;
  }
  
  const time = new Date().toLocaleTimeString('ru-RU', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const span = document.createElement('div');
  span.textContent = `[${time}] ${msg}`;
  span.style.fontSize = '10px';
  span.style.marginBottom = '2px';
  
  logEl.insertBefore(span, logEl.firstChild);
  
  // Ограничиваем историю
  while (logEl.childNodes.length > 20) {
    logEl.removeChild(logEl.lastChild);
  }
}

/** Вкл/выкл debug режима */
export function toggleDebug() {
  debugMode = !debugMode;
  const status = debugMode ? 'АКТИВИРОВАН' : 'ОТКЛЮЧЁН';
  debugLog(`DEBUG режим ${status}`);
  return debugMode;
}

/** @returns {boolean} */
export function isDebugMode() {
  return debugMode;
}

/** Сохранение в localStorage с проверкой целостности */
export function saveGame() {
  try {
    const payload = { 
      data: player, 
      ts: Date.now() 
    };
    payload.hash = simpleHash(JSON.stringify(payload.data) + payload.ts);
    localStorage.setItem('neuro_terminal_save_v1', JSON.stringify(payload));
    debugLog('Game saved: ' + JSON.stringify(player));
    return true;
  } catch (err) {
    debugLog('Save error: ' + err.message);
    return false;
  }
}

/** Загрузка с валидацией */
export function loadGame() {
  try {
    const raw = localStorage.getItem('neuro_terminal_save_v1');
    if (!raw) {
      debugLog('No save found, using defaults');
      return false;
    }
    
    const obj = JSON.parse(raw);
    const expected = simpleHash(JSON.stringify(obj.data) + obj.ts);
    
    if (obj.hash !== expected) {
      console.warn('⚠️ Целостность сохранения нарушена. Используется резерв.');
      debugLog('Save integrity check FAILED');
      return false;
    }
    
    player = { ...player, ...obj.data };
    debugLog('Game loaded: ' + JSON.stringify(player));
    return true;
  } catch (err) {
    debugLog('Load error: ' + err.message);
    return false;
  }
}

/** Экспорт сохранения */
export function exportSave() {
  try {
    const blob = new Blob([JSON.stringify(player, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `ntrpg_save_${Date.now()}.json`; 
    a.click();
    URL.revokeObjectURL(url);
    debugLog('Save exported');
    return true;
  } catch (err) {
    debugLog('Export error: ' + err.message);
    return false;
  }
}

/** Импорт сохранения */
export function importSave(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    if (data.charge !== undefined && data.wisdom !== undefined) {
      player = { ...player, ...data };
      saveGame();
      debugLog('Save imported: ' + JSON.stringify(player));
      return true;
    } else {
      throw new Error('Invalid save format');
    }
  } catch (err) {
    debugLog('Import error: ' + err.message);
    return false;
  }
}

/** 
 * Godmode - установка статов
 * @param {string} stat 
 * @param {number} value 
 */
export function godmodeSet(stat, value) {
  const validStats = ['charge', 'wisdom', 'credits', 'level', 'xp', 'maxCharge'];
  if (!validStats.includes(stat)) {
    debugLog(`Godmode: invalid stat "${stat}"`);
    return false;
  }
  
  player[stat] = Number(value);
  debugLog(`Godmode: ${stat} = ${value}`);
  saveGame();
  return true;
}

/** Godmode - макс все статы */
export function godmodeAll() {
  player.charge = 100;
  player.wisdom = 1000;
  player.credits = 9999;
  player.level = 50;
  player.xp = 10000;
  player.maxCharge = 200;
  debugLog('Godmode: ALL STATS MAXED');
  saveGame();
}

/** @returns {PlayerStats} */
export function getPlayer() {
  return { ...player };
}

/** 
 * Обновление игрока (для других модулей)
 * @param {Partial<PlayerStats>} updates 
 */
export function updatePlayer(updates) {
  player = { ...player, ...updates };
  debugLog(`Player updated: ${JSON.stringify(updates)}`);
}

export { player };

