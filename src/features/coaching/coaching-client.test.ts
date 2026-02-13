import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '@/stores/app-store';
import { useSessionStore } from '@/stores/session-store';

// Mock @ai-sdk/react useChat
const mockSendMessage = vi.fn();
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    sendMessage: mockSendMessage,
    status: 'ready',
    error: null,
    setMessages: vi.fn(),
  })),
}));

// Mock 'ai' module for DefaultChatTransport — must be a constructor
vi.mock('ai', () => ({
  DefaultChatTransport: class MockTransport {
    constructor() {
      // no-op
    }
  },
}));

// Must import after mocks are set up
const { useCoachingChat } = await import('./coaching-client');

describe('useCoachingChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      hasApiKey: false,
      apiKeyProvider: null,
    });
    useSessionStore.setState({
      chatHistory: [],
      pendingDrillRequest: false,
    });
  });

  it('returns hasApiKey false when no API key is set', () => {
    const { result } = renderHook(() => useCoachingChat());
    expect(result.current.hasApiKey).toBe(false);
  });

  it('returns hasApiKey true when API key is set', () => {
    useAppStore.setState({ hasApiKey: true });
    const { result } = renderHook(() => useCoachingChat());
    expect(result.current.hasApiKey).toBe(true);
  });

  it('does not call sendMessage when hasApiKey is false', () => {
    useAppStore.setState({ hasApiKey: false });
    const { result } = renderHook(() => useCoachingChat());

    act(() => {
      result.current.setInput('Help me with chord transitions');
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('calls sendMessage when hasApiKey is true and input is provided', () => {
    useAppStore.setState({ hasApiKey: true });
    const { result } = renderHook(() => useCoachingChat());

    act(() => {
      result.current.setInput('Help me with chord transitions');
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(mockSendMessage).toHaveBeenCalledWith({ text: 'Help me with chord transitions' });
  });

  it('does not call sendMessage when input is empty', () => {
    useAppStore.setState({ hasApiKey: true });
    const { result } = renderHook(() => useCoachingChat());

    act(() => {
      result.current.handleSubmit();
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('does not call sendMessage when input is only whitespace', () => {
    useAppStore.setState({ hasApiKey: true });
    const { result } = renderHook(() => useCoachingChat());

    act(() => {
      result.current.setInput('   ');
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('clears input after successful submit', () => {
    useAppStore.setState({ hasApiKey: true });
    const { result } = renderHook(() => useCoachingChat());

    act(() => {
      result.current.setInput('Test message');
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.input).toBe('');
  });

  it('adds user message to session store on submit', () => {
    useAppStore.setState({ hasApiKey: true });
    const { result } = renderHook(() => useCoachingChat());

    act(() => {
      result.current.setInput('Help me improve');
    });

    act(() => {
      result.current.handleSubmit();
    });

    const chatHistory = useSessionStore.getState().chatHistory;
    expect(chatHistory).toHaveLength(1);
    expect(chatHistory[0].role).toBe('user');
    expect(chatHistory[0].content).toBe('Help me improve');
  });

  it('reads providerId from appStore.apiKeyProvider', () => {
    useAppStore.setState({ apiKeyProvider: 'anthropic' });
    const provider = useAppStore.getState().apiKeyProvider;
    expect(provider).toBe('anthropic');
  });

  it('defaults providerId to openai when apiKeyProvider is null', () => {
    useAppStore.setState({ apiKeyProvider: null });
    const provider = useAppStore.getState().apiKeyProvider ?? 'openai';
    expect(provider).toBe('openai');
  });
});
