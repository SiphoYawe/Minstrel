'use client';

import {
  useRef,
  useEffect,
  useMemo,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { capture } from '@/lib/analytics';
import { useAppStore } from '@/stores/app-store';
import type { ChatErrorInfo } from '@/features/coaching/coaching-types';
import { segmentResponseText, type TextSegment } from '@/features/coaching/response-processor';
import type { UIMessage } from 'ai';

interface AIChatPanelProps {
  messages: UIMessage[];
  input: string;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: ChatErrorInfo | null;
  setInput: (input: string) => void;
}

const HIGHLIGHT_CLASSES: Record<string, string> = {
  metric: 'text-metric',
  timing: 'text-metric',
  chord: 'text-achieved',
  key: 'text-achieved',
};

function HighlightedMessage({ parts }: { parts: UIMessage['parts'] }) {
  const textContent = parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');

  const segments = useMemo(() => segmentResponseText(textContent), [textContent]);

  return (
    <>
      {segments.map((seg: TextSegment, i: number) =>
        seg.highlight ? (
          <span key={i} className={HIGHLIGHT_CLASSES[seg.highlight] ?? ''}>
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

export function AIChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  error,
  setInput,
}: AIChatPanelProps) {
  const hasApiKey = useAppStore((s) => s.hasApiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const formEvent = new Event('submit', { bubbles: true, cancelable: true });
      textareaRef.current?.form?.dispatchEvent(formEvent);
    }
    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }
  }

  function handleTextareaChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onInputChange(e);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (input.trim()) {
      capture('ai_chat_message_sent', {
        message_length: input.trim().length,
        conversation_turn: messages.length + 1,
      });
    }
    onSubmit(e);
  }

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Connect your API key in Settings to unlock AI coaching
        </p>
        <a
          href="/settings"
          className="text-sm text-[#7CB9E8] underline underline-offset-2 hover:opacity-80"
        >
          Go to Settings
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F]">
      <ScrollArea className="flex-1 min-h-0">
        <div
          className="flex flex-col gap-3 p-3"
          role="log"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {messages.length === 0 && !error && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Ask about your playing — the Studio Engineer is listening.
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'self-end bg-[#1A1A1A] text-foreground font-sans'
                  : 'self-start bg-[#141414] text-foreground font-mono text-xs'
              }`}
            >
              {msg.role === 'assistant' ? (
                <HighlightedMessage parts={msg.parts} />
              ) : (
                msg.parts
                  .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
                  .map((part, i) => <span key={i}>{part.text}</span>)
              )}
            </div>
          ))}
          {error && (
            <div className="self-center px-3 py-2 text-[#D4A43C] text-xs" role="alert">
              {error.message}
              {error.actionUrl && (
                <>
                  {' '}
                  <a href={error.actionUrl} className="underline underline-offset-2">
                    Settings
                  </a>
                </>
              )}
            </div>
          )}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="self-start px-3 py-2" aria-label="AI is thinking">
              <span className="inline-flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-[#7CB9E8] animate-pulse"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-[#7CB9E8] animate-pulse"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-[#7CB9E8] animate-pulse"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 border-t border-[#1A1A1A]">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your playing..."
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none bg-[#141414] border border-[#2A2A2A] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#7CB9E8] font-sans min-h-[36px]"
          aria-label="Chat message input"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-9 px-3 bg-[#7CB9E8] text-[#0F0F0F] hover:bg-[#6AA8D7] disabled:opacity-40 font-mono text-xs uppercase tracking-wider"
          aria-label="Send message"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
