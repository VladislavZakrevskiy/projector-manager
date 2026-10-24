import { describe, expect, test } from '@rstest/core';

import { EFFECT_ID } from '~/entities/effect';
import type { Shape } from '~/entities/shape';
import type { AudioReading } from '~/shared/contracts';

import { buildFrame } from './build-frame';
import type { BuildFrameInput } from './build-frame';

const AUDIO: AudioReading = { levels: { bass: 0.1, mid: 0.2, high: 0.3, beat: 0.4 }, loudness: 0.2, beatCount: 3 };

function createShape(overrides: Partial<Shape> = {}): Shape {
  return {
    id: 'a',
    name: 'Полка',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
    effectId: EFFECT_ID.PLASMA,
    color1: '#ff0000',
    color2: '#00ff00',
    speed: 2,
    phase: 0.5,
    ...overrides,
  };
}

function createInput(overrides: Partial<BuildFrameInput> = {}): BuildFrameInput {
  return {
    time: 12,
    audio: AUDIO,
    shapes: [createShape()],
    selectedId: null,
    isShowing: false,
    isAuto: false,
    isBlackout: false,
    getAutoLooks: () => [],
    ...overrides,
  };
}

describe('buildFrame', () => {
  test('passes time and audio levels through', () => {
    const frame = buildFrame(createInput());

    expect([frame.time, frame.audio]).toEqual([12, AUDIO.levels]);
  });

  test('draws no shapes during a blackout', () => {
    const frame = buildFrame(createInput({ isBlackout: true, isShowing: true }));

    expect(frame.shapes).toEqual([]);
  });

  test('skips shapes with fewer than three points', () => {
    const degenerate = createShape({ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] });

    const frame = buildFrame(createInput({ shapes: [degenerate] }));

    expect(frame.shapes).toEqual([]);
  });

  test('draws outlines in the editor mode', () => {
    const frame = buildFrame(createInput({ isShowing: false }));

    expect(frame.shapes[0]?.effectId).toBe(EFFECT_ID.GRID);
  });

  test('draws the selected shape at full brightness in the editor mode', () => {
    const frame = buildFrame(createInput({ selectedId: 'a' }));

    expect(frame.shapes[0]?.gain).toBe(1);
  });

  test('dims shapes that are not selected in the editor mode', () => {
    const frame = buildFrame(createInput({ selectedId: 'other' }));

    expect(frame.shapes[0]?.gain).toBeLessThan(1);
  });

  test('uses the shape own effect when showing manually', () => {
    const frame = buildFrame(createInput({ isShowing: true }));

    expect(frame.shapes[0]?.effectId).toBe(EFFECT_ID.PLASMA);
  });

  test('converts shape colors to rgb when showing manually', () => {
    const frame = buildFrame(createInput({ isShowing: true }));

    expect(frame.shapes[0]?.color1).toEqual([1, 0, 0]);
  });

  test('uses director looks in the auto mode', () => {
    const look = { effectId: EFFECT_ID.RAINBOW, color1: [0, 0, 1], color2: [1, 1, 0], speed: 1.2, phase: 0.3, gain: 0.9 } as const;

    const frame = buildFrame(createInput({ isShowing: true, isAuto: true, getAutoLooks: () => [look] }));

    expect(frame.shapes[0]).toMatchObject({ effectId: EFFECT_ID.RAINBOW, gain: 0.9 });
  });

  test('ignores director looks in the editor mode', () => {
    const look = { effectId: EFFECT_ID.RAINBOW, color1: [0, 0, 1], color2: [1, 1, 0], speed: 1.2, phase: 0.3, gain: 0.9 } as const;

    const frame = buildFrame(createInput({ isShowing: false, isAuto: true, getAutoLooks: () => [look] }));

    expect(frame.shapes[0]?.effectId).toBe(EFFECT_ID.GRID);
  });
});
