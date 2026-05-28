/**
 * @typedef {Object} PlayerStats
 * @property {number} charge
 * @property {number} wisdom
 * @property {number} credits
 * @property {number} level
 * @property {number} xp
 * @property {string} cls
 * @property {number} maxCharge
 * @property {string} theme - 'white'|'green'|'amber'
 * @property {Array<string>} unlockedThemes
 */

/** @type {PlayerStats} */
let player = { 
  charge: 100, 
  wisdom: 0, 
  credits: 0, 
  level: 1, 
  xp: 0, 
  cls: 'hacker',
  maxCharge: 100,
  theme: 'white',
  unlockedThemes: ['white']
};

let debugMode = false;

/**
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
 * @param {string} msg 
 * @param {string} type - 'info'|'debug'|'error'|'warn'
 */
export function debugLog(msg, type = 'debug') {
  const logEl = document.getElementById('screen-output');
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
  
  const div = document.createElement('div');
  
  if (type === 'debug' && !debugMode) {
    return;
  }
  
  const prefix = type === 'error' ? '[ERR]' : type === 'warn' ? '[WARN]' : '[DBG]';
  div.textContent = `${prefix} ${time} ${msg}`;
  div.className = 'debug-line';
  
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

/** @returns {boolean} */
export function toggleDebug() {
  debugMode = !debugMode;
  const status = debugMode ? 'ENABLED' : 'DISABLED';
  debugLog(`DEBUG MODE ${status}`, 'info');
  return debugMode;
}

/** @returns {boolean} */
export function isDebugMode() {
  return debugMode;
}

/** 
 * Разблокировка темы
 * @param {string} themeName 
 */
export function unlockTheme(themeName) {
  const validThemes = ['white', 'green', 'amber'];
  if (!validThemes.includes(themeName)) {
    debugLog(`INVALID THEME: ${themeName}`, 'error');
    return false;
  }
  
  if (!player.unlockedThemes.includes(themeName)) {
    player.unlockedThemes.push(themeName);
    debugLog(`THEME UNLOCKED: ${themeName.toUpperCase()}`, 'info');
    return true;
  }
  return false;
}

/** 
 * Смена темы
 * @param {string} themeName 
 */
export function setTheme(themeName) {
  if (!player.unlockedThemes.includes(themeName)) {
    debugLog(`THEME NOT UNLOCKED: ${themeName}`, 'warn');
    return false;
  }
  
  player.theme = themeName;
  
  // Применяем к DOM
  const body = document.body;
  body.removeAttribute('data-theme');
  if (themeName !== 'white') {
    body.setAttribute('data-theme', themeName);
  }
  
  debugLog(`THEME SET: ${themeName.toUpperCase()}`, 'info');
  saveGame();
  return true;
}

/** @returns {string} */
export function getCurrentTheme() {
  return player.theme;
}

/** @returns {Array<string>} */
export function getUnlockedThemes() {
  return player.unlockedThemes;
}

/** @returns {boolean} */
export function saveGame() {
  try {
    const payload = { 
      data: player, 
      ts: Date.now() 
    };
    payload.hash = simpleHash(JSON.stringify(payload.data) + payload.ts);
    localStorage.setItem('neuro_terminal_save_v1', JSON.stringify(payload));
    debugLog('GAME SAVED', 'info');
    return true;
  } catch (err) {
    debugLog(`SAVE ERROR: ${err.message}`, 'error');
    return false;
  }
}

/** @returns {boolean} */
export function loadGame() {
  try {
    const raw = localStorage.getItem('neuro_terminal_save_v1');
    if (!raw) {
      debugLog('NO SAVE FOUND', 'warn');
      return false;
    }
    
    const obj = JSON.parse(raw);
    const expected = simpleHash(JSON.stringify(obj.data) + obj.ts);
    
    if (obj.hash !== expected) {
      console.warn('SAVE INTEGRITY FAILED');
      debugLog('SAVE CORRUPTED', 'error');
      return false;
    }
    
    player = { ...player, ...obj.data };
    
    // Применяем тему
    const body = document.body;
    body.removeAttribute('data-theme');
    if (player.theme !== 'white') {
      body.setAttribute('data-theme', player.theme);
    }
    
    debugLog('GAME LOADED', 'info');
    return true;
  } catch (err) {
    debugLog(`LOAD ERROR: ${err.message}`, 'error');
    return false;
  }
}

/** @returns {boolean} */
export function exportSave() {
  try {
    const blob = new Blob([JSON.stringify(player, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `ntrpg_save_${Date.now()}.json`; 
    a.click();
    URL.revokeObjectURL(url);
    debugLog('SAVE EXPORTED', 'info');
    return true;
  } catch (err) {
    debugLog(`EXPORT ERROR: ${err.message}`, 'error');
    return false;
  }
}

/** @param {string} jsonText @returns {boolean} */
export function importSave(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    if (data.charge !== undefined && data.wisdom !== undefined) {
      player = { ...player, ...data };
      
      // Применяем тему
      const body = document.body;
      body.removeAttribute('data-theme');
      if (player.theme !== 'white') {
        body.setAttribute('data-theme', player.theme);
      }
      
      saveGame();
      debugLog('SAVE IMPORTED', 'info');
      return true;
    } else {
      throw new Error('Invalid save format');
    }
  } catch (err) {
    debugLog(`IMPORT ERROR: ${err.message}`, 'error');
    return false;
  }
}

/** 
 * @param {string} stat 
 * @param {number} value
 * @returns {boolean}
 */
export function godmodeSet(stat, value) {
  const validStats = ['charge', 'wisdom', 'credits', 'level', 'xp', 'maxCharge'];
  if (!validStats.includes(stat)) {
    debugLog(`INVALID STAT: ${stat}`, 'error');
    return false;
  }
  
  player[stat] = Number(value);
  debugLog(`GODMODE: ${stat.toUpperCase()}=${value}`, 'warn');
  saveGame();
  return true;
}

/** */
export function godmodeAll() {
  player.charge = 100;
  player.wisdom = 1000;
  player.credits = 9999;
  player.level = 50;
  player.xp = 10000;
  player.maxCharge = 200;
  player.unlockedThemes = ['white', 'green', 'amber'];
  player.theme = 'white';
  debugLog('GODMODE: ALL STATS MAXED', 'warn');
  saveGame();
}

/** @returns {PlayerStats} */
export function getPlayer() {
  return { ...player };
}

/** 
 * @param {Partial<PlayerStats>} updates 
 */
export function updatePlayer(updates) {
  player = { ...player, ...updates };
  debugLog(`STAT UPDATE: ${JSON.stringify(updates)}`);
}

export { player };

