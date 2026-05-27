import { 
  player, 
  saveGame, 
  loadGame, 
  exportSave, 
  importSave, 
  toggleDebug, 
  debugLog, 
  isDebugMode,
  godmodeSet,
  godmodeAll,
  updatePlayer 
} from './utils.js';
import { loadCSV } from './loader.js';
import { buyUpgrade } from './progression.js';
import { getLoreArchive } from './lore.js';
import { startRun, clearRun } from './game.js';

// DOM элементы
let output = null;
let input = null;
let choices = null;
let statusBar = null;

// Глобальный перехват ошибок
window.addEventListener('error', (e) => {
  const msg = `ERROR: ${e.message} at ${e.filename}:${e.lineno}`;
  screenLog(msg, 'error');
  debugLog(`CRITICAL: ${e.error?.stack || msg}`, 'error');
  console.error(e);
});

window.addEventListener('unhandledrejection', (e) => {
  const msg = `PROMISE ERROR: ${e.reason}`;
  screenLog(msg, 'error');
  debugLog(`UNHANDLED: ${e.reason}`, 'error');
  console.error(e);
});

/** */
async function init() {
  debugLog('INIT START');
  
  try {
    // Инициализация DOM
    output = document.getElementById('screen-output');
    input = document.getElementById('cmd-input');
    choices = document.createElement('div');
    choices.id = 'choices-container';
    statusBar = document.getElementById('status-bar');
    
    if (!output || !input) {
      throw new Error('DOM ELEMENTS NOT FOUND');
    }
    
    // Вставляем choices после output
    output.parentNode.insertBefore(choices, output.nextSibling);
    
    // Загрузка CSV
    await loadCSV();
    debugLog('CSV LOADED');
    
    // Загрузка сохранения
    loadGame();
    debugLog('GAME LOADED');
    
    // Обновление UI
    updateStatsUI();
    debugLog('UI UPDATED');
    
    // Приветствие
    screenLog('NEURO-TERMINAL RPG v1.0-PROTOTYPE', 'info');
    screenLog('CONNECTING TO ANCIENT NETWORK...');
    screenLog('');
    screenLog('AVAILABLE COMMANDS:');
    screenLog('  RUN    - START RUN');
    screenLog('  BASE   - BASE MENU');
    screenLog('  LORE   - LORE ARCHIVE');
    screenLog('  SAVE   - SAVE GAME');
    screenLog('  DEBUG  - TOGGLE DEBUG');
    screenLog('  CLEAR  - CLEAR SCREEN');
    screenLog('');
    
    // Настройка ввода
    setupInput();
    debugLog('INPUT SETUP COMPLETE');
    
    debugLog('INIT COMPLETE');
    
  } catch (err) {
    screenLog(`INIT FAILED: ${err.message}`, 'error');
    debugLog(`INIT ERROR: ${err.stack}`, 'error');
    console.error(err);
  }
}

/** */
function setupInput() {
  if (!input) {
    debugLog('INPUT ELEMENT NOT FOUND', 'error');
    return;
  }
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      const cmd = input.value.trim();
      
      debugLog(`INPUT: "${cmd}"`);
      
      if (cmd.length > 0) {
        screenLog(`> ${cmd}`);
        input.value = '';
        
        setTimeout(() => {
          try {
            processCommand(cmd.toUpperCase());
          } catch (err) {
            screenLog(`ERROR: ${err.message}`, 'error');
            debugLog(`PROCESS ERROR: ${err.stack}`, 'error');
          }
        }, 50);
      }
      
      setTimeout(() => input.focus(), 10);
    }
  });
  
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });
  
  input.focus();
  
  if (output) {
    output.addEventListener('click', () => {
      input.focus();
    });
  }
}

/** 
 * @param {string} cmd 
 */
