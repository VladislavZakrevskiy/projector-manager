import { describe, expect, test } from '@rstest/core';

import { createLevelTracker } from './level-tracker';
import type { LevelTracker } from './level-tracker';

const FRAME_SECONDS = 1 / 60;
const FRAME_MS = 1000 / 60;

// Тихая «подложка», на которой трекер стабилизирует усиление
function warmUp(tracker: LevelTracker, frames: number) {
  for (let frame = 0; frame < frames; frame++) {
    tracker.update([0.05, 0.05, 0.05], frame * FRAME_MS, FRAME_SECONDS);
  }
}

describe('createLevelTracker', () => {
  test('detects a beat on a sudden bass spike', () => {
    const tracker = createLevelTracker();
    warmUp(tracker, 60);

    const reading = tracker.update([0.9, 0.05, 0.05], 2000, FRAME_SECONDS);

    expect(reading.beatCount).toBe(1);
  });

  test('sets beat strength to 1 on the beat frame', () => {
    const tracker = createLevelTracker();
    warmUp(tracker, 60);

    const reading = tracker.update([0.9, 0.05, 0.05], 2000, FRAME_SECONDS);

    expect(reading.levels.beat).toBe(1);
  });

  test('does not count a second spike inside the cooldown as a beat', () => {
    const tracker = createLevelTracker();
    warmUp(tracker, 60);
    tracker.update([0.9, 0.05, 0.05], 2000, FRAME_SECONDS);
    tracker.update([0.05, 0.05, 0.05], 2050, FRAME_SECONDS);

    const reading = tracker.update([0.9, 0.05, 0.05], 2100, FRAME_SECONDS);

    expect(reading.beatCount).toBe(1);
  });

  test('counts a second spike after the cooldown', () => {
    const tracker = createLevelTracker();
    warmUp(tracker, 60);
    tracker.update([0.9, 0.05, 0.05], 2000, FRAME_SECONDS);
    tracker.update([0.05, 0.05, 0.05], 2250, FRAME_SECONDS);

    const reading = tracker.update([0.9, 0.05, 0.05], 2500, FRAME_SECONDS);

    expect(reading.beatCount).toBe(2);
  });

  test('does not detect a beat in steady quiet input', () => {
    const tracker = createLevelTracker();

    warmUp(tracker, 120);

    expect(tracker.update([0.05, 0.05, 0.05], 3000, FRAME_SECONDS).beatCount).toBe(0);
  });

  test('fades beat strength after the beat', () => {
    const tracker = createLevelTracker();
    warmUp(tracker, 60);
    tracker.update([0.9, 0.05, 0.05], 2000, FRAME_SECONDS);

    const reading = tracker.update([0.05, 0.05, 0.05], 2500, 0.5);

    expect(reading.levels.beat).toBeLessThan(0.1);
  });

  test('keeps levels within 0..1', () => {
    const tracker = createLevelTracker();

    const reading = tracker.update([5, 5, 5], 1000, FRAME_SECONDS);

    expect(Math.max(reading.levels.bass, reading.levels.mid, reading.levels.high)).toBe(1);
  });
});
