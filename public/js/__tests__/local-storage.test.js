import { beforeEach, describe, expect, it } from 'vitest';

import { EVENTS } from '../config/events.js';
import { STORAGE_KEY } from '../config/constants.js';
import { clearRecords, saveRecords } from '../storage/local-storage.js';
import { clearAll, on } from '../utils/event-bus.js';

describe('local record clearing', () => {
  beforeEach(() => {
    clearAll();
    localStorage.clear();
  });

  it('removes persisted records and emits RECORDS_CLEARED', () => {
    let triggered = 0;
    on(EVENTS.RECORDS_CLEARED, () => {
      triggered += 1;
    });

    saveRecords({
      easy: {
        best: 1234,
        history: [{ time: 1234, at: 1, synced: false }]
      }
    });

    clearRecords();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(triggered).toBe(1);
  });
});
