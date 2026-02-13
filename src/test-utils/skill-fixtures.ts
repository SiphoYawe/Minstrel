import type { SessionPerformanceData } from '@/features/difficulty/difficulty-types';

export function createBeginnerFixture(): SessionPerformanceData {
  return {
    timingEvents: Array.from({ length: 8 }, (_, i) => ({
      noteTimestamp: i * 500,
      expectedBeatTimestamp: i * 500,
      deviationMs: 80 + Math.random() * 40, // large deviations
      beatIndex: i,
    })),
    tempoSegments: [{ bpm: 70, startTimestamp: 0, endTimestamp: 4000, noteCount: 8 }],
    detectedChords: [
      { root: 'C', quality: 'Major' as const, notes: [], timestamp: 0 },
      { root: 'G', quality: 'Major' as const, notes: [], timestamp: 1000 },
      { root: 'F', quality: 'Major' as const, notes: [], timestamp: 2000 },
    ],
    genrePatterns: [],
    playingTendencies: null,
    avoidancePatterns: null,
    noteCount: 8,
    uniqueNoteRange: 12, // 1 octave
    maxCleanTempoBpm: 60,
    timingAccuracy: 25, // 25%
  };
}

export function createIntermediateFixture(): SessionPerformanceData {
  return {
    timingEvents: Array.from({ length: 30 }, (_, i) => ({
      noteTimestamp: i * 250,
      expectedBeatTimestamp: i * 250,
      deviationMs: 15 + Math.random() * 10,
      beatIndex: i,
    })),
    tempoSegments: [{ bpm: 110, startTimestamp: 0, endTimestamp: 7500, noteCount: 30 }],
    detectedChords: [
      { root: 'D', quality: 'Minor7' as const, notes: [], timestamp: 0 },
      { root: 'G', quality: 'Dominant7' as const, notes: [], timestamp: 500 },
      { root: 'C', quality: 'Major7' as const, notes: [], timestamp: 1000 },
      { root: 'A', quality: 'Minor' as const, notes: [], timestamp: 1500 },
      { root: 'E', quality: 'Augmented' as const, notes: [], timestamp: 2000 },
    ],
    genrePatterns: [{ genre: 'Jazz', confidence: 0.8, matchedPatterns: ['ii-V-I'] }],
    playingTendencies: {
      keyDistribution: { C: 10, G: 5, Am: 3, Dm: 2, F: 1 },
      chordTypeDistribution: { Minor7: 8, Dominant7: 6, Major7: 4 },
      tempoHistogram: [100, 110, 120],
      intervalDistribution: { 2: 3, 3: 5, 4: 4, 5: 3, 7: 2, 9: 1 },
      rhythmProfile: { swingRatio: 1.3, commonSubdivisions: ['eighth'], averageDensity: 3 },
    },
    avoidancePatterns: null,
    noteCount: 30,
    uniqueNoteRange: 24, // 2 octaves
    maxCleanTempoBpm: 120,
    timingAccuracy: 72,
  };
}

export function createAdvancedFixture(): SessionPerformanceData {
  return {
    timingEvents: Array.from({ length: 60 }, (_, i) => ({
      noteTimestamp: i * 200,
      expectedBeatTimestamp: i * 200,
      deviationMs: 5 + Math.random() * 5,
      beatIndex: i,
    })),
    tempoSegments: [{ bpm: 160, startTimestamp: 0, endTimestamp: 12000, noteCount: 60 }],
    detectedChords: [
      { root: 'D', quality: 'Minor7' as const, notes: [], timestamp: 0 },
      { root: 'G', quality: 'Dominant7' as const, notes: [], timestamp: 500 },
      { root: 'C', quality: 'Major7' as const, notes: [], timestamp: 1000 },
      { root: 'F#', quality: 'Diminished' as const, notes: [], timestamp: 1500 },
      { root: 'B', quality: 'Augmented' as const, notes: [], timestamp: 2000 },
      { root: 'E', quality: 'Minor7' as const, notes: [], timestamp: 2500 },
      { root: 'A', quality: 'Sus4' as const, notes: [], timestamp: 3000 },
      { root: 'D', quality: 'Sus2' as const, notes: [], timestamp: 3500 },
    ],
    genrePatterns: [
      { genre: 'Jazz', confidence: 0.9, matchedPatterns: ['ii-V-I', 'tritone-sub'] },
      { genre: 'Blues', confidence: 0.5, matchedPatterns: ['12-bar'] },
    ],
    playingTendencies: {
      keyDistribution: { C: 10, G: 8, Dm: 7, Am: 6, F: 5, Bb: 4, Eb: 3 },
      chordTypeDistribution: {
        Minor7: 10,
        Dominant7: 8,
        Major7: 6,
        Diminished: 4,
        Augmented: 3,
        Sus4: 2,
      },
      tempoHistogram: [100, 120, 140, 160],
      intervalDistribution: { 1: 2, 2: 4, 3: 6, 4: 5, 5: 4, 6: 3, 7: 3, 9: 2, 10: 1, 11: 1 },
      rhythmProfile: {
        swingRatio: 1.5,
        commonSubdivisions: ['eighth', 'triplet', 'sixteenth'],
        averageDensity: 5,
      },
    },
    avoidancePatterns: null,
    noteCount: 60,
    uniqueNoteRange: 36, // 3 octaves
    maxCleanTempoBpm: 170,
    timingAccuracy: 92,
  };
}
