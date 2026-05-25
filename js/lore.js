import { player, debugLog } from './utils.js';

/** @type {Array<string>} */
let unlockedLore = [];

/**
 * Добавление фрагмента в архив
 * @param {string} fragment
 * @param {number} minWisdom
 */
export function addLore(fragment, minWisdom = 0) {
  if (!fragment) return;
  
  if (player.wisdom >= minWisdom && !unlockedLore.includes(fragment)) {
    unlockedLore.push(fragment);
    debugLog(`addLore: Unlocked "${fragment.slice(0, 50)}..."`);
  }
}

/** Возвращает отформатированный список лора */
export function getLoreArchive() {
  if (unlockedLore.length === 0) {
    return 'Архив пуст. Исследуйте глубже.';
  }
  return unlockedLore.map((f, i) => `[${i+1}] ${f}`).join('\n\n');
}

export { unlockedLore };

