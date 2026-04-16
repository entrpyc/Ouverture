"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { finalizeTask } from "@/app/actions/tasks";
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + chunk };
          }
          return next;
        });
      }
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
                  <div className="max-w-[90%] whitespace-pre-wrap text-sm text-zinc-200">
                    {m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
                  </div>
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
          {isFinalizing ? "Finalizing…" : "Finalize"}
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
