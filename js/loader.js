/** @type {Array} */
let eventsDB = [];

/** Загрузка и парсинг CSV */
export async function loadCSV() {
  const CACHE_KEY = 'events_cache';
  const cached = localStorage.getItem(CACHE_KEY);
  const now = Date.now();

  if (cached) {
    const { ts, data } = JSON.parse(cached);
    if (now - ts < 86400000) { // 24ч
      eventsDB = data;
      log('📦 Загружено из кэша.');
      return;
    }
  }

  // TODO: SERVER_VALIDATE | Замените URL на ваш published Google Sheets CSV
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1v.../pub?output=csv';
  
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error('Network');
    const text = await res.text();
    eventsDB = parseCSV(text);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now, data: eventsDB }));
    log('🌐 CSV обновлён.');
  } catch {
    log('⚠️ CSV недоступен. Загружен демо-набор.');
    eventsDB = getFallbackEvents();
  }
}

/** Простой парсер CSV → массив объектов */
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(row => {
    const vals = row.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i]?.trim() || '');
    // Нормализация дельт и минимального уровня
    obj.C1_dCharge = Number(obj.C1_dCharge) || 0;
    obj.C1_dWisdom = Number(obj.C1_dWisdom) || 0;
    obj.C1_dCredits = Number(obj.C1_dCredits) || 0;
    obj.C2_dCharge = Number(obj.C2_dCharge) || 0;
    obj.C2_dWisdom = Number(obj.C2_dWisdom) || 0;
    obj.C2_dCredits = Number(obj.C2_dCredits) || 0;
    obj.minLevel = Number(obj.minLevel) || 0;
    return obj;
  }).filter(r => r.ID);
}

/** Демо-данные для офлайн-запуска */
function getFallbackEvents() {
  return [
    { ID: 'evt_001', Text: 'Обнаружен базовый шлюз. Данные зашифрованы.', Choice1: 'Сканировать', C1_dCharge: -5, C1_dWisdom: 10, C1_dCredits: 0, Choice2: 'Пройти мимо', C2_dCharge: 0, C2_dWisdom: 0, C2_dCredits: 5, minLevel: 0, tags: '#entry', loreFragment: 'Шлюз установлен в 2078 г.' },
    { ID: 'evt_002', Text: 'Аномальная сигнатура. Требует анализа.', Choice1: 'Анализ', C1_dCharge: -15, C1_dWisdom: 20, C1_dCredits: 0, Choice2: 'Игнор', C2_dCharge: 5, C2_dWisdom: 5, C2_dCredits: 10, minLevel: 1, tags: '#core', loreFragment: 'Сигнатура совпадает с протоколом "Архив".' },
    { ID: 'evt_003', Text: 'Заблокированный узел. Высокая защита.', Choice1: 'Взлом', C1_dCharge: -25, C1_dWisdom: 35, C1_dCredits: 20, Choice2: 'Отступ', C2_dCharge: 2, C2_dWisdom: 2, C2_dCredits: 0, minLevel: 2, tags: '#firewall', loreFragment: 'Узел датирован 2084 г. Автор: неизвестен.' }
  ];
}

export { eventsDB };

