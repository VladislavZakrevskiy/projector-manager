import { EFFECT_ID } from '~/entities/effect';
import type { Shape } from '~/entities/shape';
import type { DirectorLook, DirectorShape } from '~/features/auto-director';
import type { AudioReading, StageFrame, StageShapeFrame } from '~/shared/contracts';
import { hexToRgb } from '~/shared/lib/color';
import type { RgbColor } from '~/shared/lib/color';

export type BuildFrameInput = {
  time: number;
  audio: AudioReading;
  shapes: Shape[];
  selectedId: string | null;
  isShowing: boolean;
  isAuto: boolean;
  isBlackout: boolean;
  getAutoLooks: (shapes: DirectorShape[]) => DirectorLook[];
};

const MIN_POLYGON_POINTS = 3;
const GRID_COLOR: RgbColor = [1, 1, 1];
const GRID_DIMMED_GAIN = 0.45;

export function buildFrame(input: BuildFrameInput): StageFrame {
  const { time, audio, isBlackout } = input;
  const shapes = isBlackout ? [] : input.shapes.filter((shape) => shape.points.length >= MIN_POLYGON_POINTS);

  return { time, audio: audio.levels, shapes: getShapeFrames({ ...input, shapes }) };
}

function getShapeFrames({ shapes, selectedId, isShowing, isAuto, getAutoLooks }: BuildFrameInput): StageShapeFrame[] {
  // В редакторе проектор показывает контуры для подгонки по стене; выбранная фигура ярче остальных
  if (!isShowing) {
    return shapes.map((shape) => ({
      points: shape.points,
      effectId: EFFECT_ID.GRID,
      color1: GRID_COLOR,
      color2: GRID_COLOR,
      speed: 1,
      phase: 0,
      gain: shape.id === selectedId ? 1 : GRID_DIMMED_GAIN,
    }));
  }

  if (isAuto) {
    const looks = getAutoLooks(shapes.map(({ id, points }) => ({ id, points })));

    return shapes.flatMap((shape, index) => {
      const look = looks[index];

      return look ? [{ points: shape.points, ...look }] : [];
    });
  }

  return shapes.map((shape) => ({
    points: shape.points,
    effectId: shape.effectId,
    color1: hexToRgb(shape.color1),
    color2: hexToRgb(shape.color2),
    speed: shape.speed,
    phase: shape.phase,
    gain: 1,
  }));
}
