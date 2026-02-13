// @vitest-environment node
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  playDrill,
  createDrillCycle,
  previewDrill,
  SCHEDULE_AHEAD_MS,
  LISTEN_PAUSE_MS,
  PREVIEW_VELOCITY_MULT,
} from './drill-player';
import type { DrillOutput } from './drill-player';
import { DrillPhase } from './drill-types';
import type { GeneratedDrill } from './drill-types';
import { DEFAULT_DIFFICULTY } from '@/features/difficulty/difficulty-engine';

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

function makeDrill(overrides?: Partial<GeneratedDrill>): GeneratedDrill {
  return {
    id: 'drill-1',
    targetSkill: 'Chord transitions',
    weaknessDescription: 'Slow transitions',
    sequence: {
      notes: [
        { midiNote: 60, duration: 1, velocity: 80, startBeat: 0 },
        { midiNote: 64, duration: 1, velocity: 80, startBeat: 1 },
        { midiNote: 67, duration: 1, velocity: 80, startBeat: 2 },
      ],
      chordSymbols: ['C', 'E', 'G'],
      timeSignature: [4, 4] as [number, number],
      measures: 1,
    },
    targetTempo: 120, // 500ms per beat
    successCriteria: {
      timingThresholdMs: 50,
      accuracyTarget: 0.8,
      tempoToleranceBpm: 5,
    },
    reps: 4,
    instructions: 'Play C major arpeggio',
    difficultyLevel: { ...DEFAULT_DIFFICULTY },
    ...overrides,
  };
}

// --- Tests ---

describe('playDrill (MIDI output)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends noteOn and noteOff for each note in the drill', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };

    playDrill(drill, output);

    // 3 notes → 3 noteOn + 3 noteOff = 6 MIDI messages
    expect(sentMessages).toHaveLength(6);

    // Check noteOn messages (status byte 0x90)
    const noteOns = sentMessages.filter((m) => (m.data[0] & 0xf0) === 0x90);
    expect(noteOns).toHaveLength(3);
    expect(noteOns[0].data[1]).toBe(60);
    expect(noteOns[1].data[1]).toBe(64);
    expect(noteOns[2].data[1]).toBe(67);

    // Check noteOff messages (status byte 0x80)
    const noteOffs = sentMessages.filter((m) => (m.data[0] & 0xf0) === 0x80);
    expect(noteOffs).toHaveLength(3);
  });

  it('uses MIDI API timestamps for precise scheduling', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };

    playDrill(drill, output);

    // All messages should have timestamps
    for (const msg of sentMessages) {
      expect(msg.timestamp).toBeDefined();
      expect(typeof msg.timestamp).toBe('number');
    }
  });

  it('spaces notes according to target tempo', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    // 120 BPM = 500ms per beat
    const drill = makeDrill({ targetTempo: 120 });
    const output: DrillOutput = { type: 'midi', port };

    playDrill(drill, output);

    // Extract noteOn timestamps
    const noteOns = sentMessages.filter((m) => (m.data[0] & 0xf0) === 0x90);
    const t0 = noteOns[0].timestamp!;
    const t1 = noteOns[1].timestamp!;
    const t2 = noteOns[2].timestamp!;

    // Beat 0 → 1: 500ms, beat 1 → 2: 500ms
    expect(t1 - t0).toBeCloseTo(500, 0);
    expect(t2 - t1).toBeCloseTo(500, 0);
  });

  it('fires onNotePlay callback for each note', () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const notePlayCalls: Array<{ index: number; total: number }> = [];

    playDrill(drill, output, {
      onNotePlay: (_note, index, total) => {
        notePlayCalls.push({ index, total });
      },
    });

    // Advance past all note callbacks
    vi.advanceTimersByTime(SCHEDULE_AHEAD_MS + 3000);

    expect(notePlayCalls).toHaveLength(3);
    expect(notePlayCalls[0]).toEqual({ index: 0, total: 3 });
    expect(notePlayCalls[1]).toEqual({ index: 1, total: 3 });
    expect(notePlayCalls[2]).toEqual({ index: 2, total: 3 });
  });

  it('fires onComplete callback when playback finishes', () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const onComplete = vi.fn();

    playDrill(drill, output, { onComplete });

    // Last note ends at beat 3 (startBeat 2 + duration 1) = 1500ms at 120BPM
    // Completion fires at SCHEDULE_AHEAD_MS + 1500ms + 200ms buffer
    vi.advanceTimersByTime(SCHEDULE_AHEAD_MS + 1500 + 200);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resolves completed promise when playback finishes', async () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };

    const handle = playDrill(drill, output);
    let resolved = false;
    handle.completed.then(() => {
      resolved = true;
    });

    vi.advanceTimersByTime(SCHEDULE_AHEAD_MS + 2000);
    await Promise.resolve(); // flush microtasks

    expect(resolved).toBe(true);
  });

  it('stop() cancels pending callbacks', () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const onNotePlay = vi.fn();
    const onComplete = vi.fn();

    const handle = playDrill(drill, output, { onNotePlay, onComplete });
    handle.stop();

    // Advance past all timers
    vi.advanceTimersByTime(10000);

    // No callbacks should fire after stop
    expect(onNotePlay).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('stop() sends allNotesOff for MIDI output', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };

    const handle = playDrill(drill, output);
    const messageCountBefore = sentMessages.length;

    handle.stop();

    // Should have sent 128 noteOff messages (panic)
    const newMessages = sentMessages.slice(messageCountBefore);
    expect(newMessages).toHaveLength(128);
    for (const msg of newMessages) {
      expect(msg.data[0] & 0xf0).toBe(0x80);
      expect(msg.data[2]).toBe(0);
    }
  });

  it('stop() resolves completed promise', async () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };

    const handle = playDrill(drill, output);
    let resolved = false;
    handle.completed.then(() => {
      resolved = true;
    });

    handle.stop();
    await Promise.resolve();

    expect(resolved).toBe(true);
  });

  it('stop() is idempotent', () => {
    const { port, send } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };

    const handle = playDrill(drill, output);
    handle.stop();
    const callCountAfterFirst = send.mock.calls.length;

    handle.stop();
    expect(send.mock.calls.length).toBe(callCountAfterFirst);
  });

  it('handles drill with single note', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    const drill = makeDrill({
      sequence: {
        notes: [{ midiNote: 60, duration: 2, velocity: 100, startBeat: 0 }],
        timeSignature: [4, 4] as [number, number],
        measures: 1,
      },
    });
    const output: DrillOutput = { type: 'midi', port };

    playDrill(drill, output);

    // 1 noteOn + 1 noteOff
    expect(sentMessages).toHaveLength(2);
  });
});

