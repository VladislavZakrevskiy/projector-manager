import { EFFECT_ID } from '~/entities/effect';
import { STAGE_HEIGHT, STAGE_WIDTH } from '~/shared/config';
import type { AudioReading } from '~/shared/contracts';
import { hexToRgb } from '~/shared/lib/color';
import type { RgbColor } from '~/shared/lib/color';
import { getPolygonArea } from '~/shared/lib/geometry';
import type { Point } from '~/shared/lib/geometry';

export type DirectorShape = {
  id: string;
  points: Point[];
};

export type DirectorLook = {
  effectId: string;
  color1: RgbColor;
  color2: RgbColor;
  speed: number;
  phase: number;
  gain: number;
};

export type DirectorInput = {
  shapes: DirectorShape[];
  audio: AudioReading;
  dt: number;
  now: number;
};

export type Director = {
  update: (input: DirectorInput) => DirectorLook[];
};

type ShapeState = Omit<DirectorLook, 'gain'> & { fade: number; flash: number };

const PALETTES = [
  ['#00e5ff', '#ff2bd6'],
  ['#ff6a00', '#ffe000'],
  ['#7c4dff', '#00ffa3'],
  ['#ff1744', '#ffffff'],
  ['#00ff87', '#0066ff'],
  ['#ffd400', '#ff005c'],
] as const;

const FILL_EFFECTS = [EFFECT_ID.RIPPLES, EFFECT_ID.PLASMA, EFFECT_ID.BEAT_FILL, EFFECT_ID.SCANNER, EFFECT_ID.SPARKLES];
const LINE_EFFECTS = [EFFECT_ID.EDGE_TRACE, EFFECT_ID.NEON, EFFECT_ID.RAINBOW];
const DROP_EFFECTS = [EFFECT_ID.EDGE_TRACE, EFFECT_ID.RAINBOW, EFFECT_ID.NEON];

const BEATS_PER_LOOK = 8;
// С такой площади (3% кадра) фигура считается большой и получает заливку, а не контур
const BIG_SHAPE_AREA = STAGE_WIDTH * STAGE_HEIGHT * 0.03;
const FADE_IN_START = 0.25;
const FADE_IN_PER_SECOND = 1.7;
const FLASH_DECAY_PER_SECOND = 3;
const DROP_DECAY_PER_SECOND = 0.5;
const DROP_COOLDOWN_MS = 10_000;
const DROP_LOUDNESS_RATIO = 1.6;
const DROP_MIN_BASELINE = 0.15;
const FAST_LOUDNESS_RATE = 6;
const SLOW_LOUDNESS_RATE = 0.4;
const MAX_GAIN = 1.8;

// Выбирает эффекты и палитры по геометрии фигур и ведёт показ по музыке:
// «эстафета» вспышек по фигурам слева направо на каждый бит, новый «лук» раз в 8 битов и на дропе.
export function createDirector(deps: { random: () => number }): Director {
  const states = new Map<string, ShapeState>();
  let palette: readonly [string, string] = PALETTES[0];
  let handledBeats = 0;
  let fastLoudness = 0.3;
  let slowLoudness = 0.3;
  let lastDropAt = -Infinity;
  let drop = 0;

  function pick<T>(items: readonly T[]): T {
    const index = Math.min(items.length - 1, Math.floor(deps.random() * items.length));

    return items[index] as T;
  }

  function assign(shape: DirectorShape, isDrop: boolean) {
    const previous = states.get(shape.id);
    const pool = isDrop ? DROP_EFFECTS : getPolygonArea(shape.points) > BIG_SHAPE_AREA ? FILL_EFFECTS : LINE_EFFECTS;
    let effectId = pick(pool);

    if (effectId === previous?.effectId) {
      effectId = pick(pool);
    }

    const [first, second] = deps.random() < 0.5 ? palette : [palette[1], palette[0]];

    states.set(shape.id, {
      effectId,
      color1: hexToRgb(first),
      color2: hexToRgb(second),
      speed: 0.8 + deps.random() * 0.9,
      phase: deps.random(),
      fade: FADE_IN_START,
      flash: previous?.flash ?? 0,
    });
  }

  function reroll(shapes: DirectorShape[], isDrop: boolean) {
    palette = pick(PALETTES.filter((candidate) => candidate !== palette));
    shapes.forEach((shape) => assign(shape, isDrop));
  }

  return {
    update: ({ shapes, audio, dt, now }) => {
      const ids = new Set(shapes.map((shape) => shape.id));

      for (const id of states.keys()) {
        if (!ids.has(id)) {
          states.delete(id);
        }
      }

      shapes.forEach((shape) => {
        if (!states.has(shape.id)) {
          assign(shape, false);
        }
      });

      const leftToRight = [...shapes].sort((a, b) => getCenterX(a.points) - getCenterX(b.points));

      while (handledBeats < audio.beatCount) {
        handledBeats++;

        const flashed = leftToRight[handledBeats % leftToRight.length];
        const flashedState = flashed ? states.get(flashed.id) : undefined;

        if (flashedState) {
          flashedState.flash = 1;
        }

        if (handledBeats % BEATS_PER_LOOK === 0) {
          reroll(shapes, false);
        }
      }

      fastLoudness += (audio.loudness - fastLoudness) * Math.min(1, dt * FAST_LOUDNESS_RATE);
      slowLoudness += (audio.loudness - slowLoudness) * Math.min(1, dt * SLOW_LOUDNESS_RATE);

      const isDropStarted = fastLoudness > slowLoudness * DROP_LOUDNESS_RATIO && slowLoudness > DROP_MIN_BASELINE && now - lastDropAt > DROP_COOLDOWN_MS;

      if (isDropStarted) {
        lastDropAt = now;
        drop = 1;
        reroll(shapes, true);
      }

      drop = Math.max(0, drop - dt * DROP_DECAY_PER_SECOND);

      return shapes.map((shape) => {
        const state = states.get(shape.id);

        if (!state) {
          return { effectId: EFFECT_ID.NEON, color1: [1, 1, 1], color2: [1, 1, 1], speed: 1, phase: 0, gain: 0 };
        }

        state.flash = Math.max(0, state.flash - dt * FLASH_DECAY_PER_SECOND);
        state.fade = Math.min(1, state.fade + dt * FADE_IN_PER_SECOND);

        const gain = Math.min(MAX_GAIN, (0.6 + 0.5 * audio.levels.beat + 0.9 * state.flash + 0.6 * drop) * state.fade);

        return { effectId: state.effectId, color1: state.color1, color2: state.color2, speed: state.speed, phase: state.phase, gain };
      });
    },
  };
}

function getCenterX(points: Point[]): number {
  return points.reduce((sum, point) => sum + point.x, 0) / Math.max(points.length, 1);
}
