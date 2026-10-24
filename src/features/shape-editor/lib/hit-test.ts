import { isPointInPolygon } from '~/shared/lib/geometry';
import type { Point } from '~/shared/lib/geometry';

export function findVertexAt(points: Point[], point: Point, radius: number): number | null {
  const index = points.findIndex((vertex) => Math.hypot(vertex.x - point.x, vertex.y - point.y) < radius);

  return index === -1 ? null : index;
}

// Верхняя фигура — последняя в списке
export function findShapeAt<T extends { points: Point[] }>(shapes: T[], point: Point): T | null {
  return [...shapes].reverse().find((shape) => isPointInPolygon(point, shape.points)) ?? null;
}
