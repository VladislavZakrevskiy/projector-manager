const SAMPLE_RATE = 44_100;
const BEAT_SECONDS = 0.484;
const BASS_HZ = 80;

// Моно 16-bit WAV: басовые «удары» 124 BPM, чтобы анализатору было что слушать
export function makeBeatWav(seconds: number): Buffer {
  const sampleCount = Math.floor(seconds * SAMPLE_RATE);
  const data = Buffer.alloc(sampleCount * 2);

  for (let index = 0; index < sampleCount; index++) {
    const time = index / SAMPLE_RATE;
    const sinceBeat = time % BEAT_SECONDS;
    const amplitude = Math.exp(-sinceBeat * 8) * 0.9;

    data.writeInt16LE(Math.round(Math.sin(2 * Math.PI * BASS_HZ * time) * amplitude * 32_767), index * 2);
  }

  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}
