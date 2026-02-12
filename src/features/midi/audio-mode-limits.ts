export interface DisabledFeature {
  featureId: string;
  label: string;
  reason: string;
}

const AUDIO_MODE_DISABLED_FEATURES: DisabledFeature[] = [
  {
    featureId: 'exact-velocity',
    label: 'Exact velocity tracking',
    reason: 'Requires MIDI connection',
  },
  {
    featureId: 'precise-timing',
    label: 'Sub-20ms timing precision',
    reason: 'Requires MIDI connection',
  },
  {
    featureId: 'midi-output',
    label: 'MIDI output demonstrations',
    reason: 'Requires MIDI connection',
  },
  {
    featureId: 'chord-detection',
    label: 'Multi-note chord detection',
    reason: 'Requires MIDI connection',
  },
];

export function getDisabledFeatures(): DisabledFeature[] {
  return AUDIO_MODE_DISABLED_FEATURES;
}

export function isFeatureDisabledInAudioMode(featureId: string): boolean {
  return AUDIO_MODE_DISABLED_FEATURES.some((f) => f.featureId === featureId);
}
