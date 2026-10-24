import { describe, expect, test } from '@rstest/core';

import { getDistanceToSegment, getPolygonArea, isPointInPolygon } from './polygon';

const SQUARE = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe('getPolygonArea', () => {
  test('returns 100 for a 10x10 square', () => {
    expect(getPolygonArea(SQUARE)).toBe(100);
  });

  test('returns 6 for a 3x4 right triangle', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 4 },
    ];

    expect(getPolygonArea(triangle)).toBe(6);
  });

  test('returns the same area for reversed vertex order', () => {
    expect(getPolygonArea([...SQUARE].reverse())).toBe(100);
  });
});

describe('isPointInPolygon', () => {
  test('returns true for a point inside', () => {
    expect(isPointInPolygon({ x: 5, y: 5 }, SQUARE)).toBe(true);
  });

  test('returns false for a point to the right of the polygon', () => {
    expect(isPointInPolygon({ x: 15, y: 5 }, SQUARE)).toBe(false);
  });

  test('returns false for a point above the polygon', () => {
    expect(isPointInPolygon({ x: 5, y: -1 }, SQUARE)).toBe(false);
  });

  test('returns false for a point in the notch of a concave polygon', () => {
    const letterU = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 0 },
      { x: 9, y: 0 },
      { x: 9, y: 9 },
      { x: 0, y: 9 },
    ];

    expect(isPointInPolygon({ x: 4.5, y: 3 }, letterU)).toBe(false);
  });
});

describe('getDistanceToSegment', () => {
  const start = { x: 0, y: 0 };
  const end = { x: 10, y: 0 };

  test('returns the perpendicular distance when the projection is on the segment', () => {
    expect(getDistanceToSegment({ x: 5, y: 3 }, start, end)).toBe(3);
  });

  test('returns the distance to the nearest end when the projection is outside', () => {
    expect(getDistanceToSegment({ x: 13, y: 4 }, start, end)).toBe(5);
  });

  test('returns the distance to the point for a zero-length segment', () => {
    expect(getDistanceToSegment({ x: 3, y: 4 }, start, start)).toBe(5);
  });
});
