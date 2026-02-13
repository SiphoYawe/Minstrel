'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import { getSessionContextForAI } from './session-context-provider';
import { parseChatError } from './chat-error-handler';
import { uiMessagesToSimple } from './message-adapter';
import type { ChatErrorInfo } from './coaching-types';
import { replaceProhibitedWords } from './growth-mindset-rules';

/**
 * Custom hook wrapping Vercel AI SDK useChat for coaching chat.
 * Manages streaming, session context injection, error handling, and store sync.
 */
export function useCoachingChat() {
  const [input, setInput] = useState('');
  const hasApiKey = useAppStore((s) => s.hasApiKey);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        body: () => ({
          sessionContext: getSessionContextForAI(),
          providerId: useAppStore.getState().apiKeyProvider ?? 'openai',
        }),
        prepareSendMessagesRequest: async ({ messages: uiMessages, body, ...rest }) => ({
          ...rest,
          body: {
            ...body,
            messages: uiMessagesToSimple(uiMessages),
          },
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

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: initialMessages,
    onFinish: ({ message }) => {
      const textContent = message.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('');
      const filtered = replaceProhibitedWords(textContent);
      useSessionStore.getState().addChatMessage({
        id: message.id,
        role: 'assistant',
        content: filtered,
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
      if (!trimmed || isLoading || !hasApiKey) return;

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
    [input, isLoading, hasApiKey, sendMessage]
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
    hasApiKey,
  };
}
