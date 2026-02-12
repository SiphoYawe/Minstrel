import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { calculateRMS, rmsToVelocity, isAudioSupported } from './audio-engine';

// Mock the store to prevent import issues
vi.mock('@/stores/midi-store', () => ({
  useMidiStore: {
    getState: vi.fn(() => ({
      setInputSource: vi.fn(),
      setConnectionStatus: vi.fn(),
      setErrorMessage: vi.fn(),
      addEvent: vi.fn(),
    })),
  },
}));

describe('calculateRMS', () => {
  it('returns 0 for silence', () => {
    const silence = new Float32Array(1024);
    expect(calculateRMS(silence)).toBe(0);
  });

  it('returns correct RMS for a known signal', () => {
    // All values at 0.5 → RMS = 0.5
    const data = new Float32Array(100).fill(0.5);
    expect(calculateRMS(data)).toBeCloseTo(0.5, 5);
  });

  it('returns correct RMS for alternating signal', () => {
    // Alternating 1 and -1 → RMS = 1
    const data = new Float32Array(100);
    for (let i = 0; i < data.length; i++) {
      data[i] = i % 2 === 0 ? 1 : -1;
    }
    expect(calculateRMS(data)).toBeCloseTo(1, 5);
  });

  it('returns value between 0 and 1 for typical audio', () => {
    const data = new Float32Array(1024);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin((2 * Math.PI * 440 * i) / 44100) * 0.3;
    }
    const rms = calculateRMS(data);
    expect(rms).toBeGreaterThan(0);
    expect(rms).toBeLessThan(1);
  });
});

describe('rmsToVelocity', () => {
  it('returns 0 for silence', () => {
    expect(rmsToVelocity(0)).toBe(0);
  });

  it('returns 127 for loud signal', () => {
    expect(rmsToVelocity(0.5)).toBe(127);
  });

  it('caps at 127 for very loud signal', () => {
    expect(rmsToVelocity(1.0)).toBe(127);
  });

  it('returns proportional value for moderate signal', () => {
    const velocity = rmsToVelocity(0.2);
    expect(velocity).toBeGreaterThan(30);
    expect(velocity).toBeLessThan(100);
  });
});

describe('isAudioSupported', () => {
  const originalNavigator = globalThis.navigator;
  const originalWindow = globalThis.window;
  const originalAudioContext = globalThis.AudioContext;

  beforeEach(() => {
    // Reset to a supported environment
    Object.defineProperty(globalThis, 'window', { value: {}, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        mediaDevices: {
          getUserMedia: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  it('returns true when all APIs are available', () => {
    expect(isAudioSupported()).toBe(true);
  });

  it('returns false when window is undefined', () => {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(isAudioSupported()).toBe(false);
  });

  // Restore after all tests
  afterAll(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'AudioContext', {
      value: originalAudioContext,
      writable: true,
      configurable: true,
    });
  });
});
