"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectCard } from "./project-card";
import { NewProjectButton } from "./new-project-button";
import { ProjectModal } from "./project-modal";
import { DeleteProjectDialog } from "./delete-project-dialog";

type Props = {
  projects: Project[];
};

export function ProjectsList({ projects }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          Projects
        </h1>
        <NewProjectButton onClick={() => setCreateOpen(true)} />
      </div>

      {projects.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-zinc-400">No projects yet</p>
          <NewProjectButton onClick={() => setCreateOpen(true)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <ProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <ProjectModal
        open={editing !== null}
        project={editing}
        onClose={() => setEditing(null)}
      />
      <DeleteProjectDialog
        project={deleting}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
