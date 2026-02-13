import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import { AIChatPanel } from './ai-chat-panel';
import { useAppStore } from '@/stores/app-store';
import type { ChatMessage } from '@/features/coaching/coaching-types';

const mockMessages: ChatMessage[] = [
  { id: '1', role: 'user', content: 'How is my timing?', timestamp: 1000 },
  { id: '2', role: 'assistant', content: 'Your timing is at 73%.', timestamp: 2000 },
];

describe('AIChatPanel', () => {
  beforeEach(() => {
    useAppStore.setState({ hasApiKey: true });
  });

  it('renders empty state when no messages', () => {
    render(<AIChatPanel messages={[]} onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByText(/Studio Engineer is listening/)).toBeInTheDocument();
  });

  it('renders messages', () => {
    render(<AIChatPanel messages={mockMessages} onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByText('How is my timing?')).toBeInTheDocument();
    expect(screen.getByText('Your timing is at 73%.')).toBeInTheDocument();
  });

  it('shows typing indicator when loading', () => {
    render(<AIChatPanel messages={[]} onSubmit={vi.fn()} isLoading={true} />);
    expect(screen.getByLabelText('AI is thinking')).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AIChatPanel messages={[]} onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByLabelText('Chat message input');
    await user.type(input, 'test message');
    await user.click(screen.getByLabelText('Send message'));

    expect(onSubmit).toHaveBeenCalledWith('test message');
  });

  it('clears input after submit', async () => {
    const user = userEvent.setup();
    render(<AIChatPanel messages={[]} onSubmit={vi.fn()} isLoading={false} />);

    const input = screen.getByLabelText('Chat message input') as HTMLTextAreaElement;
    await user.type(input, 'test message');
    await user.click(screen.getByLabelText('Send message'));

    expect(input.value).toBe('');
  });

  it('disables submit when loading', () => {
    render(<AIChatPanel messages={[]} onSubmit={vi.fn()} isLoading={true} />);
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('disables submit when input is empty', () => {
    render(<AIChatPanel messages={[]} onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('shows API key prompt when no key configured', () => {
    useAppStore.setState({ hasApiKey: false });
    render(<AIChatPanel messages={[]} onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByText(/Connect your API key/)).toBeInTheDocument();
    expect(screen.getByText('Go to Settings')).toHaveAttribute('href', '/settings');
  });

  it('submits on Enter key', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AIChatPanel messages={[]} onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByLabelText('Chat message input');
    await user.type(input, 'hello{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('hello');
  });

  it('does not submit on Shift+Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AIChatPanel messages={[]} onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByLabelText('Chat message input');
    await user.type(input, 'hello{Shift>}{Enter}{/Shift}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has aria-live on message area', () => {
    render(<AIChatPanel messages={[]} onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'polite');
  });

  it('styles user messages differently from assistant messages', () => {
    render(<AIChatPanel messages={mockMessages} onSubmit={vi.fn()} isLoading={false} />);
    const userMsg = screen.getByText('How is my timing?');
    const aiMsg = screen.getByText('Your timing is at 73%.');
    expect(userMsg.className).toContain('self-end');
    expect(aiMsg.className).toContain('self-start');
  });
});
