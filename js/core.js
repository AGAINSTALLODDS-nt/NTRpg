import { player, saveGame, loadGame, exportSave, importSave, simpleHash } from './utils.js';
import { loadCSV } from './loader.js';
import { buyUpgrade } from './progression.js';
import { getLoreArchive } from './lore.js';

const output = document.getElementById('screen-output');
const input = document.getElementById('cmd-input');
const choices = document.getElementById('choices-container');

/** Инициализация */
async function init() {
  loadGame();
  await loadCSV();
  updateStatsUI();
  screenLog('NEURO-TERMINAL v1.0-PROTOTYPE\nПодключение к древней сети...\nВведите > RUN, > BASE, > LORE, > SAVE\n');
  input.focus();
}

/** Ввод команд */
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cmd = input.value.trim().toUpperCase();
    input.value = '';
    processCommand(cmd);
  }
});

/** Роутинг терминала */
function processCommand(cmd) {
  screenLog(`> ${cmd}`);
  switch (cmd) {
    case 'RUN':
      showScreen('run_menu');
      break;
    case 'BASE':
      showScreen('base');
      break;
    case 'LORE':
      showScreen('lore');
      break;
    case 'SAVE':
      saveGame();
      break;
    case 'EXPORT':
      exportSave();
      break;
    case 'IMPORT':
      const json = prompt('Вставьте JSON сохранения:');
      if (json) importSave(json);
      break;
    case 'CLEAR':
      output.innerHTML = '';
      break;
    default:
      log('⚠️ Команда не распознана.');
  }
}

/** Переключение экранов */
function showScreen(type) {
  clearChoices();
  output.innerHTML = '';
  switch(type) {
    case 'run_menu':
      screenLog('Выберите режим вылазки:');
      createChoice('SAFE (x0.8 риск)', () => window.gameAPI.startRun('safe'));
      createChoice('NORMAL (x1.0 риск)', () => window.gameAPI.startRun('normal'));
      createChoice('DEEP (x1.5 риск)', () => window.gameAPI.startRun('deep'));
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

/** Эффект печати */
function screenLog(text, type = 'info') {
  const div = document.createElement('div');
  div.textContent = text;
  if (type === 'error') div.classList.add('error');
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
}

/** Создание кнопки выбора */
function createChoice(label, onClick) {
  const btn = document.createElement('button');
  btn.className = 'choice-btn';
  btn.textContent = label;
  btn.onclick = onClick;
  choices.appendChild(btn);
}

/** Обновление статуса */
function updateStatsUI() {
  document.getElementById('stat-charge').textContent = `⚡ ${player.charge}`;
  document.getElementById('stat-wisdom').textContent = `🧠 ${player.wisdom}`;
  document.getElementById('stat-credits').textContent = `💳 ${player.credits}`;
  document.getElementById('stat-level').textContent = `📊 LVL ${player.level}`;
}

// Глобальные хелперы для модулей
window.screenLog = screenLog;
window.updateStatsUI = updateStatsUI;
window.log = screenLog;
window.createChoice = createChoice;

// Запуск
document.addEventListener('DOMContentLoaded', init);

