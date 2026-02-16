import type { MidiConnectionStatus } from './midi-types';

export interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
}

// Channel 9 in 0-indexed = channel 10 in MIDI convention (GM percussion)
const DRUM_CHANNEL = 9;

export function isDrumChannel(channel: number): boolean {
  return channel === DRUM_CHANNEL;
}

export function getTroubleshootingSteps(
  connectionStatus: MidiConnectionStatus,
  detectedChannel?: number | null,
  audioSupported?: boolean
): TroubleshootingStep[] {
  const steps: TroubleshootingStep[] = [];

  // Unsupported browsers get no troubleshooting steps — the status bar
  // already shows the error message and there's nothing the user can do
  // with USB/permission guidance.
  if (connectionStatus === 'unsupported') {
    return steps;
  }

  if (connectionStatus !== 'connected') {
    steps.push(
      {
        id: 'power-check',
        title: 'Check your device',
        description:
          'Is your MIDI device powered on and plugged into a USB port? Make sure the cable is securely connected.',
        actionLabel: 'Try Again',
      },
      {
        id: 'usb-port',
        title: 'Try a different connection',
        description:
          'Sometimes a different USB port or cable does the trick. Try switching and we will check again.',
        actionLabel: 'Try Again',
      },
      {
        id: 'browser-permissions',
        title: 'Check browser permissions',
        description:
          'Your browser needs permission to access MIDI devices. Look for a permission prompt or check your browser settings.',
        actionLabel: 'Try Again',
      }
    );

    // Audio fallback option when microphone is available
    if (audioSupported) {
      steps.push({
        id: 'audio-fallback',
        title: 'No MIDI device? Try Audio Mode',
        description:
          'Use your microphone to capture basic pitch and volume. Some features require a MIDI connection for full precision.',
        actionLabel: 'Use Microphone',
      });
    }
  }

  if (detectedChannel != null && isDrumChannel(detectedChannel)) {
    steps.push({
      id: 'channel-mismatch',
      title: 'Percussion channel detected',
      description:
        'We detected a percussion channel (channel 10). Melodic features like chord and key detection work best on channels 1–9. You can keep playing — we\u2019re listening on all channels.',
      actionLabel: 'Continue',
    });
  }

  return steps;
}
