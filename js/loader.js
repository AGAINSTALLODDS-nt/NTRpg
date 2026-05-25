import { debugLog } from './utils.js';

/** @type {Array} */
let eventsDB = [];

/** Загрузка и парсинг CSV */
export async function loadCSV() {
  const CACHE_KEY = 'events_cache_v1';
  const cached = localStorage.getItem(CACHE_KEY);
  const now = Date.now();

  debugLog('loadCSV: Starting...');

  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached);
      if (now - ts < 86400000) { // 24ч
        eventsDB = data;
        debugLog(`loadCSV: Loaded from cache (${data.length} events)`);
        return;
      }
    } catch (err) {
      debugLog(`loadCSV: Cache parse error: ${err.message}`);
    }
  }

  // Демо-данные (замените на реальный CSV URL когда будет)
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vYOUR_SHEET_ID/pub?output=csv';
  
  try {
    debugLog(`loadCSV: Fetching from ${CSV_URL}`);
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const text = await res.text();
    eventsDB = parseCSV(text);
    
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now, data: eventsDB }));
    debugLog(`loadCSV: Fetched ${eventsDB.length} events from CSV`);
  } catch (err) {
    debugLog(`loadCSV: Fetch failed, using fallback: ${err.message}`);
    eventsDB = getFallbackEvents();
  }
}

/** Простой парсер CSV → массив объектов */
function parseCSV(text) {
  try {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const events = [];
    
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',');
      const obj = {};
      
      headers.forEach((h, idx) => {
        obj[h] = vals[idx]?.trim() || '';
      });
      
      // Нормализация числовых полей
      if (obj.ID) {
        obj.C1_dCharge = Number(obj.C1_dCharge) || 0;
        obj.C1_dWisdom = Number(obj.C1_dWisdom) || 0;
        obj.C1_dCredits = Number(obj.C1_dCredits) || 0;
        obj.C2_dCharge = Number(obj.C2_dCharge) || 0;
        obj.C2_dWisdom = Number(obj.C2_dWisdom) || 0;
        obj.C2_dCredits = Number(obj.C2_dCredits) || 0;
        obj.minLevel = Number(obj.minLevel) || 0;
        events.push(obj);
      }
    }
    
    return events;
  } catch (err) {
    debugLog(`parseCSV: Error - ${err.message}`);
    return [];
  }
}

/** Демо-данные для офлайн-запуска */
function getFallbackEvents() {
  debugLog('getFallbackEvents: Using demo data');
  return [
    {
      ID: 'evt_001',
      Text: 'Обнаружен базовый шлюз. Данные зашифрованы.',
      Choice1: 'Сканировать',
      C1_dCharge: -5,
      C1_dWisdom: 10,
      C1_dCredits: 0,
      Choice2: 'Пройти мимо',
      C2_dCharge: 5,
      C2_dWisdom: 0,
      C2_dCredits: 5,
      minLevel: 0,
      tags: '#entry',
      loreFragment: 'Шлюз установлен в 2078 г.'
    },
    {
      ID: 'evt_002',
      Text: 'Аномальная сигнатура. Требует анализа.',
      Choice1: 'Анализ',
      C1_dCharge: -15,
      C1_dWisdom: 20,
      C1_dCredits: 0,
      Choice2: 'Игнор',
      C2_dCharge: 5,
      C2_dWisdom: 5,
      C2_dCredits: 10,
      minLevel: 1,
      tags: '#core',
      loreFragment: 'Сигнатура совпадает с протоколом "Архив".'
    },
    {
      ID: 'evt_003',
      Text: 'Заблокированный узел. Высокая защита.',
      Choice1: 'Взлом',
      C1_dCharge: -25,
      C1_dWisdom: 35,
      C1_dCredits: 20,
      Choice2: 'Отступ',
      C2_dCharge: 2,
      C2_dWisdom: 2,
      C2_dCredits: 0,
      minLevel: 2,
      tags: '#firewall',
      loreFragment: 'Узел датирован 2084 г. Автор: неизвестен.'
    }
  ];
}

export { eventsDB };

