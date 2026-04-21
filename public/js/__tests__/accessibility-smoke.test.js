import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexHtmlPath = path.resolve(__dirname, '../../index.html');

describe('index accessibility smoke checks', () => {
  it('includes accessible labels and email validation attributes', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf8');
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const languageSelector = doc.getElementById('language-selector');
    const difficultySelector = doc.getElementById('difficulty');
    const emailInput = doc.getElementById('emailInput');
    const emailValidationMessage = doc.getElementById('emailValidationMessage');

    expect(languageSelector.getAttribute('data-i18n-aria-label')).toBe('labels.languageSelector');
    expect(difficultySelector.getAttribute('data-i18n-aria-label')).toBe('labels.difficultySelector');
    expect(emailInput.hasAttribute('required')).toBe(true);
    expect(emailInput.getAttribute('aria-describedby')).toBe('emailValidationMessage');
    expect(emailInput.getAttribute('data-i18n-aria-label')).toBe('labels.emailInput');
    expect(emailValidationMessage.getAttribute('aria-live')).toBe('polite');
  });
});
