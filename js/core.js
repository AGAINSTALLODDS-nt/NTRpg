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
const output = document.getElementById('screen-output');
const input = document.getElementById('cmd-input');
const choices = document.getElementById('choices-container');
const statusBar = document.getElementById('status-bar');

// Глобальный перехват ошибок
window.addEventListener('error', (e) => {
  const msg = `💥 ERROR: ${e.message} at ${e.filename}:${e.lineno}`;
  screenLog(msg, 'error');
  debugLog(`CRITICAL: ${e.error?.stack || msg}`);
  console.error(e);
});

window.addEventListener('unhandledrejection', (e) => {
  const msg = `💥 PROMISE ERROR: ${e.reason}`;
  screenLog(msg, 'error');
  debugLog(`UNHANDLED: ${e.reason}`);
  console.error(e);
});

/** Инициализация */
async function init() {
  debugLog('=== INIT START ===');
  
  try {
    // Загрузка CSV
    await loadCSV();
    debugLog('CSV loaded');
    
    // Загрузка сохранения
    loadGame();
    debugLog('Game loaded');
    
    // Обновление UI
    updateStatsUI();
    debugLog('UI updated');
    
    // Приветствие
    screenLog('NEURO-TERMINAL v1.0-PROTOTYPE');
    screenLog('Подключение к древней сети...');
    screenLog('');
    screenLog('Доступные команды:');
    screenLog('  > RUN    - начать вылазку');
    screenLog('  > BASE   - база данных');
    screenLog('  > LORE   - архив лора');
    screenLog('  > SAVE   - сохранить');
    screenLog('  > DEBUG  - режим отладки');
    screenLog('  > CLEAR  - очистить экран');
    screenLog('');
    
    // Фокус на input
    input.focus();
    
    debugLog('=== INIT COMPLETE ===');
    
  } catch (err) {
    screenLog(`❌ INIT FAILED: ${err.message}`, 'error');
    debugLog(`INIT ERROR: ${err.stack}`);
    console.error(err);
  }
}

/** 
 * Обработка ввода - ИСПРАВЛЕНО ДЛЯ iOS
 * @param {KeyboardEvent} e 
 */
function handleInput(e) {
  // Проверяем Enter разными способами для совместимости
  if (e.key === 'Enter' || e.keyCode === 13 || e.which === 13) {
    e.preventDefault();
    e.stopPropagation();
    
    const cmd = input.value.trim();
    debugLog(`Input detected: "${cmd}" (key: ${e.key}, code: ${e.keyCode})`);
    
    if (cmd) {
      processCommand(cmd.toUpperCase());
      input.value = '';
    }
    
    // Возвращаем фокус
    setTimeout(() => input.focus(), 10);
  }
}

// Удаляем старые слушатели (если есть)
input.replaceWith(input.cloneNode(true));
const newInput = document.getElementById('cmd-input');

// Добавляем слушатели
newInput.addEventListener('keydown', handleInput);
newInput.addEventListener('keypress', handleInput);
newInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
});

// Фокус при клике на терминал
document.getElementById('terminal').addEventListener('click', () => {
  newInput.focus();
});

/** 
 * Обработка команд
 * @param {string} cmd 
 */
function processCommand(cmd) {
  screenLog(`> ${cmd}`);
  debugLog(`Processing command: "${cmd}"`);
  debugLog(`Player state: ${JSON.stringify(player)}`);
  
  try {
    // GODMODE команды
    if (cmd.startsWith('GODMODE ')) {
      const args = cmd.slice(8).trim();
      
      if (args === 'ALL') {
        godmodeAll();
        screenLog('🔓 GODMODE: ВСЕ СТАТЫ МАКСИМАЛЬНЫ', 'error');
        updateStatsUI();
        return;
      }
      
      if (args.startsWith('SET ')) {
        const [stat, val] = args.slice(4).trim().split('=');
        if (stat && val !== undefined) {
          const num = Number(val);
          if (!isNaN(num)) {
            if (godmodeSet(stat.toLowerCase(), num)) {
              screenLog(`🔓 GODMODE: ${stat} = ${num}`);
              updateStatsUI();
            } else {
              screenLog('⚠️ Неверное имя стата', 'error');
            }
          } else {
            screenLog('⚠️ Значение должно быть числом', 'error');
          }
        } else {
          screenLog('⚠️ Формат: GODMODE SET <stat>=<value>', 'error');
        }
        return;
      }
      
      screenLog('⚠️ GODMODE команды: ALL, SET <stat>=<value>', 'error');
      return;
    }
    
    // DEBUG команда
    if (cmd === 'DEBUG') {
      const enabled = toggleDebug();
      screenLog(`🔍 DEBUG режим: ${enabled ? 'ВКЛ' : 'ВЫК'}`);
      return;
    }
    
    // Основные команды
    switch (cmd) {
      case 'RUN':
        debugLog('RUN command - showing menu');
        showScreen('run_menu');
        break;
        
      case 'BASE':
        debugLog('BASE command - showing base');
        showScreen('base');
        break;
        
      case 'LORE':
        debugLog('LORE command - showing lore');
        showScreen('lore');
        break;
        
      case 'SAVE':
        debugLog('SAVE command');
        if (saveGame()) {
          screenLog('💾 Игра сохранена');
        } else {
          screenLog('❌ Ошибка сохранения', 'error');
        }
        break;
        
      case 'EXPORT':
        debugLog('EXPORT command');
        if (exportSave()) {
          screenLog('📤 Сохранение экспортировано');
        }
        break;
        
      case 'IMPORT':
        debugLog('IMPORT command');
        const json = prompt('Вставьте JSON сохранения:');
        if (json && importSave(json)) {
          screenLog('📥 Сохранение импортировано');
          updateStatsUI();
        } else if (json) {
          screenLog('❌ Ошибка импорта', 'error');
        }
        break;
        
      case 'CLEAR':
        debugLog('CLEAR command');
        output.innerHTML = '';
        break;
        
      case 'HELP':
        screenLog('Команды: RUN, BASE, LORE, SAVE, EXPORT, IMPORT, DEBUG, GODMODE, CLEAR');
        break;
        
      default:
        screenLog(`⚠️ Неизвестная команда: ${cmd}`);
        screenLog('Введите HELP для списка команд');
        debugLog(`Unknown command: ${cmd}`);
    }
    
  } catch (err) {
    screenLog(`💥 Ошибка: ${err.message}`, 'error');
    debugLog(`COMMAND ERROR: ${err.stack}`);
    console.error(err);
  }
}

