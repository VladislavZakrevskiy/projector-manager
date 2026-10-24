import type { Bands } from './level-tracker';

export type AudioInput = {
  id: string;
  label: string;
};

export type SpectrumSource = {
  listInputs: () => Promise<AudioInput[]>;
  startInput: (inputId: string) => Promise<void>;
  startFile: (file: File) => Promise<void>;
  // null — источник ещё не запущен
  readBands: () => Bands | null;
};

const FFT_SIZE = 1024;
const SMOOTHING = 0.5;
const MAX_BYTE = 255;
// Границы полос в бинах FFT (~47 Гц на бин при 48 кГц): бас, средние, высокие
const BASS_BINS = [1, 5] as const;
const MID_BINS = [5, 25] as const;
const HIGH_BINS = [25, 110] as const;

// Вход (микрофон или виртуальное устройство вроде BlackHole) обрабатывать нельзя:
// шумодав и авто-усиление вырезают бит
const RAW_AUDIO_CONSTRAINTS = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

export function createSpectrumSource(): SpectrumSource {
  let context: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let spectrum = new Uint8Array(0);
  let stopCurrent: () => void = () => undefined;

  async function ensureContext(): Promise<{ context: AudioContext; analyser: AnalyserNode }> {
    if (!context || !analyser) {
      context = new AudioContext();
      analyser = context.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING;
      spectrum = new Uint8Array(analyser.frequencyBinCount);
    }

    await context.resume();

    return { context, analyser };
  }

  return {
    listInputs: async () => {
      // Без разрешения браузер прячет названия устройств, поэтому один раз просим доступ
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      permissionStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();

      return devices.filter((device) => device.kind === 'audioinput').map((device) => ({ id: device.deviceId, label: device.label || 'Аудиовход' }));
    },
    startInput: async (inputId) => {
      const ready = await ensureContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { ...RAW_AUDIO_CONSTRAINTS, deviceId: { exact: inputId } } });
      const source = ready.context.createMediaStreamSource(stream);

      stopCurrent();
      source.connect(ready.analyser);
      stopCurrent = () => {
        source.disconnect();
        stream.getTracks().forEach((track) => track.stop());
      };
    },
    startFile: async (file) => {
      const ready = await ensureContext();
      const element = new Audio(URL.createObjectURL(file));
      const source = ready.context.createMediaElementSource(element);

      stopCurrent();
      element.loop = true;
      source.connect(ready.analyser);
      source.connect(ready.context.destination);
      await element.play();
      stopCurrent = () => {
        element.pause();
        source.disconnect();
      };
    },
    readBands: () => {
      if (!analyser) {
        return null;
      }

      analyser.getByteFrequencyData(spectrum);

      return [averageBins(spectrum, BASS_BINS), averageBins(spectrum, MID_BINS), averageBins(spectrum, HIGH_BINS)];
    },
  };
}

function averageBins(spectrum: Uint8Array, [from, to]: readonly [number, number]): number {
  let sum = 0;

  for (let bin = from; bin < to; bin++) {
    sum += spectrum[bin] ?? 0;
  }

  return sum / (to - from) / MAX_BYTE;
}
