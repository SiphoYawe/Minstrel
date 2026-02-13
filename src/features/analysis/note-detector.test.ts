import { describe, it, expect } from 'vitest';
import { detectNote, noteDisplayName } from './note-detector';

describe('detectNote', () => {
  it('maps C4 (MIDI 60) correctly', () => {
    const note = detectNote(60, 100, 1000);
    expect(note.name).toBe('C');
    expect(note.octave).toBe(4);
    expect(note.midiNumber).toBe(60);
    expect(note.velocity).toBe(100);
    expect(note.timestamp).toBe(1000);
  });

  it('maps A4 (MIDI 69) correctly', () => {
    const note = detectNote(69, 80, 2000);
    expect(note.name).toBe('A');
    expect(note.octave).toBe(4);
  });

  it('maps G#3 (MIDI 56) correctly', () => {
    const note = detectNote(56, 90, 3000);
    expect(note.name).toBe('G#');
    expect(note.octave).toBe(3);
  });

  it('uses sharps for enharmonic notes (C# not Db)', () => {
    const note = detectNote(61, 100, 1000); // C#4
    expect(note.name).toBe('C#');
  });

  it('maps MIDI note 0 (C-1) correctly', () => {
    const note = detectNote(0, 64, 500);
    expect(note.name).toBe('C');
    expect(note.octave).toBe(-1);
  });

  it('maps MIDI note 127 (G9) correctly', () => {
    const note = detectNote(127, 127, 999);
    expect(note.name).toBe('G');
    expect(note.octave).toBe(9);
  });

  it('maps all 12 pitch classes in octave 4 (MIDI 60-71)', () => {
    const expected = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let i = 0; i < 12; i++) {
      const note = detectNote(60 + i, 100, 0);
      expect(note.name).toBe(expected[i]);
      expect(note.octave).toBe(4);
    }
  });

  it('maps middle octave boundaries correctly', () => {
    // B3 = 59, C4 = 60
    expect(detectNote(59, 100, 0).octave).toBe(3);
    expect(detectNote(59, 100, 0).name).toBe('B');
    expect(detectNote(60, 100, 0).octave).toBe(4);
    expect(detectNote(60, 100, 0).name).toBe('C');
  });

  it('preserves velocity and timestamp', () => {
    const note = detectNote(64, 42, 12345);
    expect(note.velocity).toBe(42);
    expect(note.timestamp).toBe(12345);
  });
});

describe('noteDisplayName', () => {
  it('returns "C4" for MIDI 60', () => {
    expect(noteDisplayName(60)).toBe('C4');
  });

  it('returns "G#3" for MIDI 56', () => {
    expect(noteDisplayName(56)).toBe('G#3');
  });

  it('returns "C-1" for MIDI 0', () => {
    expect(noteDisplayName(0)).toBe('C-1');
  });

  it('returns "G9" for MIDI 127', () => {
    expect(noteDisplayName(127)).toBe('G9');
  });

  it('maps all 128 MIDI notes to valid display names', () => {
    const validNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let i = 0; i <= 127; i++) {
      const display = noteDisplayName(i);
      const name = display.replace(/[-\d]+$/, '');
      expect(validNames).toContain(name);
    }
  });
});
