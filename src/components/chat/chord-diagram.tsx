'use client';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
const BLACK_KEYS = [1, 3, 6, 8, 10]; // C# D# F# G# A#

interface ChordDiagramProps {
  chord: string;
}

function parseChordNotes(chordName: string): number[] {
  const rootMatch = chordName.match(/^([A-G][#b]?)/);
  if (!rootMatch) return [];

  let root = NOTE_NAMES.indexOf(rootMatch[1]);
  if (root === -1 && rootMatch[1].includes('b')) {
    const sharpEquiv = NOTE_NAMES.indexOf(
      String.fromCharCode(((rootMatch[1].charCodeAt(0) - 65 + 6) % 7) + 65) + '#'
    );
    root = sharpEquiv !== -1 ? sharpEquiv : 0;
  }
  if (root === -1) root = 0;

  const quality = chordName.slice(rootMatch[1].length).toLowerCase();
  const intervals: number[] = [0]; // root always included

  if (quality.includes('dim') || quality.includes('°')) {
    intervals.push(3, 6);
  } else if (quality.includes('aug') || quality.includes('+')) {
    intervals.push(4, 8);
  } else if (quality.includes('sus4')) {
    intervals.push(5, 7);
  } else if (quality.includes('sus2')) {
    intervals.push(2, 7);
  } else if (quality.startsWith('m') || quality.includes('min')) {
    intervals.push(3, 7);
  } else {
    intervals.push(4, 7); // major
  }

  if (quality.includes('7')) intervals.push(quality.includes('maj7') ? 11 : 10);
  if (quality.includes('9')) intervals.push(14);

  return intervals.map((i) => (root + i) % 12);
}

export function ChordDiagram({ chord }: ChordDiagramProps) {
  const highlightedNotes = parseChordNotes(chord);

  const keyWidth = 24;
  const keyHeight = 64;
  const blackKeyWidth = 16;
  const blackKeyHeight = 38;
  const totalWidth = keyWidth * 7;

  return (
    <div className="my-2 p-3 bg-surface-1 border border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-sans">
        {chord}
      </p>
      <svg
        width={totalWidth}
        height={keyHeight}
        viewBox={`0 0 ${totalWidth} ${keyHeight}`}
        className="block"
      >
        {/* White keys */}
        {WHITE_KEYS.map((note, i) => {
          const isHighlighted = highlightedNotes.includes(note);
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
        {/* Black keys */}
        {BLACK_KEYS.map((note) => {
          const whiteIndex = WHITE_KEYS.findIndex((w) => w > note) - 1;
          if (whiteIndex < 0) return null;
          const adjustedIndex =
            note === 1 ? 0 : note === 3 ? 1 : note === 6 ? 3 : note === 8 ? 4 : note === 10 ? 5 : 0;
          const x = (adjustedIndex + 1) * keyWidth - blackKeyWidth / 2;
          const isHighlighted = highlightedNotes.includes(note);
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
