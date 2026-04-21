import { formatTime } from '../utils/helpers.js';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
const EMPTY_TIME = '--';

function getTranslator(i18n) {
  if (!i18n || typeof i18n.t !== 'function') {
    return (key, params = {}) => {
      let text = key;
      Object.entries(params).forEach(([name, value]) => {
        text = text.replace(new RegExp(`{{${name}}}`, 'g'), value);
      });
      return text;
    };
  }

  return i18n.t.bind(i18n);
}

export function renderRecordsList(recordsList, stats, i18n) {
  if (!recordsList) return;

  const t = getTranslator(i18n);
  const fragment = document.createDocumentFragment();

  DIFFICULTIES.forEach((difficulty) => {
    const stat = stats[difficulty] || {};
    const label = t(`difficulty.${difficulty}`);
    const lastTime = stat.lastTime ? formatTime(stat.lastTime) : EMPTY_TIME;
    const bestTime = stat.best ? formatTime(stat.best) : EMPTY_TIME;

    const row = document.createElement('div');
    row.className = 'record-row';

    const primary = document.createElement('div');
    primary.append(document.createTextNode(`${label} `));

    const recent = document.createElement('span');
    recent.className = 'small';
    recent.textContent = t('records.recent', { time: lastTime });
    primary.appendChild(recent);

    const best = document.createElement('div');
    best.textContent = t('records.best', { time: bestTime });

    row.appendChild(primary);
    row.appendChild(best);
    fragment.appendChild(row);
  });

  recordsList.replaceChildren(fragment);
}