function processCommand(cmd) {
  debugLog(`COMMAND: "${cmd}"`);
  debugLog(`PLAYER: CHG=${player.charge} WIS=${player.wisdom} CRD=${player.credits} LVL=${player.level}`);
  
  try {
    // GODMODE команды
    if (cmd.startsWith('GODMODE ')) {
      const args = cmd.slice(8).trim();
      
      if (args === 'ALL') {
        godmodeAll();
        screenLog('GODMODE: ALL STATS MAXED', 'warn');
        updateStatsUI();
        return;
      }
      
      if (args.startsWith('SET ')) {
        const [stat, val] = args.slice(4).trim().split('=');
        if (stat && val !== undefined) {
          const num = Number(val);
          if (!isNaN(num)) {
            if (godmodeSet(stat.toLowerCase(), num)) {
              screenLog(`GODMODE: ${stat.toUpperCase()}=${num}`, 'warn');
              updateStatsUI();
            } else {
              screenLog('INVALID STAT NAME', 'error');
            }
          } else {
            screenLog('VALUE MUST BE NUMBER', 'error');
          }
        } else {
          screenLog('FORMAT: GODMODE SET <stat>=<value>', 'error');
        }
        return;
      }
      
      screenLog('GODMODE: USE "ALL" OR "SET <stat>=<value>"', 'error');
      return;
    }
    
    // DEBUG команда
    if (cmd === 'DEBUG') {
      const enabled = toggleDebug();
      screenLog(`DEBUG MODE: ${enabled ? 'ON' : 'OFF'}`, 'info');
      return;
    }
    
    // Основные команды
    switch (cmd) {
      case 'RUN':
        debugLog('SHOWING RUN MENU');
        showScreen('run_menu');
        break;
        
      case 'BASE':
        debugLog('SHOWING BASE MENU');
        showScreen('base');
        break;
        
      case 'LORE':
        debugLog('SHOWING LORE');
        showScreen('lore');
        break;
        
      case 'SAVE':
        debugLog('SAVING GAME');
        if (saveGame()) {
          screenLog('GAME SAVED', 'info');
        } else {
          screenLog('SAVE FAILED', 'error');
        }
        break;
        
      case 'EXPORT':
        debugLog('EXPORTING SAVE');
        if (exportSave()) {
          screenLog('SAVE EXPORTED', 'info');
        }
        break;
        
      case 'IMPORT':
        debugLog('IMPORTING SAVE');
        const json = prompt('PASTE SAVE JSON:');
        if (json && importSave(json)) {
          screenLog('SAVE IMPORTED', 'info');
          updateStatsUI();
        } else if (json) {
          screenLog('IMPORT FAILED', 'error');
        }
        break;
        
      case 'CLEAR':
        debugLog('CLEARING SCREEN');
        if (output) output.innerHTML = '';
        if (choices) choices.innerHTML = '';
        break;
        
      case 'HELP':
        screenLog('COMMANDS: RUN, BASE, LORE, SAVE, EXPORT, IMPORT, DEBUG, GODMODE, CLEAR');
        break;
        
      default:
        screenLog(`UNKNOWN COMMAND: ${cmd}`, 'warn');
        screenLog('TYPE HELP FOR COMMAND LIST');
        debugLog(`UNKNOWN COMMAND: ${cmd}`);
    }
    
  } catch (err) {
    screenLog(`ERROR: ${err.message}`, 'error');
    debugLog(`COMMAND ERROR: ${err.stack}`, 'error');
    console.error(err);
  }
}

/** 
 * @param {'run_menu'|'base'|'lore'|'main'} type 
 */
