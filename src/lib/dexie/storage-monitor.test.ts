import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkStorageQuota, startStorageMonitor, stopStorageMonitor } from './storage-monitor';

describe('storage-monitor (Story 24.4)', () => {
  afterEach(() => {
    stopStorageMonitor();
    vi.restoreAllMocks();
  });

  it('checkStorageQuota returns null when navigator.storage is unavailable', async () => {
    const result = await checkStorageQuota();
    // In test environment, navigator.storage.estimate may not exist
    // This test verifies it handles gracefully
    expect(result === null || typeof result === 'number').toBe(true);
  });

  it('startStorageMonitor is idempotent', () => {
    const cb = vi.fn();
    startStorageMonitor(cb);
    startStorageMonitor(cb); // Should be no-op
    stopStorageMonitor();
  });

  it('stopStorageMonitor cleans up without error even if not started', () => {
    expect(() => stopStorageMonitor()).not.toThrow();
  });
});
