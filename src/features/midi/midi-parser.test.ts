import { describe, it, expect, beforeEach } from 'vitest';
import { parseMidiMessage, noteNumberToName, resetRunningStatus } from './midi-parser';

describe('noteNumberToName', () => {
  it('maps note 60 to C4 (middle C)', () => {
    expect(noteNumberToName(60)).toBe('C4');
  });

  it('maps note 0 to C-1', () => {
    expect(noteNumberToName(0)).toBe('C-1');
  });

  it('maps note 127 to G9', () => {
    expect(noteNumberToName(127)).toBe('G9');
  });

  it('maps note 69 to A4 (concert pitch)', () => {
    expect(noteNumberToName(69)).toBe('A4');
  });

  it('maps sharps correctly (note 61 = C#4)', () => {
    expect(noteNumberToName(61)).toBe('C#4');
  });

  it('maps note 21 to A0 (lowest piano key)', () => {
    expect(noteNumberToName(21)).toBe('A0');
  });

  it('maps note 108 to C8 (highest piano key)', () => {
    expect(noteNumberToName(108)).toBe('C8');
  });
});

describe('parseMidiMessage', () => {
  const ts = 1000;

  beforeEach(() => {
    resetRunningStatus();
  });

  describe('note-on messages (0x90)', () => {
    it('parses a note-on message on channel 0', () => {
      const data = new Uint8Array([0x90, 60, 100]);
      const event = parseMidiMessage(data, ts);
      expect(event).toEqual({
        type: 'note-on',
        note: 60,
        noteName: 'C4',
        velocity: 100,
        channel: 0,
        timestamp: ts,
        source: 'midi',
      });
    });

    it('parses note-on on channel 1', () => {
      const data = new Uint8Array([0x91, 60, 100]);
      const event = parseMidiMessage(data, ts);
      expect(event).not.toBeNull();
      expect(event!.channel).toBe(1);
    });

    it('parses note-on on channel 15', () => {
      const data = new Uint8Array([0x9f, 48, 80]);
      const event = parseMidiMessage(data, ts);
      expect(event).not.toBeNull();
      expect(event!.channel).toBe(15);
    });

    it('treats note-on with velocity 0 as note-off', () => {
      const data = new Uint8Array([0x90, 60, 0]);
      const event = parseMidiMessage(data, ts);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('note-off');
      expect(event!.velocity).toBe(0);
    });
  });

  describe('note-off messages (0x80)', () => {
    it('parses a note-off message', () => {
      const data = new Uint8Array([0x80, 60, 0]);
      const event = parseMidiMessage(data, ts);
      expect(event).toEqual({
        type: 'note-off',
        note: 60,
        noteName: 'C4',
        velocity: 0,
        channel: 0,
        timestamp: ts,
        source: 'midi',
      });
    });

    it('parses note-off with release velocity', () => {
      const data = new Uint8Array([0x80, 48, 64]);
      const event = parseMidiMessage(data, ts);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('note-off');
      expect(event!.velocity).toBe(64);
    });
  });

  describe('control change messages (0xB0)', () => {
    it('parses a control change message', () => {
      const data = new Uint8Array([0xb0, 64, 127]);
      const event = parseMidiMessage(data, ts);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('control-change');
      expect(event!.note).toBe(64); // controller number
      expect(event!.velocity).toBe(127); // controller value
    });

    it('sets noteName to empty string for control-change', () => {
      const data = new Uint8Array([0xb0, 64, 127]);
      const event = parseMidiMessage(data, ts);
      expect(event!.noteName).toBe('');
    });
  });

  describe('running status', () => {
    it('handles running status (data bytes without status byte)', () => {
      // First, send a note-on to set running status
      parseMidiMessage(new Uint8Array([0x90, 60, 100]), ts);

      // Running status: 2 data bytes, reuse last status (0x90)
      const event = parseMidiMessage(new Uint8Array([64, 80]), ts);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('note-on');
      expect(event!.note).toBe(64);
      expect(event!.velocity).toBe(80);
    });

    it('returns null for running status without prior status byte', () => {
      const event = parseMidiMessage(new Uint8Array([60, 100]), ts);
      expect(event).toBeNull();
    });

    it('resets running status on system messages', () => {
      parseMidiMessage(new Uint8Array([0x90, 60, 100]), ts);
      parseMidiMessage(new Uint8Array([0xf0, 0x7e, 0xf7]), ts); // sysex
      const event = parseMidiMessage(new Uint8Array([64, 80]), ts);
      expect(event).toBeNull();
    });
  });

  describe('invalid/unsupported messages', () => {
    it('returns null for empty data', () => {
      expect(parseMidiMessage(new Uint8Array([]), ts)).toBeNull();
    });

    it('returns null for too-short data (2 bytes)', () => {
      expect(parseMidiMessage(new Uint8Array([0x90, 60]), ts)).toBeNull();
    });

    it('returns null for system messages (0xF0+)', () => {
      expect(parseMidiMessage(new Uint8Array([0xf0, 0x7e, 0xf7]), ts)).toBeNull();
    });

    it('returns null for unsupported message types (e.g., aftertouch 0xA0)', () => {
      expect(parseMidiMessage(new Uint8Array([0xa0, 60, 100]), ts)).toBeNull();
    });

    it('returns null for program change (0xC0)', () => {
      expect(parseMidiMessage(new Uint8Array([0xc0, 10, 0]), ts)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles maximum velocity (127)', () => {
      const data = new Uint8Array([0x90, 60, 127]);
      const event = parseMidiMessage(data, ts);
      expect(event!.velocity).toBe(127);
    });

    it('handles minimum note (0)', () => {
      const data = new Uint8Array([0x90, 0, 100]);
      const event = parseMidiMessage(data, ts);
      expect(event!.note).toBe(0);
      expect(event!.noteName).toBe('C-1');
    });

    it('handles maximum note (127)', () => {
      const data = new Uint8Array([0x90, 127, 100]);
      const event = parseMidiMessage(data, ts);
      expect(event!.note).toBe(127);
      expect(event!.noteName).toBe('G9');
    });

    it('preserves high-resolution timestamp', () => {
      const preciseTs = 1234.5678;
      const data = new Uint8Array([0x90, 60, 100]);
      const event = parseMidiMessage(data, preciseTs);
      expect(event!.timestamp).toBe(preciseTs);
    });
  });
});
