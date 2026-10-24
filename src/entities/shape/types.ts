import type { Point } from '~/shared/lib/geometry';

export type Shape = {
  id: string;
  name: string;
  points: Point[];
  effectId: string;
  color1: string;
  color2: string;
  speed: number;
  phase: number;
};

export type NewShape = Omit<Shape, 'id'>;

export type ShapeChange = {
  id: string;
  changes: Partial<Omit<Shape, 'id'>>;
};
