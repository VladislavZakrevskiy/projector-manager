import { createEffect, createEvent, createStore, sample } from 'effector';

import type { AudioReading } from '~/shared/contracts';

import { getDemoBands } from '../lib/demo-bands';
import { createLevelTracker } from '../lib/level-tracker';
import type { SpectrumSource } from '../lib/spectrum-source';
import type { AudioInput } from '../lib/spectrum-source';

export type AudioAnalysisDeps = {
  source: SpectrumSource;
};

const SILENT_READING: AudioReading = { levels: { bass: 0, mid: 0, high: 0, beat: 0 }, loudness: 0, beatCount: 0 };

export function createAudioAnalysisFeature(deps: AudioAnalysisDeps) {
  const tracker = createLevelTracker();
  let lastReading = SILENT_READING;

  // 1. Effects
  const listInputsFx = createEffect(() => deps.source.listInputs());
  const startInputFx = createEffect((inputId: string) => deps.source.startInput(inputId).then(() => inputId));
  const startFileFx = createEffect((file: File) => deps.source.startFile(file));

  // 2. Events
  const inputsRefreshRequested = createEvent();
  const inputSelected = createEvent<string>();
  const fileSelected = createEvent<File>();

  // 3. Stores
  const $inputs = createStore<AudioInput[]>([]);
  const $selectedInputId = createStore<string | null>(null);
  const $isLive = createStore(false);
  const $errorMessage = createStore<string | null>(null);

  // 5. Sample
  sample({ clock: inputsRefreshRequested, target: listInputsFx });
  sample({ clock: inputSelected, target: startInputFx });
  sample({ clock: fileSelected, target: startFileFx });

  sample({ clock: listInputsFx.doneData, target: $inputs });

  sample({ clock: startInputFx.doneData, target: $selectedInputId });

  // Файл играет сам, выбранный вход после него неактуален
  sample({
    clock: startFileFx.done,
    fn: () => null,
    target: $selectedInputId,
  });

  sample({
    clock: [startInputFx.done, startFileFx.done],
    fn: () => true,
    target: $isLive,
  });

  sample({
    clock: [listInputsFx.done, startInputFx.done, startFileFx.done],
    fn: () => null,
    target: $errorMessage,
  });

  sample({
    clock: [listInputsFx.failData, startInputFx.failData, startFileFx.failData],
    fn: (error) => error.message,
    target: $errorMessage,
  });

  // Горячий путь: вызывается каждый кадр и не проходит через сторы
  function readAudio(now: number, dt: number): AudioReading {
    lastReading = tracker.update(deps.source.readBands() ?? getDemoBands(now), now, dt);

    return lastReading;
  }

  // Для индикаторов: последний посчитанный кадр, без повторного обновления трекера
  function getLastReading(): AudioReading {
    return lastReading;
  }

  // 6. Return
  return {
    $inputs,
    $selectedInputId,
    $isLive,
    $errorMessage,
    inputsRefreshRequested,
    inputSelected,
    fileSelected,
    readAudio,
    getLastReading,
  };
}

export type AudioAnalysisFeature = ReturnType<typeof createAudioAnalysisFeature>;