describe('createDrillCycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('transitions through Demonstrate → Listen → Attempt phases', async () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const phases: DrillPhase[] = [];

    const cycle = createDrillCycle(drill, output, (phase) => {
      phases.push(phase);
    });

    cycle.startDemonstration();

    // Should immediately enter Demonstrate
    expect(phases).toEqual([DrillPhase.Demonstrate]);

    // Advance past drill playback (3 beats at 120BPM = 1500ms + buffer)
    vi.advanceTimersByTime(SCHEDULE_AHEAD_MS + 1500 + 200);
    await Promise.resolve();

    // Should enter Listen phase
    expect(phases).toContain(DrillPhase.Listen);

    // Advance past listen pause
    vi.advanceTimersByTime(LISTEN_PAUSE_MS);
    await Promise.resolve();

    // Should enter Attempt phase
    expect(phases).toContain(DrillPhase.Attempt);
    expect(phases).toEqual([DrillPhase.Demonstrate, DrillPhase.Listen, DrillPhase.Attempt]);
  });

  it('resolves readyForAttempt when Attempt phase begins', async () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };

    const cycle = createDrillCycle(drill, output, () => {});
    cycle.startDemonstration();

    let ready = false;
    cycle.readyForAttempt.then(() => {
      ready = true;
    });

    // Advance through all phases
    vi.advanceTimersByTime(SCHEDULE_AHEAD_MS + 1500 + 200 + LISTEN_PAUSE_MS);
    await Promise.resolve();

    expect(ready).toBe(true);
  });

  it('fires onNotePlay callbacks during demonstration', () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const notePlayCalls: number[] = [];

    const cycle = createDrillCycle(
      drill,
      output,
      () => {},
      (_note, index) => {
        notePlayCalls.push(index);
      }
    );

    cycle.startDemonstration();

    // Advance past all note callbacks
    vi.advanceTimersByTime(SCHEDULE_AHEAD_MS + 2000);

    expect(notePlayCalls).toEqual([0, 1, 2]);
  });

  it('stop() halts the cycle at any point', () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const phases: DrillPhase[] = [];

    const cycle = createDrillCycle(drill, output, (phase) => {
      phases.push(phase);
    });

    cycle.startDemonstration();
    expect(phases).toEqual([DrillPhase.Demonstrate]);

    cycle.stop();

    // Advance past everything — should not transition further
    vi.advanceTimersByTime(10000);

    expect(phases).toEqual([DrillPhase.Demonstrate]);
  });

  it('stop() resolves readyForAttempt', async () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };

    const cycle = createDrillCycle(drill, output, () => {});
    cycle.startDemonstration();

    let ready = false;
    cycle.readyForAttempt.then(() => {
      ready = true;
    });

    cycle.stop();
    await Promise.resolve();

    expect(ready).toBe(true);
  });

  it('does not start demonstration if already stopped', () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const phases: DrillPhase[] = [];

    const cycle = createDrillCycle(drill, output, (phase) => {
      phases.push(phase);
    });

    cycle.stop();
    cycle.startDemonstration();

    expect(phases).toEqual([]);
  });

  it('includes listen pause of 1.5 seconds between demonstrate and attempt', async () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const phases: DrillPhase[] = [];

    const cycle = createDrillCycle(drill, output, (phase) => {
      phases.push(phase);
    });

    cycle.startDemonstration();

    // Advance past playback
    vi.advanceTimersByTime(SCHEDULE_AHEAD_MS + 1500 + 200);
    await Promise.resolve();

    expect(phases).toContain(DrillPhase.Listen);

    // Advance only 1000ms — not enough for full listen pause
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(phases).not.toContain(DrillPhase.Attempt);

    // Advance remaining 500ms
    vi.advanceTimersByTime(500);
    await Promise.resolve();
    expect(phases).toContain(DrillPhase.Attempt);
  });
});

