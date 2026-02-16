import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReplayChat } from './use-replay-chat';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';

// Mock AI SDK hooks
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    sendMessage: vi.fn(),
    status: 'ready',
    error: null,
    setMessages: vi.fn(),
  })),
}));

vi.mock('ai', () => ({
  DefaultChatTransport: class MockTransport {
    constructor() {
      // mock transport
    }
  },
}));

// Mock context builder
vi.mock('./context-builder', () => ({
  buildReplayContext: vi.fn(() => ({
    timestampFormatted: '1:30',
    timestampMs: 90000,
    notesAtMoment: ['C', 'E'],
    chordAtMoment: 'C+E',
    timingAccuracy: 0.85,
    tempo: 120,
    chordProgression: ['C+E', 'F+A'],
    nearbySnapshots: [],
    key: 'C major',
    genre: null,
    windowMs: 10000,
  })),
}));

vi.mock('./chat-error-handler', () => ({
  parseChatError: vi.fn((err: Error) => ({
    error: {
      code: 'UNKNOWN',
      message: err.message,
    },
    type: 'UNKNOWN',
  })),
}));

describe('useReplayChat', () => {
  beforeEach(() => {
    useSessionStore.setState({
      replayPosition: 90000,
      replayEvents: [],
      replaySession: null,
    });
    useAppStore.setState({ hasApiKey: true });
  });

  it('returns hasApiKey from app store', () => {
    const { result } = renderHook(() => useReplayChat());
    expect(result.current.hasApiKey).toBe(true);
  });

  it('returns hasApiKey false when no key', () => {
    useAppStore.setState({ hasApiKey: false });
    const { result } = renderHook(() => useReplayChat());
    expect(result.current.hasApiKey).toBe(false);
  });

  it('reads current timestamp from session store', () => {
    useSessionStore.setState({ replayPosition: 60_000 });
    const { result } = renderHook(() => useReplayChat());
    expect(result.current.currentTimestamp).toBe(60_000);
  });

  it('manages input state', () => {
    const { result } = renderHook(() => useReplayChat());
    expect(result.current.input).toBe('');
    act(() => {
      result.current.setInput('test question');
    });
    expect(result.current.input).toBe('test question');
  });

  it('does not submit when input is empty', () => {
    const { result } = renderHook(() => useReplayChat());
    act(() => {
      result.current.handleSubmit();
    });
    // No error thrown, input remains empty
    expect(result.current.input).toBe('');
  });

  it('does not submit when no API key', () => {
    useAppStore.setState({ hasApiKey: false });
    const { result } = renderHook(() => useReplayChat());
    act(() => {
      result.current.setInput('test');
    });
    act(() => {
      result.current.handleSubmit();
    });
    // Input is NOT cleared (submit was blocked)
    expect(result.current.input).toBe('test');
  });

  it('returns isLoading false when status is ready', () => {
    const { result } = renderHook(() => useReplayChat());
    expect(result.current.isLoading).toBe(false);
  });

  it('returns messages from AI SDK', () => {
    const { result } = renderHook(() => useReplayChat());
    expect(result.current.messages).toEqual([]);
  });
});
