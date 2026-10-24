import type { Bands } from './level-tracker';

const DEMO_BPM = 124;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;

// Синтетический бит, чтобы эффекты и авто-режим жили без микрофона и файла
export function getDemoBands(now: number): Bands {
  const beatPhase = ((now / MS_PER_SECOND) * DEMO_BPM) / SECONDS_PER_MINUTE;
  const sinceBeat = beatPhase % 1;

  return [Math.exp(-sinceBeat * 4) * 0.9, 0.4 + 0.3 * Math.sin(now / 700), 0.3 + 0.2 * Math.sin(now / 230)];
}
