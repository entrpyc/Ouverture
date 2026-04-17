"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";
import { EditTaskModal } from "./edit-task-modal";
import { DeleteTaskDialog } from "./delete-task-dialog";

type Props = {
  projectId: string;
  task: Task;
};

export function TaskRow({ projectId, task }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusPending, startStatusTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const isDone = task.status === "done";

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

  return (
    <div
      className={
        "relative flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 transition hover:border-zinc-700 hover:bg-zinc-900 " +
        (isDone ? "opacity-60" : "")
      }
    >
      <Link
        href={`/projects/${projectId}/tasks/${task.id}`}
        className="flex flex-1 items-center justify-between gap-4 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600"
      >
        <span
          className={
            "truncate text-sm " +
            (isDone ? "text-zinc-400 line-through" : "text-zinc-100")
          }
        >
          {task.title}
        </span>
        <span
          className={
            isDone
              ? "rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-500"
              : "rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200"
          }
        >
          {isDone ? "done" : "active"}
        </span>
      </Link>
      <div ref={menuRef} className="relative pr-2">
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
