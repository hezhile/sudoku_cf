import { describe, it, expect, beforeEach } from 'vitest';
import { gameStateManager } from '../core/game-state-manager.js';

describe('GameStateManager', () => {
  beforeEach(() => {
    gameStateManager.reset();
  });

  it('resets to default state', () => {
    gameStateManager.setGame({
      solution: [[1]],
      puzzle: [[0]],
      givenMask: [[true]]
    });
    gameStateManager.setLastSaveTime(1234);

    gameStateManager.reset();
    const snapshot = gameStateManager.getSnapshot();

    expect(snapshot.solution).toBeNull();
    expect(snapshot.puzzle).toBeNull();
    expect(snapshot.givenMask).toBeNull();
    expect(snapshot.lastSaveTime).toBe(0);
  });

  it('updates game state partially', () => {
    gameStateManager.setGame({ solution: [[1, 2, 3]] });
    gameStateManager.setGame({ puzzle: [[0, 0, 0]] });

    const snapshot = gameStateManager.getSnapshot();
    expect(snapshot.solution).toEqual([[1, 2, 3]]);
    expect(snapshot.puzzle).toEqual([[0, 0, 0]]);
    expect(snapshot.givenMask).toBeNull();
  });

  it('records autosave timestamp', () => {
    const now = Date.now();
    gameStateManager.setLastSaveTime(now);

    expect(gameStateManager.getSnapshot().lastSaveTime).toBe(now);
  });
});
