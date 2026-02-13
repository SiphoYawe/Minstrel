import { describe, it, expect } from 'vitest';
import { detectGenrePatterns } from './genre-detector';
import type { AnalysisAccumulator, DetectedNote, DetectedChord } from './analysis-types';

function note(midi: number, ts: number): DetectedNote {
  return { name: '', octave: 0, midiNumber: midi, velocity: 100, timestamp: ts };
}

function chord(
  root: string,
  quality: DetectedChord['quality'],
  midis: number[],
  ts: number
): DetectedChord {
  return { root, quality, notes: midis.map((m) => note(m, ts)), timestamp: ts };
}

function createAccumulator(notes: DetectedNote[], chords: DetectedChord[]): AnalysisAccumulator {
  return {
    notes,
    chords,
    tempoSegments: [],
    keySegments: [],
    totalNoteCount: notes.length,
    totalChordCount: chords.length,
    startTimestamp: notes.length > 0 ? notes[0].timestamp : 0,
    lastTimestamp: notes.length > 0 ? notes[notes.length - 1].timestamp : 0,
  };
}

describe('detectGenrePatterns', () => {
  it('returns empty array with insufficient data', () => {
    const acc = createAccumulator([], []);
    expect(detectGenrePatterns(acc)).toEqual([]);
  });

  it('detects blues from I7-IV7-V7 progression with pentatonic notes', () => {
    // 12-bar blues in C: C7-C7-C7-C7 | F7-F7-C7-C7 | G7-F7-C7-G7
    const chords = [
      chord('C', 'Dominant7', [60, 64, 67, 70], 0),
      chord('C', 'Dominant7', [60, 64, 67, 70], 500),
      chord('C', 'Dominant7', [60, 64, 67, 70], 1000),
      chord('C', 'Dominant7', [60, 64, 67, 70], 1500),
      chord('F', 'Dominant7', [65, 69, 72, 75], 2000),
      chord('F', 'Dominant7', [65, 69, 72, 75], 2500),
      chord('C', 'Dominant7', [60, 64, 67, 70], 3000),
      chord('C', 'Dominant7', [60, 64, 67, 70], 3500),
      chord('G', 'Dominant7', [67, 71, 74, 77], 4000),
      chord('F', 'Dominant7', [65, 69, 72, 75], 4500),
      chord('C', 'Dominant7', [60, 64, 67, 70], 5000),
      chord('G', 'Dominant7', [67, 71, 74, 77], 5500),
    ];

    // Pentatonic notes (C minor pentatonic: C Eb F G Bb)
    const pentatonic = [60, 63, 65, 67, 70]; // C, Eb, F, G, Bb
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 30; i++) {
      // Swing rhythm: long-short pairs
      const ts = i * 200 + (i % 2 === 1 ? 80 : 0);
      notes.push(note(pentatonic[i % pentatonic.length], ts));
    }

    const acc = createAccumulator(notes, chords);
    const result = detectGenrePatterns(acc);

    const blues = result.find((r) => r.genre === 'Blues');
    expect(blues).toBeDefined();
    expect(blues!.confidence).toBeGreaterThan(0);
    expect(blues!.matchedPatterns.length).toBeGreaterThan(0);
  });

  it('detects jazz from ii-V-I progression with extended chords', () => {
    // ii-V-I in C: Dm7 - G7 - Cmaj7 repeated
    const chords = [
      chord('D', 'Minor7', [62, 65, 69, 72], 0),
      chord('G', 'Dominant7', [67, 71, 74, 77], 500),
      chord('C', 'Major7', [60, 64, 67, 71], 1000),
      chord('D', 'Minor7', [62, 65, 69, 72], 1500),
      chord('G', 'Dominant7', [67, 71, 74, 77], 2000),
      chord('C', 'Major7', [60, 64, 67, 71], 2500),
      chord('D', 'Minor7', [62, 65, 69, 72], 3000),
      chord('G', 'Dominant7', [67, 71, 74, 77], 3500),
      chord('C', 'Major7', [60, 64, 67, 71], 4000),
    ];

    // Chromatic jazz notes with swing
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 30; i++) {
      const ts = i * 200 + (i % 2 === 1 ? 80 : 0);
      notes.push(note(60 + (i % 12), ts)); // Chromatic movement
    }

    const acc = createAccumulator(notes, chords);
    const result = detectGenrePatterns(acc);

    const jazz = result.find((r) => r.genre === 'Jazz');
    expect(jazz).toBeDefined();
    expect(jazz!.confidence).toBeGreaterThan(0);
    expect(jazz!.matchedPatterns).toContain('chord-voicing');
  });

  it('detects pop from I-V-vi-IV with simple triads', () => {
    // I-V-vi-IV in C: C - G - Am - F repeated
    const chords = [
      chord('C', 'Major', [60, 64, 67], 0),
      chord('G', 'Major', [67, 71, 74], 500),
      chord('A', 'Minor', [57, 60, 64], 1000),
      chord('F', 'Major', [65, 69, 72], 1500),
      chord('C', 'Major', [60, 64, 67], 2000),
      chord('G', 'Major', [67, 71, 74], 2500),
      chord('A', 'Minor', [57, 60, 64], 3000),
      chord('F', 'Major', [65, 69, 72], 3500),
    ];

    // Major scale notes with steady straight rhythm
    const majorScale = [60, 62, 64, 65, 67, 69, 71];
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 30; i++) {
      notes.push(note(majorScale[i % majorScale.length], i * 250));
    }

    const acc = createAccumulator(notes, chords);
    const result = detectGenrePatterns(acc);

    const pop = result.find((r) => r.genre === 'Pop');
    expect(pop).toBeDefined();
    expect(pop!.confidence).toBeGreaterThan(0);
  });

  it('returns multiple genre matches with confidence scores', () => {
    // Generic I-IV-V progression (matches multiple genres)
    const chords = [
      chord('C', 'Major', [60, 64, 67], 0),
      chord('F', 'Major', [65, 69, 72], 500),
      chord('G', 'Major', [67, 71, 74], 1000),
      chord('C', 'Major', [60, 64, 67], 1500),
      chord('F', 'Major', [65, 69, 72], 2000),
      chord('G', 'Major', [67, 71, 74], 2500),
    ];

    const notes: DetectedNote[] = [];
    for (let i = 0; i < 20; i++) {
      notes.push(note(60 + (i % 7) * 2, i * 200));
    }

    const acc = createAccumulator(notes, chords);
    const result = detectGenrePatterns(acc);

    // Should return results sorted by confidence (descending)
    expect(result.length).toBeGreaterThan(0);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].confidence).toBeGreaterThanOrEqual(result[i].confidence);
    }
  });

  it('returns results sorted by confidence descending', () => {
    const chords = [
      chord('C', 'Major', [60, 64, 67], 0),
      chord('G', 'Major', [67, 71, 74], 500),
      chord('A', 'Minor', [57, 60, 64], 1000),
    ];
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 15; i++) {
      notes.push(note(60 + (i % 12), i * 200));
    }

    const acc = createAccumulator(notes, chords);
    const result = detectGenrePatterns(acc);

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].confidence).toBeGreaterThanOrEqual(result[i].confidence);
    }
  });
});
