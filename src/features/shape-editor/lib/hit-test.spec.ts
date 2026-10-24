import { describe, expect, test } from '@rstest/core';

import { findShapeAt, findVertexAt } from './hit-test';

const SQUARE = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe('findVertexAt', () => {
  test('returns the index of the vertex under the cursor', () => {
    expect(findVertexAt(SQUARE, { x: 98, y: 3 }, 10)).toBe(1);
  });

  test('returns null when no vertex is close', () => {
    expect(findVertexAt(SQUARE, { x: 50, y: 50 }, 10)).toBeNull();
  });
});

describe('findShapeAt', () => {
  test('returns the shape under the cursor', () => {
    const shape = { id: 'a', points: SQUARE };

    expect(findShapeAt([shape], { x: 50, y: 50 })).toBe(shape);
  });

  test('returns null on empty space', () => {
    expect(findShapeAt([{ id: 'a', points: SQUARE }], { x: 500, y: 500 })).toBeNull();
  });

  test('prefers the topmost of overlapping shapes', () => {
    const bottom = { id: 'bottom', points: SQUARE };
    const top = { id: 'top', points: SQUARE };

    expect(findShapeAt([bottom, top], { x: 50, y: 50 })).toBe(top);
  });
});
