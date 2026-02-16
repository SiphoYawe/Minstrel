/**
 * Studio Engineer avatar icon — a waveform/audio mixing motif
 * representing the AI coaching persona.
 */
export function StudioEngineerIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="28" height="28" fill="#1A1A1A" />
      {/* Waveform bars representing a mixing console */}
      <rect x="5" y="10" width="2" height="8" rx="1" fill="#7CB9E8" />
      <rect x="9" y="7" width="2" height="14" rx="1" fill="#7CB9E8" />
      <rect x="13" y="5" width="2" height="18" rx="1" fill="#7CB9E8" />
      <rect x="17" y="8" width="2" height="12" rx="1" fill="#7CB9E8" />
      <rect x="21" y="11" width="2" height="6" rx="1" fill="#7CB9E8" />
    </svg>
  );
}
