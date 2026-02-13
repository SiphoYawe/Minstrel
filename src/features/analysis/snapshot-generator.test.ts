import { describe, it, expect, vi } from 'vitest';
import { generateSnapshot, generateKeyInsight, applyGrowthMindset } from './snapshot-generator';
import type { SnapshotInput } from './snapshot-generator';
import type {
  DetectedChord,
  DetectedNote,
  GenrePattern,
  PlayingTendencies,
  AvoidancePatterns,
} from './analysis-types';

function note(midi: number, ts: number): DetectedNote {
  return { name: '', octave: 0, midiNumber: midi, velocity: 100, timestamp: ts };
}

function chord(root: string, quality: DetectedChord['quality'], ts: number): DetectedChord {
  return { root, quality, notes: [note(60, ts)], timestamp: ts };
}

function fullInput(): SnapshotInput {
  return {
    currentKey: { root: 'C', mode: 'major', confidence: 0.9 },
    detectedChords: [
      chord('C', 'Major', 0),
      chord('F', 'Major', 500),
      chord('G', 'Major', 1000),
      chord('C', 'Major', 1500),
      chord('Am', 'Minor', 3000),
    ],
    timingAccuracy: 82,
    currentTempo: 120,
    detectedGenres: [
      { genre: 'Pop', confidence: 0.6, matchedPatterns: ['chord-progression'] },
    ] as GenrePattern[],
    playingTendencies: {
      keyDistribution: {
        C: 10,
        D: 5,
        E: 3,
        F: 4,
        G: 5,
        A: 2,
        B: 1,
        'C#': 0,
        'D#': 0,
        'F#': 0,
        'G#': 0,
        'A#': 0,
      },
      chordTypeDistribution: {
        Major: 4,
        Minor: 1,
        Dominant7: 0,
        Minor7: 0,
        Major7: 0,
        Sus2: 0,
        Sus4: 0,
        Diminished: 0,
        Augmented: 0,
      },
      tempoHistogram: new Array(16).fill(0),
      intervalDistribution: new Array(13).fill(0),
      rhythmProfile: { averageDensity: 4.2, swingRatio: 0, commonSubdivisions: [] },
    } as PlayingTendencies,
    avoidancePatterns: {
      avoidedKeys: ['C#', 'D#', 'F#', 'G#', 'A#'],
      avoidedChordTypes: [
        'Dominant7',
        'Minor7',
        'Major7',
        'Sus2',
        'Sus4',
        'Diminished',
        'Augmented',
      ],
      avoidedTempoRanges: [],
      avoidedIntervals: [],
    } as AvoidancePatterns,
  };
}

describe('applyGrowthMindset', () => {
  it('replaces banned words with positive alternatives', () => {
    expect(applyGrowthMindset('That was wrong')).toBe('That was not yet there');
    expect(applyGrowthMindset('You failed the test')).toBe('You in progress the test');
    expect(applyGrowthMindset('Bad timing')).toBe('Developing timing');
    expect(applyGrowthMindset('Timing error detected')).toBe('Timing opportunity detected');
  });

  it('is case insensitive and preserves capitalization', () => {
    expect(applyGrowthMindset('WRONG note')).toBe('Not yet there note');
    expect(applyGrowthMindset('Failed attempt')).toBe('In progress attempt');
  });

  it('returns unchanged text when no banned words present', () => {
    const text = 'Great session in C major at 120 BPM';
    expect(applyGrowthMindset(text)).toBe(text);
  });
});

describe('generateSnapshot', () => {
  it('produces snapshot with all fields populated from complete data', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' });
    const input = fullInput();
    const snapshot = generateSnapshot(input);

    expect(snapshot.id).toBe('test-uuid-1234');
    expect(snapshot.key).toEqual(input.currentKey);
    expect(snapshot.chordsUsed.length).toBeGreaterThan(0);
    expect(snapshot.timingAccuracy).toBe(82);
    expect(snapshot.averageTempo).toBe(120);
    expect(snapshot.keyInsight.length).toBeGreaterThan(0);
    expect(snapshot.genrePatterns).toEqual(input.detectedGenres);
    expect(snapshot.timestamp).toBeGreaterThan(0);
    expect(snapshot.insightCategory).toBeDefined();
    vi.unstubAllGlobals();
  });

  it('produces valid snapshot with partial data (null tempo)', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-partial' });
    const input = fullInput();
    input.currentTempo = null;
    input.currentKey = null;
    input.detectedChords = [];
    input.detectedGenres = [];

    const snapshot = generateSnapshot(input);

    expect(snapshot.id).toBe('test-uuid-partial');
    expect(snapshot.key).toBeNull();
    expect(snapshot.averageTempo).toBeNull();
    expect(snapshot.chordsUsed).toEqual([]);
    expect(snapshot.keyInsight.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it('limits chordsUsed to last 20', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-limit' });
    const input = fullInput();
    input.detectedChords = Array.from({ length: 30 }, (_, i) => chord('C', 'Major', i * 100));

    const snapshot = generateSnapshot(input);
    expect(snapshot.chordsUsed).toHaveLength(20);
    vi.unstubAllGlobals();
  });

  it('applies growth mindset language to insight text', () => {
    const banned = ['wrong', 'failed', 'bad', 'error'];
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-mindset' });
    const input = fullInput();
    const snapshot = generateSnapshot(input);

    for (const word of banned) {
      expect(snapshot.keyInsight.toLowerCase()).not.toContain(word);
    }
    vi.unstubAllGlobals();
  });
});

