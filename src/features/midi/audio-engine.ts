import { useMidiStore } from '@/stores/midi-store';
import { detectPitch } from './pitch-detector';
import { noteNumberToName } from './midi-parser';

let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;
let mediaStream: MediaStream | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let lastDetectedNote: number | null = null;
let initPromise: Promise<void> | null = null;

// Noise gate threshold (RMS)
const NOISE_GATE_THRESHOLD = 0.015;
// Analysis interval (~60Hz)
const ANALYSIS_INTERVAL_MS = 16;
// Smoothing factor for velocity (exponential moving average)
const VELOCITY_SMOOTHING = 0.3;
let smoothedVelocity = 0;

// Pre-allocated time domain buffer (reused across frames)
let timeDomainBuffer: Float32Array<ArrayBuffer> | null = null;

/**
 * Calculate RMS (root-mean-square) amplitude from time domain data.
 */
export function calculateRMS(timeDomainData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    sum += timeDomainData[i] * timeDomainData[i];
  }
  return Math.sqrt(sum / timeDomainData.length);
}

/**
 * Map RMS amplitude (0.0 - ~1.0) to MIDI velocity (0-127).
 */
export function rmsToVelocity(rms: number): number {
  // RMS for typical mic input rarely exceeds 0.5
  // Map 0.0-0.5 to 0-127 with some headroom
  const normalized = Math.min(rms / 0.4, 1.0);
  return Math.round(normalized * 127);
}

/**
 * Request microphone access and initialize the audio capture pipeline.
 * Guarded against concurrent calls — returns existing promise if in-flight.
 */
export async function requestAudioAccess(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = doRequestAudioAccess().finally(() => {
    initPromise = null;
  });
  return initPromise;
}

async function doRequestAudioAccess(): Promise<void> {
  // Clean up any previous session
  stopAudioListening();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream = stream;

    audioContext = new AudioContext();

    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 4096;

    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyserNode);

    // Pre-allocate the time domain buffer
    timeDomainBuffer = new Float32Array(analyserNode.fftSize);

    useMidiStore.getState().setInputSource('audio');
    useMidiStore.getState().setConnectionStatus('connected');
    useMidiStore.getState().setErrorMessage(null);

    startListening();
  } catch (error) {
    useMidiStore.getState().setConnectionStatus('error');
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      useMidiStore
        .getState()
        .setErrorMessage(
          'Microphone access was not granted. Please allow microphone access for audio mode.'
        );
    } else {
      useMidiStore
        .getState()
        .setErrorMessage('Could not initialize audio input. Please check your microphone.');
    }
  }
}

/**
 * Start the audio analysis loop via setInterval (not rAF — works in background tabs).
 */
function startListening(): void {
  if (!analyserNode || !audioContext || !timeDomainBuffer) return;

  intervalId = setInterval(() => {
    if (!analyserNode || !audioContext || !timeDomainBuffer) return;

    analyserNode.getFloatTimeDomainData(timeDomainBuffer);

    const rms = calculateRMS(timeDomainBuffer);

    if (rms < NOISE_GATE_THRESHOLD) {
      // Silence: send note-off for any active note
      if (lastDetectedNote !== null) {
        useMidiStore.getState().addEvent({
          type: 'note-off',
          note: lastDetectedNote,
          noteName: noteNumberToName(lastDetectedNote),
          velocity: 0,
          channel: 0,
          timestamp: performance.now(),
          source: 'audio',
        });
        lastDetectedNote = null;
        smoothedVelocity = 0;
      }
    } else {
      const pitchResult = detectPitch(timeDomainBuffer, audioContext!.sampleRate);

      if (pitchResult) {
        const rawVelocity = rmsToVelocity(rms);
        smoothedVelocity =
          smoothedVelocity * VELOCITY_SMOOTHING + rawVelocity * (1 - VELOCITY_SMOOTHING);
        const velocity = Math.round(smoothedVelocity);

        if (pitchResult.midiNote !== lastDetectedNote) {
          // Note changed — send note-off for previous, note-on for new
          if (lastDetectedNote !== null) {
            useMidiStore.getState().addEvent({
              type: 'note-off',
              note: lastDetectedNote,
              noteName: noteNumberToName(lastDetectedNote),
              velocity: 0,
              channel: 0,
              timestamp: performance.now(),
              source: 'audio',
            });
          }

          lastDetectedNote = pitchResult.midiNote;
          useMidiStore.getState().addEvent({
            type: 'note-on',
            note: pitchResult.midiNote,
            noteName: pitchResult.noteName,
            velocity,
            channel: 0,
            timestamp: performance.now(),
            source: 'audio',
          });
        }
      }
    }
  }, ANALYSIS_INTERVAL_MS);
}

/**
 * Stop audio capture and clean up resources.
 */
export function stopAudioListening(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  if (lastDetectedNote !== null) {
    useMidiStore.getState().addEvent({
      type: 'note-off',
      note: lastDetectedNote,
      noteName: noteNumberToName(lastDetectedNote),
      velocity: 0,
      channel: 0,
      timestamp: performance.now(),
      source: 'audio',
    });
    lastDetectedNote = null;
  }

  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }

  if (analyserNode) {
    analyserNode.disconnect();
    analyserNode = null;
  }

  if (audioContext) {
    audioContext.close().catch((err) => {
      console.warn('AudioContext.close() failed:', err);
    });
    audioContext = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  timeDomainBuffer = null;
  smoothedVelocity = 0;
}

/**
 * Check if browser supports audio input.
 */
export function isAudioSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof AudioContext !== 'undefined'
  );
}
