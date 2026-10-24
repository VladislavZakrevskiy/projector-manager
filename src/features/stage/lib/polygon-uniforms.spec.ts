import { describe, expect, test } from '@rstest/core';

import { writePolygonUniforms } from './polygon-uniforms';

function createBuffers() {
  return { points: new Float32Array(64), edgeStartLengths: new Float32Array(32) };
}

const SQUARE = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe('writePolygonUniforms', () => {
  test('returns the perimeter of a square', () => {
    const metrics = writePolygonUniforms(SQUARE, createBuffers());

    expect(metrics.perimeter).toBe(40);
  });

  test('returns the vertex count', () => {
    const metrics = writePolygonUniforms(SQUARE, createBuffers());

    expect(metrics.count).toBe(4);
  });

  test('returns the center of a square', () => {
    const metrics = writePolygonUniforms(SQUARE, createBuffers());

    expect([metrics.centerX, metrics.centerY]).toEqual([5, 5]);
  });

  test('writes cumulative edge start lengths', () => {
    const buffers = createBuffers();

    writePolygonUniforms(SQUARE, buffers);

    expect(Array.from(buffers.edgeStartLengths.slice(0, 4))).toEqual([0, 10, 20, 30]);
  });

  test('writes vertex coordinates as flat pairs', () => {
    const buffers = createBuffers();

    writePolygonUniforms(SQUARE, buffers);

    expect(Array.from(buffers.points.slice(0, 4))).toEqual([0, 0, 10, 0]);
  });

  test('returns the distance to the farthest vertex as radius', () => {
    const metrics = writePolygonUniforms(SQUARE, createBuffers());

    expect(metrics.radius).toBeCloseTo(Math.hypot(5, 5));
  });

  test('ignores vertices beyond the buffer capacity', () => {
    const polygon = Array.from({ length: 40 }, (_, index) => ({ x: index, y: index % 2 }));

    const metrics = writePolygonUniforms(polygon, createBuffers());

    expect(metrics.count).toBe(32);
  });
});
