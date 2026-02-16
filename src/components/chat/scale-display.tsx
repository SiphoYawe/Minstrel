'use client';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEYS = [1, 3, 6, 8, 10];

interface ScaleDisplayProps {
  scaleName: string;
}

const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

function parseScale(name: string): number[] {
  const normalized = name.replace(/_/g, ' ').trim();
  const rootMatch = normalized.match(/^([A-G][#b]?)/i);
  if (!rootMatch) return [];

  let rootName = rootMatch[1].charAt(0).toUpperCase() + rootMatch[1].slice(1);
  if (rootName.includes('b')) {
    const idx = NOTE_NAMES.indexOf(rootName.replace('b', '#'));
    rootName = idx !== -1 ? NOTE_NAMES[(idx + 11) % 12] : rootName;
  }

  let root = NOTE_NAMES.indexOf(rootName);
  if (root === -1) root = 0;

  const rest = normalized.slice(rootMatch[1].length).trim().toLowerCase();

  let intervals = SCALE_INTERVALS.major;
  for (const [key, val] of Object.entries(SCALE_INTERVALS)) {
    if (rest.includes(key)) {
      intervals = val;
      break;
    }
  }

  return intervals.map((i) => (root + i) % 12);
}

export function ScaleDisplay({ scaleName }: ScaleDisplayProps) {
  const scaleNotes = parseScale(scaleName);
  const displayName = scaleName.replace(/_/g, ' ');

  const keyWidth = 24;
  const keyHeight = 64;
  const blackKeyWidth = 16;
  const blackKeyHeight = 38;
  const totalWidth = keyWidth * 7;

  return (
    <div className="my-2 p-3 bg-surface-1 border border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-sans">
        {displayName}
      </p>
      <svg
        width={totalWidth}
        height={keyHeight}
        viewBox={`0 0 ${totalWidth} ${keyHeight}`}
        className="block"
      >
        {WHITE_KEYS.map((note, i) => {
          const isHighlighted = scaleNotes.includes(note);
          return (
            <rect
              key={`w-${note}`}
              x={i * keyWidth}
              y={0}
              width={keyWidth - 1}
              height={keyHeight}
              fill={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--viz-surface-dark))'}
              stroke="hsl(var(--viz-border-dark))"
              strokeWidth={0.5}
            />
          );
        })}
        {BLACK_KEYS.map((note) => {
          const adjustedIndex =
            note === 1 ? 0 : note === 3 ? 1 : note === 6 ? 3 : note === 8 ? 4 : note === 10 ? 5 : 0;
          const x = (adjustedIndex + 1) * keyWidth - blackKeyWidth / 2;
          const isHighlighted = scaleNotes.includes(note);
          return (
            <rect
              key={`b-${note}`}
              x={x}
              y={0}
              width={blackKeyWidth}
              height={blackKeyHeight}
              fill={isHighlighted ? 'var(--viz-primary-dark)' : 'hsl(var(--background))'}
              stroke="hsl(var(--viz-border-dark))"
              strokeWidth={0.5}
            />
          );
        })}
      </svg>
    </div>
  );
}
