"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTicketStatus } from "@/app/actions/tickets";
import type { Ticket } from "@/lib/types";

type Props = {
  ticket: Ticket;
  projectId: string;
  taskId: string;
  phaseId: string;
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

export function ConfirmedTicketRow({
  ticket,
  projectId,
  taskId,
  phaseId,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isDone = ticket.status === "done";
  const href = `/projects/${projectId}/tasks/${taskId}/phases/${phaseId}/tickets/${ticket.id}`;

  function handleMarkDone() {
    if (pending || isDone) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, "done");
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
          (isDone ? "bg-zinc-900/50 opacity-70" : "bg-zinc-900")
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
            {ticket.title}
          </span>
          <StatusBadge status={ticket.status} />
        </Link>
        {!isDone && (
          <button
            type="button"
            onClick={handleMarkDone}
            disabled={pending}
            className="mr-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            {pending ? "Marking…" : "Mark done"}
          </button>
        )}
      </div>
      {error && (
        <p className="px-4 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
