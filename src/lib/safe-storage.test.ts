import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isLocalStorageAvailable,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  resetStorageCheck,
} from './safe-storage';

describe('safe-storage', () => {
  beforeEach(() => {
    resetStorageCheck();
    localStorage.clear();
  });

  describe('isLocalStorageAvailable', () => {
    it('returns true when localStorage works', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('returns false when localStorage throws', () => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceeded');
      });
      resetStorageCheck();

      expect(isLocalStorageAvailable()).toBe(false);

      Storage.prototype.setItem = original;
    });

    it('caches the result', () => {
      isLocalStorageAvailable();
      const spy = vi.spyOn(Storage.prototype, 'setItem');
      isLocalStorageAvailable();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('safeGetItem', () => {
    it('returns stored value', () => {
      localStorage.setItem('key', 'value');
      expect(safeGetItem('key')).toBe('value');
    });

    it('returns fallback when key missing', () => {
      expect(safeGetItem('missing', 'default')).toBe('default');
    });

    it('returns fallback when localStorage throws', () => {
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new DOMException('SecurityError');
      });

      expect(safeGetItem('key', 'fallback')).toBe('fallback');

      Storage.prototype.getItem = original;
    });
  });

  describe('safeSetItem', () => {
    it('sets value in localStorage', () => {
      safeSetItem('key', 'value');
      expect(localStorage.getItem('key')).toBe('value');
    });

    it('does not throw when localStorage is unavailable', () => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceeded');
      });

      expect(() => safeSetItem('key', 'value')).not.toThrow();

      Storage.prototype.setItem = original;
    });
  });

  describe('safeRemoveItem', () => {
    it('removes item from localStorage', () => {
      localStorage.setItem('key', 'value');
      safeRemoveItem('key');
      expect(localStorage.getItem('key')).toBeNull();
    });

    it('does not throw when localStorage is unavailable', () => {
      const original = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new DOMException('SecurityError');
      });

      expect(() => safeRemoveItem('key')).not.toThrow();

      Storage.prototype.removeItem = original;
    });
  });
});