/** 
 * Показ экрана
 * @param {'run_menu'|'base'|'lore'|'main'} type 
 */
function showScreen(type) {
  debugLog(`showScreen: ${type}`);
  clearChoices();
  output.innerHTML = '';
  
  switch(type) {
    case 'run_menu':
      screenLog('=== ВЫЛАЗКА ===');
      screenLog('Выберите режим:');
      screenLog('');
      
      createChoice('🟢 SAFE (риск x0.8, награда x0.8)', () => {
        debugLog('Starting SAFE run');
        startRun('safe');
      });
      
      createChoice('🟡 NORMAL (риск x1.0, награда x1.0)', () => {
        debugLog('Starting NORMAL run');
        startRun('normal');
      });
      
      createChoice('🔴 DEEP (риск x1.5, награда x1.5)', () => {
        debugLog('Starting DEEP run');
        startRun('deep');
      });
      
      createChoice('⬅️ НАЗАД', () => showScreen('main'));
      break;
      
    case 'base':
      screenLog('=== БАЗА ===');
      screenLog(`Кредиты: ${player.credits} 💳`);
      screenLog('');
      
      createChoice(`⚡ +10 Заряд (100 💳)`, () => {
        debugLog('Buying charge upgrade');
        buyUpgrade('charge');
        updateStatsUI();
        showScreen('base');
      });
      
      createChoice(`💳 +50 Кредитов (бесплатно)`, () => {
        debugLog('Buying credits upgrade');
        buyUpgrade('credits');
        updateStatsUI();
        showScreen('base');
      });
      
      createChoice(`🧠 Мудрость +5% пассивно (150 💳)`, () => {
        debugLog('Buying wisdom upgrade');
        buyUpgrade('wisdom');
        updateStatsUI();
        showScreen('base');
      });
      
      createChoice('⬅️ НАЗАД', () => showScreen('main'));
      break;
      
    case 'lore':
      screenLog('=== АРХИВ ЛОРА ===');
      screenLog('');
      const lore = getLoreArchive();
      screenLog(lore || 'Архив пуст. Исследуйте глубже.');
      screenLog('');
      
      createChoice('⬅️ НАЗАД', () => showScreen('main'));
      break;
      
    case 'main':
    default:
      screenLog('NEURO-TERMINAL v1.0-PROTOTYPE');
      screenLog('Готов к подключению.');
      screenLog('');
      screenLog('Введите команду:');
      screenLog('  > RUN    - вылазка');
      screenLog('  > BASE   - база');
      screenLog('  > LORE   - архив');
      screenLog('  > DEBUG  - отладка');
      break;
  }
}

/** 
 * Вывод текста на экран
 * @param {string} text 
 * @param {'info'|'error'|'success'} type 
 */
export function screenLog(text, type = 'info') {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.marginBottom = '4px';
  
  if (type === 'error') {
    div.classList.add('error');
  } else if (type === 'success') {
    div.style.color = '#00ff41';
  }
  
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
  
  debugLog(`UI: ${text.slice(0, 100)}`);
}

/** Создание кнопки выбора */
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
    debugLog('ERROR: choices container not found');
    return;
  }
  
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = label;
  btn.tabIndex = 0;
  
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    debugLog(`Choice clicked: ${label}`);
    onClick();
  });
  
  // Keyboard accessibility
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  });
  
  choices.appendChild(btn);
  debugLog(`Choice created: ${label}`);
}

/** Обновление статус бара */
function updateStatsUI() {
  try {
    const chargeEl = document.getElementById('stat-charge');
    const wisdomEl = document.getElementById('stat-wisdom');
    const creditsEl = document.getElementById('stat-credits');
    const levelEl = document.getElementById('stat-level');
    
    if (chargeEl) chargeEl.textContent = `⚡ ${player.charge}`;
    if (wisdomEl) wisdomEl.textContent = `🧠 ${player.wisdom}`;
    if (creditsEl) creditsEl.textContent = `💳 ${player.credits}`;
    if (levelEl) levelEl.textContent = `📊 LVL ${player.level}`;
    
    debugLog(`UI Stats updated: ${JSON.stringify(player)}`);
  } catch (err) {
    debugLog(`updateStatsUI error: ${err.message}`);
  }
}

// Экспорт для других модулей
window.screenLog = screenLog;
window.updateStatsUI = updateStatsUI;
window.createChoice = createChoice;
window.clearChoices = clearChoices;
window.debugLog = debugLog;

// Запуск при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Фокус при загрузке
window.addEventListener('load', () => {
  newInput.focus();
});

