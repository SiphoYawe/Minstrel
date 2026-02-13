import { describe, it, expect } from 'vitest';
import { trackTendencies, detectAvoidance } from './tendency-tracker';
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

function createAccumulator(
  notes: DetectedNote[],
  chords: DetectedChord[],
  tempoSegments: AnalysisAccumulator['tempoSegments'] = []
): AnalysisAccumulator {
  return {
    notes,
    chords,
    tempoSegments,
    keySegments: [],
    totalNoteCount: notes.length,
    totalChordCount: chords.length,
    startTimestamp: notes.length > 0 ? notes[0].timestamp : 0,
    lastTimestamp: notes.length > 0 ? notes[notes.length - 1].timestamp : 0,
  };
}

describe('trackTendencies', () => {
  it('computes key distribution from notes', () => {
    // Play only C major scale notes
    const cMajor = [60, 62, 64, 65, 67, 69, 71]; // C D E F G A B
    const notes = cMajor.map((m, i) => note(m, i * 100));
    const acc = createAccumulator(notes, []);
    const tendencies = trackTendencies(acc);

    // C should have the highest count (or equal to others in the scale)
    expect(tendencies.keyDistribution['C']).toBe(1);
    expect(tendencies.keyDistribution['D']).toBe(1);
    // Non-scale notes should be 0
    expect(tendencies.keyDistribution['C#']).toBe(0);
    expect(tendencies.keyDistribution['D#']).toBe(0);
  });

  it('computes chord type distribution', () => {
    const chords = [
      chord('C', 'Major', [60, 64, 67], 0),
      chord('D', 'Minor', [62, 65, 69], 500),
      chord('G', 'Major', [67, 71, 74], 1000),
      chord('A', 'Minor', [57, 60, 64], 1500),
    ];
    const acc = createAccumulator([], chords);
    const tendencies = trackTendencies(acc);

    expect(tendencies.chordTypeDistribution['Major']).toBe(2);
    expect(tendencies.chordTypeDistribution['Minor']).toBe(2);
    expect(tendencies.chordTypeDistribution['Dominant7']).toBe(0);
  });

  it('computes tempo histogram from segments', () => {
    const tempoSegments = [
      { bpm: 120, startTimestamp: 0, endTimestamp: 5000, noteCount: 20 },
      { bpm: 125, startTimestamp: 5000, endTimestamp: 10000, noteCount: 15 },
      { bpm: 80, startTimestamp: 10000, endTimestamp: 15000, noteCount: 10 },
    ];
    const acc = createAccumulator([], [], tempoSegments);
    const tendencies = trackTendencies(acc);

    // 120 BPM → bucket (120-40)/10 = 8
    // 125 BPM → bucket (125-40)/10 = 8 (same bucket)
    // 80 BPM → bucket (80-40)/10 = 4
    expect(tendencies.tempoHistogram[8]).toBe(35); // 20 + 15
    expect(tendencies.tempoHistogram[4]).toBe(10);
  });

  it('computes interval distribution', () => {
    // C4 → E4 → G4 = intervals 4, 3
    const notes = [note(60, 0), note(64, 100), note(67, 200)];
    const acc = createAccumulator(notes, []);
    const tendencies = trackTendencies(acc);

    expect(tendencies.intervalDistribution[4]).toBe(1); // C→E
    expect(tendencies.intervalDistribution[3]).toBe(1); // E→G
  });

  it('computes rhythm profile with average density', () => {
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 20; i++) {
      notes.push(note(60, i * 250)); // 4 notes per second
    }
    const acc = createAccumulator(notes, []);
    const tendencies = trackTendencies(acc);

    // Duration = (19 * 250) = 4750ms, 20 notes → ~4.2 notes/sec
    expect(tendencies.rhythmProfile.averageDensity).toBeGreaterThan(3);
    expect(tendencies.rhythmProfile.averageDensity).toBeLessThan(5);
  });

  it('detects swing rhythm profile', () => {
    // Create long-short pairs (swing feel)
    const notes: DetectedNote[] = [];
    let ts = 0;
    for (let i = 0; i < 20; i++) {
      notes.push(note(60, ts));
      ts += i % 2 === 0 ? 300 : 150; // 2:1 long-short ratio
    }
    const acc = createAccumulator(notes, []);
    const tendencies = trackTendencies(acc);

    expect(tendencies.rhythmProfile.swingRatio).toBeGreaterThan(0.3);
  });

  it('returns zero swing for straight rhythm', () => {
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 20; i++) {
      notes.push(note(60, i * 250)); // Perfectly even
    }
    const acc = createAccumulator(notes, []);
    const tendencies = trackTendencies(acc);

    expect(tendencies.rhythmProfile.swingRatio).toBe(0);
  });

  it('detects quarter note subdivisions from even spacing', () => {
    // Steady quarter notes at 250ms apart
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 20; i++) {
      notes.push(note(60, i * 250));
    }
    const acc = createAccumulator(notes, []);
    const tendencies = trackTendencies(acc);

    expect(tendencies.rhythmProfile.commonSubdivisions).toContain('quarter');
  });

  it('returns empty subdivisions with insufficient notes', () => {
    const notes = [note(60, 0), note(62, 100)];
    const acc = createAccumulator(notes, []);
    const tendencies = trackTendencies(acc);

    expect(tendencies.rhythmProfile.commonSubdivisions).toEqual([]);
  });
});

