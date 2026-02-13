// @vitest-environment node
import { vi, describe, it, expect } from 'vitest';
import {
  sendNoteOn,
  sendNoteOff,
  sendAllNotesOff,
  detectOutputCapability,
  getFirstOutputPort,
  midiNoteToFrequency,
} from './midi-output';

// --- Mock helpers ---

function createMockMIDIOutput() {
  const sentMessages: { data: number[]; timestamp?: number }[] = [];
  const send = vi.fn((data: number[] | Uint8Array, timestamp?: number) => {
    sentMessages.push({ data: [...data], timestamp });
  });
  return {
    port: { send } as unknown as MIDIOutput,
    send,
    sentMessages,
  };
}

function createMockMIDIAccess(
  outputs: Array<{ id: string; name?: string | null; state: string }> = []
): MIDIAccess {
  const outputMap = new Map<string, MIDIOutput>();
  for (const o of outputs) {
    outputMap.set(o.id, {
      id: o.id,
      name: o.name ?? null,
      state: o.state,
      send: vi.fn(),
    } as unknown as MIDIOutput);
  }
  return {
    inputs: new Map(),
    outputs: outputMap,
    onstatechange: null,
    sysexEnabled: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MIDIAccess;
}

// --- Tests ---

describe('sendNoteOn', () => {
  it('generates correct MIDI byte sequence for default channel 0', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOn(port, 60, 100);
    expect(send).toHaveBeenCalledWith([0x90, 60, 100]);
  });

  it('applies channel to status byte', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOn(port, 60, 100, 5);
    expect(send).toHaveBeenCalledWith([0x95, 60, 100]);
  });

  it('clamps channel to lower 4 bits', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOn(port, 60, 100, 0xff);
    // 0xFF & 0x0F = 0x0F → 0x90 | 0x0F = 0x9F
    expect(send).toHaveBeenCalledWith([0x9f, 60, 100]);
  });

  it('masks note and velocity to 7-bit range', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOn(port, 200, 200);
    // 200 & 0x7F = 72 for note, 72 for velocity
    expect(send).toHaveBeenCalledWith([0x90, 200 & 0x7f, 200 & 0x7f]);
  });

  it('passes timestamp when provided', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOn(port, 60, 100, 0, 5000);
    expect(send).toHaveBeenCalledWith([0x90, 60, 100], 5000);
  });

  it('does not pass timestamp when undefined', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOn(port, 60, 100, 0);
    expect(send).toHaveBeenCalledWith([0x90, 60, 100]);
  });
});

describe('sendNoteOff', () => {
  it('generates correct MIDI byte sequence for default channel 0', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOff(port, 60);
    expect(send).toHaveBeenCalledWith([0x80, 60, 0]);
  });

  it('applies channel to status byte', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOff(port, 60, 3);
    expect(send).toHaveBeenCalledWith([0x83, 60, 0]);
  });

  it('always sends velocity 0', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOff(port, 72, 9);
    expect(send).toHaveBeenCalledWith([0x89, 72, 0]);
  });

  it('passes timestamp when provided', () => {
    const { port, send } = createMockMIDIOutput();
    sendNoteOff(port, 60, 0, 3000);
    expect(send).toHaveBeenCalledWith([0x80, 60, 0], 3000);
  });
});

describe('sendAllNotesOff', () => {
  it('sends noteOff for all 128 MIDI notes', () => {
    const { port, send } = createMockMIDIOutput();
    sendAllNotesOff(port);
    expect(send).toHaveBeenCalledTimes(128);
  });

  it('covers note range 0 through 127', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    sendAllNotesOff(port);
    const notes = sentMessages.map((m) => m.data[1]);
    expect(notes).toHaveLength(128);
    expect(notes[0]).toBe(0);
    expect(notes[127]).toBe(127);
  });

  it('uses specified channel', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    sendAllNotesOff(port, 7);
    // All messages should have status byte 0x87
    for (const msg of sentMessages) {
      expect(msg.data[0]).toBe(0x87);
    }
  });
});

describe('detectOutputCapability', () => {
  it('returns false when no output ports exist', () => {
    const access = createMockMIDIAccess([]);
    const result = detectOutputCapability(access);
    expect(result.hasOutput).toBe(false);
    expect(result.portName).toBeNull();
  });

  it('returns true with port name when connected output exists', () => {
    const access = createMockMIDIAccess([{ id: 'o1', name: 'Piano Out', state: 'connected' }]);
    const result = detectOutputCapability(access);
    expect(result.hasOutput).toBe(true);
    expect(result.portName).toBe('Piano Out');
  });

  it('returns false when output port is disconnected', () => {
    const access = createMockMIDIAccess([{ id: 'o1', name: 'Piano Out', state: 'disconnected' }]);
    const result = detectOutputCapability(access);
    expect(result.hasOutput).toBe(false);
    expect(result.portName).toBeNull();
  });

  it('handles output port with null name', () => {
    const access = createMockMIDIAccess([{ id: 'o1', name: null, state: 'connected' }]);
    const result = detectOutputCapability(access);
    expect(result.hasOutput).toBe(true);
    expect(result.portName).toBe('Unknown Output');
  });
});

describe('getFirstOutputPort', () => {
  it('returns null when no output ports exist', () => {
    const access = createMockMIDIAccess([]);
    expect(getFirstOutputPort(access)).toBeNull();
  });

  it('returns first connected output port', () => {
    const access = createMockMIDIAccess([
      { id: 'o1', name: 'Port A', state: 'disconnected' },
      { id: 'o2', name: 'Port B', state: 'connected' },
    ]);
    const port = getFirstOutputPort(access);
    expect(port).not.toBeNull();
    expect((port as unknown as { id: string }).id).toBe('o2');
  });

  it('returns null when all ports disconnected', () => {
    const access = createMockMIDIAccess([{ id: 'o1', name: 'Port A', state: 'disconnected' }]);
    expect(getFirstOutputPort(access)).toBeNull();
  });
});

describe('midiNoteToFrequency', () => {
  it('returns 440 Hz for A4 (MIDI 69)', () => {
    expect(midiNoteToFrequency(69)).toBe(440);
  });

  it('returns approximately 261.63 Hz for C4 (MIDI 60)', () => {
    expect(midiNoteToFrequency(60)).toBeCloseTo(261.63, 1);
  });

  it('returns approximately 880 Hz for A5 (MIDI 81)', () => {
    expect(midiNoteToFrequency(81)).toBeCloseTo(880, 1);
  });

  it('returns approximately 220 Hz for A3 (MIDI 57)', () => {
    expect(midiNoteToFrequency(57)).toBeCloseTo(220, 1);
  });

  it('returns approximately 27.5 Hz for A0 (MIDI 21)', () => {
    expect(midiNoteToFrequency(21)).toBeCloseTo(27.5, 1);
  });

  it('doubles frequency for each octave', () => {
    const c4 = midiNoteToFrequency(60);
    const c5 = midiNoteToFrequency(72);
    expect(c5 / c4).toBeCloseTo(2, 5);
  });
});
