import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setWriteErrorCallback,
  getBufferSize,
  resetRecorder,
  recordEvent,
} from './session-recorder';
import type { MidiEvent } from '@/features/midi/midi-types';

function makeEvent(overrides: Partial<MidiEvent> = {}): MidiEvent {
  return {
    type: 'note-on',
    note: 60,
    noteName: 'C4',
    velocity: 100,
    channel: 0,
    timestamp: Date.now(),
    source: 'midi',
    ...overrides,
  };
}

describe('session-recorder write error handling (Story 24.4)', () => {
  beforeEach(() => {
    resetRecorder();
  });

  afterEach(() => {
    setWriteErrorCallback(null);
    resetRecorder();
  });

  it('setWriteErrorCallback registers and clears callback', () => {
    const cb = vi.fn();
    setWriteErrorCallback(cb);
    // Just verify it doesn't throw
    setWriteErrorCallback(null);
  });

  it('recordEvent does not buffer when not recording', () => {
    recordEvent(makeEvent());
    expect(getBufferSize()).toBe(0);
  });

  it('resetRecorder clears all state', () => {
    resetRecorder();
    expect(getBufferSize()).toBe(0);
  });
});
