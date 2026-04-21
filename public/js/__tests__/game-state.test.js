import { beforeEach, describe, expect, it } from 'vitest';

import {
  loadGameState,
  normalizeGameState,
  saveGameState
} from '../storage/game-state.js';
import { GAME_STATE_STORAGE_KEY } from '../config/constants.js';

describe('game state persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes legacy elapsed into elapsedTime when saving', () => {
    saveGameState({
      puzzle: [[0]],
      solution: [[1]],
      givenMask: [[false]],
      currentBoard: [[0]],
      elapsed: 4321,
      difficulty: 'easy',
      isPaused: false
    });

    const raw = JSON.parse(localStorage.getItem(GAME_STATE_STORAGE_KEY));
    expect(raw.elapsedTime).toBe(4321);
    expect('elapsed' in raw).toBe(false);
  });

  it('loads legacy saved data using elapsed as a fallback', () => {
    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify({
      puzzle: [[0]],
      solution: [[1]],
      givenMask: [[false]],
      currentBoard: [[0]],
      elapsed: 9876,
      difficulty: 'medium',
      isPaused: true,
      savedAt: Date.now()
    }));

    const state = loadGameState();

    expect(state.elapsedTime).toBe(9876);
    expect('elapsed' in state).toBe(false);
  });

  it('keeps explicit elapsedTime during normalization', () => {
    const state = normalizeGameState({
      elapsed: 1000,
      elapsedTime: 2500,
      difficulty: 'hard'
    });

    expect(state.elapsedTime).toBe(2500);
    expect('elapsed' in state).toBe(false);
  });
});
