/**
 * Sanitizes toolCallId in messages to conform to Anthropic and strict provider requirements:
 * ^[a-zA-Z0-9_-]+$
 */
export function sanitizeToolCallId(id: string): string {
  if (!id) return `tool_${Math.random().toString(36).slice(2, 10)}`;
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function sanitizeMessages<T = any>(messages: T[]): T[] {
  if (!Array.isArray(messages)) return [];

  return messages.map((message: any) => {
    if (!message || typeof message !== 'object') return message;

    const cloned = { ...message };

    // Sanitize parts array
    if (Array.isArray(cloned.parts)) {
      cloned.parts = cloned.parts.map((part: any) => {
        if (!part || typeof part !== 'object') return part;
        const partClone = { ...part };
        if (typeof partClone.toolCallId === 'string') {
          partClone.toolCallId = sanitizeToolCallId(partClone.toolCallId);
        }
        return partClone;
      });
    }

    // Sanitize toolInvocations array
    if (Array.isArray(cloned.toolInvocations)) {
      cloned.toolInvocations = cloned.toolInvocations.map((invocation: any) => {
        if (!invocation || typeof invocation !== 'object') return invocation;
        const invClone = { ...invocation };
        if (typeof invClone.toolCallId === 'string') {
          invClone.toolCallId = sanitizeToolCallId(invClone.toolCallId);
        }
        return invClone;
      });
    }

    return cloned;
  });
}
