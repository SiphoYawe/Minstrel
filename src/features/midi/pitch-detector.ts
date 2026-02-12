const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PitchResult {
  frequency: number;
  midiNote: number;
  noteName: string;
  confidence: number;
  centsOff: number;
}

const MIN_CONFIDENCE = 0.85;

// Pre-allocated correlations buffer, resized as needed
let correlationsBuffer: Float32Array | null = null;

/**
 * Autocorrelation-based pitch detection for monophonic input.
 * Uses the normalized square difference function (simplified YIN).
 */
export function detectPitch(timeDomainData: Float32Array, sampleRate: number): PitchResult | null {
  const bufferSize = timeDomainData.length;

  // Check for silence (RMS below threshold)
  let rms = 0;
  for (let i = 0; i < bufferSize; i++) {
    rms += timeDomainData[i] * timeDomainData[i];
  }
  rms = Math.sqrt(rms / bufferSize);
  if (rms < 0.01) return null;

  // Reuse or resize the correlations buffer
  if (!correlationsBuffer || correlationsBuffer.length < bufferSize) {
    correlationsBuffer = new Float32Array(bufferSize);
  }
  const correlations = correlationsBuffer;
  for (let lag = 0; lag < bufferSize; lag++) {
    let sum = 0;
    for (let i = 0; i < bufferSize - lag; i++) {
      sum += timeDomainData[i] * timeDomainData[i + lag];
    }
    correlations[lag] = sum;
  }

  // Normalize
  const c0 = correlations[0];
  if (c0 === 0) return null;

  for (let i = 0; i < bufferSize; i++) {
    correlations[i] /= c0;
  }

  // Find the first peak after the first dip below zero crossing.
  // This avoids picking the zero-lag autocorrelation (always 1.0).
  const minPeriod = Math.floor(sampleRate / 1000); // ~1000 Hz max
  const maxPeriod = Math.floor(sampleRate / 50); // ~50 Hz min

  let bestLag = -1;
  let bestCorrelation = 0;

  // Walk through the autocorrelation to find the first strong peak:
  // 1. Skip the initial descent from lag-0
  // 2. Find the first peak that exceeds confidence threshold
  let descending = true;

  for (let lag = minPeriod; lag < Math.min(maxPeriod, bufferSize); lag++) {
    if (descending) {
      // Wait until we pass through a valley (correlation starts rising)
      if (lag > minPeriod && correlations[lag] > correlations[lag - 1]) {
        descending = false;
      }
      continue;
    }

    // Track the best peak after the valley
    if (correlations[lag] > bestCorrelation) {
      bestCorrelation = correlations[lag];
      bestLag = lag;
    }

    // Once we clearly pass the peak, stop searching
    if (
      bestLag > 0 &&
      bestCorrelation >= MIN_CONFIDENCE &&
      correlations[lag] < bestCorrelation * 0.9
    ) {
      break;
    }
  }

  if (bestLag < 0 || bestCorrelation < MIN_CONFIDENCE) {
    return null;
  }

  const frequency = sampleRate / bestLag;
  return frequencyToMidiNote(frequency, bestCorrelation);
}

/**
 * Convert a frequency in Hz to the nearest MIDI note number with cents offset.
 */
export function frequencyToMidiNote(frequency: number, confidence: number = 1.0): PitchResult {
  // MIDI note number: 69 = A4 = 440Hz
  const exactNote = 12 * Math.log2(frequency / 440) + 69;
  const midiNote = Math.round(exactNote);
  const centsOff = Math.round((exactNote - midiNote) * 100);

  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = `${NOTE_NAMES[((midiNote % 12) + 12) % 12]}${octave}`;

  return {
    frequency,
    midiNote,
    noteName,
    confidence,
    centsOff,
  };
}
