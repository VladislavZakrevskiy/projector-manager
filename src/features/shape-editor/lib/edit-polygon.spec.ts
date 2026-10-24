import { describe, expect, test } from '@rstest/core';

import { clampPoint, insertVertex, isClosingPoint, isNewPoint, moveVertex, removeVertex, translatePolygon } from './edit-polygon';

const TRIANGLE = [
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 150, y: 200 },
];

describe('clampPoint', () => {
  test('keeps a point inside the stage unchanged', () => {
    expect(clampPoint({ x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
  });

  test('pulls a point back to the stage edge', () => {
    expect(clampPoint({ x: -50, y: 9999 })).toEqual({ x: 0, y: 720 });
  });
});

describe('moveVertex', () => {
  test('moves only the given vertex', () => {
    expect(moveVertex(TRIANGLE, 1, { x: 300, y: 50 })).toEqual([
      { x: 100, y: 100 },
      { x: 300, y: 50 },
      { x: 150, y: 200 },
    ]);
  });

  test('keeps the vertex inside the stage', () => {
    expect(moveVertex(TRIANGLE, 0, { x: -10, y: 100 })[0]).toEqual({ x: 0, y: 100 });
  });
});

describe('translatePolygon', () => {
  test('shifts every vertex by the delta', () => {
    expect(translatePolygon(TRIANGLE, 10, -20)[0]).toEqual({ x: 110, y: 80 });
  });

  test('stops at the left stage edge', () => {
    expect(translatePolygon(TRIANGLE, -500, 0)[0]).toEqual({ x: 0, y: 100 });
  });

  test('stops at the bottom stage edge', () => {
    expect(translatePolygon(TRIANGLE, 0, 9999)[2]).toEqual({ x: 150, y: 720 });
  });
});

describe('insertVertex', () => {
  test('inserts a vertex after the start of the nearest edge', () => {
    const result = insertVertex(TRIANGLE, { x: 150, y: 102 }, 8);

    expect(result?.[1]).toEqual({ x: 150, y: 102 });
  });

  test('returns null when the click is far from every edge', () => {
    expect(insertVertex(TRIANGLE, { x: 150, y: 140 }, 8)).toBeNull();
  });

  test('inserts into the closing edge at the end of the list', () => {
    const result = insertVertex(TRIANGLE, { x: 125, y: 150 }, 8);

    expect(result).toHaveLength(4);
  });
});

describe('removeVertex', () => {
  test('removes the vertex from a quad', () => {
    const quad = [...TRIANGLE, { x: 100, y: 200 }];

    expect(removeVertex(quad, 3)).toEqual(TRIANGLE);
  });

  test('refuses to shrink a triangle', () => {
    expect(removeVertex(TRIANGLE, 0)).toBeNull();
  });
});

describe('isClosingPoint', () => {
  test('is true near the first point of a polygon with three points', () => {
    expect(isClosingPoint(TRIANGLE, { x: 105, y: 104 })).toBe(true);
  });

  test('is false far from the first point', () => {
    expect(isClosingPoint(TRIANGLE, { x: 300, y: 300 })).toBe(false);
  });

  test('is false when there are fewer than three points', () => {
    expect(isClosingPoint([{ x: 100, y: 100 }, { x: 200, y: 100 }], { x: 101, y: 101 })).toBe(false);
  });
});

describe('isNewPoint', () => {
  test('is true for the first point', () => {
    expect(isNewPoint([], { x: 10, y: 10 })).toBe(true);
  });

  test('is false for a duplicate of the last point', () => {
    expect(isNewPoint(TRIANGLE, { x: 150, y: 201 })).toBe(false);
  });

  test('is true for a distinct point', () => {
    expect(isNewPoint(TRIANGLE, { x: 400, y: 400 })).toBe(true);
  });
});
