/**
 * Storage quota monitoring for IndexedDB (Story 24.4).
 *
 * Uses navigator.storage.estimate() to check usage and warn
 * when capacity is nearing the limit.
 */

const QUOTA_WARNING_THRESHOLD = 0.9; // 90%
const CHECK_INTERVAL_MS = 60_000; // Check every 60s

export type StorageWarningCallback = (usagePercent: number) => void;

let checkTimer: ReturnType<typeof setInterval> | null = null;
let warningCallback: StorageWarningCallback | null = null;
let warningShown = false;

/**
 * Check current storage usage. Returns percentage (0-1) or null if unavailable.
 */
export async function checkStorageQuota(): Promise<number | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }

  try {
    const { usage, quota } = await navigator.storage.estimate();
    if (!quota || quota === 0) return null;
    return (usage ?? 0) / quota;
  } catch {
    return null;
  }
}

/**
 * Start periodic storage monitoring.
 * Calls the callback when usage exceeds the warning threshold.
 */
export function startStorageMonitor(onWarning: StorageWarningCallback): void {
  if (checkTimer !== null) return;

  warningCallback = onWarning;
  warningShown = false;

  async function check() {
    const usage = await checkStorageQuota();
    if (usage !== null && usage >= QUOTA_WARNING_THRESHOLD && !warningShown) {
      warningShown = true;
      warningCallback?.(Math.round(usage * 100));
    }
  }

  // Initial check
  check();

  checkTimer = setInterval(check, CHECK_INTERVAL_MS);
}

/**
 * Stop storage monitoring.
 */
export function stopStorageMonitor(): void {
  if (checkTimer !== null) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
  warningCallback = null;
  warningShown = false;
}
