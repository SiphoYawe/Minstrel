'use client';

import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import type { ChatMessage } from '@/features/coaching/coaching-types';

interface AIChatPanelProps {
  messages: ChatMessage[];
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

export function AIChatPanel({ messages, onSubmit, isLoading }: AIChatPanelProps) {
  const hasApiKey = useAppStore((s) => s.hasApiKey);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
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
          {messages.length === 0 && (
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
                  : msg.role === 'system'
                    ? 'self-center text-[#D4A43C] text-xs'
                    : 'self-start bg-[#141414] text-foreground font-mono text-xs'
              }`}
            >
              {msg.content}
            </div>
          ))}
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
          onChange={handleInput}
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