describe('previewDrill', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies emphasized velocity (1.2×) to all notes', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    const drill = makeDrill(); // velocity: 80 per note
    const output: DrillOutput = { type: 'midi', port };

    previewDrill(drill, output);

    const noteOns = sentMessages.filter((m) => (m.data[0] & 0xf0) === 0x90);
    const expectedVelocity = Math.min(127, Math.round(80 * PREVIEW_VELOCITY_MULT));
    for (const msg of noteOns) {
      expect(msg.data[2]).toBe(expectedVelocity);
    }
  });

  it('caps velocity at 127 for loud notes', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    const drill = makeDrill({
      sequence: {
        notes: [{ midiNote: 60, duration: 1, velocity: 120, startBeat: 0 }],
        timeSignature: [4, 4] as [number, number],
        measures: 1,
      },
    });
    const output: DrillOutput = { type: 'midi', port };

    previewDrill(drill, output);

    const noteOns = sentMessages.filter((m) => (m.data[0] & 0xf0) === 0x90);
    // 120 * 1.2 = 144 → capped at 127
    expect(noteOns[0].data[2]).toBe(127);
  });

  it('does not mutate the original drill', () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const originalVelocity = drill.sequence.notes[0].velocity;
    const output: DrillOutput = { type: 'midi', port };

    previewDrill(drill, output);

    expect(drill.sequence.notes[0].velocity).toBe(originalVelocity);
  });

  it('fires onNotePlay and onComplete callbacks', () => {
    const { port } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const onNotePlay = vi.fn();
    const onComplete = vi.fn();

    previewDrill(drill, output, { onNotePlay, onComplete });

    vi.advanceTimersByTime(SCHEDULE_AHEAD_MS + 1500 + 200);

    expect(onNotePlay).toHaveBeenCalledTimes(3);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('stop() sends allNotesOff and cancels callbacks', () => {
    const { port, sentMessages } = createMockMIDIOutput();
    const drill = makeDrill();
    const output: DrillOutput = { type: 'midi', port };
    const onComplete = vi.fn();

    const handle = previewDrill(drill, output, { onComplete });
    const beforeStop = sentMessages.length;
    handle.stop();

    vi.advanceTimersByTime(10000);

    // 128 noteOff messages from panic
    const panicMessages = sentMessages.slice(beforeStop);
    expect(panicMessages).toHaveLength(128);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
