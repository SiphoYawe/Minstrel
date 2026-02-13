import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from './use-online-status';

describe('useOnlineStatus', () => {
  let listeners: Record<string, EventListener[]>;

  beforeEach(() => {
    listeners = { online: [], offline: [] };

    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      if (type === 'online' || type === 'offline') {
        listeners[type].push(listener as EventListener);
      }
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((type, listener) => {
      if (type === 'online' || type === 'offline') {
        listeners[type] = listeners[type].filter((l) => l !== listener);
      }
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function fireEvent(type: 'online' | 'offline') {
    for (const listener of listeners[type]) {
      listener(new Event(type));
    }
  }

  it('defaults to online when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('reflects offline state when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it('transitions to offline when offline event fires', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      fireEvent('offline');
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('transitions to online and sets wasOffline for 3 seconds', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      fireEvent('online');
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.wasOffline).toBe(false);
  });

  it('calls onReconnect callback when coming back online', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const onReconnect = vi.fn();
    renderHook(() => useOnlineStatus({ onReconnect }));

    act(() => {
      fireEvent('online');
    });

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it('does not call onReconnect when going offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const onReconnect = vi.fn();
    renderHook(() => useOnlineStatus({ onReconnect }));

    act(() => {
      fireEvent('offline');
    });

    expect(onReconnect).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const { unmount } = renderHook(() => useOnlineStatus());

    expect(listeners.online.length).toBe(1);
    expect(listeners.offline.length).toBe(1);

    unmount();

    expect(listeners.online.length).toBe(0);
    expect(listeners.offline.length).toBe(0);
  });
});
