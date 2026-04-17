"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { TaskRow } from "./task-row";

type Props = {
  projectId: string;
  tasks: Task[];
};

export function TaskListGroups({ projectId, tasks }: Props) {
  const [doneOpen, setDoneOpen] = useState(false);

  const activeTasks = tasks.filter((t: Task) => t.status !== "done");
  const doneTasks = tasks.filter((t: Task) => t.status === "done");

  return (
    <div className="flex flex-col gap-4">
      {activeTasks.length === 0 && doneTasks.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No tasks yet — create one to get started
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {activeTasks.map((task: Task) => (
            <li key={task.id}>
              <TaskRow projectId={projectId} task={task} />
            </li>
          ))}
        </ul>
      )}

      {doneTasks.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={doneOpen}
            onClick={() => setDoneOpen((v) => !v)}
            className="flex items-center gap-2 self-start rounded-md px-1 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              aria-hidden="true"
              className={
                "transition-transform " + (doneOpen ? "rotate-90" : "")
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
            <span>Done ({doneTasks.length})</span>
          </button>
          {doneOpen && (
            <ul className="flex flex-col gap-2">
              {doneTasks.map((task: Task) => (
                <li key={task.id}>
                  <TaskRow projectId={projectId} task={task} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
