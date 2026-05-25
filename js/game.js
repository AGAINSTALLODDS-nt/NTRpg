import { player, updatePlayer, saveGame, debugLog } from './utils.js';
import { eventsDB } from './loader.js';

let runActive = false;
let currentEventIdx = 0;
let eventsCount = 10;
let runMode = 'normal';

/** 
 * Старт вылазки
 * @param {'safe'|'normal'|'deep'} mode 
 */
export function startRun(mode) {
  debugLog(`startRun called with mode: ${mode}`);
  debugLog(`Player before run: ${JSON.stringify(player)}`);
  
  runMode = mode;
  runActive = true;
  currentEventIdx = 0;
  eventsCount = 10;
  
  const multipliers = {
    safe: 0.8,
    normal: 1.0,
    deep: 1.5
  };
  
  const mult = multipliers[mode] || 1.0;
  
  window.screenLog(`\n=== ВЫЛАЗКА: ${mode.toUpperCase()} ===`);
  window.screenLog(`Множитель: x${mult}`);
  window.screenLog(`Событий: ${eventsCount}`);
  window.screenLog('');
  
  debugLog(`Run started: mode=${mode}, mult=${mult}`);
  
  // Показываем первое событие
  setTimeout(() => nextEvent(), 500);
}

/** Следующее событие */
export function nextEvent() {
  debugLog(`nextEvent: idx=${currentEventIdx}, active=${runActive}`);
  
  if (!runActive) {
    debugLog('Run not active, returning');
    return;
  }
  
  if (currentEventIdx >= eventsCount) {
    debugLog('All events completed');
    endRun(true);
    return;
  }
  
  if (player.charge <= 0) {
    debugLog('Charge depleted');
    endRun(false);
    return;
  }
  
  // Берем случайное событие
  const availableEvents = eventsDB.filter(e => !e.minLevel || e.minLevel <= player.level);
  
  if (availableEvents.length === 0) {
    window.screenLog('⚠️ Нет доступных событий для вашего уровня');
    debugLog('No events available');
    endRun(true);
    return;
  }
  
  const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
  displayEvent(event);
}

/** 
 * Показ события
 * @param {Object} event 
 */
function displayEvent(event) {
  debugLog(`displayEvent: ${event.ID || 'unknown'}`);
  
  window.clearChoices();
  
  window.screenLog(`\n[СОБЫТИЕ ${currentEventIdx + 1}/${eventsCount}]`);
  window.screenLog(event.Text || event.text || 'Неизвестное событие');
  window.screenLog('');
  
  // Выбор 1
  const c1Label = event.Choice1 || event.choice1 || 'Выбор 1';
  const c1Deltas = {
    charge: event.C1_dCharge || event.c1_dCharge || 0,
    wisdom: event.C1_dWisdom || event.c1_dWisdom || 0,
    credits: event.C1_dCredits || event.c1_dCredits || 0
  };
  
  // Выбор 2
  const c2Label = event.Choice2 || event.choice2 || 'Выбор 2';
  const c2Deltas = {
    charge: event.C2_dCharge || event.c2_dCharge || 0,
    wisdom: event.C2_dWisdom || event.c2_dWisdom || 0,
    credits: event.C2_dCredits || event.c2_dCredits || 0
  };
  
  // Применяем множитель режима
  const mult = runMode === 'deep' ? 1.5 : runMode === 'safe' ? 0.8 : 1.0;
  
  window.createChoice(`${c1Label}`, () => {
    applyChoice(c1Deltas, mult);
  });
  
  window.createChoice(`${c2Label}`, () => {
    applyChoice(c2Deltas, mult);
  });
  
  debugLog(`Event displayed with choices: ${c1Label}, ${c2Label}`);
}

/** 
 * Применение выбора
 * @param {Object} deltas 
 * @param {number} mult 
 */
function applyChoice(deltas, mult) {
  debugLog(`applyChoice: ${JSON.stringify(deltas)} x ${mult}`);
  
  const dCharge = Math.round(deltas.charge * mult);
  const dWisdom = Math.round(deltas.wisdom * mult);
  const dCredits = Math.round(deltas.credits * mult);
  
  const newCharge = player.charge + dCharge;
  const newWisdom = player.wisdom + dWisdom;
  const newCredits = player.credits + dCredits;
  
  updatePlayer({
    charge: newCharge,
    wisdom: newWisdom,
    credits: newCredits
  });
  
  window.updateStatsUI();
  
  window.screenLog(`\nРезультат: ${dCharge > 0 ? '+' : ''}${dCharge}⚡, ${dWisdom > 0 ? '+' : ''}${dWisdom}🧠, ${dCredits > 0 ? '+' : ''}${dCredits}💳`);
  
  debugLog(`New stats: charge=${newCharge}, wisdom=${newWisdom}, credits=${newCredits}`);
  
  if (newCharge <= 0) {
    debugLog('Charge <= 0, ending run');
    setTimeout(() => endRun(false), 1000);
  } else {
    currentEventIdx++;
    debugLog(`Moving to event ${currentEventIdx}`);
    setTimeout(() => nextEvent(), 1500);
  }
}

/** 
 * Конец вылазки
 * @param {boolean} success 
 */
function endRun(success) {
  debugLog(`endRun: success=${success}`);
  runActive = false;
  
  if (success) {
    const xpGain = 50 * (1 + player.wisdom / 100);
    updatePlayer({ xp: player.xp + xpGain });
    window.screenLog(`\n✅ ВЫЛАЗКА ЗАВЕРШЕНА`);
    window.screenLog(`Получено XP: ${Math.floor(xpGain)}`);
  } else {
    const penalty = Math.floor(player.credits * 0.3);
    updatePlayer({ credits: Math.max(0, player.credits - penalty) });
    window.screenLog(`\n💀 ЗАРЯД ИСЧЕРПАН`, 'error');
    window.screenLog(`Потеряно кредитов: ${penalty}`, 'error');
  }
  
  window.updateStatsUI();
  saveGame();
  window.clearChoices();
  
  window.createChoice('⬅️ НАЗАД В МЕНЮ', () => {
    window.screenLog('\n> BASE');
    setTimeout(() => window.showScreen('main'), 100);
  });
  
  debugLog(`Run ended. Final stats: ${JSON.stringify(player)}`);
}

/** Очистка состояния вылазки */
export function clearRun() {
  runActive = false;
  currentEventIdx = 0;
  debugLog('Run cleared');
}