describe('generateKeyInsight', () => {
  it('prioritizes timing insight when accuracy is below 95%', () => {
    const input = fullInput();
    input.timingAccuracy = 78;

    const { insight, category } = generateKeyInsight(input);

    expect(category).toBe('TIMING');
    expect(insight.length).toBeGreaterThan(0);
  });

  it('produces chord-transition timing insight with ms and chord names', () => {
    const input = fullInput();
    input.timingAccuracy = 70;
    input.currentTempo = 100;
    input.detectedChords = [
      chord('C', 'Major', 0),
      chord('F', 'Major', 400),
      chord('G', 'Major', 800),
      chord('Am', 'Minor', 2500), // big gap → slowest transition
    ];

    const { insight, category } = generateKeyInsight(input);

    expect(category).toBe('TIMING');
    expect(insight).toMatch(/\d+ms/);
    expect(insight).toContain('transition');
  });

  it('returns generic timing insight when tempo is null', () => {
    const input = fullInput();
    input.timingAccuracy = 60;
    input.currentTempo = null;

    const { insight, category } = generateKeyInsight(input);

    expect(category).toBe('TIMING');
    expect(insight).toContain('60%');
  });

  it('returns harmonic insight when timing is good but chords are limited', () => {
    const input = fullInput();
    input.timingAccuracy = 97;
    input.currentTempo = 120;
    input.detectedChords = [
      chord('C', 'Major', 0),
      chord('C', 'Major', 500),
      chord('C', 'Major', 1000),
      chord('C', 'Major', 1500),
    ];
    input.avoidancePatterns = null;

    const { category } = generateKeyInsight(input);
    expect(category).toBe('HARMONIC');
  });

  it('returns tendency insight when timing and harmony are not noteworthy', () => {
    const input = fullInput();
    input.timingAccuracy = 97;
    input.currentTempo = null;
    input.detectedChords = [
      chord('C', 'Major', 0),
      chord('F', 'Minor', 500),
      chord('G', 'Dominant7', 1000),
    ];

    const { category } = generateKeyInsight(input);
    expect(category).toBe('TENDENCY');
  });

  it('returns general insight as fallback when no specific data', () => {
    const input: SnapshotInput = {
      currentKey: { root: 'G', mode: 'major', confidence: 0.8 },
      detectedChords: [],
      timingAccuracy: 100,
      currentTempo: 100,
      detectedGenres: [],
      playingTendencies: null,
      avoidancePatterns: null,
    };

    const { insight, category } = generateKeyInsight(input);
    expect(category).toBe('GENERAL');
    expect(insight).toContain('G major');
    expect(insight).toContain('100 BPM');
  });

  it('insight contains specific data values, not just generic text', () => {
    const input = fullInput();
    input.timingAccuracy = 78;

    const { insight } = generateKeyInsight(input);

    // Should contain either a percentage, BPM, or chord name
    const hasSpecificData =
      /\d+%/.test(insight) || /\d+ms/.test(insight) || /\d+ BPM/.test(insight);
    expect(hasSpecificData).toBe(true);
  });

  it('no insight text contains banned growth mindset words', () => {
    const banned = ['wrong', 'failed', 'bad', 'error'];

    // Test multiple input configurations
    const configs = [fullInput()];
    configs[0].timingAccuracy = 50;

    for (const input of configs) {
      const { insight } = generateKeyInsight(input);
      for (const word of banned) {
        expect(insight.toLowerCase()).not.toContain(word);
      }
    }
  });
});

describe('snapshot uniqueness', () => {
  it('generates unique snapshots for different pauses', () => {
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2'),
    });

    const input1 = fullInput();
    const input2 = fullInput();
    input2.timingAccuracy = 95;
    input2.currentTempo = 140;

    const snap1 = generateSnapshot(input1);
    const snap2 = generateSnapshot(input2);

    expect(snap1.id).not.toBe(snap2.id);
    expect(snap1.timingAccuracy).not.toBe(snap2.timingAccuracy);
    vi.unstubAllGlobals();
  });
});
