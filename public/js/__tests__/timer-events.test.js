import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('timer pause button events', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="timerArea">
        <span id="timer"></span>
      </div>
    `;
    vi.resetModules();
  });

  afterEach(async () => {
    const { clearAll, setGlobalState } = await import('../utils/event-bus.js');
    clearAll();
    setGlobalState('isPaused', false);
  });

  it('emits a pause request when the game is active', async () => {
    const { on, setGlobalState } = await import('../utils/event-bus.js');
    const { EVENTS } = await import('../config/events.js');
    const { initTimer } = await import('../ui/timer.js');

    let triggered = 0;
    on(EVENTS.GAME_PAUSE_REQUEST, () => {
      triggered += 1;
    });

    setGlobalState('isPaused', false);
    initTimer('#timer');

    expect(document.getElementById('pauseBtn')).not.toBeNull();
    document.getElementById('pauseBtn').click();

    expect(triggered).toBe(1);
  });

  it('emits a resume request when the game is paused', async () => {
    const { on, setGlobalState } = await import('../utils/event-bus.js');
    const { EVENTS } = await import('../config/events.js');
    const { initTimer } = await import('../ui/timer.js');

    let triggered = 0;
    on(EVENTS.GAME_RESUME_REQUEST, () => {
      triggered += 1;
    });

    setGlobalState('isPaused', true);
    initTimer('#timer');

    document.getElementById('pauseBtn').click();

    expect(triggered).toBe(1);
  });

  it('reuses the same pause button when timer initialization runs twice', async () => {
    const { initTimer } = await import('../ui/timer.js');

    initTimer('#timer');
    initTimer('#timer');

    expect(document.querySelectorAll('#pauseBtn')).toHaveLength(1);
  });

  it('returns restored elapsed time before the timer resumes', async () => {
    const { initTimer, setElapsedTime, getElapsedTime } = await import('../ui/timer.js');

    initTimer('#timer');
    setElapsedTime(2468);

    expect(getElapsedTime()).toBe(2468);
  });
});
