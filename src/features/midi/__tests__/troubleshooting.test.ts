import { describe, it, expect } from 'vitest';
import { getTroubleshootingSteps, isDrumChannel } from '../troubleshooting';

describe('isDrumChannel', () => {
  it('returns true for channel 9 (MIDI channel 10)', () => {
    expect(isDrumChannel(9)).toBe(true);
  });

  it('returns false for channel 0', () => {
    expect(isDrumChannel(0)).toBe(false);
  });

  it('returns false for channel 1', () => {
    expect(isDrumChannel(1)).toBe(false);
  });
});

describe('getTroubleshootingSteps', () => {
  it('returns empty for unsupported browser', () => {
    const steps = getTroubleshootingSteps('unsupported');
    expect(steps).toHaveLength(0);
  });

  it('returns connection steps when disconnected', () => {
    const steps = getTroubleshootingSteps('disconnected');
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.map((s) => s.id)).toContain('power-check');
    expect(steps.map((s) => s.id)).toContain('usb-port');
    expect(steps.map((s) => s.id)).toContain('browser-permissions');
  });

  it('includes audio fallback when audio is supported', () => {
    const steps = getTroubleshootingSteps('disconnected', null, true);
    expect(steps.map((s) => s.id)).toContain('audio-fallback');
  });

  it('does not include audio fallback when not supported', () => {
    const steps = getTroubleshootingSteps('disconnected', null, false);
    expect(steps.map((s) => s.id)).not.toContain('audio-fallback');
  });

  it('returns empty steps when connected with no drum channel', () => {
    const steps = getTroubleshootingSteps('connected');
    expect(steps).toHaveLength(0);
  });

  it('returns drum channel step with clear non-contradictory messaging', () => {
    const steps = getTroubleshootingSteps('connected', 9);
    expect(steps).toHaveLength(1);

    const drumStep = steps[0];
    expect(drumStep.id).toBe('channel-mismatch');
    expect(drumStep.title).toBe('Percussion channel detected');
    // Should explain what works and what's limited
    expect(drumStep.description).toContain('percussion channel');
    expect(drumStep.description).toContain('chord and key detection');
    expect(drumStep.description).toContain('keep playing');
    expect(drumStep.description).toContain('listening on all channels');
    // Should NOT say "switch to channel 1" (contradictory with "listening on all channels")
    expect(drumStep.description).not.toContain('switch to channel 1');
    // Action should be specific and non-vague
    expect(drumStep.actionLabel).toBe('Continue');
  });
});
