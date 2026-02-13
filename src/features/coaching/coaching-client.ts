'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useCallback, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { getSessionContextForAI } from './session-context-provider';
import { parseChatError } from './chat-error-handler';
import type { ChatErrorInfo } from './coaching-types';

/**
 * Custom hook wrapping Vercel AI SDK useChat for coaching chat.
 * Manages streaming, session context injection, error handling, and store sync.
 */
export function useCoachingChat() {
  const [input, setInput] = useState('');

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        body: () => ({
          sessionContext: getSessionContextForAI(),
          providerId: 'openai',
        }),
      }),
    []
  );

  const chatHistory = useSessionStore((s) => s.chatHistory);
  const initialMessages = useMemo(
    () =>
      chatHistory
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          parts: [{ type: 'text' as const, text: m.content }],
          createdAt: new Date(m.timestamp),
        })),
    // Only compute on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    messages: initialMessages,
    onFinish: ({ message }) => {
      const textContent = message.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('');
      useSessionStore.getState().addChatMessage({
        id: message.id,
        role: 'assistant',
        content: textContent,
        timestamp: Date.now(),
      });
    },
    onError: () => {
      // Error is captured by the hook's error state
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;

      // Add to session store
      const id = crypto.randomUUID();
      useSessionStore.getState().addChatMessage({
        id,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      });

      sendMessage({ text: trimmed });
      setInput('');
    },
    [input, isLoading, sendMessage]
  );

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const chatError: ChatErrorInfo | null = error ? parseChatError(error) : null;

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error: chatError,
    setInput,
  };
}
