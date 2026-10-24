import { allSettled, fork } from 'effector';
import { describe, expect, rs, test } from '@rstest/core';

import type { SpectrumSource } from '../lib/spectrum-source';

import { createAudioAnalysisFeature } from './factory';

function createSource(overrides: Partial<SpectrumSource> = {}): SpectrumSource {
  return {
    listInputs: () => Promise.resolve([]),
    startInput: () => Promise.resolve(),
    startFile: () => Promise.resolve(),
    readBands: () => null,
    ...overrides,
  };
}

describe('AudioAnalysisFeature', () => {
  test('is not live before any source is started', () => {
    const feature = createAudioAnalysisFeature({ source: createSource() });
    const scope = fork();

    expect(scope.getState(feature.$isLive)).toBe(false);
  });

  test('exposes the audio inputs found by the source', async () => {
    const inputs = [{ id: 'blackhole', label: 'BlackHole 2ch' }];
    const feature = createAudioAnalysisFeature({ source: createSource({ listInputs: () => Promise.resolve(inputs) }) });
    const scope = fork();

    await allSettled(feature.inputsRefreshRequested, { scope });

    expect(scope.getState(feature.$inputs)).toEqual(inputs);
  });

  test('starts the selected input', async () => {
    const startInput = rs.fn(() => Promise.resolve());
    const feature = createAudioAnalysisFeature({ source: createSource({ startInput }) });
    const scope = fork();

    await allSettled(feature.inputSelected, { scope, params: 'blackhole' });

    expect(startInput).toHaveBeenCalledWith('blackhole');
  });

  test('remembers the selected input', async () => {
    const feature = createAudioAnalysisFeature({ source: createSource() });
    const scope = fork();

    await allSettled(feature.inputSelected, { scope, params: 'blackhole' });

    expect(scope.getState(feature.$selectedInputId)).toBe('blackhole');
  });

  test('becomes live after an input starts', async () => {
    const feature = createAudioAnalysisFeature({ source: createSource() });
    const scope = fork();

    await allSettled(feature.inputSelected, { scope, params: 'blackhole' });

    expect(scope.getState(feature.$isLive)).toBe(true);
  });

  test('becomes live after a file starts playing', async () => {
    const feature = createAudioAnalysisFeature({ source: createSource() });
    const scope = fork();

    await allSettled(feature.fileSelected, { scope, params: new File([''], 'track.mp3') });

    expect(scope.getState(feature.$isLive)).toBe(true);
  });

  test('passes the selected file to the source', async () => {
    const startFile = rs.fn(() => Promise.resolve());
    const feature = createAudioAnalysisFeature({ source: createSource({ startFile }) });
    const scope = fork();
    const file = new File([''], 'track.mp3');

    await allSettled(feature.fileSelected, { scope, params: file });

    expect(startFile).toHaveBeenCalledWith(file);
  });

  test('forgets the selected input when a file starts', async () => {
    const feature = createAudioAnalysisFeature({ source: createSource() });
    const scope = fork({ values: [[feature.$selectedInputId, 'blackhole']] });

    await allSettled(feature.fileSelected, { scope, params: new File([''], 'track.mp3') });

    expect(scope.getState(feature.$selectedInputId)).toBeNull();
  });

  test('exposes the error message when the input is denied', async () => {
    const source = createSource({ startInput: () => Promise.reject(new Error('Permission denied')) });
    const feature = createAudioAnalysisFeature({ source });
    const scope = fork();

    await allSettled(feature.inputSelected, { scope, params: 'blackhole' });

    expect(scope.getState(feature.$errorMessage)).toBe('Permission denied');
  });

  test('stays not live when the input is denied', async () => {
    const source = createSource({ startInput: () => Promise.reject(new Error('Permission denied')) });
    const feature = createAudioAnalysisFeature({ source });
    const scope = fork();

    await allSettled(feature.inputSelected, { scope, params: 'blackhole' });

    expect(scope.getState(feature.$isLive)).toBe(false);
  });

  test('exposes the error message when listing inputs fails', async () => {
    const source = createSource({ listInputs: () => Promise.reject(new Error('Permission denied')) });
    const feature = createAudioAnalysisFeature({ source });
    const scope = fork();

    await allSettled(feature.inputsRefreshRequested, { scope });

    expect(scope.getState(feature.$errorMessage)).toBe('Permission denied');
  });

  test('reads levels from the source bands', () => {
    const source = createSource({ readBands: () => [0.9, 0.5, 0.2] });
    const feature = createAudioAnalysisFeature({ source });

    const reading = feature.readAudio(1000, 1 / 60);

    expect(reading.levels.bass).toBe(1);
  });

  test('falls back to the demo beat without a source', () => {
    const feature = createAudioAnalysisFeature({ source: createSource() });

    const reading = feature.readAudio(0, 1 / 60);

    expect(reading.levels.bass).toBeGreaterThan(0);
  });

  test('returns the last reading without advancing the tracker', () => {
    const source = createSource({ readBands: () => [0.9, 0.5, 0.2] });
    const feature = createAudioAnalysisFeature({ source });
    const reading = feature.readAudio(1000, 1 / 60);

    expect(feature.getLastReading()).toBe(reading);
  });
});
