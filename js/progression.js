import { player, updatePlayer, saveGame, debugLog } from './utils.js';

const BASE_XP = 50;
const LEVEL_THRESHOLD_BASE = 150;

/**
 * Начисление XP с учётом мудрости
 * @param {number} eventsCleared
 */
export function gainXP(eventsCleared) {
  const gain = Math.floor(BASE_XP * (1 + player.wisdom / 100) * eventsCleared);
  const newXp = player.xp + gain;
  
  const currentThreshold = player.level * LEVEL_THRESHOLD_BASE;
  let newLevel = player.level;
  let remainingXp = newXp;
  
  while (remainingXp >= currentThreshold * newLevel) {
    newLevel++;
    debugLog(`Level up! New level: ${newLevel}`);
  }
  
  updatePlayer({ xp: remainingXp, level: newLevel });
  debugLog(`gainXP: +${gain} XP, total: ${remainingXp}, level: ${newLevel}`);
}

/** Апгрейды базы */
const UPGRADES = {
  charge: { 
    cost: 100, 
    effect: () => {
      const newMax = (player.maxCharge || 100) + 10;
      const newCharge = player.charge + 10;
      updatePlayer({ maxCharge: newMax, charge: newCharge });
      debugLog(`Upgrade charge: max=${newMax}, current=${newCharge}`);
    } 
  },
  credits: { 
    cost: 0, 
    effect: () => {
      const newCredits = player.credits + 50;
      updatePlayer({ credits: newCredits });
      debugLog(`Upgrade credits: +50, total=${newCredits}`);
    } 
  },
  wisdom: { 
    cost: 150, 
    effect: () => {
      debugLog(`Upgrade wisdom: passive +5%`);
    } 
  }
};

/**
 * Проверка и применение апгрейда
 * @param {'charge'|'credits'|'wisdom'} type
 */
export function buyUpgrade(type) {
  const up = UPGRADES[type];
  if (!up) {
    debugLog(`buyUpgrade: Unknown type ${type}`);
    return false;
  }
  
  if (player.credits >= up.cost) {
    updatePlayer({ credits: player.credits - up.cost });
    up.effect();
    saveGame();
    debugLog(`buyUpgrade: ${type} purchased`);
    return true;
  } else {
    debugLog(`buyUpgrade: Not enough credits (${player.credits} < ${up.cost})`);
    return false;
  }
}

export { LEVEL_THRESHOLD_BASE };

