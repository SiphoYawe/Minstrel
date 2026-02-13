/**
 * MIDI Output Core — Layer 3 Domain Logic
 *
 * Pure MIDI byte construction and Web MIDI API output port interaction.
 * Used by drill-player.ts to send demonstration playback to instruments.
 */

// MIDI status bytes
const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;

/**
 * Send a MIDI Note On message.
 * Status byte: 0x90 | channel, followed by note number and velocity.
 */
export function sendNoteOn(
  port: MIDIOutput,
  note: number,
  velocity: number,
  channel: number = 0,
  timestamp?: number
): void {
  const status = NOTE_ON | (channel & 0x0f);
  const data = [status, note & 0x7f, velocity & 0x7f];
  if (timestamp !== undefined) {
    port.send(data, timestamp);
  } else {
    port.send(data);
  }
}

/**
 * Send a MIDI Note Off message.
 * Status byte: 0x80 | channel, followed by note number and velocity 0.
 */
export function sendNoteOff(
  port: MIDIOutput,
  note: number,
  channel: number = 0,
  timestamp?: number
): void {
  const status = NOTE_OFF | (channel & 0x0f);
  const data = [status, note & 0x7f, 0];
  if (timestamp !== undefined) {
    port.send(data, timestamp);
  } else {
    port.send(data);
  }
}

/**
 * Panic function: send Note Off for all 128 MIDI notes on the given channel.
 * Ensures no hanging notes after playback interruption.
 */
export function sendAllNotesOff(port: MIDIOutput, channel: number = 0): void {
  for (let note = 0; note < 128; note++) {
    sendNoteOff(port, note, channel);
  }
}

/**
 * Check whether the MIDI access object has any connected output ports.
 */
export function detectOutputCapability(access: MIDIAccess): {
  hasOutput: boolean;
  portName: string | null;
} {
  for (const output of access.outputs.values()) {
    if (output.state === 'connected') {
      return { hasOutput: true, portName: output.name ?? 'Unknown Output' };
    }
  }
  return { hasOutput: false, portName: null };
}

/**
 * Return the first connected MIDI output port, or null if none available.
 */
export function getFirstOutputPort(access: MIDIAccess): MIDIOutput | null {
  for (const output of access.outputs.values()) {
    if (output.state === 'connected') {
      return output;
    }
  }
  return null;
}

/**
 * Convert a MIDI note number to frequency in Hz.
 * A4 (MIDI 69) = 440 Hz. Used by the audio fallback synthesizer.
 */
export function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}
