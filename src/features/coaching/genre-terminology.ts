export interface GenreTerminology {
  genre: string;
  chordTerms: Record<string, string>;
  scaleTerms: Record<string, string>;
  conceptTerms: Record<string, string>;
  commonProgressions: string[];
  styleDescriptors: string[];
}

const JAZZ: GenreTerminology = {
  genre: 'Jazz',
  chordTerms: {
    dominant: 'dominant 7th',
    minor: 'minor 7th',
    major: 'major 7th',
    diminished: 'half-diminished',
    augmented: 'augmented',
    altered: 'altered dominant',
  },
  scaleTerms: {
    major: 'Ionian',
    minor: 'Dorian',
    pentatonic: 'bebop scale',
    blues: 'blues scale',
    chromatic: 'chromatic approach tones',
  },
  conceptTerms: {
    progression: 'changes',
    improvisation: 'blowing',
    accompaniment: 'comping',
    bassLine: 'walking bass',
    harmony: 'voice leading',
    substitution: 'tritone substitution',
  },
  commonProgressions: ['ii-V-I', 'I-vi-ii-V', 'iii-VI-ii-V', 'rhythm changes'],
  styleDescriptors: ['swing feel', 'bebop lines', 'modal', 'post-bop', 'cool'],
};

const BLUES: GenreTerminology = {
  genre: 'Blues',
  chordTerms: {
    dominant: 'dominant 7th',
    minor: 'minor',
    major: 'major',
    diminished: 'diminished passing chord',
    turnaround: 'turnaround chord',
  },
  scaleTerms: {
    pentatonic: 'minor pentatonic',
    blues: 'blues scale',
    major: 'major pentatonic',
    mixolydian: 'Mixolydian',
  },
  conceptTerms: {
    form: '12-bar blues',
    ending: 'turnaround',
    rhythm: 'shuffle feel',
    expression: 'bend',
    interaction: 'call and response',
    note: 'blue note',
  },
  commonProgressions: ['I-IV-I-V-IV-I (12-bar)', 'quick-change', 'minor blues'],
  styleDescriptors: ['shuffle', 'slow blues', 'Chicago', 'Delta', 'boogie'],
};

const POP_ROCK: GenreTerminology = {
  genre: 'Pop/Rock',
  chordTerms: {
    power: 'power chord',
    major: 'major chord',
    minor: 'minor chord',
    sus: 'suspended chord',
    add: 'add chord',
  },
  scaleTerms: {
    pentatonic: 'pentatonic',
    major: 'major scale',
    minor: 'natural minor',
    blues: 'blues scale',
  },
  conceptTerms: {
    form: 'verse-chorus',
    melody: 'hook',
    riff: 'riff',
    technique: 'palm mute',
    tuning: 'drop tuning',
    rhythm: 'groove',
  },
  commonProgressions: ['I-V-vi-IV', 'I-IV-V-IV', 'vi-IV-I-V', 'I-IV-vi-V'],
  styleDescriptors: ['driving', 'anthemic', 'ballad', 'punk', 'indie'],
};

const CLASSICAL: GenreTerminology = {
  genre: 'Classical',
  chordTerms: {
    dominant: 'dominant',
    tonic: 'tonic',
    subdominant: 'subdominant',
    diminished: 'diminished seventh',
    augmented: 'augmented sixth',
  },
  scaleTerms: {
    major: 'major',
    minor: 'harmonic minor',
    melodicMinor: 'melodic minor',
    chromatic: 'chromatic',
  },
  conceptTerms: {
    harmony: 'counterpoint',
    cadence: 'cadence',
    modulation: 'modulation',
    resolution: 'resolution',
    progression: 'harmonic progression',
    technique: 'voice leading',
  },
  commonProgressions: ['I-IV-V-I', 'I-vi-IV-V', 'I-IV-vii°-I'],
  styleDescriptors: ['legato', 'staccato', 'cantabile', 'rubato', 'con moto'],
};

const RNB_SOUL: GenreTerminology = {
  genre: 'R&B/Soul',
  chordTerms: {
    extended: 'extended chord',
    ninth: '9th chord',
    major7: 'major 9th',
    minor7: 'minor 9th',
    dominant: 'dominant 9th',
  },
  scaleTerms: {
    pentatonic: 'minor pentatonic',
    blues: 'blues scale',
    dorian: 'Dorian',
    mixolydian: 'Mixolydian',
  },
  conceptTerms: {
    rhythm: 'groove',
    timing: 'syncopation',
    voicing: 'soul voicing',
    chord: 'extended chord',
    feel: 'pocket',
  },
  commonProgressions: ['I-IV-vi-V', 'ii-V-I with extensions', 'I-vi-ii-V'],
  styleDescriptors: ['groove', 'laid-back', 'neo-soul', 'Motown', 'gospel-influenced'],
};

const GENERIC: GenreTerminology = {
  genre: 'Generic',
  chordTerms: {},
  scaleTerms: {},
  conceptTerms: {},
  commonProgressions: [],
  styleDescriptors: [],
};

const GENRE_MAP: Record<string, GenreTerminology> = {
  Jazz: JAZZ,
  Blues: BLUES,
  'Pop/Rock': POP_ROCK,
  Pop: POP_ROCK,
  Rock: POP_ROCK,
  Classical: CLASSICAL,
  'R&B/Soul': RNB_SOUL,
  'R&B': RNB_SOUL,
  Soul: RNB_SOUL,
};

export function getTerminologyForGenre(genre: string | null): GenreTerminology {
  if (!genre) return GENERIC;
  return GENRE_MAP[genre] ?? GENERIC;
}

export function getGenreTerminologyHints(genre: string | null): string {
  const terminology = getTerminologyForGenre(genre);
  if (terminology === GENERIC) return '';

  const hints: string[] = [];

  const concepts = Object.values(terminology.conceptTerms);
  if (concepts.length > 0) {
    hints.push(`Key terms: ${concepts.join(', ')}`);
  }

  if (terminology.commonProgressions.length > 0) {
    hints.push(`Common progressions: ${terminology.commonProgressions.join(', ')}`);
  }

  if (terminology.styleDescriptors.length > 0) {
    hints.push(`Style descriptors: ${terminology.styleDescriptors.join(', ')}`);
  }

  return hints.join('\n');
}
