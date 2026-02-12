import { describe, it, expect, afterEach } from 'vitest';
import { isMidiSupported } from './midi-utils';

describe('isMidiSupported', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('returns true when requestMIDIAccess is available', () => {
    Object.defineProperty(global, 'navigator', {
      value: { requestMIDIAccess: () => {} },
      writable: true,
      configurable: true,
    });
    expect(isMidiSupported()).toBe(true);
  });

  it('returns false when requestMIDIAccess is not available', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });
    expect(isMidiSupported()).toBe(false);
  });
});
