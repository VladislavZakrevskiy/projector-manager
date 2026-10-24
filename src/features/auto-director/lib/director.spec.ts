import { describe, expect, test } from '@rstest/core';

import { EFFECT_ID } from '~/entities/effect';
import type { AudioReading } from '~/shared/contracts';
import { hexToRgb } from '~/shared/lib/color';

import { createDirector } from './director';
import type { DirectorShape } from './director';

const FRAME_SECONDS = 1 / 60;

function createSquare(id: string, left: number, size: number): DirectorShape {
  return {
    id,
    points: [
      { x: left, y: 0 },
      { x: left + size, y: 0 },
      { x: left + size, y: size },
      { x: left, y: size },
    ],
  };
}

function createAudio(overrides: Partial<AudioReading> = {}): AudioReading {
  return { levels: { bass: 0, mid: 0, high: 0, beat: 0 }, loudness: 0.3, beatCount: 0, ...overrides };
}

// random() === 0 всегда выбирает первый элемент пула и не меняет порядок палитры
const FIRST_CHOICE = () => 0;

describe('createDirector', () => {
  test('returns one look per shape in the input order', () => {
    const director = createDirector({ random: FIRST_CHOICE });
    const shapes = [createSquare('a', 0, 400), createSquare('b', 500, 400)];

    const looks = director.update({ shapes, audio: createAudio(), dt: FRAME_SECONDS, now: 0 });

    expect(looks).toHaveLength(2);
  });

  test('gives a big shape a fill effect', () => {
    const director = createDirector({ random: FIRST_CHOICE });

    const [look] = director.update({ shapes: [createSquare('big', 0, 400)], audio: createAudio(), dt: FRAME_SECONDS, now: 0 });

    expect(look?.effectId).toBe(EFFECT_ID.RIPPLES);
  });

  test('gives a small shape a line effect', () => {
    const director = createDirector({ random: FIRST_CHOICE });

    const [look] = director.update({ shapes: [createSquare('small', 0, 50)], audio: createAudio(), dt: FRAME_SECONDS, now: 0 });

    expect(look?.effectId).toBe(EFFECT_ID.EDGE_TRACE);
  });

  test('flashes the next shape on a beat', () => {
    const director = createDirector({ random: FIRST_CHOICE });
    const shapes = [createSquare('left', 0, 100), createSquare('right', 500, 100)];

    const [left, right] = director.update({ shapes, audio: createAudio({ beatCount: 1 }), dt: FRAME_SECONDS, now: 0 });

    expect(right?.gain).toBeGreaterThan(left?.gain ?? Infinity);
  });

  test('picks the second palette after eight beats', () => {
    const director = createDirector({ random: FIRST_CHOICE });
    const shapes = [createSquare('a', 0, 100)];

    const [look] = director.update({ shapes, audio: createAudio({ beatCount: 8 }), dt: FRAME_SECONDS, now: 0 });

    expect(look?.color1).toEqual(hexToRgb('#ff6a00'));
  });

  test('keeps the first palette before eight beats', () => {
    const director = createDirector({ random: FIRST_CHOICE });
    const shapes = [createSquare('a', 0, 100)];

    const [look] = director.update({ shapes, audio: createAudio({ beatCount: 7 }), dt: FRAME_SECONDS, now: 0 });

    expect(look?.color1).toEqual(hexToRgb('#00e5ff'));
  });

  test('fades a new look in', () => {
    const director = createDirector({ random: FIRST_CHOICE });
    const shapes = [createSquare('a', 0, 100)];
    const [first] = director.update({ shapes, audio: createAudio(), dt: FRAME_SECONDS, now: 0 });

    const [later] = director.update({ shapes, audio: createAudio(), dt: 1, now: 1000 });

    expect(later?.gain).toBeGreaterThan(first?.gain ?? Infinity);
  });

  test('switches to drop effects on a sudden loudness jump', () => {
    const director = createDirector({ random: FIRST_CHOICE });
    const shapes = [createSquare('big', 0, 400)];
    director.update({ shapes, audio: createAudio({ loudness: 0.3 }), dt: FRAME_SECONDS, now: 0 });

    const [look] = director.update({ shapes, audio: createAudio({ loudness: 1 }), dt: 0.1, now: 100 });

    expect(look?.effectId).toBe(EFFECT_ID.EDGE_TRACE);
  });

  test('does not switch to drop effects on steady loudness', () => {
    const director = createDirector({ random: FIRST_CHOICE });
    const shapes = [createSquare('big', 0, 400)];
    director.update({ shapes, audio: createAudio({ loudness: 0.3 }), dt: FRAME_SECONDS, now: 0 });

    const [look] = director.update({ shapes, audio: createAudio({ loudness: 0.3 }), dt: 0.1, now: 100 });

    expect(look?.effectId).toBe(EFFECT_ID.RIPPLES);
  });
});
