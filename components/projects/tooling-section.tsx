"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addProjectTool,
  deleteProjectTool,
  updateProjectTool,
} from "@/app/actions/project-tools";
import type { ProjectTool, ToolType } from "@/lib/types";

type Props = {
  projectId: string;
  tools: ProjectTool[];
};

type FormState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; toolId: string };

const TYPE_LABELS: Record<ToolType, string> = {
  agent: "Agents",
  skill: "Skills",
  mcp: "MCPs",
};

const TYPE_ORDER: ToolType[] = ["agent", "skill", "mcp"];

export function ToolingSection({ projectId, tools }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ kind: "closed" });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const grouped: Record<ToolType, ProjectTool[]> = {
    agent: [],
    skill: [],
    mcp: [],
  };
  for (const tool of tools) {
    const type = tool.type as ToolType;
    if (grouped[type]) grouped[type].push(tool);
  }

  function openCreate() {
    setError(null);
    setForm({ kind: "create" });
  }

  function openEdit(toolId: string) {
    setError(null);
    setForm({ kind: "edit", toolId });
  }

  function closeForm() {
    setError(null);
    setForm({ kind: "closed" });
  }

  function handleDelete(toolId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteProjectTool(toolId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSubmit(values: { type: ToolType; name: string }) {
    setError(null);
    startTransition(async () => {
      const result =
        form.kind === "edit"
          ? await updateProjectTool(form.toolId, values)
          : await addProjectTool(projectId, values);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      setForm({ kind: "closed" });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {TYPE_ORDER.map((type) => {
        const items = grouped[type];
        return (
          <div key={type} className="flex flex-col gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {TYPE_LABELS[type]}
            </h3>
            {items.length === 0 ? (
              <p className="text-sm text-zinc-500">None added yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((tool) => {
                  const isEditing =
                    form.kind === "edit" && form.toolId === tool.id;
                  return (
                    <div key={tool.id} className="flex flex-col gap-2">
                      <ToolPill
                        tool={tool}
                        pending={pending}
                        onEdit={() => openEdit(tool.id)}
                        onDelete={() => handleDelete(tool.id)}
                      />
                      {isEditing && (
                        <InlineToolForm
                          mode="edit"
                          initialType={tool.type as ToolType}
                          initialName={tool.name}
                          pending={pending}
                          onCancel={closeForm}
                          onSubmit={handleSubmit}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-2 flex flex-col gap-2">
        {form.kind !== "create" ? (
          <button
            type="button"
            onClick={openCreate}
            className="self-start rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            Add tool
          </button>
        ) : (
          <InlineToolForm
            mode="create"
            initialType="agent"
            initialName=""
            pending={pending}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

function ToolPill({
  tool,
  pending,
  onEdit,
  onDelete,
}: {
  tool: ProjectTool;
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 py-1 pl-3 pr-1.5 text-sm text-zinc-200">
      <span className="max-w-[20rem] truncate">{tool.name}</span>
      <button
        type="button"
        aria-label={`Edit ${tool.name}`}
        onClick={onEdit}
        disabled={pending}
        className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M11.5 2.5l2 2L5 13l-3 1 1-3 8.5-8.5z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label={`Remove ${tool.name}`}
        onClick={onDelete}
        disabled={pending}
        className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function InlineToolForm({
  mode,
  initialType,
  initialName,
  pending,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialType: ToolType;
  initialName: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: { type: ToolType; name: string }) => void;
}) {
  const [type, setType] = useState<ToolType>(initialType);
  const [name, setName] = useState(initialName);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ type, name: trimmed });
      }}
      className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 p-2"
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value as ToolType)}
        className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
        aria-label="Tool type"
      >
        <option value="agent">agent</option>
        <option value="skill">skill</option>
        <option value="mcp">mcp</option>
      </select>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="tool-name"
        className="flex-1 min-w-[10rem] rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
        autoFocus
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : mode === "edit" ? "Save" : "Add"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="rounded-md px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel
      </button>
    </form>
  );
}
