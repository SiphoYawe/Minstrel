/**
 * Stylized SVG of a MIDI keyboard (one octave + 2 keys).
 * Used as the empty-state illustration for MIDI connection screens.
 */
export function MidiKeyboard({ className }: { className?: string }) {
  return (
    <svg
      width="160"
      height="56"
      viewBox="0 0 160 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* White keys */}
      {[0, 20, 40, 60, 80, 100, 120, 140].map((x, i) => (
        <rect
          key={`w-${i}`}
          x={x + 0.5}
          y="0.5"
          width="19"
          height="55"
          stroke="currentColor"
          strokeOpacity="0.15"
          fill="currentColor"
          fillOpacity="0.04"
        />
      ))}

      {/* Black keys */}
      {[14, 34, 74, 94, 114].map((x, i) => (
        <rect
          key={`b-${i}`}
          x={x}
          y="0"
          width="12"
          height="34"
          fill="currentColor"
          fillOpacity="0.2"
        />
      ))}

      {/* Accent on middle key — hint of connection */}
      <rect x="60.5" y="0.5" width="19" height="55" fill="#7CB9E8" fillOpacity="0.12" />
    </svg>
  );
}
