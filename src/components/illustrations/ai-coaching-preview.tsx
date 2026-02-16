/**
 * Stylized SVG depicting chat bubbles with a waveform, suggesting AI coaching.
 * Used as the empty-state illustration for the chat panel without an API key.
 */
export function AiCoachingPreview({ className }: { className?: string }) {
  return (
    <svg
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* AI message bubble */}
      <rect
        x="4"
        y="8"
        width="72"
        height="24"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.3"
        fill="hsl(var(--primary))"
        fillOpacity="0.05"
      />
      {/* Waveform inside bubble */}
      <line
        x1="12"
        y1="20"
        x2="18"
        y2="14"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <line
        x1="18"
        y1="14"
        x2="24"
        y2="24"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <line
        x1="24"
        y1="24"
        x2="30"
        y2="16"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <line
        x1="30"
        y1="16"
        x2="36"
        y2="22"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <line
        x1="36"
        y1="22"
        x2="42"
        y2="18"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      {/* Text line placeholders */}
      <rect x="48" y="16" width="20" height="2" fill="hsl(var(--primary))" fillOpacity="0.2" />
      <rect x="48" y="22" width="14" height="2" fill="hsl(var(--primary))" fillOpacity="0.15" />

      {/* User message bubble */}
      <rect
        x="44"
        y="42"
        width="72"
        height="18"
        stroke="currentColor"
        strokeOpacity="0.12"
        fill="currentColor"
        fillOpacity="0.03"
      />
      <rect x="52" y="49" width="30" height="2" fill="currentColor" fillOpacity="0.12" />
      <rect x="86" y="49" width="18" height="2" fill="currentColor" fillOpacity="0.08" />

      {/* Accent dot — API key hint */}
      <circle cx="16" y="68" r="3" fill="hsl(var(--primary))" fillOpacity="0.25" />
      <rect x="24" y="66" width="40" height="2" fill="currentColor" fillOpacity="0.08" />
    </svg>
  );
}
