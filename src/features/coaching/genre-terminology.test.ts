import { describe, it, expect } from 'vitest';
import { getTerminologyForGenre, getGenreTerminologyHints, GenreTerminology } from './genre-terminology';

function expectPopulatedTerminology(t: GenreTerminology) {
  expect(Object.keys(t.chordTerms).length).toBeGreaterThanOrEqual(3);
  expect(Object.keys(t.scaleTerms).length).toBeGreaterThanOrEqual(3);
  expect(Object.keys(t.conceptTerms).length).toBeGreaterThanOrEqual(3);
  expect(t.commonProgressions.length).toBeGreaterThanOrEqual(3);
  expect(t.styleDescriptors.length).toBeGreaterThanOrEqual(3);
}

describe('getTerminologyForGenre', () => {
  it('returns Jazz terminology for "Jazz"', () => {
    const t = getTerminologyForGenre('Jazz');
    expect(t.genre).toBe('Jazz');
    expect(t.conceptTerms['substitution']).toBe('tritone substitution');
    expect(t.conceptTerms['accompaniment']).toBe('comping');
    expect(t.commonProgressions).toContain('ii-V-I');
    expectPopulatedTerminology(t);
  });

  it('returns Blues terminology for "Blues"', () => {
    const t = getTerminologyForGenre('Blues');
    expect(t.genre).toBe('Blues');
    expect(t.conceptTerms['form']).toBe('12-bar blues');
    expect(t.conceptTerms['expression']).toBe('bend');
    expect(t.conceptTerms['note']).toBe('blue note');
    expectPopulatedTerminology(t);
  });

  it('returns Pop/Rock terminology for "Rock"', () => {
    const t = getTerminologyForGenre('Rock');
    expect(t.genre).toBe('Pop/Rock');
    expect(t.conceptTerms['riff']).toBe('riff');
    expect(t.conceptTerms['technique']).toBe('palm mute');
    expectPopulatedTerminology(t);
  });

  it('returns Pop/Rock terminology for "Pop"', () => {
    const t = getTerminologyForGenre('Pop');
    expect(t.genre).toBe('Pop/Rock');
    expectPopulatedTerminology(t);
  });

  it('returns Classical terminology for "Classical"', () => {
    const t = getTerminologyForGenre('Classical');
    expect(t.genre).toBe('Classical');
    expect(t.conceptTerms['harmony']).toBe('counterpoint');
    expect(t.conceptTerms['cadence']).toBe('cadence');
    expectPopulatedTerminology(t);
  });

  it('returns R&B/Soul terminology', () => {
    const t = getTerminologyForGenre('R&B/Soul');
    expect(t.genre).toBe('R&B/Soul');
    expect(t.conceptTerms['timing']).toBe('syncopation');
    expectPopulatedTerminology(t);

    const t2 = getTerminologyForGenre('R&B');
    expect(t2.genre).toBe('R&B/Soul');

    const t3 = getTerminologyForGenre('Soul');
    expect(t3.genre).toBe('R&B/Soul');
  });

  it('returns Funk terminology for "Funk"', () => {
    const t = getTerminologyForGenre('Funk');
    expect(t.genre).toBe('Funk');
    expect(t.conceptTerms['rhythm']).toBe('the one');
    expect(t.conceptTerms['bass']).toBe('slap bass');
    expect(t.conceptTerms['guitar']).toBe('chicken scratch');
    expect(t.conceptTerms['strumming']).toBe('muted strums');
    expect(t.conceptTerms['feel']).toBe('pocket');
    expect(t.conceptTerms['groove']).toBe('sixteenth-note groove');
    expect(t.conceptTerms['technique']).toBe('ghost notes');
    expect(t.chordTerms['effect']).toBe('envelope filter');
    expectPopulatedTerminology(t);
  });

  it('returns Latin terminology for "Latin"', () => {
    const t = getTerminologyForGenre('Latin');
    expect(t.genre).toBe('Latin');
    expect(t.chordTerms['montuno']).toBe('montuno chord pattern');
    expect(t.conceptTerms['rhythm']).toBe('clave');
    expect(t.conceptTerms['bass']).toBe('tumbao');
    expect(t.conceptTerms['feel']).toBe('son');
    expect(t.conceptTerms['pattern']).toBe('guajeo');
    expect(t.conceptTerms['groove']).toBe('cascara');
    expect(t.conceptTerms['dance']).toBe('guaguancó');
    expect(t.styleDescriptors).toContain('bossa nova');
    expect(t.styleDescriptors).toContain('salsa');
    expect(t.styleDescriptors).toContain('rumba');
    expectPopulatedTerminology(t);
  });

  it('returns Country terminology for "Country"', () => {
    const t = getTerminologyForGenre('Country');
    expect(t.genre).toBe('Country');
    expect(t.conceptTerms['form']).toBe('Nashville number system');
    expect(t.conceptTerms['instrument']).toBe('pedal steel');
    expect(t.conceptTerms['technique']).toBe("chicken pickin'");
    expect(t.conceptTerms['rhythm']).toBe('train beat');
    expect(t.conceptTerms['picking']).toBe('flatpicking');
    expect(t.conceptTerms['style']).toBe('telecaster twang');
    expect(t.styleDescriptors).toContain('honky-tonk');
    expect(t.styleDescriptors).toContain('Bakersfield sound');
    expectPopulatedTerminology(t);
  });

  it('returns Electronic terminology for "Electronic"', () => {
    const t = getTerminologyForGenre('Electronic');
    expect(t.genre).toBe('Electronic');
    expect(t.conceptTerms['sound']).toBe('synthesis');
    expect(t.conceptTerms['modulation']).toBe('filter sweep');
    expect(t.conceptTerms['effect']).toBe('sidechain');
    expect(t.conceptTerms['form']).toBe('build-drop');
    expect(t.conceptTerms['technique']).toBe('arpeggiation');
    expect(t.conceptTerms['sequencing']).toBe('sequencer');
    expect(t.conceptTerms['oscillator']).toBe('LFO');
    expect(t.conceptTerms['rhythm']).toBe('4-on-the-floor');
    expect(t.conceptTerms['structure']).toBe('breakdown');
    expectPopulatedTerminology(t);
  });

  it('returns Gospel terminology for "Gospel"', () => {
    const t = getTerminologyForGenre('Gospel');
    expect(t.genre).toBe('Gospel');
    expect(t.chordTerms['shout']).toBe('shout chord');
    expect(t.chordTerms['diminished']).toBe('passing diminished');
    expect(t.chordTerms['tritoneSub']).toBe('tritone substitution');
    expect(t.conceptTerms['progression']).toBe('worship progression');
    expect(t.conceptTerms['interaction']).toBe('call and response');
    expect(t.conceptTerms['bass']).toBe('walk-up bass');
    expect(t.conceptTerms['vocal']).toBe('melisma');
    expectPopulatedTerminology(t);
  });

  it('returns Metal terminology for "Metal"', () => {
    const t = getTerminologyForGenre('Metal');
    expect(t.genre).toBe('Metal');
    expect(t.conceptTerms['technique']).toBe('palm mute');
    expect(t.conceptTerms['rhythm']).toBe('gallop picking');
    expect(t.chordTerms['power']).toBe('power chord');
    expect(t.chordTerms['tritone']).toBe('tritone');
    expect(t.conceptTerms['drums']).toBe('blast beat');
    expect(t.conceptTerms['speed']).toBe('tremolo picking');
    expect(t.conceptTerms['tuning']).toBe('drop tuning');
    expect(t.conceptTerms['kick']).toBe('double bass');
    expectPopulatedTerminology(t);
  });

  it('returns Folk terminology for "Folk"', () => {
    const t = getTerminologyForGenre('Folk');
    expect(t.genre).toBe('Folk');
    expect(t.conceptTerms['technique']).toBe('fingerpicking');
    expect(t.chordTerms['open']).toBe('open tuning chord');
    expect(t.conceptTerms['style']).toBe('drone');
    expect(t.scaleTerms['modal']).toBe('modal scale');
    expect(t.conceptTerms['rhythm']).toBe('Travis picking');
    expect(t.conceptTerms['tuning']).toBe('DADGAD');
    expect(t.conceptTerms['ornamentation']).toBe('Celtic ornamentation');
    expect(t.styleDescriptors).toContain('Appalachian style');
    expectPopulatedTerminology(t);
  });

  it('returns Reggae terminology for "Reggae"', () => {
    const t = getTerminologyForGenre('Reggae');
    expect(t.genre).toBe('Reggae');
    expect(t.conceptTerms['rhythm']).toBe('skank');
    expect(t.conceptTerms['feel']).toBe('one drop');
    expect(t.conceptTerms['style']).toBe('riddim');
    expect(t.conceptTerms['production']).toBe('dub');
    expect(t.conceptTerms['technique']).toBe('offbeat');
    expect(t.chordTerms['organ']).toBe('bubble organ');
    expect(t.conceptTerms['bass']).toBe('steppers');
    expect(t.conceptTerms['groove']).toBe('rockers');
    expectPopulatedTerminology(t);
  });

  describe('all 13 genres resolve to non-generic terminology', () => {
    const genres = [
      'Jazz', 'Blues', 'Pop/Rock', 'Classical', 'R&B/Soul',
      'Funk', 'Latin', 'Country', 'Electronic', 'Gospel',
      'Metal', 'Folk', 'Reggae',
    ];

    for (const genre of genres) {
      it(`"${genre}" resolves to non-generic terminology`, () => {
        const t = getTerminologyForGenre(genre);
        expect(t.genre).not.toBe('Generic');
        expectPopulatedTerminology(t);
      });
    }
  });

  describe('alias resolution', () => {
    it('EDM resolves to Electronic', () => {
      expect(getTerminologyForGenre('EDM').genre).toBe('Electronic');
    });

    it('Dance resolves to Electronic', () => {
      expect(getTerminologyForGenre('Dance').genre).toBe('Electronic');
    });

    it('Heavy Metal resolves to Metal', () => {
      expect(getTerminologyForGenre('Heavy Metal').genre).toBe('Metal');
    });

    it('Bluegrass resolves to Folk', () => {
      expect(getTerminologyForGenre('Bluegrass').genre).toBe('Folk');
    });

    it('Americana resolves to Folk', () => {
      expect(getTerminologyForGenre('Americana').genre).toBe('Folk');
    });

    it('Dancehall resolves to Reggae', () => {
      expect(getTerminologyForGenre('Dancehall').genre).toBe('Reggae');
    });

    it('Ska resolves to Reggae', () => {
      expect(getTerminologyForGenre('Ska').genre).toBe('Reggae');
    });

    it('Southern Gospel resolves to Gospel', () => {
      expect(getTerminologyForGenre('Southern Gospel').genre).toBe('Gospel');
    });

    it('Bossa Nova resolves to Latin', () => {
      expect(getTerminologyForGenre('Bossa Nova').genre).toBe('Latin');
    });

    it('Latin/Bossa Nova resolves to Latin', () => {
      expect(getTerminologyForGenre('Latin/Bossa Nova').genre).toBe('Latin');
    });
  });

  it('returns populated GENERIC for null genre', () => {
    const t = getTerminologyForGenre(null);
    expect(t.genre).toBe('Generic');
    expectPopulatedTerminology(t);
  });

  it('returns populated GENERIC for unknown genre', () => {
    const t = getTerminologyForGenre('Grindcore');
    expect(t.genre).toBe('Generic');
    expectPopulatedTerminology(t);
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

  it('returns hints for Gospel', () => {
    const hints = getGenreTerminologyHints('Gospel');
    expect(hints).toContain('worship progression');
    expect(hints).toContain('melisma');
    expect(hints).toContain('uplifting');
  });

  it('returns empty string for unknown genre', () => {
    expect(getGenreTerminologyHints('Grindcore')).toBe('');
  });
});
