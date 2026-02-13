import { describe, it, expect } from 'vitest';
import { analyzeChord, chordDisplayName, updateProgression } from './chord-analyzer';
import { detectNote } from './note-detector';
import type { ChordProgression } from './analysis-types';

// Helper: create DetectedNote array from MIDI numbers
function notes(...midiNumbers: number[]): DetectedNote[] {
  return midiNumbers.map((n, i) => detectNote(n, 100, 1000 + i));
}

describe('analyzeChord', () => {
  describe('major triads', () => {
    it('detects C major (C4-E4-G4)', () => {
      const chord = analyzeChord(notes(60, 64, 67));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('C');
      expect(chord!.quality).toBe('Major');
    });

    it('detects G major (G3-B3-D4)', () => {
      const chord = analyzeChord(notes(55, 59, 62));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('G');
      expect(chord!.quality).toBe('Major');
    });

    it('detects F major (F3-A3-C4)', () => {
      const chord = analyzeChord(notes(53, 57, 60));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('F');
      expect(chord!.quality).toBe('Major');
    });
  });

  describe('minor triads', () => {
    it('detects A minor (A3-C4-E4)', () => {
      const chord = analyzeChord(notes(57, 60, 64));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('A');
      expect(chord!.quality).toBe('Minor');
    });

    it('detects D minor (D4-F4-A4)', () => {
      const chord = analyzeChord(notes(62, 65, 69));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('D');
      expect(chord!.quality).toBe('Minor');
    });

    it('detects E minor (E3-G3-B3)', () => {
      const chord = analyzeChord(notes(52, 55, 59));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('E');
      expect(chord!.quality).toBe('Minor');
    });
  });

  describe('7th chords', () => {
    it('detects G dominant 7 (G3-B3-D4-F4)', () => {
      const chord = analyzeChord(notes(55, 59, 62, 65));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('G');
      expect(chord!.quality).toBe('Dominant7');
    });

    it('detects A minor 7 (A3-C4-E4-G4)', () => {
      const chord = analyzeChord(notes(57, 60, 64, 67));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('A');
      expect(chord!.quality).toBe('Minor7');
    });

    it('detects C major 7 (C4-E4-G4-B4)', () => {
      const chord = analyzeChord(notes(60, 64, 67, 71));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('C');
      expect(chord!.quality).toBe('Major7');
    });
  });

  describe('suspended chords', () => {
    it('detects C sus2 (C4-D4-G4)', () => {
      const chord = analyzeChord(notes(60, 62, 67));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('C');
      expect(chord!.quality).toBe('Sus2');
    });

    it('detects C sus4 (C4-F4-G4)', () => {
      const chord = analyzeChord(notes(60, 65, 67));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('C');
      expect(chord!.quality).toBe('Sus4');
    });

    it('detects G sus4 (G3-C4-D4)', () => {
      const chord = analyzeChord(notes(55, 60, 62));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('G');
      expect(chord!.quality).toBe('Sus4');
    });
  });

  describe('diminished and augmented', () => {
    it('detects B diminished (B3-D4-F4)', () => {
      const chord = analyzeChord(notes(59, 62, 65));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('B');
      expect(chord!.quality).toBe('Diminished');
    });

    it('detects C augmented (C4-E4-G#4)', () => {
      const chord = analyzeChord(notes(60, 64, 68));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('C');
      expect(chord!.quality).toBe('Augmented');
    });
  });

  describe('inversions', () => {
    it('detects C major first inversion (E3-G3-C4)', () => {
      const chord = analyzeChord(notes(52, 55, 60));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('C');
      expect(chord!.quality).toBe('Major');
    });

    it('detects C major second inversion (G3-C4-E4)', () => {
      const chord = analyzeChord(notes(55, 60, 64));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('C');
      expect(chord!.quality).toBe('Major');
    });

    it('detects A minor first inversion (C4-E4-A4)', () => {
      const chord = analyzeChord(notes(60, 64, 69));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('A');
      expect(chord!.quality).toBe('Minor');
    });
  });

  describe('edge cases', () => {
    it('returns null for fewer than 3 notes', () => {
      expect(analyzeChord(notes(60, 64))).toBeNull();
    });

    it('returns null for single note', () => {
      expect(analyzeChord(notes(60))).toBeNull();
    });

    it('returns null for empty array', () => {
      expect(analyzeChord([])).toBeNull();
    });

    it('returns null for 3 notes with duplicate pitch classes only', () => {
      // C4, C5, C3 — all same pitch class
      expect(analyzeChord(notes(60, 72, 48))).toBeNull();
    });

    it('handles duplicate pitch classes in different octaves', () => {
      // C4-E4-G4-C5 — still C major
      const chord = analyzeChord(notes(60, 64, 67, 72));
      expect(chord).not.toBeNull();
      expect(chord!.root).toBe('C');
      expect(chord!.quality).toBe('Major');
    });

    it('chord timestamp is the earliest note timestamp', () => {
      const chord = analyzeChord(notes(60, 64, 67));
      expect(chord!.timestamp).toBe(1000);
    });
  });
});

describe('chordDisplayName', () => {
  it('formats major chord', () => {
    const chord = analyzeChord(notes(60, 64, 67))!;
    expect(chordDisplayName(chord)).toBe('Cmaj');
  });

  it('formats minor chord', () => {
    const chord = analyzeChord(notes(57, 60, 64))!;
    expect(chordDisplayName(chord)).toBe('Am');
  });

  it('formats dominant 7 chord', () => {
    const chord = analyzeChord(notes(55, 59, 62, 65))!;
    expect(chordDisplayName(chord)).toBe('G7');
  });

  it('formats sus4 chord', () => {
    const chord = analyzeChord(notes(60, 65, 67))!;
    expect(chordDisplayName(chord)).toBe('Csus4');
  });
});

describe('updateProgression', () => {
  it('creates new progression from null', () => {
    const chord = analyzeChord(notes(60, 64, 67))!;
    const progression = updateProgression(chord, null);
    expect(progression.chords).toHaveLength(1);
    expect(progression.startTimestamp).toBe(chord.timestamp);
    expect(progression.endTimestamp).toBe(chord.timestamp);
  });

  it('appends chord to existing progression', () => {
    const chord1 = analyzeChord(notes(60, 64, 67))!;
    const chord2 = analyzeChord([57, 60, 64].map((n) => detectNote(n, 100, 2000)))!;

    const prog1 = updateProgression(chord1, null);
    const prog2 = updateProgression(chord2, prog1);
    expect(prog2.chords).toHaveLength(2);
    expect(prog2.startTimestamp).toBe(chord1.timestamp);
    expect(prog2.endTimestamp).toBe(chord2.timestamp);
  });

  it('builds a multi-chord progression (C -> Am -> F -> G)', () => {
    const chords = [
      analyzeChord(notes(60, 64, 67))!, // C
      analyzeChord([57, 60, 64].map((n) => detectNote(n, 100, 2000)))!, // Am
      analyzeChord([53, 57, 60].map((n) => detectNote(n, 100, 3000)))!, // F
      analyzeChord([55, 59, 62].map((n) => detectNote(n, 100, 4000)))!, // G
    ];

    let progression: ChordProgression | null = null;
    for (const chord of chords) {
      progression = updateProgression(chord, progression);
    }

    expect(progression!.chords).toHaveLength(4);
    expect(progression!.chords.map((c) => c.root)).toEqual(['C', 'A', 'F', 'G']);
  });
});
