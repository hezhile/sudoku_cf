import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SOLUTION = Array.from({ length: 9 }, (_, rowIndex) =>
  Array.from({ length: 9 }, (_, columnIndex) => ((rowIndex * 3 + Math.floor(rowIndex / 3) + columnIndex) % 9) + 1)
);

const PUZZLE = SOLUTION.map((row, rowIndex) =>
  row.map((value, columnIndex) => (rowIndex === 0 && columnIndex === 0 ? 0 : value))
);

function createI18nMock() {
  const translations = {
    errors: {
      authFailed: 'Authentication system failed to load',
      generationFailed: 'Failed to generate puzzle',
      gameNotStarted: 'Game not started'
    },
    buttons: {
      generating: 'Generating...'
    },
    difficulty: {
      medium: 'Medium'
    },
    puzzleGenerated: 'Puzzle generated',
    pause: {
      title: 'Game Paused',
      resume: 'Resume'
    },
    newGame: 'New Game',
    login: 'Login',
    status: {
      recordsCleared: 'Records cleared'
    },
    welcome: 'Welcome, {{email}}'
  };

  const resolve = (key) => key.split('.').reduce((value, part) => value?.[part], translations) ?? key;
  const i18nInstance = {
    currentLang: 'en-US',
    translations: { 'en-US': translations },
    _initializationPromise: Promise.resolve(),
    loadTranslations: vi.fn().mockResolvedValue(undefined),
    updateDOM: vi.fn(),
    getSavedLanguage: vi.fn(() => 'en-US'),
    setLanguage: vi.fn().mockResolvedValue(undefined),
    t: vi.fn((key, params = {}) => {
      let text = resolve(key);
      if (typeof text === 'string') {
        Object.entries(params).forEach(([param, value]) => {
          text = text.replaceAll(`{{${param}}}`, value);
        });
      }
      return text;
    })
  };

  if (typeof window !== 'undefined') {
    window.i18n = i18nInstance;
  }

  return i18nInstance;
}

vi.mock('../core/sudoku-engine.js', () => ({
  generateFullBoard: vi.fn(() => SOLUTION)
}));

vi.mock('../core/solver.js', () => ({
  digHolesWithValidation: vi.fn(() => PUZZLE)
}));

vi.mock('../core/validator.js', () => ({
  detectConflicts: vi.fn(() => ({ conflicts: [] })),
  validateSolution: vi.fn(() => ({ isCorrect: true, errors: [] }))
}));

vi.mock('../storage/local-storage.js', () => ({
  saveRecord: vi.fn().mockResolvedValue(undefined),
  loadRecords: vi.fn(() => ({
    easy: { history: [], best: null },
    medium: { history: [], best: null },
    hard: { history: [], best: null },
    expert: { history: [], best: null }
  })),
  getAllStats: vi.fn(() => ({})),
  clearRecords: vi.fn()
}));

vi.mock('../storage/supabase-sync.js', () => ({
  initSyncModule: vi.fn(),
  uploadRecordOnComplete: vi.fn().mockResolvedValue(false)
}));

vi.mock('../storage/game-state.js', () => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(() => null),
  clearGameState: vi.fn()
}));

vi.mock('../auth/auth-handler.js', () => ({
  initAuth: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../ui/records.js', () => ({
  renderRecordsList: vi.fn()
}));

vi.mock('../api/counter.js', () => ({
  initCounter: vi.fn(),
  incrementGameCount: vi.fn()
}));

vi.mock('../i18n/i18n.js', () => ({
  i18nInstance: createI18nMock()
}));

describe('pause flow regression', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    localStorage.clear();
    document.body.innerHTML = `
      <div class="main-container">
        <select id="language-selector"></select>
        <input id="emailInput" />
        <button id="loginBtn">Login</button>
        <span id="emailValidationMessage"></span>
        <span id="userInfo"></span>
        <button id="logoutBtn"></button>
        <select id="difficulty">
          <option value="medium" selected>Medium</option>
        </select>
        <button id="newBtn">New Game</button>
        <button id="resetBtn">Reset</button>
        <div id="timerArea">
          <span id="timer">00:00.00</span>
        </div>
        <div class="board-wrapper">
          <div id="board"></div>
        </div>
        <div id="recordsList"></div>
        <button id="clearRecords"></button>
        <button id="syncBtn"></button>
        <div id="game-counter"></div>
      </div>
    `;
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'complete'
    });
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register: vi.fn().mockResolvedValue(undefined) }
    });
  });

  afterEach(async () => {
    const { clearAll, setGlobalState } = await import('../utils/event-bus.js');
    clearAll();
    setGlobalState('isPaused', false);
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('pauses and resumes after starting a new game', async () => {
    await import('../main.js');
    await vi.runAllTimersAsync();

    document.getElementById('newBtn').click();
    await vi.advanceTimersByTimeAsync(150);

    const { getGlobalState } = await import('../utils/event-bus.js');
    const { saveGameState } = await import('../storage/game-state.js');

    expect(document.getElementById('pauseBtn')).not.toBeNull();

    await vi.advanceTimersByTimeAsync(300);
    const runningTimerText = document.getElementById('timer').textContent;

    document.getElementById('pauseBtn').click();

    expect(getGlobalState('isPaused')).toBe(true);
    expect(document.getElementById('pauseOverlay').style.display).toBe('flex');

    await vi.advanceTimersByTimeAsync(300);
    expect(document.getElementById('timer').textContent).toBe(runningTimerText);
    expect(saveGameState).toHaveBeenCalledWith(expect.objectContaining({ isPaused: true }));

    document.getElementById('resumeBtn').click();

    expect(getGlobalState('isPaused')).toBe(false);
    expect(document.getElementById('pauseOverlay').style.display).toBe('none');
    expect(saveGameState).toHaveBeenCalledWith(expect.objectContaining({ isPaused: false }));

    await vi.advanceTimersByTimeAsync(300);
    expect(document.getElementById('timer').textContent).not.toBe(runningTimerText);
  });

  it('shows a visible warning instead of silently failing when no puzzle is active', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await import('../main.js');
    await vi.runAllTimersAsync();

    document.getElementById('pauseBtn').click();

    const { getGlobalState } = await import('../utils/event-bus.js');
    expect(getGlobalState('isPaused')).toBe(false);
    expect(document.querySelector('.toast-warning .toast-message')?.textContent).toBe('Game not started');
    expect(warnSpy).toHaveBeenCalledWith(
      '[pause-flow] Cannot pause because runtime state is out of sync.',
      expect.objectContaining({
        action: 'pause',
        hasPuzzle: false
      })
    );
  });

  it('can pause again after restoring an active saved game', async () => {
    const { loadGameState } = await import('../storage/game-state.js');
    loadGameState.mockReturnValue({
      solution: SOLUTION,
      puzzle: PUZZLE,
      givenMask: PUZZLE.map(row => row.map(cell => cell !== 0)),
      currentBoard: PUZZLE,
      elapsedTime: 2400,
      difficulty: 'medium',
      isPaused: false,
      savedAt: Date.now()
    });

    await import('../main.js');
    await vi.advanceTimersByTimeAsync(300);

    const { getGlobalState } = await import('../utils/event-bus.js');

    document.getElementById('pauseBtn').click();

    expect(getGlobalState('isPaused')).toBe(true);
    expect(document.getElementById('pauseOverlay').style.display).toBe('flex');
  });
});
