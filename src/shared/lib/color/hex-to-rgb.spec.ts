import { describe, expect, test } from '@rstest/core';

import { hexToRgb } from './hex-to-rgb';

describe('hexToRgb', () => {
  test('converts white to ones', () => {
    expect(hexToRgb('#ffffff')).toEqual([1, 1, 1]);
  });

  test('converts a pure red', () => {
    expect(hexToRgb('#ff0000')).toEqual([1, 0, 0]);
  });

  test('is case insensitive', () => {
    expect(hexToRgb('#00FF00')).toEqual([0, 1, 0]);
  });

  test('returns black for an invalid string', () => {
    expect(hexToRgb('red')).toEqual([0, 0, 0]);
  });
});
