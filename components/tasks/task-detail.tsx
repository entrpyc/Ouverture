"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Phase, Priority, Task, ToolType } from "@/lib/types";
import { saveProposedPhases, updateTaskStatus } from "@/app/actions/tasks";
import { EditTaskModal } from "./edit-task-modal";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { ProposedPhasesReview } from "@/components/phases/proposed-phases-review";
import { ConfirmedPhaseRow } from "@/components/phases/confirmed-phase-row";
import { ThinkingEmoji } from "@/components/thinking-emoji";
import { BurgerMenu } from "@/components/burger-menu";
import { BackLink } from "@/components/back-link";
import { AssumptionsCard } from "@/components/assumptions-card";

export type ProposedPhase = {
  title: string;
  description: string;
  estimateHours: string;
  priority: Priority;
  tooling: {
    type: ToolType;
    name: string;
    isNew: boolean;
    rationale: string | null;
  }[];
};

type Props = {
  task: Task & { phases: Phase[] };
  projectId: string;
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

export function TaskDetail({ task, projectId }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposedPhases, setProposedPhases] = useState<ProposedPhase[] | null>(
    (task.proposedPhases as ProposedPhase[] | null) ?? null
  );
  const [phaseCountInput, setPhaseCountInput] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [statusPending, startStatusTransition] = useTransition();
  const [donePhasesOpen, setDonePhasesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasConfirmedPhases = task.phases.length > 0;
  const isDone = task.status === "done";
  const activePhases = task.phases.filter((p: Phase) => p.status !== "done");
  const donePhases = task.phases.filter((p: Phase) => p.status === "done");

  function handleToggleStatus() {
    if (statusPending) return;
    const next = isDone ? "active" : "done";
    setMenuOpen(false);
    startStatusTransition(async () => {
      const result = await updateTaskStatus(task.id, next);
      if (result.error) return;
      router.refresh();
    });
  }

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

  async function handleGeneratePhases() {
    if (isGenerating) return;
    setGenerationError(null);
    const trimmed = phaseCountInput.trim();
    let phaseCount: number | undefined;
    if (trimmed) {
      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setGenerationError("Phase count must be a positive integer");
        return;
      }
      phaseCount = parsed;
    }
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          ...(phaseCount !== undefined ? { phaseCount } : {}),
        }),
      });
      if (!response.ok) {
        let detail = "Phase generation failed";
        try {
          const data = await response.json();
          if (typeof data?.error === "string") detail = data.error;
        } catch {
          // leave default
        }
        throw new Error(detail);
      }
      const phases = (await response.json()) as ProposedPhase[];
      setProposedPhases(phases);
      void saveProposedPhases(task.id, phases);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Phase generation failed";
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center gap-3 px-6">
        <BackLink href={`/projects/${projectId}`} label="Back to project" />
        <h1 className="flex-1 truncate text-base font-semibold tracking-tight text-zinc-100">
          {task.title}
        </h1>
        <StatusBadge status={task.status} />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Task actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="3" cy="8" r="1.25" fill="currentColor" />
              <circle cx="8" cy="8" r="1.25" fill="currentColor" />
              <circle cx="13" cy="8" r="1.25" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-lg"
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
                onClick={handleToggleStatus}
                disabled={statusPending}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statusPending
                  ? isDone
                    ? "Reopening…"
                    : "Marking…"
                  : isDone
                    ? "Reopen"
                    : "Mark as done"}
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
        <BurgerMenu />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-6 py-6 pt-[calc(5rem+1.5rem)]">
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Requirements
          </h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="whitespace-pre-wrap text-sm text-zinc-200">
              {task.requirements}
            </p>
          </div>
        </section>

        {task.assumptions && <AssumptionsCard assumptions={task.assumptions} />}

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Phases
          </h2>
          {hasConfirmedPhases ? (
            <div className="flex flex-col gap-3">
              {activePhases.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {activePhases.map((phase: Phase) => (
                    <li key={phase.id}>
                      <ConfirmedPhaseRow
                        phase={phase}
                        projectId={projectId}
                        taskId={task.id}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {donePhases.length > 0 && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    aria-expanded={donePhasesOpen}
                    onClick={() => setDonePhasesOpen((v) => !v)}
                    className="flex items-center gap-2 self-start rounded-md px-1 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      aria-hidden="true"
                      className={
                        "transition-transform " +
                        (donePhasesOpen ? "rotate-90" : "")
                      }
                    >
                      <path
                        d="M3 2l4 3-4 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Done ({donePhases.length})</span>
                  </button>
                  {donePhasesOpen && (
                    <ul className="flex flex-col gap-2">
                      {donePhases.map((phase: Phase) => (
                        <li key={phase.id}>
                          <ConfirmedPhaseRow
                            phase={phase}
                            projectId={projectId}
                            taskId={task.id}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : proposedPhases ? (
            <ProposedPhasesReview
              taskId={task.id}
              proposedPhases={proposedPhases}
              onCancel={() => {
                setProposedPhases(null);
                void saveProposedPhases(task.id, null);
              }}
            />
          ) : (
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePhases}
                  disabled={isGenerating}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                >
                  {isGenerating ? (
                    <>
                      Generating phases <ThinkingEmoji />
                    </>
                  ) : (
                    "Generate phases"
                  )}
                </button>
                <input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={phaseCountInput}
                  onChange={(e) => setPhaseCountInput(e.target.value)}
                  disabled={isGenerating}
                  placeholder="Auto"
                  aria-label="Number of phases (leave blank for auto)"
                  className="w-20 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              {generationError && (
                <p className="text-sm text-red-400" role="alert">
                  {generationError}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <EditTaskModal
        open={editOpen}
        task={task}
        onClose={() => setEditOpen(false)}
      />
      <DeleteTaskDialog
        open={deleteOpen}
        taskId={task.id}
        taskTitle={task.title}
        projectId={projectId}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
