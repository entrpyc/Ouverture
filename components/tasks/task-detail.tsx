"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Phase, Task } from "@/lib/types";
import { EditTaskModal } from "./edit-task-modal";
import { DeleteTaskDialog } from "./delete-task-dialog";

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

export function TaskDetail({ task, projectId }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  function handleGeneratePhases() {
    console.log("Generate phases clicked — wiring in Phase 6");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
        <Link
          href={`/projects/${projectId}`}
          aria-label="Back to project"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
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
            Requirements
          </h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="whitespace-pre-wrap text-sm text-zinc-200">
              {task.requirements}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Phases
            </h2>
            <button
              type="button"
              onClick={handleGeneratePhases}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              Generate phases
            </button>
          </div>
          {task.phases.length === 0 ? (
            <p className="text-sm text-zinc-500">No phases yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {task.phases.map((phase: Phase) => (
                <li
                  key={phase.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  <span className="flex-1 truncate text-sm text-zinc-100">
                    {phase.title}
                  </span>
                  <PriorityBadge priority={phase.priority} />
                  <span className="text-xs text-zinc-400">
                    {phase.estimateHours}h
                  </span>
                  <StatusBadge status={phase.status} />
                </li>
              ))}
            </ul>
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
