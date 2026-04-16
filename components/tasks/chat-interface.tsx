"use client";

import type { Phase, ProjectTool, Task } from "@/lib/types";

type Props = {
  task: Task & { phases: Phase[] };
  projectId: string;
  projectTools: ProjectTool[];
};

export function ChatInterface({ task, projectId, projectTools }: Props) {
  void projectId;
  void projectTools;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-400">
        Chat for “{task.title}” — interface lands in the next ticket.
      </p>
    </div>
  );
}
