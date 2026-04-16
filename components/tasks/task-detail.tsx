"use client";

import type { Phase, Task } from "@/lib/types";

type Props = {
  task: Task & { phases: Phase[] };
  projectId: string;
};

export function TaskDetail({ task, projectId }: Props) {
  void projectId;

  return (
    <div className="flex flex-col gap-3">
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Requirements
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
          {task.requirements}
        </p>
      </section>
    </div>
  );
}
