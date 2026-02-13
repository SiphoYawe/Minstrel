/**
 * Static SVG depicting a stylized piano-roll with sample note bars.
 * Used as the empty-state illustration for session history.
 */
export function MockVisualization({ className }: { className?: string }) {
  return (
    <svg
      width="160"
      height="80"
      viewBox="0 0 160 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Grid lines */}
      <line x1="0" y1="20" x2="160" y2="20" stroke="currentColor" strokeOpacity="0.08" />
      <line x1="0" y1="40" x2="160" y2="40" stroke="currentColor" strokeOpacity="0.08" />
      <line x1="0" y1="60" x2="160" y2="60" stroke="currentColor" strokeOpacity="0.08" />

      {/* Note bars — staggered to suggest a melody */}
      <rect x="10" y="30" width="24" height="6" rx="0" fill="#7CB9E8" fillOpacity="0.7" />
      <rect x="38" y="22" width="18" height="6" rx="0" fill="#7CB9E8" fillOpacity="0.5" />
      <rect x="60" y="38" width="30" height="6" rx="0" fill="#7CB9E8" fillOpacity="0.8" />
      <rect x="94" y="26" width="14" height="6" rx="0" fill="#7CB9E8" fillOpacity="0.4" />
      <rect x="112" y="50" width="22" height="6" rx="0" fill="#7CB9E8" fillOpacity="0.6" />
      <rect x="138" y="34" width="16" height="6" rx="0" fill="#7CB9E8" fillOpacity="0.3" />

      {/* Playhead line */}
      <line
        x1="80"
        y1="0"
        x2="80"
        y2="80"
        stroke="#7CB9E8"
        strokeOpacity="0.25"
        strokeDasharray="3 3"
      />
    </svg>
  );
}
