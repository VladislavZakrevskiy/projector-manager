import type { Point } from '~/shared/lib/geometry';

export type PolygonBuffers = {
  points: Float32Array;
  edgeStartLengths: Float32Array;
};

export type PolygonMetrics = {
  count: number;
  perimeter: number;
  centerX: number;
  centerY: number;
  radius: number;
};

// Пишет полигон в буферы для шейдера и возвращает его метрики
export function writePolygonUniforms(polygon: Point[], buffers: PolygonBuffers): PolygonMetrics {
  const count = Math.min(polygon.length, buffers.edgeStartLengths.length);
  let perimeter = 0;
  let sumX = 0;
  let sumY = 0;

  for (let index = 0; index < count; index++) {
    const current = polygon[index];
    const next = polygon[(index + 1) % count];

    if (!current || !next) {
      continue;
    }

    buffers.points[index * 2] = current.x;
    buffers.points[index * 2 + 1] = current.y;
    buffers.edgeStartLengths[index] = perimeter;
    perimeter += Math.hypot(next.x - current.x, next.y - current.y);
    sumX += current.x;
    sumY += current.y;
  }

  const centerX = count > 0 ? sumX / count : 0;
  const centerY = count > 0 ? sumY / count : 0;
  let radius = 1;

  for (let index = 0; index < count; index++) {
    const x = buffers.points[index * 2] ?? 0;
    const y = buffers.points[index * 2 + 1] ?? 0;

    radius = Math.max(radius, Math.hypot(x - centerX, y - centerY));
  }

  return { count, perimeter: Math.max(perimeter, 1), centerX, centerY, radius };
}
