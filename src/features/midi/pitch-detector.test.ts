import { describe, it, expect } from 'vitest';
import { frequencyToMidiNote, detectPitch } from './pitch-detector';

describe('frequencyToMidiNote', () => {
  it('maps 440Hz to A4 (MIDI note 69)', () => {
    const result = frequencyToMidiNote(440);
    expect(result.midiNote).toBe(69);
    expect(result.noteName).toBe('A4');
    expect(result.centsOff).toBe(0);
  });

  it('maps 261.63Hz to C4 (MIDI note 60)', () => {
    const result = frequencyToMidiNote(261.63);
    expect(result.midiNote).toBe(60);
    expect(result.noteName).toBe('C4');
    expect(Math.abs(result.centsOff)).toBeLessThanOrEqual(1);
  });

  it('maps 880Hz to A5 (MIDI note 81)', () => {
    const result = frequencyToMidiNote(880);
    expect(result.midiNote).toBe(81);
    expect(result.noteName).toBe('A5');
  });

  it('maps 220Hz to A3 (MIDI note 57)', () => {
    const result = frequencyToMidiNote(220);
    expect(result.midiNote).toBe(57);
    expect(result.noteName).toBe('A3');
  });

  it('includes confidence value', () => {
    const result = frequencyToMidiNote(440, 0.95);
    expect(result.confidence).toBe(0.95);
  });

  it('defaults confidence to 1.0', () => {
    const result = frequencyToMidiNote(440);
    expect(result.confidence).toBe(1.0);
  });

  it('calculates cents offset for slightly sharp pitch', () => {
    // 446.16 Hz is about 24 cents sharp of A4
    const result = frequencyToMidiNote(446.16);
    expect(result.midiNote).toBe(69);
    expect(result.centsOff).toBeGreaterThan(0);
    expect(result.centsOff).toBeLessThanOrEqual(30);
  });

  it('calculates cents offset for slightly flat pitch', () => {
    // 430 Hz is about 40 cents flat of A4
    const result = frequencyToMidiNote(430);
    expect(result.midiNote).toBe(69);
    expect(result.centsOff).toBeLessThan(0);
  });

  it('handles very low frequency (MIDI note 21 = A0 = 27.5Hz)', () => {
    const result = frequencyToMidiNote(27.5);
    expect(result.midiNote).toBe(21);
    expect(result.noteName).toBe('A0');
  });

  it('handles high frequency (MIDI note 108 = C8 = 4186Hz)', () => {
    const result = frequencyToMidiNote(4186);
    expect(result.midiNote).toBe(108);
    expect(result.noteName).toBe('C8');
    expect(Math.abs(result.centsOff)).toBeLessThanOrEqual(1);
  });
});

describe('detectPitch', () => {
  it('returns null for silence (all zeros)', () => {
    const silence = new Float32Array(2048);
    const result = detectPitch(silence, 44100);
    expect(result).toBeNull();
  });

  it('returns null for very low amplitude noise', () => {
    const noise = new Float32Array(2048);
    for (let i = 0; i < noise.length; i++) {
      noise[i] = (Math.random() - 0.5) * 0.005; // Very quiet
    }
    const result = detectPitch(noise, 44100);
    expect(result).toBeNull();
  });

  it('detects a pure sine wave at 440Hz', () => {
    const sampleRate = 44100;
    const frequency = 440;
    const buffer = new Float32Array(2048);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.5;
    }
    const result = detectPitch(buffer, sampleRate);
    expect(result).not.toBeNull();
    expect(result!.midiNote).toBe(69); // A4
    expect(result!.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('detects a lower pitch (220Hz = A3)', () => {
    const sampleRate = 44100;
    const frequency = 220;
    // Larger buffer needed for lower frequencies to capture enough periods
    const bufferSize = 8192;
    const buffer = new Float32Array(bufferSize);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.5;
    }
    const result = detectPitch(buffer, sampleRate);
    expect(result).not.toBeNull();
    expect(result!.midiNote).toBe(57); // A3
  });
});