describe('detectAvoidance', () => {
  it('returns empty patterns with insufficient data', () => {
    const notes = [note(60, 0)];
    const acc = createAccumulator(notes, []);
    const tendencies = trackTendencies(acc);
    const avoidance = detectAvoidance(tendencies, acc);

    expect(avoidance.avoidedKeys).toEqual([]);
    expect(avoidance.avoidedChordTypes).toEqual([]);
    expect(avoidance.avoidedTempoRanges).toEqual([]);
    expect(avoidance.avoidedIntervals).toEqual([]);
  });

  it('detects avoided keys with sufficient data', () => {
    // Play 200+ notes only in C major (no sharps/flats)
    const cMajor = [60, 62, 64, 65, 67, 69, 71];
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 210; i++) {
      notes.push(note(cMajor[i % cMajor.length], i * 50));
    }

    // Need 50+ chords too
    const chords: DetectedChord[] = [];
    for (let i = 0; i < 55; i++) {
      chords.push(chord('C', 'Major', [60, 64, 67], i * 200));
    }

    const acc = createAccumulator(notes, chords);
    const tendencies = trackTendencies(acc);
    const avoidance = detectAvoidance(tendencies, acc);

    // F#, C#, D#, G#, A# should be avoided (never played)
    expect(avoidance.avoidedKeys).toContain('C#');
    expect(avoidance.avoidedKeys).toContain('F#');
    expect(avoidance.avoidedKeys).toContain('G#');
    expect(avoidance.avoidedKeys).not.toContain('C');
  });

  it('detects avoided chord types', () => {
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 210; i++) {
      notes.push(note(60 + (i % 12), i * 50));
    }

    // Only play Major chords
    const chords: DetectedChord[] = [];
    for (let i = 0; i < 55; i++) {
      chords.push(chord('C', 'Major', [60, 64, 67], i * 200));
    }

    const acc = createAccumulator(notes, chords);
    const tendencies = trackTendencies(acc);
    const avoidance = detectAvoidance(tendencies, acc);

    // All non-Major chord types should be avoided
    expect(avoidance.avoidedChordTypes).toContain('Minor');
    expect(avoidance.avoidedChordTypes).toContain('Dominant7');
    expect(avoidance.avoidedChordTypes).not.toContain('Major');
  });

  it('detects avoided tempo ranges (gaps in histogram)', () => {
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 210; i++) {
      notes.push(note(60, i * 50));
    }
    const chords: DetectedChord[] = [];
    for (let i = 0; i < 55; i++) {
      chords.push(chord('C', 'Major', [60, 64, 67], i * 200));
    }

    // Tempo segments: 80 BPM and 120 BPM but nothing at 90-100
    const tempoSegments = [
      { bpm: 80, startTimestamp: 0, endTimestamp: 5000, noteCount: 20 },
      { bpm: 120, startTimestamp: 5000, endTimestamp: 10000, noteCount: 20 },
    ];
    const acc = createAccumulator(notes, chords, tempoSegments);
    const tendencies = trackTendencies(acc);
    const avoidance = detectAvoidance(tendencies, acc);

    // There should be gaps between 80 and 120 BPM buckets
    expect(avoidance.avoidedTempoRanges.length).toBeGreaterThan(0);
  });

  it('detects avoided intervals', () => {
    // Play only unisons and octaves (intervals 0 and 12)
    const notes: DetectedNote[] = [];
    for (let i = 0; i < 210; i++) {
      notes.push(note(i % 2 === 0 ? 60 : 72, i * 50)); // Alternating C4 and C5
    }
    const chords: DetectedChord[] = [];
    for (let i = 0; i < 55; i++) {
      chords.push(chord('C', 'Major', [60, 64, 67], i * 200));
    }

    const acc = createAccumulator(notes, chords);
    const tendencies = trackTendencies(acc);
    const avoidance = detectAvoidance(tendencies, acc);

    // Intervals 1-11 should all be avoided (only interval 12 is played)
    expect(avoidance.avoidedIntervals).toContain(1);
    expect(avoidance.avoidedIntervals).toContain(5);
    expect(avoidance.avoidedIntervals).toContain(7);
    expect(avoidance.avoidedIntervals).not.toContain(12);
  });
});
