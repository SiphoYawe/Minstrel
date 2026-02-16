import * as Sentry from '@sentry/nextjs';

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

const FUNK: GenreTerminology = {
  genre: 'Funk',
  chordTerms: {
    dominant: 'dominant 9th',
    minor: 'minor 7th',
    suspended: 'sus chord',
    sharp9: 'sharp 9 chord',
    effect: 'envelope filter',
  },
  scaleTerms: {
    pentatonic: 'minor pentatonic',
    mixolydian: 'Mixolydian',
    dorian: 'Dorian',
    blues: 'blues scale',
  },
  conceptTerms: {
    rhythm: 'the one',
    feel: 'pocket',
    technique: 'ghost notes',
    groove: 'sixteenth-note groove',
    bass: 'slap bass',
    guitar: 'chicken scratch',
    strumming: 'muted strums',
  },
  commonProgressions: ['I7-IV7', 'i7 vamp', 'I9-IV9', 'one-chord vamp'],
  styleDescriptors: ['tight pocket', 'syncopated', 'groove-heavy', 'percussive', 'staccato rhythm'],
};

const LATIN: GenreTerminology = {
  genre: 'Latin',
  chordTerms: {
    major: 'major 7th',
    minor: 'minor 9th',
    dominant: 'dominant 7(b9)',
    diminished: 'diminished passing chord',
    montuno: 'montuno chord pattern',
  },
  scaleTerms: {
    major: 'Lydian',
    minor: 'Dorian',
    altered: 'altered scale',
    melodicMinor: 'melodic minor',
    pentatonic: 'minor pentatonic',
  },
  conceptTerms: {
    rhythm: 'clave',
    bass: 'tumbao',
    pattern: 'guajeo',
    feel: 'son',
    groove: 'cascara',
    dance: 'guaguancó',
    interaction: 'call and response',
  },
  commonProgressions: ['I-IV-V-I', 'i-iv-V-i', 'I-bII7-ii-V', 'Imaj7-IVmaj7-bVII7-Imaj7'],
  styleDescriptors: ['bossa nova', 'salsa', 'rumba', 'gentle sway', 'syncopated', 'chromatic'],
};

const COUNTRY: GenreTerminology = {
  genre: 'Country',
  chordTerms: {
    major: 'major chord',
    minor: 'minor chord',
    dominant: 'dominant 7th',
    sus: 'suspended chord',
    add: 'add9 chord',
  },
  scaleTerms: {
    pentatonic: 'major pentatonic',
    major: 'major scale',
    mixolydian: 'Mixolydian',
    blues: 'country blues scale',
  },
  conceptTerms: {
    technique: "chicken pickin'",
    rhythm: 'train beat',
    style: 'telecaster twang',
    form: 'Nashville number system',
    bass: 'boom-chuck',
    picking: 'flatpicking',
    instrument: 'pedal steel',
  },
  commonProgressions: ['I-IV-V', 'I-V-vi-IV', 'I-IV-I-V', 'vi-IV-I-V'],
  styleDescriptors: [
    'twangy',
    'honky-tonk',
    'outlaw',
    'Nashville',
    'Bakersfield sound',
    'Americana',
  ],
};

const FOLK: GenreTerminology = {
  genre: 'Folk',
  chordTerms: {
    major: 'open chord',
    minor: 'minor chord',
    sus: 'suspended chord',
    add: 'add chord',
    open: 'open tuning chord',
  },
  scaleTerms: {
    major: 'Ionian',
    minor: 'Aeolian',
    dorian: 'Dorian',
    mixolydian: 'Mixolydian',
    pentatonic: 'pentatonic',
    modal: 'modal scale',
  },
  conceptTerms: {
    technique: 'fingerpicking',
    rhythm: 'Travis picking',
    form: 'verse-refrain',
    style: 'drone',
    harmony: 'open voicing',
    tuning: 'DADGAD',
    ornamentation: 'Celtic ornamentation',
  },
  commonProgressions: ['I-IV-V', 'I-V-vi-IV', 'i-VII-VI-V', 'I-ii-IV-V'],
  styleDescriptors: ['acoustic', 'pastoral', 'modal', 'Celtic', 'Appalachian style'],
};

const REGGAE: GenreTerminology = {
  genre: 'Reggae',
  chordTerms: {
    major: 'major chord',
    minor: 'minor chord',
    dominant: 'dominant 7th',
    diminished: 'diminished',
    organ: 'bubble organ',
  },
  scaleTerms: {
    pentatonic: 'minor pentatonic',
    major: 'major scale',
    minor: 'natural minor',
    blues: 'blues scale',
  },
  conceptTerms: {
    rhythm: 'skank',
    feel: 'one drop',
    bass: 'steppers',
    technique: 'offbeat',
    style: 'riddim',
    production: 'dub',
    groove: 'rockers',
  },
  commonProgressions: ['I-IV', 'i-IV-V-i', 'I-V-vi-IV', 'vi-I-ii-V'],
  styleDescriptors: ['offbeat-driven', 'laid-back', 'roots', 'dub', 'dancehall', 'steppers'],
};

