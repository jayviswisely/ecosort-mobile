import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'assets', 'full-bin-alarm.wav');
const sampleRate = 44_100;
const durationSeconds = 1.65;
const sampleCount = Math.floor(sampleRate * durationSeconds);
const samples = new Int16Array(sampleCount);

const pulses = [
  { start: 0.0, end: 0.28, frequency: 880 },
  { start: 0.38, end: 0.66, frequency: 660 },
  { start: 0.76, end: 1.04, frequency: 880 },
  { start: 1.14, end: 1.42, frequency: 660 },
];

for (let index = 0; index < sampleCount; index += 1) {
  const time = index / sampleRate;
  const pulse = pulses.find(({ start, end }) => time >= start && time < end);
  if (!pulse) continue;

  const localTime = time - pulse.start;
  const pulseDuration = pulse.end - pulse.start;
  const attack = Math.min(1, localTime / 0.012);
  const release = Math.min(1, (pulseDuration - localTime) / 0.035);
  const envelope = Math.max(0, Math.min(attack, release));
  const phase = 2 * Math.PI * pulse.frequency * localTime;
  const tone =
    Math.sin(phase) * 0.68 +
    Math.sin(phase * 2) * 0.2 +
    Math.sin(phase * 3) * 0.12;
  samples[index] = Math.round(tone * envelope * 0.72 * 32_767);
}

const dataSize = samples.length * 2;
const wav = Buffer.alloc(44 + dataSize);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + dataSize, 4);
wav.write('WAVE', 8);
wav.write('fmt ', 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(dataSize, 40);

for (let index = 0; index < samples.length; index += 1) {
  wav.writeInt16LE(samples[index], 44 + index * 2);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, wav);
console.log(`Generated ${output} (${durationSeconds}s, ${sampleRate} Hz)`);
