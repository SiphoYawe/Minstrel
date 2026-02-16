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
    .map((m) => {
      const droppedParts = m.parts.filter((p) => p.type !== 'text');
      if (droppedParts.length > 0) {
        console.warn(
          `[message-adapter] Dropped ${droppedParts.length} non-text part(s) from message ${m.id}:`,
          droppedParts.map((p) => p.type)
        );
      }
      return {
        role: m.role as 'user' | 'assistant',
        content: m.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(''),
      };
    });
}