const METAL: GenreTerminology = {
  genre: 'Metal',
  chordTerms: {
    power: 'power chord',
    diminished: 'diminished chord',
    tritone: 'tritone',
    minor: 'minor chord',
    augmented: 'augmented chord',
  },
  scaleTerms: {
    minor: 'natural minor',
    pentatonic: 'minor pentatonic',
    phrygian: 'Phrygian',
    harmonicMinor: 'harmonic minor',
    chromatic: 'chromatic runs',
  },
  conceptTerms: {
    technique: 'palm mute',
    rhythm: 'gallop picking',
    speed: 'tremolo picking',
    form: 'breakdown',
    tuning: 'drop tuning',
    drums: 'blast beat',
    kick: 'double bass',
  },
  commonProgressions: ['i-bVI-bVII-i', 'i-bII-i', 'i-iv-bVI-V', 'power chord riffs'],
  styleDescriptors: ['aggressive', 'heavy', 'shredding', 'thrash', 'djent'],
};

const ELECTRONIC: GenreTerminology = {
  genre: 'Electronic',
  chordTerms: {
    pad: 'pad chord',
    stab: 'chord stab',
    minor: 'minor chord',
    major: 'major chord',
    suspended: 'suspended chord',
  },
  scaleTerms: {
    minor: 'minor scale',
    pentatonic: 'pentatonic',
    phrygian: 'Phrygian',
    dorian: 'Dorian',
    wholeTone: 'whole tone',
  },
  conceptTerms: {
    rhythm: '4-on-the-floor',
    form: 'build-drop',
    technique: 'arpeggiation',
    bass: 'sub bass',
    effect: 'sidechain',
    sound: 'synthesis',
    modulation: 'filter sweep',
    sequencing: 'sequencer',
    oscillator: 'LFO',
    structure: 'breakdown',
  },
  commonProgressions: ['i-VI-III-VII', 'i-iv-VI-V', 'vi-IV-I-V', 'one-chord vamp'],
  styleDescriptors: ['atmospheric', 'driving', 'hypnotic', 'euphoric', 'minimal'],
};

const GOSPEL: GenreTerminology = {
  genre: 'Gospel',
  chordTerms: {
    shout: 'shout chord',
    diminished: 'passing diminished',
    tritoneSub: 'tritone substitution',
    extended: 'extended chord',
    major7: 'major 7th',
    dominant: 'dominant 9th',
  },
  scaleTerms: {
    major: 'major scale',
    pentatonic: 'major pentatonic',
    blues: 'gospel blues scale',
    chromatic: 'chromatic passing tones',
  },
  conceptTerms: {
    progression: 'worship progression',
    interaction: 'call and response',
    bass: 'walk-up bass',
    vocal: 'melisma',
    feel: 'shout',
    harmony: 'choir voicing',
  },
  commonProgressions: ['I-IV-I-V', 'I-I7-IV-iv-I', 'I-vi-ii-V', 'IV-V-iii-vi'],
  styleDescriptors: ['uplifting', 'jubilant', 'soulful', 'congregational', 'spirited'],
};

const GENERIC: GenreTerminology = {
  genre: 'Generic',
  chordTerms: {
    major: 'major chord',
    minor: 'minor chord',
    dominant: 'dominant 7th',
    diminished: 'diminished chord',
    augmented: 'augmented chord',
    suspended: 'suspended chord',
  },
  scaleTerms: {
    major: 'major scale',
    minor: 'natural minor',
    pentatonic: 'pentatonic scale',
    chromatic: 'chromatic scale',
    blues: 'blues scale',
  },
  conceptTerms: {
    melody: 'melody',
    harmony: 'harmony',
    rhythm: 'rhythm',
    dynamics: 'dynamics',
    tempo: 'tempo',
    form: 'song form',
  },
  commonProgressions: ['I-IV-V-I', 'I-V-vi-IV', 'ii-V-I', 'I-vi-IV-V'],
  styleDescriptors: ['legato', 'staccato', 'forte', 'piano', 'crescendo'],
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
  Funk: FUNK,
  Latin: LATIN,
  'Latin/Bossa Nova': LATIN,
  'Bossa Nova': LATIN,
  Bossa: LATIN,
  Country: COUNTRY,
  Folk: FOLK,
  Bluegrass: FOLK,
  Americana: FOLK,
  Reggae: REGGAE,
  Dancehall: REGGAE,
  Ska: REGGAE,
  Metal: METAL,
  'Heavy Metal': METAL,
  Electronic: ELECTRONIC,
  EDM: ELECTRONIC,
  Dance: ELECTRONIC,
  Techno: ELECTRONIC,
  House: ELECTRONIC,
  Gospel: GOSPEL,
  'Southern Gospel': GOSPEL,
};

export function getTerminologyForGenre(genre: string | null): GenreTerminology {
  if (!genre) return GENERIC;
  const terminology = GENRE_MAP[genre];
  if (!terminology) {
    Sentry.captureMessage(`Unknown genre fell back to GENERIC: "${genre}"`, {
      level: 'info',
      extra: { genre },
    });
    return GENERIC;
  }
  return terminology;
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
