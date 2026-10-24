import { allSettled, fork } from 'effector';
import { describe, expect, test } from '@rstest/core';

import { createPlaybackFeature } from './factory';

describe('PlaybackFeature', () => {
  test('starts in the editor mode', () => {
    const feature = createPlaybackFeature();
    const scope = fork();

    expect(scope.getState(feature.$isShowing)).toBe(false);
  });

  test('toggles showing on', async () => {
    const feature = createPlaybackFeature();
    const scope = fork();

    await allSettled(feature.showToggled, { scope });

    expect(scope.getState(feature.$isShowing)).toBe(true);
  });

  test('toggles showing off again', async () => {
    const feature = createPlaybackFeature();
    const scope = fork({ values: [[feature.$isShowing, true]] });

    await allSettled(feature.showToggled, { scope });

    expect(scope.getState(feature.$isShowing)).toBe(false);
  });

  test('enabling auto switches to showing', async () => {
    const feature = createPlaybackFeature();
    const scope = fork();

    await allSettled(feature.autoToggled, { scope });

    expect(scope.getState(feature.$isShowing)).toBe(true);
  });

  test('disabling auto keeps showing', async () => {
    const feature = createPlaybackFeature();
    const scope = fork({ values: [[feature.$isAuto, true], [feature.$isShowing, true]] });

    await allSettled(feature.autoToggled, { scope });

    expect(scope.getState(feature.$isShowing)).toBe(true);
  });

  test('toggles blackout', async () => {
    const feature = createPlaybackFeature();
    const scope = fork();

    await allSettled(feature.blackoutToggled, { scope });

    expect(scope.getState(feature.$isBlackout)).toBe(true);
  });
});
