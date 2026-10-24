import type { AudioReading } from '~/shared/contracts';

export type Bands = readonly [bass: number, mid: number, high: number];

export type LevelTracker = {
  update: (bands: Bands, now: number, dt: number) => AudioReading;
};

const MIN_PEAK = 0.15;
const PEAK_DECAY_PER_FRAME = 0.9995;
const BEAT_COOLDOWN_MS = 280;
const BEAT_MIN_LEVEL = 0.45;
const BEAT_RATIO = 1.3;
const BEAT_OFFSET = 0.08;
const BASS_AVERAGE_SMOOTHING = 0.05;
const BEAT_DECAY_PER_SECOND = 6;

// Нормализует полосы по медленно затухающему максимуму (авто-усиление) и ловит бит по басу
export function createLevelTracker(): LevelTracker {
  const peaks = { bass: MIN_PEAK, mid: MIN_PEAK, high: MIN_PEAK };
  let bassAverage = 0;
  let lastBeatAt = -Infinity;
  let beat = 0;
  let beatCount = 0;

  function normalize(value: number, peakKey: keyof typeof peaks): number {
    peaks[peakKey] = Math.max(MIN_PEAK, value, peaks[peakKey] * PEAK_DECAY_PER_FRAME);

    return Math.min(1, value / peaks[peakKey]);
  }

  return {
    update: ([rawBass, rawMid, rawHigh], now, dt) => {
      const bass = normalize(rawBass, 'bass');
      const mid = normalize(rawMid, 'mid');
      const high = normalize(rawHigh, 'high');

      bassAverage += (bass - bassAverage) * BASS_AVERAGE_SMOOTHING;
      beat *= Math.exp(-dt * BEAT_DECAY_PER_SECOND);

      const isBeat = bass > bassAverage * BEAT_RATIO + BEAT_OFFSET && bass > BEAT_MIN_LEVEL && now - lastBeatAt > BEAT_COOLDOWN_MS;

      if (isBeat) {
        lastBeatAt = now;
        beat = 1;
        beatCount++;
      }

      return { levels: { bass, mid, high, beat }, loudness: (bass + mid + high) / 3, beatCount };
    },
  };
}
