import type { Point } from './types';

export function getPolygonArea(points: Point[]): number {
  let doubledArea = 0;

  points.forEach((a, index) => {
    const b = points[(index + 1) % points.length];

    if (!b) {
      return;
    }

    doubledArea += a.x * b.y - b.x * a.y;
  });

  return Math.abs(doubledArea) / 2;
}

// Чётно-нечётное правило: луч вправо от точки, считаем пересечения с рёбрами
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let isInside = false;

  polygon.forEach((a, index) => {
    const b = polygon[(index + 1) % polygon.length];

    if (!b) {
      return;
    }

    const isBetweenByY = a.y > point.y !== b.y > point.y;
    const crossingX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;

    if (isBetweenByY && point.x < crossingX) {
      isInside = !isInside;
    }
  });

  return isInside;
}

export function getDistanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const t = Math.max(0, Math.min(1, projection));

  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}
