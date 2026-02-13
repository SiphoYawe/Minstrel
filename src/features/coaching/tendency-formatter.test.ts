import { describe, it, expect } from 'vitest';
import { formatTendenciesForPrompt } from './tendency-formatter';
import type { PlayingTendencies, AvoidancePatterns } from '@/features/analysis/analysis-types';

const mockTendencies: PlayingTendencies = {
  keyDistribution: { C: 10, G: 5, Am: 3 },
  chordTypeDistribution: { Major: 12, Minor: 6 },
  tempoHistogram: [85, 90, 95, 100],
  intervalDistribution: { 3: 5, 5: 3 },
  rhythmProfile: { swingRatio: 1, commonSubdivisions: [], averageDensity: 1 },
};

const mockAvoidances: AvoidancePatterns = {
  avoidedKeys: ['F#', 'Bb'],
  avoidedChordTypes: ['Diminished', 'Augmented'],
  avoidedTempoRanges: [],
  avoidedIntervals: [],
};

describe('formatTendenciesForPrompt', () => {
  it('returns placeholder when no data', () => {
    const result = formatTendenciesForPrompt(null, null);
    expect(result).toContain('Not enough session data');
  });

  it('formats key distribution', () => {
    const result = formatTendenciesForPrompt(mockTendencies, null);
    expect(result).toContain('Most played keys');
    expect(result).toContain('C');
  });

  it('formats chord type distribution', () => {
    const result = formatTendenciesForPrompt(mockTendencies, null);
    expect(result).toContain('Most played chord types');
    expect(result).toContain('Major');
  });

  it('formats tempo range', () => {
    const result = formatTendenciesForPrompt(mockTendencies, null);
    expect(result).toContain('Tempo range');
    expect(result).toContain('85');
    expect(result).toContain('100');
  });

  it('formats avoidance patterns', () => {
    const result = formatTendenciesForPrompt(null, mockAvoidances);
    expect(result).toContain('Avoided keys');
    expect(result).toContain('F#');
    expect(result).toContain('Avoided chord types');
    expect(result).toContain('Diminished');
  });

  it('combines tendencies and avoidances', () => {
    const result = formatTendenciesForPrompt(mockTendencies, mockAvoidances);
    expect(result).toContain('Most played keys');
    expect(result).toContain('Avoided keys');
  });
});
