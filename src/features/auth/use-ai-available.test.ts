import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '@/stores/app-store';
import { useAiAvailable } from './use-ai-available';

beforeEach(() => {
  useAppStore.setState({ hasApiKey: false });
});

describe('useAiAvailable', () => {
  it('returns isAiAvailable false when hasApiKey is false', () => {
    const { result } = renderHook(() => useAiAvailable());
    expect(result.current.isAiAvailable).toBe(false);
  });

  it('returns isAiAvailable true when hasApiKey is true', () => {
    useAppStore.setState({ hasApiKey: true });
    const { result } = renderHook(() => useAiAvailable());
    expect(result.current.isAiAvailable).toBe(true);
  });

  it('returns provider as null (placeholder until Epic 4)', () => {
    const { result } = renderHook(() => useAiAvailable());
    expect(result.current.provider).toBeNull();
  });

  it('reactively updates when hasApiKey changes', () => {
    const { result } = renderHook(() => useAiAvailable());
    expect(result.current.isAiAvailable).toBe(false);

    act(() => {
      useAppStore.setState({ hasApiKey: true });
    });
    expect(result.current.isAiAvailable).toBe(true);

    act(() => {
      useAppStore.setState({ hasApiKey: false });
    });
    expect(result.current.isAiAvailable).toBe(false);
  });
});
