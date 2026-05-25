import { player, saveGame } from './utils.js';

const BASE_XP = 50;
const LEVEL_THRESHOLD_BASE = 150;

/**
 * Начисление XP с учётом мудрости
 * @param {number} eventsCleared
 */
export function gainXP(eventsCleared) {
  const gain = Math.floor(BASE_XP * (1 + player.wisdom / 100) * eventsCleared);
  player.xp += gain;
  
  const currentThreshold = player.level * LEVEL_THRESHOLD_BASE;
  while (player.xp >= currentThreshold) {
    player.level++;
    player.xp -= currentThreshold;
    log(`📈 Уровень повышен до ${player.level}!`);
  }
  saveGame();
}

/** Апгрейды базы */
const UPGRADES = {
  charge: { cost: 100, effect: () => { /* maxCharge logic handled in game init */ player.charge += 10; log('⚡ Заряд увеличен на 10'); } },
  credits: { cost: 50, effect: () => { player.credits += 50; log('💳 Кредиты пополнены'); } },
  wisdom: { cost: 150, effect: () => { /* Passive logic */ log('🧠 Пассивная мудрость +5%'); } }
};

/**
 * Проверка и применение апгрейда
 * @param {'charge'|'credits'|'wisdom'} type
 */
export function buyUpgrade(type) {
  const up = UPGRADES[type];
  if (player.credits >= up.cost) {
    player.credits -= up.cost;
    up.effect();
    saveGame();
  } else {
    log('❌ Недостаточно кредитов.');
  }
}

export { LEVEL_THRESHOLD_BASE };