function showScreen(type) {
  debugLog(`SCREEN: ${type}`);
  if (choices) choices.innerHTML = '';
  if (output) output.innerHTML = '';
  
  switch(type) {
    case 'run_menu':
      screenLog('=== RUN MENU ===', 'info');
      screenLog('SELECT MODE:');
      screenLog('');
      
      createChoice('[SAFE] RISK x0.8, REWARD x0.8', () => {
        debugLog('STARTING SAFE RUN');
        startRun('safe');
      });
      
      createChoice('[NORMAL] RISK x1.0, REWARD x1.0', () => {
        debugLog('STARTING NORMAL RUN');
        startRun('normal');
      });
      
      createChoice('[DEEP] RISK x1.5, REWARD x1.5', () => {
        debugLog('STARTING DEEP RUN');
        startRun('deep');
      });
      
      createChoice('[BACK] RETURN TO MAIN', () => showScreen('main'));
      break;
      
    case 'base':
      screenLog('=== BASE MENU ===', 'info');
      screenLog(`CREDITS: ${player.credits}`);
      screenLog('');
      
      createChoice(`[UPG] CHARGE +10 (100 CRD)`, () => {
        debugLog('BUYING CHARGE UPGRADE');
        buyUpgrade('charge');
        updateStatsUI();
        showScreen('base');
      });
      
      createChoice(`[UPG] CREDITS +50 (FREE)`, () => {
        debugLog('BUYING CREDITS');
        buyUpgrade('credits');
        updateStatsUI();
        showScreen('base');
      });
      
      createChoice(`[UPG] WISDOM +5% PASSIVE (150 CRD)`, () => {
        debugLog('BUYING WISDOM UPGRADE');
        buyUpgrade('wisdom');
        updateStatsUI();
        showScreen('base');
      });
      
      createChoice('[BACK] RETURN TO MAIN', () => showScreen('main'));
      break;
      
    case 'lore':
      screenLog('=== LORE ARCHIVE ===', 'info');
      screenLog('');
      const lore = getLoreArchive();
      screenLog(lore || 'ARCHIVE EMPTY. EXPLORE DEEPER.');
      screenLog('');
      
      createChoice('[BACK] RETURN TO MAIN', () => showScreen('main'));
      break;
      
    case 'main':
    default:
      screenLog('NEURO-TERMINAL RPG v1.0-PROTOTYPE', 'info');
      screenLog('SYSTEM READY');
      screenLog('');
      screenLog('TYPE COMMAND:');
      screenLog('  RUN    - START RUN');
      screenLog('  BASE   - BASE MENU');
      screenLog('  LORE   - ARCHIVE');
      screenLog('  DEBUG  - TOGGLE DEBUG');
      break;
  }
}

/** 
 * @param {string} text 
 * @param {'info'|'error'|'success'|'warn'} type 
 */
function screenLog(text, type = 'info') {
  if (!output) {
    console.log('screenLog:', text);
    return;
  }
  
  const div = document.createElement('div');
  div.textContent = text;
  div.style.marginBottom = '3px';
  
  if (type === 'error') {
    div.className = 'error';
  } else if (type === 'warn') {
    div.className = 'warn';
  } else if (type === 'info') {
    div.style.color = '#00ff41';
    div.style.fontWeight = 'bold';
  }
  
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
  
  debugLog(`UI: ${text.slice(0, 80)}`);
}

/** */
function clearChoices() {
  if (choices) {
    choices.innerHTML = '';
  }
}

/** 
 * @param {string} label 
 * @param {() => void} onClick 
 */
function createChoice(label, onClick) {
  if (!choices) {
    debugLog('ERROR: CHOICES CONTAINER NOT FOUND', 'error');
    return;
  }
  
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = label;
  btn.tabIndex = 0;
  
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    debugLog(`CHOICE: ${label}`);
    onClick();
  });
  
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  });
  
  choices.appendChild(btn);
  debugLog(`CHOICE CREATED: ${label}`);
}

/** */
function updateStatsUI() {
  try {
    if (!statusBar) return;
    
    let chargeEl = document.getElementById('stat-charge');
    let wisdomEl = document.getElementById('stat-wisdom');
    let creditsEl = document.getElementById('stat-credits');
    let levelEl = document.getElementById('stat-level');
    
    if (chargeEl) chargeEl.textContent = `CHG:${player.charge}`;
    if (wisdomEl) wisdomEl.textContent = `WIS:${player.wisdom}`;
    if (creditsEl) creditsEl.textContent = `CRD:${player.credits}`;
    if (levelEl) levelEl.textContent = `LVL:${player.level}`;
    
    debugLog(`STATS UPDATED`);
  } catch (err) {
    debugLog(`UPDATE STATS ERROR: ${err.message}`, 'error');
  }
}

// Экспорт для других модулей
window.screenLog = screenLog;
window.updateStatsUI = updateStatsUI;
window.createChoice = createChoice;
window.clearChoices = clearChoices;
window.debugLog = debugLog;
window.showScreen = showScreen;

// Запуск при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Фокус при загрузке
window.addEventListener('load', () => {
  if (input) input.focus();
});

