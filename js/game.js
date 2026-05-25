import { player, mulberry32, saveGame } from './utils.js';
import { eventsDB } from './loader.js';
import { gainXP } from './progression.js';
import { addLore } from './lore.js';

/** @typedef {'safe'|'normal'|'deep'} RunMode */
/** @type {RunMode|null} */
let runMode = null;
/** @type {number} */
let eventsCount = 0;
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
  runMode = mode;
  eventsCount = 10;
  currentEventIdx = 0;
  runChargeStart = player.charge;
  runActive = true;
  
  // TODO: ANALYTICS_HOOK | track run_start
  log(`🟢 Вылазка: ${mode.toUpperCase()} | Событий: ${eventsCount}`);
  nextEvent();
}

/** Генерация и показ следующего события */
export function nextEvent() {
  if (!runActive || currentEventIdx >= eventsCount) {
    endRun(true);
    return;
  }

  const seed = Date.now() ^ player.level ^ (player.wisdom % 100) ^ currentEventIdx;
  const rng = mulberry32(seed);
  const pool = eventsDB.filter(e => e.minLevel <= player.level);
  if (pool.length === 0) { endRun(true); return; }
  
  const evt = pool[Math.floor(rng() * pool.length)];
  displayEvent(evt);
}

/** Отрисовка события */
function displayEvent(evt) {
  clearChoices();
  screenLog(`\n[${evt.ID}] ${evt.Text}`);
  
  addLore(evt.loreFragment, Number(evt.minLevel) * 5);

  const c1 = { label: evt.Choice1, deltas: { c: evt.C1_dCharge, w: evt.C1_dWisdom, cr: evt.C1_dCredits } };
  const c2 = { label: evt.Choice2, deltas: { c: evt.C2_dCharge, w: evt.C2_dWisdom, cr: evt.C2_dCredits } };
  
  // Масштабирование по режиму
  const mult = runMode === 'safe' ? 0.8 : runMode === 'deep' ? 1.5 : 1;
  c1.deltas.c = Math.round(c1.deltas.c * mult);
  c1.deltas.w = Math.round(c1.deltas.w * mult);
  c1.deltas.cr = Math.round(c1.deltas.cr * mult);
  c2.deltas.c = Math.round(c2.deltas.c * mult);
  c2.deltas.w = Math.round(c2.deltas.w * mult);
  c2.deltas.cr = Math.round(c2.deltas.cr * mult);

  // Trace Protocol (Ищейка) - пассивный бонус
  const showDelta = player.cls === 'tracker' ? true : false;

  createChoiceBtn(c1.label, () => applyChoice(evt.ID, c1.deltas), showDelta ? ` (${c1.deltas.c > 0 ? '+' : ''}${c1.deltas.c}⚡, ${c1.deltas.w > 0 ? '+' : ''}${c1.deltas.w}🧠)` : '');
  createChoiceBtn(c2.label, () => applyChoice(evt.ID, c2.deltas), showDelta ? ` (${c2.deltas.c > 0 ? '+' : ''}${c2.deltas.c}⚡, ${c2.deltas.w > 0 ? '+' : ''}${c2.deltas.w}🧠)` : '');
}

/** Применение дельт */
function applyChoice(evtId, deltas) {
  if (!runActive) return;
  
  player.charge += deltas.c;
  player.wisdom += deltas.w;
  player.credits += deltas.cr;
  
  if (player.charge <= 0) {
    player.charge = 0;
    endRun(false);
    return;
  }
  
  updateStatsUI();
  currentEventIdx++;
  setTimeout(nextEvent, 600);
}

/** Завершение вылазки */
function endRun(success) {
  runActive = false;
  if (success) {
    gainXP(eventsCount);
    screenLog('\n✅ Вылазка завершена успешно. Возврат на базу.');
  } else {
    const penalty = Math.floor(player.credits * 0.3);
    player.credits = Math.max(0, player.credits - penalty);
    screenLog(`\n💀 Заряд иссяк. Потеряно ${penalty} кредитов.`);
  }
  saveGame();
  updateStatsUI();
  clearChoices();
}

/** Backdoor (Хакер) */
export function useBackdoor() {
  if (player.cls !== 'hacker' || player.charge >= runChargeStart) return;
  player.charge = runChargeStart;
  log('🔓 Backdoor активирован. Заряд восстановлен.');
}

/** Reality Patch (Маг) */
export function useRealityPatch() {
  if (player.cls !== 'mage' || player.credits < 2) return;
  player.credits -= 2;
  player.wisdom += 1;
  log('🔮 Reality Patch: -2💳, +1🧠');
}

// UI helpers
function createChoiceBtn(label, onClick, suffix = '') {
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = label + suffix;
  btn.onclick = onClick;
  document.getElementById('choices-container').appendChild(btn);
}
function clearChoices() { document.getElementById('choices-container').innerHTML = ''; }
export function clearRun() { runActive = false; currentEventIdx = 0; clearChoices(); }

// Экспорт для core.js
window.gameAPI = { startRun, useBackdoor, useRealityPatch, clearRun };

