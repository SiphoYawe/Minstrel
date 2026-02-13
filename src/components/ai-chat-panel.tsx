'use client';

import {
  useRef,
  useState,
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
import { useOnlineStatus } from '@/hooks/use-online-status';
import { OfflineMessage } from '@/components/offline-message';
import type { ChatErrorInfo } from '@/features/coaching/coaching-types';
import { parseRichSegments, type RichSegment } from '@/features/coaching/response-processor';
import { ChordDiagram } from '@/components/chat/chord-diagram';
import { ScaleDisplay } from '@/components/chat/scale-display';
import { TimingGraph } from '@/components/chat/timing-graph';
import { PracticeTip } from '@/components/chat/practice-tip';
import { DrillSuggestion } from '@/components/chat/drill-suggestion';
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

function RichSegmentRenderer({ segment, index }: { segment: RichSegment; index: number }) {
  switch (segment.type) {
    case 'text':
      return segment.highlight ? (
        <span key={index} className={HIGHLIGHT_CLASSES[segment.highlight] ?? ''}>
          {segment.text}
        </span>
      ) : (
        <span key={index}>{segment.text}</span>
      );
    case 'chord':
      return <ChordDiagram key={index} chord={segment.chord} />;
    case 'scale':
      return <ScaleDisplay key={index} scaleName={segment.scaleName} />;
    case 'timing':
      return (
        <TimingGraph
          key={index}
          early={segment.early}
          onTime={segment.onTime}
          late={segment.late}
        />
      );
    case 'tip':
      return <PracticeTip key={index} content={segment.content} />;
    case 'drill':
      return (
        <DrillSuggestion
          key={index}
          drillName={segment.drillName}
          targetSkill={segment.targetSkill}
        />
      );
    default:
      return null;
  }
}

function HighlightedMessage({ parts }: { parts: UIMessage['parts'] }) {
  const textContent = parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');

  const segments = useMemo(() => parseRichSegments(textContent), [textContent]);

  return (
    <>
      {segments.map((seg: RichSegment, i: number) => (
        <RichSegmentRenderer key={i} segment={seg} index={i} />
      ))}
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
  setInput: _setInput,
}: AIChatPanelProps) {
  void _setInput;
  const hasApiKey = useAppStore((s) => s.hasApiKey);
  const { isOnline } = useOnlineStatus();
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

  const [isOverflowing, setIsOverflowing] = useState(false);
  const TEXTAREA_MAX_HEIGHT = 200;

  function handleTextareaChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onInputChange(e);
    const el = e.target;
    el.style.height = 'auto';
    const clamped = Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT);
    el.style.height = `${clamped}px`;
    setIsOverflowing(el.scrollHeight > TEXTAREA_MAX_HEIGHT);
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
          className="text-sm text-primary underline underline-offset-2 hover:opacity-80"
        >
          Go to Settings
        </a>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <OfflineMessage dismissable={false} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
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
                  ? 'self-end bg-surface-light text-foreground font-sans'
                  : 'self-start bg-card text-foreground font-mono text-xs'
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
            <div className="self-center px-3 py-2 text-accent-warm text-xs" role="alert">
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
                  className="w-1.5 h-1.5 bg-primary animate-pulse"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-primary animate-pulse"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-primary animate-pulse"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-3 border-t border-surface-light"
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your playing..."
            rows={1}
            disabled={isLoading}
            className="w-full resize-none bg-card border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-sans min-h-[36px] overflow-y-auto"
            style={{ maxHeight: `${TEXTAREA_MAX_HEIGHT}px` }}
            aria-label="Chat message input"
          />
          {isOverflowing && (
            <div
              className="absolute bottom-0 left-px right-px h-5 bg-gradient-to-t from-card to-transparent pointer-events-none"
              aria-hidden="true"
              data-testid="scroll-indicator"
            />
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-9 px-3 bg-primary text-background hover:brightness-90 disabled:opacity-40 font-mono text-xs uppercase tracking-wider"
          aria-label="Send message"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
