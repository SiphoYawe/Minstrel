import type { MidiEvent, MidiEventType } from './midi-types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Running status: tracks the last status byte for consecutive data-only messages
let lastStatusByte = 0;

export function noteNumberToName(note: number): string {
  const octave = Math.floor(note / 12) - 1;
  const name = NOTE_NAMES[note % 12];
  return `${name}${octave}`;
}

export function resetRunningStatus(): void {
  lastStatusByte = 0;
}

export function parseMidiMessage(data: Uint8Array, timestamp: number): MidiEvent | null {
  if (data.length < 1) return null;

  let statusByte: number;
  let dataOffset: number;

  if (data[0] >= 0x80) {
    // Status byte present
    statusByte = data[0];

    // System messages reset running status and are ignored
    if (statusByte >= 0xf0) {
      lastStatusByte = 0;
      return null;
    }

    lastStatusByte = statusByte;
    dataOffset = 1;
  } else {
    // Running status: data[0] is a data byte, reuse last status
    if (lastStatusByte === 0) return null;
    statusByte = lastStatusByte;
    dataOffset = 0;
  }

  // Need at least 2 data bytes after status for note/CC messages
  if (data.length - dataOffset < 2) return null;

  const messageType = statusByte & 0xf0;
  const channel = statusByte & 0x0f;
  const data1 = data[dataOffset];
  const data2 = data[dataOffset + 1];

  // Validate ranges
  if (data1 > 127 || data2 > 127) return null;

  let type: MidiEventType;

  switch (messageType) {
    case 0x90: // Note On
      type = data2 === 0 ? 'note-off' : 'note-on';
      break;
    case 0x80: // Note Off
      type = 'note-off';
      break;
    case 0xb0: // Control Change
      type = 'control-change';
      break;
    default:
      return null;
  }

  return {
    type,
    note: data1,
    noteName: type === 'control-change' ? '' : noteNumberToName(data1),
    velocity: data2,
    channel,
    timestamp,
    source: 'midi',
  };
}
