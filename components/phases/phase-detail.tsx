"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Phase, PhaseTooling, Ticket, ToolType } from "@/lib/types";
import { EditPhaseModal } from "./edit-phase-modal";
import { DeletePhaseDialog } from "./delete-phase-dialog";
import { PhaseToolingEditor } from "./phase-tooling-editor";
import { ProposedTicketsReview } from "@/components/tickets/proposed-tickets-review";
import { ConfirmedTicketRow } from "@/components/tickets/confirmed-ticket-row";

export type ProposedTicket = {
  title: string;
  description: string;
  instructions: string[];
  claudeCodePrompt: string;
  testPrompt: string;
  acceptanceCriteria: string[];
  tooling: {
    type: ToolType;
    name: string;
    isNew: boolean;
    rationale: string | null;
  }[];
};

type Props = {
  phase: Phase & { tooling: PhaseTooling[] };
  tickets: Ticket[];
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

function PriorityBadge({ priority }: { priority: string }) {
  const styles =
    priority === "high"
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

export function PhaseDetail({ phase, tickets, projectId, taskId }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toolingEditOpen, setToolingEditOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposedTickets, setProposedTickets] = useState<
    ProposedTicket[] | null
  >(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasConfirmedTickets = tickets.length > 0;

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleGenerateTickets() {
    if (isGenerating) return;
    setGenerationError(null);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId: phase.id }),
      });
      if (!response.ok) {
        let detail = "Ticket generation failed";
        try {
          const data = await response.json();
          if (typeof data?.error === "string") detail = data.error;
        } catch {
          // leave default
        }
        throw new Error(detail);
      }
      const ticketsJson = (await response.json()) as ProposedTicket[];
      setProposedTickets(ticketsJson);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ticket generation failed";
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
        <Link
          href={`/projects/${projectId}/tasks/${taskId}`}
          aria-label="Back to task"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="flex-1 truncate text-base font-semibold tracking-tight text-zinc-100">
          {phase.title}
        </h1>
        <PriorityBadge priority={phase.priority} />
        <span className="text-xs text-zinc-400">{phase.estimateHours}</span>
        <StatusBadge status={phase.status} />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Phase actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="3" cy="8" r="1.25" fill="currentColor" />
              <circle cx="8" cy="8" r="1.25" fill="currentColor" />
              <circle cx="13" cy="8" r="1.25" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-9 z-10 w-32 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setEditOpen(true);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 py-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Description
          </h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="whitespace-pre-wrap text-sm text-zinc-200">
              {phase.description}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Tooling
            </h2>
            {!toolingEditOpen && (
              <button
                type="button"
                onClick={() => setToolingEditOpen(true)}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
              >
                Edit tooling
              </button>
            )}
          </div>
          {toolingEditOpen ? (
            <PhaseToolingEditor
              phaseId={phase.id}
              tooling={phase.tooling}
              onCancel={() => setToolingEditOpen(false)}
              onSaved={() => setToolingEditOpen(false)}
            />
          ) : phase.tooling.length === 0 ? (
            <p className="text-sm text-zinc-500">No tooling assigned.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {phase.tooling.map((tool: PhaseTooling) => (
                <li
                  key={tool.id}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
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
                  </div>
                  {tool.isNew && tool.rationale && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {tool.rationale}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Tickets
          </h2>
          {hasConfirmedTickets ? (
            <ul className="flex flex-col gap-2">
              {tickets.map((ticket: Ticket) => (
                <li key={ticket.id}>
                  <ConfirmedTicketRow
                    ticket={ticket}
                    projectId={projectId}
                    taskId={taskId}
                    phaseId={phase.id}
                  />
                </li>
              ))}
            </ul>
          ) : proposedTickets ? (
            <ProposedTicketsReview
              phaseId={phase.id}
              proposedTickets={proposedTickets}
              onCancel={() => setProposedTickets(null)}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGenerateTickets}
                disabled={isGenerating}
                className="self-start rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
              >
                {isGenerating ? "Generating tickets…" : "Generate tickets"}
              </button>
              {generationError && (
                <p className="text-sm text-red-400" role="alert">
                  {generationError}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <EditPhaseModal
        open={editOpen}
        phase={phase}
        onClose={() => setEditOpen(false)}
      />
      <DeletePhaseDialog
        open={deleteOpen}
        phaseId={phase.id}
        phaseTitle={phase.title}
        projectId={projectId}
        taskId={taskId}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
