import { STAGE_HEIGHT, STAGE_WIDTH } from '~/shared/config';
import { getDistanceToSegment } from '~/shared/lib/geometry';
import type { Point } from '~/shared/lib/geometry';

import { CLOSE_RADIUS, MIN_POINT_GAP, MIN_POLYGON_POINTS } from './constants';

export function clampPoint(point: Point): Point {
  return {
    x: Math.max(0, Math.min(STAGE_WIDTH, point.x)),
    y: Math.max(0, Math.min(STAGE_HEIGHT, point.y)),
  };
}

export function moveVertex(points: Point[], index: number, point: Point): Point[] {
  return points.map((current, currentIndex) => (currentIndex === index ? clampPoint(point) : current));
}

// Сдвигает весь полигон, не давая ему выйти за кадр
export function translatePolygon(points: Point[], dx: number, dy: number): Point[] {
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const safeDx = Math.max(-minX, Math.min(STAGE_WIDTH - maxX, dx));
  const safeDy = Math.max(-minY, Math.min(STAGE_HEIGHT - maxY, dy));

  return points.map((point) => ({ x: point.x + safeDx, y: point.y + safeDy }));
}

// Вставляет вершину в ближайшее ребро; null — клик дальше maxDistance от всех рёбер
export function insertVertex(points: Point[], point: Point, maxDistance: number): Point[] | null {
  let nearestEdge = -1;
  let nearestDistance = maxDistance;

  points.forEach((start, index) => {
    const end = points[(index + 1) % points.length];

    if (!end) {
      return;
    }

    const distance = getDistanceToSegment(point, start, end);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestEdge = index;
    }
  });

  if (nearestEdge === -1) {
    return null;
  }

  return [...points.slice(0, nearestEdge + 1), clampPoint(point), ...points.slice(nearestEdge + 1)];
}

// null — удалять нельзя, полигон останется меньше чем из трёх вершин
export function removeVertex(points: Point[], index: number): Point[] | null {
  if (points.length <= MIN_POLYGON_POINTS) {
    return null;
  }

  return points.filter((_, currentIndex) => currentIndex !== index);
}

export function isClosingPoint(draft: Point[], point: Point): boolean {
  const first = draft[0];

  return draft.length >= MIN_POLYGON_POINTS && first !== undefined && Math.hypot(point.x - first.x, point.y - first.y) < CLOSE_RADIUS;
}

export function isNewPoint(draft: Point[], point: Point): boolean {
  const last = draft[draft.length - 1];

  return last === undefined || Math.hypot(point.x - last.x, point.y - last.y) >= MIN_POINT_GAP;
}
