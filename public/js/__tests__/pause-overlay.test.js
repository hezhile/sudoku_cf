import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('pause overlay events', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="board-wrapper"></div>';
    vi.resetModules();
  });

  afterEach(async () => {
    const { clearAll } = await import('../utils/event-bus.js');
    clearAll();
  });

  it('emits a resume request when the overlay button is clicked', async () => {
    const { on } = await import('../utils/event-bus.js');
    const { EVENTS } = await import('../config/events.js');
    const { initPauseOverlay } = await import('../ui/pause-overlay.js');

    let triggered = 0;
    on(EVENTS.GAME_RESUME_REQUEST, () => {
      triggered += 1;
    });

    initPauseOverlay();
    document.getElementById('resumeBtn').click();

    expect(triggered).toBe(1);
  });

  it('does not duplicate the overlay when initialized twice', async () => {
    const { initPauseOverlay } = await import('../ui/pause-overlay.js');

    initPauseOverlay();
    initPauseOverlay();

    expect(document.querySelectorAll('#pauseOverlay')).toHaveLength(1);
    expect(document.querySelector('.pause-overlay-content')).not.toBeNull();
  });
});
