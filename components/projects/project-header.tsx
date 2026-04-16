"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectModal } from "./project-modal";

type Props = {
  project: Project;
};

export function ProjectHeader({ project }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex flex-1 items-center justify-between gap-4">
      <h1 className="truncate text-base font-semibold tracking-tight text-zinc-100">
        {project.name}
      </h1>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
      >
        Edit
      </button>
      <ProjectModal
        open={editOpen}
        project={project}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
