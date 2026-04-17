"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePhaseStatus } from "@/app/actions/phases";
import type { Phase } from "@/lib/types";

type Props = {
  phase: Phase;
  projectId: string;
  taskId: string;
};

function StatusBadge({ status }: { status: string }) {
  const isDone = status === "done";
  return (
    <span
      className={
        isDone
          ? "rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
          : "rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-200"
      }
    >
      {status}
    </span>
  );
}

function PriorityBadge({
  priority,
  muted = false,
}: {
  priority: string;
  muted?: boolean;
}) {
  const styles = muted
    ? "border-zinc-800 bg-zinc-900 text-zinc-500"
    : priority === "high"
      ? "border-red-800 bg-red-950/60 text-red-300"
      : priority === "medium"
        ? "border-amber-800 bg-amber-950/60 text-amber-300"
        : "border-emerald-800 bg-emerald-950/60 text-emerald-300";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles}`}
    >
      {priority}
    </span>
  );
}

export function ConfirmedPhaseRow({ phase, projectId, taskId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isDone = phase.status === "done";
  const href = `/projects/${projectId}/tasks/${taskId}/phases/${phase.id}`;

  function handleToggleStatus() {
    if (pending) return;
    const next = isDone ? "active" : "done";
    setError(null);
    startTransition(async () => {
      const result = await updatePhaseStatus(phase.id, next);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className={
          "flex items-center gap-3 rounded-lg border border-zinc-800 " +
          (isDone ? "bg-zinc-900/50 opacity-60" : "bg-zinc-900")
        }
      >
        <Link
          href={href}
          className="flex flex-1 items-center gap-3 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          <span
            className={
              "flex-1 truncate text-sm " +
              (isDone ? "text-zinc-400 line-through" : "text-zinc-100")
            }
          >
            {phase.title}
          </span>
          <PriorityBadge priority={phase.priority} muted={isDone} />
          <span
            className={
              "text-xs " + (isDone ? "text-zinc-500" : "text-zinc-400")
            }
          >
            {phase.estimateHours}
          </span>
          <StatusBadge status={phase.status} />
        </Link>
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={pending}
          className="mr-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          {pending
            ? isDone
              ? "Reopening…"
              : "Marking…"
            : isDone
              ? "Reopen"
              : "Mark as done"}
        </button>
      </div>
      {error && (
        <p className="px-4 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
