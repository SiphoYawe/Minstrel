import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import { AIChatPanel } from './ai-chat-panel';
import { useAppStore } from '@/stores/app-store';
import type { UIMessage } from 'ai';
import type { ChangeEvent, FormEvent } from 'react';

function createMockMessages(): UIMessage[] {
  return [
    {
      id: '1',
      role: 'user',
      content: 'How is my timing?',
      parts: [{ type: 'text', text: 'How is my timing?' }],
      createdAt: new Date(),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Your timing is at 73%.',
      parts: [{ type: 'text', text: 'Your timing is at 73%.' }],
      createdAt: new Date(),
    },
  ];
}

function renderPanel(
  overrides: Partial<{
    messages: UIMessage[];
    input: string;
    onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    error: null;
    setInput: (s: string) => void;
  }> = {}
) {
  const defaults = {
    messages: [] as UIMessage[],
    input: '',
    onInputChange: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    error: null,
    setInput: vi.fn(),
    ...overrides,
  };
  return render(<AIChatPanel {...defaults} />);
}

describe('AIChatPanel', () => {
  beforeEach(() => {
    useAppStore.setState({ hasApiKey: true });
  });

  it('renders empty state when no messages', () => {
    renderPanel();
    expect(screen.getByText(/Studio Engineer online/)).toBeInTheDocument();
  });

  it('renders messages', () => {
    renderPanel({ messages: createMockMessages() });
    expect(screen.getByText('How is my timing?')).toBeInTheDocument();
    // Assistant text is segmented with highlights via parseRichSegments
    expect(screen.getByText(/Your timing is at/)).toBeInTheDocument();
    expect(screen.getByText('73%')).toBeInTheDocument();
  });

  it('shows typing indicator when loading', () => {
    renderPanel({ isLoading: true });
    expect(screen.getByLabelText('AI is thinking')).toBeInTheDocument();
  });

  it('disables submit when loading', () => {
    renderPanel({ isLoading: true });
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('disables submit when input is empty', () => {
    renderPanel();
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('shows API key prompt when no key configured', () => {
    useAppStore.setState({ hasApiKey: false });
    renderPanel();
    expect(screen.getByText(/Connect your API key/)).toBeInTheDocument();
    expect(screen.getByText('Configure API Key')).toHaveAttribute('href', '/settings');
  });

  it('has aria-live on message area', () => {
    renderPanel();
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'polite');
  });

  it('styles user messages differently from assistant messages', () => {
    renderPanel({ messages: createMockMessages() });
    const userMsg = screen.getByText('How is my timing?').closest('div');
    const aiMsg = screen.getByText('73%').closest('div[class*="border-l-2"]')?.parentElement;
    expect(userMsg?.className).toContain('self-end');
    expect(aiMsg?.className).toContain('self-start');
  });

  it('shows error message when error is provided', () => {
    renderPanel({
      error: { code: 'INVALID_KEY', message: 'Key is invalid', actionUrl: '/settings' } as never,
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onSubmit on form submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    renderPanel({ input: 'test message', onSubmit });

    await user.click(screen.getByLabelText('Send message'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('calls onInputChange when typing', async () => {
    const user = userEvent.setup();
    const onInputChange = vi.fn();
    renderPanel({ onInputChange });

    const input = screen.getByLabelText('Ask your coach');
    await user.type(input, 'a');
    expect(onInputChange).toHaveBeenCalled();
  });

  it('textarea has max-h-[200px] CSS class and overflow-y auto', () => {
    renderPanel();
    const textarea = screen.getByLabelText('Ask your coach');
    expect(textarea.className).toContain('max-h-[200px]');
    expect(textarea.className).toContain('overflow-y-auto');
  });

  it('does not show scroll indicator when content fits', () => {
    renderPanel();
    expect(screen.queryByTestId('scroll-indicator')).not.toBeInTheDocument();
  });

  it('has a visible sr-only label associated with the textarea via htmlFor/id', () => {
    renderPanel();
    const label = screen.getByText('Ask your coach');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'chat-input');
    expect(label.className).toContain('sr-only');

    const textarea = screen.getByLabelText('Ask your coach');
    expect(textarea).toHaveAttribute('id', 'chat-input');
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('has a resize announcement aria-live region', () => {
    renderPanel();
    const announcement = screen.getByTestId('resize-announcement');
    expect(announcement).toHaveAttribute('aria-live', 'polite');
    expect(announcement.className).toContain('sr-only');
    expect(announcement.textContent).toBe('');
  });

  it('announces "Input expanded" when textarea height increases', () => {
    const onInputChange = vi.fn();
    renderPanel({ onInputChange });
    const textarea = screen.getByLabelText('Ask your coach') as HTMLTextAreaElement;

    // Simulate first change (sets baseline height)
    Object.defineProperty(textarea, 'scrollHeight', { value: 36, configurable: true });
    fireEvent.change(textarea, { target: { value: 'a' } });

    // Simulate second change with increased height
    Object.defineProperty(textarea, 'scrollHeight', { value: 72, configurable: true });
    fireEvent.change(textarea, { target: { value: 'a\nb\nc' } });

    const announcement = screen.getByTestId('resize-announcement');
    expect(announcement.textContent).toBe('Input expanded');
  });

  it('does not announce when textarea height stays the same or decreases', () => {
    const onInputChange = vi.fn();
    renderPanel({ onInputChange });
    const textarea = screen.getByLabelText('Ask your coach') as HTMLTextAreaElement;

    // Simulate first change (sets baseline height)
    Object.defineProperty(textarea, 'scrollHeight', { value: 72, configurable: true });
    fireEvent.change(textarea, { target: { value: 'a\nb\nc' } });

    // Simulate second change with same height
    Object.defineProperty(textarea, 'scrollHeight', { value: 72, configurable: true });
    fireEvent.change(textarea, { target: { value: 'a\nb\nd' } });

    const announcement = screen.getByTestId('resize-announcement');
    expect(announcement.textContent).toBe('');
  });
});
