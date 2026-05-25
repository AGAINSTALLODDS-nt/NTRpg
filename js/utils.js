/**
 * @typedef {Object} PlayerStats
 * @property {number} charge
 * @property {number} wisdom
 * @property {number} credits
 * @property {number} level
 * @property {number} xp
 * @property {string} cls
 */

/** @type {PlayerStats} */
let player = { charge: 100, wisdom: 0, credits: 0, level: 1, xp: 0, cls: 'hacker' };

/**
 * Простой детерминированный хеш для прототипа
 * @param {string} data
 * @returns {string}
 */
export function simpleHash(data) {
  let h = 0;
  for (let i = 0; i < data.length; i++) { h = ((h << 5) - h) + data.charCodeAt(i); h |= 0; }
  return btoa(Math.abs(h).toString()).slice(0, 12);
}

/** @param {string} seed */
export function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Сохранение в localStorage с проверкой целостности */
export function saveGame() {
  const payload = { data: player, ts: Date.now() };
  payload.hash = simpleHash(JSON.stringify(payload.data) + payload.ts);
  localStorage.setItem('neuro_terminal_save_v1', JSON.stringify(payload));
  log('💾 Прогресс сохранён.');
}

/** Загрузка с валидацией */
export function loadGame() {
  const raw = localStorage.getItem('neuro_terminal_save_v1');
  if (!raw) return false;
  try {
    const obj = JSON.parse(raw);
    const expected = simpleHash(JSON.stringify(obj.data) + obj.ts);
    if (obj.hash !== expected) {
      console.warn('⚠️ Целостность сохранения нарушена. Используется резерв.');
      return false;
    }
    player = { ...player, ...obj.data };
    return true;
  } catch { return false; }
}

/** Экспорт/Импорт JSON */
export function exportSave() {
  const blob = new Blob([JSON.stringify(player, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ntrpg_save_${Date.now()}.json`; a.click();
}
export function importSave(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    if (data.charge !== undefined && data.wisdom !== undefined) {
      player = { ...player, ...data };
      log('📥 Импорт успешен.');
      return true;
    }
  } catch { log('❌ Ошибка формата.'); }
  return false;
}

export { player };

