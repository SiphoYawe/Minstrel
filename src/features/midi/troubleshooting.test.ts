import { describe, it, expect } from 'vitest';
import { getTroubleshootingSteps, isDrumChannel } from './troubleshooting';

describe('isDrumChannel', () => {
  it('returns true for drum channel (9)', () => {
    expect(isDrumChannel(9)).toBe(true);
  });

  it('returns false for channel 0 (GM channel 1)', () => {
    expect(isDrumChannel(0)).toBe(false);
  });

  it('returns false for other channels', () => {
    for (const ch of [1, 2, 3, 8, 10, 15]) {
      expect(isDrumChannel(ch)).toBe(false);
    }
  });
});

describe('getTroubleshootingSteps', () => {
  it('returns connection steps when disconnected', () => {
    const steps = getTroubleshootingSteps('disconnected');
    expect(steps.length).toBe(3);
    expect(steps.map((s) => s.id)).toEqual(['power-check', 'usb-port', 'browser-permissions']);
  });

  it('returns connection steps when connecting', () => {
    const steps = getTroubleshootingSteps('connecting');
    expect(steps.length).toBe(3);
  });

  it('returns connection steps on error', () => {
    const steps = getTroubleshootingSteps('error');
    expect(steps.length).toBe(3);
  });

  it('returns no steps when connected and no channel issue', () => {
    const steps = getTroubleshootingSteps('connected');
    expect(steps).toEqual([]);
  });

  it('returns no steps when connected with null channel', () => {
    const steps = getTroubleshootingSteps('connected', null);
    expect(steps).toEqual([]);
  });

  it('returns channel mismatch step when drum channel detected while connected', () => {
    const steps = getTroubleshootingSteps('connected', 9);
    expect(steps.length).toBe(1);
    expect(steps[0].id).toBe('channel-mismatch');
    expect(steps[0].actionLabel).toBe('Got It');
    expect(steps[0].description).toContain('channel 10');
  });

  it('returns both connection and channel steps when disconnected with drum channel', () => {
    const steps = getTroubleshootingSteps('disconnected', 9);
    expect(steps.length).toBe(4);
    expect(steps[3].id).toBe('channel-mismatch');
  });

  it('does not return channel step for normal channels', () => {
    const steps = getTroubleshootingSteps('connected', 0);
    expect(steps).toEqual([]);
  });

  it('each step has required fields', () => {
    const steps = getTroubleshootingSteps('disconnected', 9);
    for (const step of steps) {
      expect(step.id).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.actionLabel).toBeTruthy();
    }
  });

  it('connection steps all have "Try Again" action label', () => {
    const steps = getTroubleshootingSteps('disconnected');
    for (const step of steps) {
      expect(step.actionLabel).toBe('Try Again');
    }
  });

  it('returns no steps for unsupported status', () => {
    const steps = getTroubleshootingSteps('unsupported');
    expect(steps.length).toBe(0);
  });

  it('returns no steps for unsupported status even with drum channel', () => {
    const steps = getTroubleshootingSteps('unsupported', 9);
    expect(steps.length).toBe(0);
  });
});
