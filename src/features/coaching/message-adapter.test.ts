import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uiMessagesToSimple } from './message-adapter';
import type { UIMessage } from 'ai';

describe('uiMessagesToSimple', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('converts text parts to simple messages', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
        createdAt: new Date(),
      },
      {
        id: '2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hi there' }],
        createdAt: new Date(),
      },
    ];

    const result = uiMessagesToSimple(messages);
    expect(result).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]);
  });

  it('filters out system messages', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'system' as UIMessage['role'],
        parts: [{ type: 'text', text: 'system prompt' }],
        createdAt: new Date(),
      },
      {
        id: '2',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
        createdAt: new Date(),
      },
    ];

    const result = uiMessagesToSimple(messages);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('user');
  });

  it('concatenates multiple text parts', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Part one. ' },
          { type: 'text', text: 'Part two.' },
        ],
        createdAt: new Date(),
      },
    ];

    const result = uiMessagesToSimple(messages);
    expect(result[0].content).toBe('Part one. Part two.');
  });

  it('logs a warning when non-text parts are dropped', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const messages: UIMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Some text' },
          { type: 'tool-invocation', toolInvocation: {} } as unknown as UIMessage['parts'][number],
          { type: 'reasoning', reasoning: 'thinking' } as unknown as UIMessage['parts'][number],
        ],
        createdAt: new Date(),
      },
    ];

    const result = uiMessagesToSimple(messages);
    expect(result[0].content).toBe('Some text');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Dropped 2 non-text part(s) from message msg-1'),
      expect.arrayContaining(['tool-invocation', 'reasoning'])
    );
  });

  it('does not warn when all parts are text', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const messages: UIMessage[] = [
      {
        id: 'msg-2',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
        createdAt: new Date(),
      },
    ];

    uiMessagesToSimple(messages);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns empty array for empty input', () => {
    const result = uiMessagesToSimple([]);
    expect(result).toEqual([]);
  });
});
