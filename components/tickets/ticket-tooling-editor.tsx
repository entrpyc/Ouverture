"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replaceTicketTooling } from "@/app/actions/tickets";
import type { TicketTooling, ToolType } from "@/lib/types";

type Props = {
  ticketId: string;
  tooling: TicketTooling[];
  onCancel: () => void;
  onSaved: () => void;
};

const TOOL_TYPES: ToolType[] = ["agent", "skill", "mcp"];

function isToolType(value: string): value is ToolType {
  return (TOOL_TYPES as string[]).includes(value);
}

type NewTool = {
  id: string;
  type: ToolType;
  name: string;
};

export function TicketToolingEditor({
  ticketId,
  tooling,
  onCancel,
  onSaved,
}: Props) {
  const router = useRouter();
  const [keptIds, setKeptIds] = useState<Set<string>>(
    () => new Set(tooling.map((t) => t.id))
  );
  const [newTools, setNewTools] = useState<NewTool[]>([]);
  const [newType, setNewType] = useState<ToolType>("agent");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const nextIdRef = useRef(0);

  function toggleKept(id: string) {
    setKeptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddTool(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = `new-${nextIdRef.current++}`;
    setNewTools((prev) => [...prev, { id, type: newType, name: trimmed }]);
    setNewName("");
  }

  function removeNewTool(id: string) {
    setNewTools((prev) => prev.filter((t) => t.id !== id));
  }

  function handleSave() {
    setError(null);
    const keptTools = tooling
      .filter((t) => keptIds.has(t.id))
      .map((t) => ({
        type: t.type as ToolType,
        name: t.name,
        isNew: t.isNew,
        rationale: t.rationale ?? undefined,
      }));
    const addedTools = newTools.map((t) => ({
      type: t.type,
      name: t.name,
      isNew: false,
      rationale: undefined,
    }));
    const payload = [...keptTools, ...addedTools];

    startTransition(async () => {
      const result = await replaceTicketTooling(ticketId, payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onSaved();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {tooling.length > 0 && (
        <ul className="flex flex-col gap-2">
          {tooling.map((tool) => {
            const kept = keptIds.has(tool.id);
            return (
              <li
                key={tool.id}
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={kept}
                    onChange={() => toggleKept(tool.id)}
                    className="h-4 w-4 cursor-pointer accent-zinc-200"
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    {tool.type}
                  </span>
                  <span className="flex-1 text-sm text-zinc-100">
                    {tool.name}
                  </span>
                  {tool.isNew && (
                    <span className="rounded-full border border-amber-800 bg-amber-950/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                      New
                    </span>
                  )}
                </label>
                {tool.isNew && tool.rationale && (
                  <p className="mt-1 pl-7 text-xs text-zinc-500">
                    {tool.rationale}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {newTools.length > 0 && (
        <ul className="flex flex-col gap-2">
          {newTools.map((tool) => (
            <li
              key={tool.id}
              className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {tool.type}
              </span>
              <span className="flex-1 text-sm text-zinc-100">{tool.name}</span>
              <button
                type="button"
                onClick={() => removeNewTool(tool.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAddTool}
        className="flex items-end gap-2 rounded-md border border-dashed border-zinc-800 bg-zinc-950 p-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Type
          </label>
          <select
            value={newType}
            onChange={(e) => {
              if (isToolType(e.target.value)) setNewType(e.target.value);
            }}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
          >
            {TOOL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="tool name"
            className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={newName.trim().length === 0}
          className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          Add
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          {pending ? "Saving…" : "Save tooling"}
        </button>
      </div>
    </div>
  );
}
