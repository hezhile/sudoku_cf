import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { I18n } from '../i18n/i18n.js';

describe('i18n translation cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads translations from localStorage cache first', async () => {
    const lang = 'en-US';
    const cached = { gameTitle: 'Sudoku' };
    localStorage.setItem('sudoku_translations_en-US', JSON.stringify(cached));

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const i18n = new I18n();
    await i18n.loadTranslations(lang);

    expect(i18n.translations[lang]).toEqual(cached);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('writes fetched translations into localStorage cache', async () => {
    const lang = 'ja-JP';
    const payload = { gameTitle: '数独' };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload
    }));

    const i18n = new I18n();
    await i18n.loadTranslations(lang);

    expect(i18n.translations[lang]).toEqual(payload);
    expect(JSON.parse(localStorage.getItem('sudoku_translations_ja-JP'))).toEqual(payload);
  });

  it('initializes language from saved language without IP detection fetch', async () => {
    localStorage.setItem('language', 'zh-CN');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const i18n = new I18n();
    await i18n._initializationPromise;

    expect(i18n.currentLang).toBe('zh-CN');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
