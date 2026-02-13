import { describe, it, expect } from 'vitest';
import { getTerminologyForGenre, getGenreTerminologyHints } from './genre-terminology';

describe('getTerminologyForGenre', () => {
  it('returns Jazz terminology for "Jazz"', () => {
    const t = getTerminologyForGenre('Jazz');
    expect(t.genre).toBe('Jazz');
    expect(t.conceptTerms['substitution']).toBe('tritone substitution');
    expect(t.conceptTerms['accompaniment']).toBe('comping');
    expect(t.commonProgressions).toContain('ii-V-I');
  });

  it('returns Blues terminology for "Blues"', () => {
    const t = getTerminologyForGenre('Blues');
    expect(t.genre).toBe('Blues');
    expect(t.conceptTerms['form']).toBe('12-bar blues');
    expect(t.conceptTerms['expression']).toBe('bend');
    expect(t.conceptTerms['note']).toBe('blue note');
  });

  it('returns Pop/Rock terminology for "Rock"', () => {
    const t = getTerminologyForGenre('Rock');
    expect(t.genre).toBe('Pop/Rock');
    expect(t.conceptTerms['riff']).toBe('riff');
    expect(t.conceptTerms['technique']).toBe('palm mute');
  });

  it('returns Pop/Rock terminology for "Pop"', () => {
    const t = getTerminologyForGenre('Pop');
    expect(t.genre).toBe('Pop/Rock');
  });

  it('returns Classical terminology for "Classical"', () => {
    const t = getTerminologyForGenre('Classical');
    expect(t.genre).toBe('Classical');
    expect(t.conceptTerms['harmony']).toBe('counterpoint');
    expect(t.conceptTerms['cadence']).toBe('cadence');
  });

  it('returns R&B/Soul terminology', () => {
    const t = getTerminologyForGenre('R&B/Soul');
    expect(t.genre).toBe('R&B/Soul');
    expect(t.conceptTerms['timing']).toBe('syncopation');

    const t2 = getTerminologyForGenre('R&B');
    expect(t2.genre).toBe('R&B/Soul');

    const t3 = getTerminologyForGenre('Soul');
    expect(t3.genre).toBe('R&B/Soul');
  });

  it('returns Generic for null genre', () => {
    const t = getTerminologyForGenre(null);
    expect(t.genre).toBe('Generic');
    expect(Object.keys(t.chordTerms)).toHaveLength(0);
  });

  it('returns Generic for unknown genre', () => {
    const t = getTerminologyForGenre('Grindcore');
    expect(t.genre).toBe('Generic');
  });
});

describe('getGenreTerminologyHints', () => {
  it('returns empty string for null genre', () => {
    expect(getGenreTerminologyHints(null)).toBe('');
  });

  it('returns hints for Jazz', () => {
    const hints = getGenreTerminologyHints('Jazz');
    expect(hints).toContain('Key terms');
    expect(hints).toContain('tritone substitution');
    expect(hints).toContain('ii-V-I');
    expect(hints).toContain('swing feel');
  });

  it('returns hints for Blues', () => {
    const hints = getGenreTerminologyHints('Blues');
    expect(hints).toContain('12-bar blues');
    expect(hints).toContain('shuffle');
  });
});
