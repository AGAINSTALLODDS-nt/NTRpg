import { player, saveGame, loadGame, exportSave, importSave, toggleDebug, debugLog, getDebugState } from './utils.js';
import { loadCSV } from './loader.js';
import { buyUpgrade } from './progression.js';
import { getLoreArchive } from './lore.js';
import { startRun, useBackdoor, useRealityPatch, clearRun } from './game.js';

const output = document.getElementById('screen-output');
const input = document.getElementById('cmd-input');
const choices = document.getElementById('choices-container');

// 🔧 Глобальный ловец ошибок (спасает от silent crashes на iOS)
window.addEventListener('error', (e) => {
  screenLog(`💥 КРИТИЧЕСКАЯ ОШИБКА: ${e.message}\n📍 ${e.filename}:${e.lineno}`, 'error');
  debugLog(`ERR: ${e.stack || e.message}`);
});
window.addEventListener('unhandledrejection', (e) => {
  screenLog(`💥 ОШИБКА PROMISE: ${e.reason}`, 'error');
  debugLog(`PROMISE ERR: ${e.reason}`);
});

/** Инициализация */
async function init() {
  debugLog('INIT START');
  try {
    await loadCSV();
    loadGame();
    updateStatsUI();
    screenLog('NEURO-TERMINAL v1.0-PROTOTYPE\nПодключение к древней сети...\nВведите > RUN, > BASE, > LORE, > SAVE\n');
    input.focus();
    debugLog('INIT OK');
  } catch (err) {
    screenLog('❌ Ошибка инициализации. Проверьте консоль.', 'error');
    debugLog(`INIT FAIL: ${err.message}`);
  }
}

/** 🍏 FIX: Обработка ввода для iOS Safari */
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.keyCode === 13) {
    e.preventDefault(); // Предотвращаем скролл/зум на iOS
    const cmd = input.value.trim().toUpperCase();
    input.value = '';
    if (cmd) processCommand(cmd);
  }
});

/** Роутинг терминала */
function processCommand(cmd) {
  screenLog(`> ${cmd}`);
  debugLog(`CMD: "${cmd}" | Player: Charge=${player.charge} Wis=${player.wisdom} Cred=${player.credits} Lvl=${player.level}`);
  
  try {
    // 🔑 GODMODE COMMAND
    if (cmd.startsWith('GODMODE ')) {
      const parts = cmd.slice(8).trim().split(/\s+/);
      const [type, val] = parts;
      if (type === 'SET' && val) {
        const [stat, num] = val.split('=');
        if (['charge','wisdom','credits','level','xp'].includes(stat) && !isNaN(Number(num))) {
          player[stat] = Number(num);
          screenLog(`🔓 GODMODE: ${stat} установлен в ${num}`);
          debugLog(`CHEAT: ${stat}=${num}`);
          updateStatsUI(); saveGame();
        } else {
          screenLog('⚠️ Формат: GODMODE SET <stat>=<value> (charge, wisdom, credits, level, xp)');
        }
      } else if (type === 'ALL') {
        Object.assign(player, { charge: 100, wisdom: 1000, credits: 9999, level: 50, xp: 0 });
        screenLog('🔓 GODMODE: ALL STATS MAXED');
        updateStatsUI(); saveGame();
      } else {
        screenLog('⚠️ Формат: GODMODE SET <stat>=<value> или GODMODE ALL');
      }
      return;
    }

    // 🔍 DEBUG COMMAND
    if (cmd === 'DEBUG') {
      toggleDebug();
      return;
    }

    switch (cmd) {
      case 'RUN': showScreen('run_menu'); break;
      case 'BASE': showScreen('base'); break;
      case 'LORE': showScreen('lore'); break;
      case 'SAVE': saveGame(); screenLog('💾 Сохранено.'); break;
      case 'EXPORT': exportSave(); break;
      case 'IMPORT':
        const json = prompt('Вставьте JSON сохранения:');
        if (json) importSave(json);
        break;
      case 'CLEAR': output.innerHTML = ''; break;
      default: screenLog('⚠️ Команда не распознана. Доступно: RUN, BASE, LORE, SAVE, EXPORT, IMPORT, DEBUG, GODMODE, CLEAR');
    }
  } catch (err) {
    screenLog(`💥 Ошибка обработки: ${err.message}`, 'error');
    debugLog(`PROCESS ERR: ${err.stack}`);
  }
}

/** Переключение экранов */
function showScreen(type) {
  clearChoices();
  output.innerHTML = '';
  switch(type) {
    case 'run_menu':
      screenLog('Выберите режим вылазки:');
      createChoice('SAFE (x0.8 риск)', () => startRun('safe'));
      createChoice('NORMAL (x1.0 риск)', () => startRun('normal'));
      createChoice('DEEP (x1.5 риск)', () => startRun('deep'));
      createChoice('Назад', () => showScreen('main'));
      break;
    case 'base':
      screenLog('🏠 БАЗА | Кредиты: ' + player.credits);
      createChoice('⚡ +10 Заряд (100💳)', () => buyUpgrade('charge'));
      createChoice('💳 +50 Кредитов (бесплатно)', () => buyUpgrade('credits'));
      createChoice('🧠 Мудрость пассив +5% (150💳)', () => buyUpgrade('wisdom'));
      createChoice('Назад', () => showScreen('main'));
      break;
    case 'lore':
      screenLog(getLoreArchive());
      createChoice('Назад', () => showScreen('main'));
      break;
    case 'main':
      screenLog('NEURO-TERMINAL v1.0-PROTOTYPE\nГотов к подключению.\nВведите > RUN, > BASE, > LORE, > SAVE');
      break;
  }
}

/** Эффект печати / лог */
export function screenLog(text, type = 'info') {
  const div = document.createElement('div');
  div.textContent = text;
  if (type === 'error') div.classList.add('error');
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
  if (getDebugState()) debugLog(`UI RENDER: ${text.slice(0, 50)}...`);
}

/** Кнопки выбора */
function clearChoices() { document.getElementById('choices-container').innerHTML = ''; }
function createChoice(label, onClick) {
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = label;
  btn.onclick = onClick;
  document.getElementById('choices-container').appendChild(btn);
}

/** Статус-бар */
function updateStatsUI() {
  document.getElementById('stat-charge').textContent = `⚡ ${player.charge}`;
  document.getElementById('stat-wisdom').textContent = `🧠 ${player.wisdom}`;
  document.getElementById('stat-credits').textContent = `💳 ${player.credits}`;
  document.getElementById('stat-level').textContent = `📊 LVL ${player.level}`;
}

// Экспорт для других модулей
window.screenLog = screenLog;
window.updateStatsUI = updateStatsUI;
window.createChoice = createChoice;

document.addEventListener('DOMContentLoaded', init);

