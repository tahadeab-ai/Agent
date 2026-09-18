'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Wrench,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  result?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolInvocation[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [soulStatus, setSoulStatus] = useState<{
    hasSoul: boolean;
    userType: string;
    userName: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/agent/soul')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setSoulStatus({
            hasSoul: data.isCustom,
            userType: data.user.type,
            userName: data.user.name,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    let assistantText = '';
    const toolInvocations: ToolInvocation[] = [];

    // Add placeholder assistant message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        toolInvocations: [],
      },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse Vercel AI SDK DataStream format
          // Format: <prefix>:<json-value>
          // 0: text delta
          // 9: tool call
          // a: tool result
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const prefix = line.slice(0, colonIndex);
            const payload = line.slice(colonIndex + 1);

            try {
              if (prefix === '0') {
                // Text delta
                const textChunk = JSON.parse(payload);
                assistantText += textChunk;
              } else if (prefix === '9') {
                // Tool call
                const call = JSON.parse(payload);
                toolInvocations.push({
                  toolCallId: call.toolCallId,
                  toolName: call.toolName,
                });
              } else if (prefix === 'a') {
                // Tool result
                const res = JSON.parse(payload);
                const existing = toolInvocations.find((t) => t.toolCallId === res.toolCallId);
                if (existing) {
                  existing.result = res.result;
                } else {
                  toolInvocations.push({
                    toolCallId: res.toolCallId,
                    toolName: res.toolName || 'Tool',
                    result: res.result,
                  });
                }
              }
            } catch {
              // Plain text fallback
              assistantText += line;
            }
          } else {
            assistantText += line;
          }

          // Update current streaming assistant message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: assistantText,
                    toolInvocations: [...toolInvocations],
                  }
                : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error('[Chat] Stream error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  assistantText ||
                  `⚠️ Error: ${err?.message || 'Failed to connect to the agent service.'}`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Introduce yourself and help me set your personality',
    'What do you know about me so far from memory?',
    'Schedule a daily summary every day at 9am',
    'List all my active scheduled tasks',
  ];

  return (
    <div className="flex flex-1 flex-col mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Welcome Banner */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-5 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Agent Assistant & Tool Center
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Powered by Vercel AI SDK, Composio external apps, Supermemory long-term memory, and Vercel Cron.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {soulStatus && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                  soulStatus.hasSoul
                    ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300'
                    : soulStatus.userType === 'guest'
                    ? 'border-amber-800 bg-amber-950/60 text-amber-300'
                    : 'border-indigo-800 bg-indigo-950/60 text-indigo-300'
                }`}
              >
                {soulStatus.hasSoul ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Soul Configured
                  </>
                ) : soulStatus.userType === 'guest' ? (
                  <>
                    <HelpCircle className="h-3.5 w-3.5" /> Guest Mode (Default Soul)
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Onboarding Active
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 sm:p-6 min-h-[420px] max-h-[calc(100vh-320px)] shadow-inner">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-3">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-base font-medium text-zinc-200">How can I assist you today?</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              Start chatting below. If you are a new regular user, I will walk you through conversational onboarding to craft my personality.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-lg w-full">
              {samplePrompts.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(promptText);
                  }}
                  className="flex items-center justify-between text-left rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 p-3 text-xs text-zinc-300 transition-all hover:border-zinc-700"
                >
                  <span className="truncate pr-2">{promptText}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role !== 'user' && (
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-indigo-600 text-white shadow">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`flex max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-md ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-zinc-850 border border-zinc-800 text-zinc-200 rounded-tl-none'
                }`}
              >
                {/* Message text content */}
                {m.content && (
                  <div className="whitespace-pre-wrap leading-relaxed break-words">
                    {m.content}
                  </div>
                )}

                {/* Tool Invocations Display */}
                {m.toolInvocations && m.toolInvocations.length > 0 && (
                  <div className="mt-2 space-y-1.5 pt-2 border-t border-zinc-700/50">
                    {m.toolInvocations.map((toolInv) => (
                      <div
                        key={toolInv.toolCallId}
                        className="rounded-lg bg-zinc-900/90 border border-zinc-750 p-2 text-xs font-mono text-zinc-300"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 font-semibold text-indigo-400">
                            <Wrench className="h-3 w-3" />
                            {toolInv.toolName}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                            {toolInv.result !== undefined ? 'Completed' : 'Running...'}
                          </span>
                        </div>
                        {toolInv.result !== undefined && (
                          <div className="mt-1 max-h-24 overflow-y-auto text-[11px] text-zinc-400 bg-zinc-950/60 rounded p-1.5 whitespace-pre-wrap">
                            {typeof toolInv.result === 'string'
                              ? toolInv.result
                              : JSON.stringify(toolInv.result, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 shadow">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 pl-11">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <span>Agent is thinking and processing tools...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message or instruction..."
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
