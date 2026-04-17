"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { finalizeTask, saveConversation } from "@/app/actions/tasks";
import { parseMessageContent } from "@/lib/parse-tooling-suggestions";
import { ThinkingEmoji } from "@/components/thinking-emoji";
import type { ProjectTool, Task } from "@/lib/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  task: Task;
  projectId: string;
  projectTools: ProjectTool[];
};

function ToolingSuggestionCard({ suggestion }: { suggestion: string }) {
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        Tooling suggestion
      </p>
      <p className="mt-1 text-sm text-zinc-200">{suggestion}</p>
    </div>
  );
}

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-assistant flex flex-col gap-3 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-zinc-200">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-50">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 text-zinc-200">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 text-zinc-200">{children}</ol>
          ),
          li: ({ children }) => <li className="marker:text-zinc-500">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-base font-semibold text-zinc-50">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-zinc-50">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-zinc-50">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-zinc-700 pl-3 text-zinc-300">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className ?? "");
            if (isBlock) {
              return (
                <code
                  className="block overflow-x-auto rounded-md bg-zinc-900 p-3 font-mono text-xs text-zinc-100"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-xs text-zinc-100"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-100">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-100 underline underline-offset-2 hover:text-white"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-zinc-800" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function AssistantMessage({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  if (isStreaming) {
    return (
      <div className="max-w-[90%] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
        {content ? <AssistantMarkdown content={content} /> : <ThinkingEmoji />}
      </div>
    );
  }

  if (!content) return null;

  const { text, suggestions } = parseMessageContent(content);

  return (
    <div className="flex max-w-[90%] flex-col gap-2">
      {text && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
          <AssistantMarkdown content={text} />
        </div>
      )}
      {suggestions.map((suggestion, i) => (
        <ToolingSuggestionCard key={i} suggestion={suggestion} />
      ))}
    </div>
  );
}

export function ChatInterface({ task, projectId, projectTools }: Props) {
  void projectTools;

  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(
    (task.conversationHistory as ChatMessage[] | null) ?? []
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (isStreaming) return;
    const current = messagesRef.current;
    if (current.length === 0) return;
    void saveConversation(task.id, { conversationHistory: current });
  }, [isStreaming, task.id]);

  const canSend = input.trim().length > 0 && !isStreaming && !isFinalizing;
  const canFinalize =
    messages.length >= 2 && !isStreaming && !isFinalizing;

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || isFinalizing) return;

    setError(null);
    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const outgoing = [...messages, userMessage];
    setMessages([...outgoing, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: outgoing, projectId }),
      });

      if (!response.ok || !response.body) {
        let detail = "Request failed";
        try {
          const data = await response.json();
          if (typeof data?.error === "string") detail = data.error;
        } catch {
          // leave default
        }
        throw new Error(detail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const appendDelta = (delta: string) => {
        if (!delta) return;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + delta };
          }
          return next;
        });
      };

      const handleFrame = (frame: string) => {
        const trimmed = frame.trim();
        if (!trimmed) return;
        const dataLines = trimmed
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim());
        if (dataLines.length === 0) return;
        const payload = dataLines.join("\n");
        if (payload === "[DONE]") return;
        try {
          const parsed = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = parsed.choices?.[0]?.delta?.content ?? "";
          appendDelta(delta);
        } catch {
          // ignore malformed frames
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sepIndex = buffer.indexOf("\n\n");
        while (sepIndex !== -1) {
          const frame = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          handleFrame(frame);
          sepIndex = buffer.indexOf("\n\n");
        }
      }
      if (buffer.length > 0) handleFrame(buffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat request failed";
      setError(message);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          next.pop();
        }
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleFinalize() {
    if (!canFinalize) return;
    setError(null);
    setIsFinalizing(true);

    try {
      const response = await fetch("/api/ai/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, projectId }),
      });

      if (!response.ok) {
        let detail = "Finalize request failed";
        try {
          const data = await response.json();
          if (typeof data?.error === "string") detail = data.error;
        } catch {
          // leave default
        }
        throw new Error(detail);
      }

      const { title, requirements } = (await response.json()) as {
        title: string;
        requirements: string;
      };

      const result = await finalizeTask(task.id, {
        title,
        requirements,
        conversationHistory: messages,
      });
      if (result.error) throw new Error(result.error);

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to finalize";
      setError(message);
      setIsFinalizing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col gap-4">
      <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Describe what you want to build. The assistant will ask follow-up
            questions until the requirements are clear.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <li
                key={i}
                className={
                  m.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                {m.role === "user" ? (
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
                    {m.content}
                  </div>
                ) : (
                  <AssistantMessage
                    content={m.content}
                    isStreaming={isStreaming && i === messages.length - 1}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {(isStreaming || isFinalizing) && (
        <p className="text-xs text-zinc-500">
          {isFinalizing ? "Generating task requirements…" : "Thinking…"}
        </p>
      )}

      <div className="flex flex-col items-end gap-2">
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleFinalize}
          disabled={!canFinalize}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          {isFinalizing ? (
            <>
              Finalizing <ThinkingEmoji intervalMs={2000} />
            </>
          ) : (
            "Finalize"
          )}
        </button>
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming || isFinalizing}
          rows={3}
          placeholder="Describe what you want to build…"
          className="flex-1 resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
