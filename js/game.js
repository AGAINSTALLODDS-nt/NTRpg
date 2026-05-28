import { player, updatePlayer, saveGame, debugLog, mulberry32 } from './utils.js';
import { eventsDB } from './loader.js';
import { gainXP } from './progression.js';
import { addLore } from './lore.js';

/** @typedef {'safe'|'normal'|'deep'} RunMode */
/** @type {RunMode|null} */
let runMode = null;
/** @type {number} */
let eventsCount = 10;
/** @type {number} */
let runChargeStart = 0;
/** @type {boolean} */
let runActive = false;
/** @type {number} */
let currentEventIdx = 0;

/**
 * Старт вылазки
 * @param {RunMode} mode
 */
export function startRun(mode) {
  debugLog(`startRun: mode=${mode}`);
  
  runMode = mode;
  eventsCount = 10;
  currentEventIdx = 0;
  runChargeStart = player.charge;
  runActive = true;
  
  const screenLog = window.screenLog;
  const clearChoices = window.clearChoices;
  const createChoice = window.createChoice;
  
  if (!screenLog || !clearChoices || !createChoice) {
    debugLog('startRun: UI functions not ready', 'error');
    return;
  }
  
  screenLog('=== RUN STARTED ===', 'info');
  screenLog(`MODE: ${mode.toUpperCase()}`);
  screenLog(`EVENTS: ${eventsCount}`);
  screenLog('');
  
  setTimeout(() => nextEvent(), 500);
}

/** */
export function nextEvent() {
  debugLog(`nextEvent: idx=${currentEventIdx}/${eventsCount}, active=${runActive}`);
  
  const screenLog = window.screenLog;
  const clearChoices = window.clearChoices;
  const createChoice = window.createChoice;
  
  if (!runActive) {
    debugLog('nextEvent: run not active');
    return;
  }
  
  if (currentEventIdx >= eventsCount) {
    debugLog('nextEvent: all events completed');
    endRun(true);
    return;
  }
  
  if (player.charge <= 0) {
    debugLog('nextEvent: charge depleted');
    endRun(false);
    return;
  }

  // Seed RNG
  const seed = Date.now() ^ player.level ^ (player.wisdom % 100) ^ currentEventIdx;
  const rng = mulberry32(seed);
  
  // Фильтр событий по уровню
  const pool = eventsDB.filter(e => !e.minLevel || e.minLevel <= player.level);
  
  if (pool.length === 0) {
    debugLog('nextEvent: no events in pool');
    screenLog('NO EVENTS AVAILABLE FOR YOUR LEVEL', 'warn');
    endRun(true);
    return;
  }
  
  const evt = pool[Math.floor(rng() * pool.length)];
  displayEvent(evt);
}

/** 
 * Отрисовка события С ПОКАЗОМ ДЕЛЬТ
 * @param {Object} evt 
 */
function displayEvent(evt) {
  debugLog(`displayEvent: ${evt.ID}`);
  
  const screenLog = window.screenLog;
  const clearChoices = window.clearChoices;
  const createChoice = window.createChoice;
  const updateStatsUI = window.updateStatsUI;
  
  clearChoices();
  
  screenLog(`\n[EVENT ${currentEventIdx + 1}/${eventsCount}]`);
  screenLog(evt.Text || evt.text || 'Unknown event');
  screenLog('');
  
  // Разблокировка лора
  if (evt.loreFragment) {
    addLore(evt.loreFragment, evt.minLevel || 0);
  }

  // Множитель режима
  const mult = runMode === 'safe' ? 0.8 : runMode === 'deep' ? 1.5 : 1.0;
  
  // Выбор 1
  const c1Label = evt.Choice1 || evt.choice1 || 'Choice 1';
  const c1Deltas = {
    chg: Math.round((evt.C1_dCharge || evt.c1_dCharge || 0) * mult),
    wis: Math.round((evt.C1_dWisdom || evt.c1_dWisdom || 0) * mult),
    crd: Math.round((evt.C1_dCredits || evt.c1_dCredits || 0) * mult)
  };
  
  // Выбор 2
  const c2Label = evt.Choice2 || evt.choice2 || 'Choice 2';
  const c2Deltas = {
    chg: Math.round((evt.C2_dCharge || evt.c2_dCharge || 0) * mult),
    wis: Math.round((evt.C2_dWisdom || evt.c2_dWisdom || 0) * mult),
    crd: Math.round((evt.C2_dCredits || evt.c2_dCredits || 0) * mult)
  };

  // Создаём кнопки с дельтами
  createChoice(c1Label, () => applyChoice(c1Deltas), c1Deltas);
  createChoice(c2Label, () => applyChoice(c2Deltas), c2Deltas);
  
  debugLog(`displayEvent: choices created with deltas`);
}

/** 
 * Применение выбора
 * @param {Object} deltas - {chg, wis, crd}
 */
function applyChoice(deltas) {
  debugLog(`applyChoice: CHG=${deltas.chg}, WIS=${deltas.wis}, CRD=${deltas.crd}`);
  
  const screenLog = window.screenLog;
  const updateStatsUI = window.updateStatsUI;
  
  if (!runActive) return;
  
  const newCharge = player.charge + deltas.chg;
  const newWisdom = player.wisdom + deltas.wis;
  const newCredits = player.credits + deltas.crd;
  
  updatePlayer({
    charge: newCharge,
    wisdom: newWisdom,
    credits: newCredits
  });
  
  // Показываем результат
  screenLog('');
  screenLog(`RESULT: CHG ${deltas.chg >= 0 ? '+' : ''}${deltas.chg}, WIS ${deltas.wis >= 0 ? '+' : ''}${deltas.wis}, CRD ${deltas.crd >= 0 ? '+' : ''}${deltas.crd}`, 'info');
  
  updateStatsUI();
  
  if (newCharge <= 0) {
    debugLog('applyChoice: charge depleted');
    setTimeout(() => endRun(false), 1000);
  } else {
    currentEventIdx++;
    setTimeout(() => nextEvent(), 1500);
  }
}

/** 
 * Завершение вылазки
 * @param {boolean} success 
 */
function endRun(success) {
  debugLog(`endRun: success=${success}`);
  
  const screenLog = window.screenLog;
  const clearChoices = window.clearChoices;
  const createChoice = window.createChoice;
  const updateStatsUI = window.updateStatsUI;
  
  runActive = false;
  
  if (success) {
    gainXP(eventsCount);
    screenLog('\n=== RUN COMPLETED ===', 'info');
    screenLog('STATUS: SUCCESS', 'info');
  } else {
    const penalty = Math.floor(player.credits * 0.3);
    updatePlayer({ credits: Math.max(0, player.credits - penalty) });
    screenLog('\n=== RUN FAILED ===', 'error');
    screenLog(`CHARGE DEPLETED`, 'error');
    screenLog(`PENALTY: -${penalty} CRD`, 'error');
  }
  
  saveGame();
  updateStatsUI();
  clearChoices();
  
  createChoice('[BACK] RETURN TO MAIN', () => {
    if (window.showScreen) {
      window.showScreen('main');
    }
  });
}

/** Очистка состояния */
export function clearRun() {
  runActive = false;
  currentEventIdx = 0;
  debugLog('clearRun');
}

