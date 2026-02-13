import type { UIMessage } from 'ai';

/**
 * Convert AI SDK v6 UIMessages (with `parts`) to simple {role, content} format
 * expected by the /api/ai/chat Zod schema.
 */
export function uiMessagesToSimple(
  messages: UIMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join(''),
    }));
}
