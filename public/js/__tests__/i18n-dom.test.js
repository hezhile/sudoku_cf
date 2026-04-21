import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18n } from '../i18n/i18n.js';

describe('i18n DOM updates', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-i18n="gameTitle"></div>
      <input id="emailInput" data-i18n-placeholder="emailPlaceholder" data-i18n-title="labels.emailInput" data-i18n-aria-label="labels.emailInput">
      <select id="difficulty">
        <option value="easy" data-i18n="difficulty.easy">old</option>
      </select>
    `;

    localStorage.setItem('language', 'en-US');
    vi.restoreAllMocks();
  });

  it('updates text, placeholder, title, and aria-label in one pass', async () => {
    const querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll');
    const i18n = new I18n();
    await i18n._initializationPromise;
    i18n.currentLang = 'en-US';
    i18n.translations['en-US'] = {
      gameTitle: 'Sudoku',
      emailPlaceholder: 'Enter email',
      labels: {
        emailInput: 'Email address'
      },
      difficulty: {
        easy: 'Easy'
      }
    };

    i18n.updateDOM();

    expect(document.querySelector('[data-i18n]').textContent).toBe('Sudoku');
    expect(document.getElementById('emailInput').placeholder).toBe('Enter email');
    expect(document.getElementById('emailInput').title).toBe('Email address');
    expect(document.getElementById('emailInput').getAttribute('aria-label')).toBe('Email address');
    expect(document.querySelector('#difficulty option').textContent).toBe('Easy');
    expect(querySelectorAllSpy).toHaveBeenCalledWith('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label]');
  });
});
