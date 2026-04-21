import { beforeEach, describe, expect, it } from 'vitest';

import { renderRecordsList } from '../ui/records.js';

function createI18n(overrides = {}) {
  const messages = {
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'difficulty.expert': 'Expert',
    'records.recent': 'Recent: {{time}}',
    'records.best': 'Best: {{time}}',
    ...overrides
  };

  return {
    t(key, params = {}) {
      let translation = messages[key] ?? key;
      Object.entries(params).forEach(([name, value]) => {
        translation = translation.replace(new RegExp(`{{${name}}}`, 'g'), value);
      });
      return translation;
    }
  };
}

describe('renderRecordsList', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="recordsList"></div>';
  });

  it('renders all difficulty rows with translated labels', () => {
    const recordsList = document.getElementById('recordsList');
    const stats = {
      easy: { best: 61500, lastTime: 70000 },
      medium: { best: null, lastTime: null },
      hard: { best: null, lastTime: null },
      expert: { best: null, lastTime: null }
    };

    renderRecordsList(recordsList, stats, createI18n());

    const rows = recordsList.querySelectorAll('.record-row');
    expect(rows).toHaveLength(4);
    expect(rows[0].textContent).toContain('Easy');
    expect(rows[0].textContent).toContain('Recent: 01:10.00');
    expect(rows[0].textContent).toContain('Best: 01:01.50');
  });

  it('re-renders content when translations change', () => {
    const recordsList = document.getElementById('recordsList');
    const stats = {
      easy: { best: null, lastTime: null },
      medium: { best: null, lastTime: null },
      hard: { best: null, lastTime: null },
      expert: { best: null, lastTime: null }
    };

    renderRecordsList(recordsList, stats, createI18n());
    renderRecordsList(recordsList, stats, createI18n({
      'difficulty.easy': 'Facile',
      'records.recent': 'Récent : {{time}}'
    }));

    expect(recordsList.firstElementChild.textContent).toContain('Facile');
    expect(recordsList.firstElementChild.textContent).toContain('Récent : --');
  });

  it('inserts translation text safely without treating it as HTML', () => {
    const recordsList = document.getElementById('recordsList');
    const stats = {
      easy: { best: null, lastTime: null },
      medium: { best: null, lastTime: null },
      hard: { best: null, lastTime: null },
      expert: { best: null, lastTime: null }
    };

    renderRecordsList(recordsList, stats, createI18n({
      'difficulty.easy': '<strong>Injected</strong>'
    }));

    expect(recordsList.innerHTML).toContain('&lt;strong&gt;Injected&lt;/strong&gt;');
    expect(recordsList.querySelector('strong')).toBeNull();
  });
});
