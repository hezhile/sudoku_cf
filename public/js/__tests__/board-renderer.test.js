import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('board renderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="board"></div>';
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(async () => {
    vi.useRealTimers();
    const { clearAll, setGlobalState } = await import('../utils/event-bus.js');
    clearAll();
    setGlobalState('isPaused', false);
    setGlobalState('isResetting', false);
  });

  it('uses cached editable inputs for arrow-key navigation', async () => {
    const { initBoardRenderer, renderBoard } = await import('../ui/board-renderer.js');

    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    const given = Array.from({ length: 9 }, () => Array(9).fill(false));
    given[0][1] = true;

    initBoardRenderer('#board');
    renderBoard(board, given);

    const start = document.querySelector('input[data-r="0"][data-c="0"]');
    const expected = document.querySelector('input[data-r="0"][data-c="2"]');
    start.focus();
    start.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(document.activeElement).toBe(expected);
  });

  it('keeps 3x3 border styling out of inline styles', async () => {
    const { initBoardRenderer, renderBoard } = await import('../ui/board-renderer.js');

    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    const given = Array.from({ length: 9 }, () => Array(9).fill(false));

    initBoardRenderer('#board');
    renderBoard(board, given);

    const thirdRowThirdColCell = document.querySelectorAll('.cell')[20];
    expect(thirdRowThirdColCell.style.borderBottom).toBe('');
    expect(thirdRowThirdColCell.style.borderRight).toBe('');
  });

  it('debounces completion checks without using a window-scoped timeout', async () => {
    const { on } = await import('../utils/event-bus.js');
    const { EVENTS } = await import('../config/events.js');
    const { initBoardRenderer, renderBoard } = await import('../ui/board-renderer.js');

    let completed = 0;
    on(EVENTS.BOARD_COMPLETE, () => {
      completed += 1;
    });

    const board = [
      [1, 2, 3, 4, 5, 6, 7, 8, 0],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 4, 5, 6, 7, 8, 9, 1],
      [5, 6, 7, 8, 9, 1, 2, 3, 4],
      [8, 9, 1, 2, 3, 4, 5, 6, 7],
      [3, 4, 5, 6, 7, 8, 9, 1, 2],
      [6, 7, 8, 9, 1, 2, 3, 4, 5],
      [9, 1, 2, 3, 4, 5, 6, 7, 8]
    ];
    const given = board.map((row, rowIndex) =>
      row.map((value, colIndex) => !(rowIndex === 0 && colIndex === 8) && value !== 0)
    );

    initBoardRenderer('#board');
    renderBoard(board, given);

    const input = document.querySelector('input[data-r="0"][data-c="8"]');
    input.value = '9';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(100);

    expect(completed).toBe(1);
    expect(window._checkCompleteTimeout).toBeUndefined();
  });
});
