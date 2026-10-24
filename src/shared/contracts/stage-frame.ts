import type { RgbColor } from '~/shared/lib/color';
import type { Point } from '~/shared/lib/geometry';

export type AudioLevels = {
  bass: number;
  mid: number;
  high: number;
  beat: number;
};

// Результат анализа звука за кадр: уровни для шейдеров + данные для авто-режиссёра
export type AudioReading = {
  levels: AudioLevels;
  loudness: number;
  beatCount: number;
};

export type StageShapeFrame = {
  points: Point[];
  effectId: string;
  color1: RgbColor;
  color2: RgbColor;
  speed: number;
  phase: number;
  gain: number;
};

// Всё, что нужно нарисовать за один кадр; именно это уходит в окно проектора
export type StageFrame = {
  time: number;
  audio: AudioLevels;
  shapes: StageShapeFrame[];
};
