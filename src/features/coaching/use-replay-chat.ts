'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import { buildReplayContext } from './context-builder';
import { parseChatError } from './chat-error-handler';
import { uiMessagesToSimple } from './message-adapter';
import type { ChatErrorInfo } from './coaching-types';
import type { AnalysisSnapshot } from '@/lib/dexie/db';

function getReplayBody(snapshots: AnalysisSnapshot[]) {
  const state = useSessionStore.getState();
  const context = buildReplayContext(state.replayEvents, state.replayPosition, snapshots, {
    key: state.replaySession?.key ?? null,
    tempo: state.replaySession?.tempo ?? null,
    genre: null,
  });
  return {
    replayContext: context,
    mode: 'replay' as const,
    providerId: 'openai',
  };
}

/**
 * Custom hook for AI chat in Replay Studio.
 * Reads replayPosition from sessionStore, builds timestamp-specific context,
 * and sends to /api/ai/chat with mode:'replay'.
 */
export function useReplayChat(snapshots: AnalysisSnapshot[] = []) {
  const [input, setInput] = useState('');
  const hasApiKey = useAppStore((s) => s.hasApiKey);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        body: () => getReplayBody(snapshots),
        prepareSendMessagesRequest: async ({ messages: uiMessages, body, ...rest }) => ({
          ...rest,
          body: {
            ...body,
            messages: uiMessagesToSimple(uiMessages),
          },
        }),
      }),
    [snapshots]
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    onError: () => {
      // Error captured by hook's error state
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading || !hasApiKey) return;

      sendMessage({ text: trimmed });
      setInput('');
    },
    [input, isLoading, hasApiKey, sendMessage]
  );

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const chatError: ChatErrorInfo | null = error ? parseChatError(error) : null;

  const currentTimestamp = useSessionStore((s) => s.replayPosition);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error: chatError,
    setInput,
    hasApiKey,
    currentTimestamp,
    setMessages,
  };
}
