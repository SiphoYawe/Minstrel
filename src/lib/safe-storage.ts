'use client';

/**
 * Shared safe localStorage wrappers with private browsing detection.
 * Story 24.6 (MIDI-C18): Detect and handle localStorage unavailability.
 */

let _isAvailable: boolean | null = null;

/**
 * Tests whether localStorage is available. Caches result.
 * Returns false in private browsing mode, SSR, or when storage is full.
 */
export function isLocalStorageAvailable(): boolean {
  if (_isAvailable !== null) return _isAvailable;
  if (typeof window === 'undefined') {
    _isAvailable = false;
    return false;
  }
  try {
    const key = '__minstrel_storage_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    _isAvailable = true;
  } catch {
    _isAvailable = false;
  }
  return _isAvailable;
}

/** Reset cached availability (for testing). */
export function resetStorageCheck(): void {
  _isAvailable = null;
}

export function safeGetItem(key: string, fallback: string | null = null): string | null {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — state won't persist
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable
  }
}
