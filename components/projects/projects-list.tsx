"use client";

import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectCard } from "./project-card";
import { NewProjectButton } from "./new-project-button";
import { ProjectModal } from "./project-modal";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { BulkDeleteProjectsDialog } from "./bulk-delete-projects-dialog";

type Props = {
  projects: Project[];
};

export function ProjectsList({ projects }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [modHeld, setModHeld] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Control" || e.key === "Meta") {
        setModHeld(e.type === "keydown");
      }
    }
    function onBlur() {
      setModHeld(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const visibleIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const selectedCount = selectedIds.size;
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelect(project: Project) {
    if (!selectMode) setSelectMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(project.id)) {
        next.delete(project.id);
      } else {
        next.add(project.id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIds));
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          Projects
        </h1>
        <div className="flex items-center gap-2">
          {projects.length > 0 &&
            (selectMode ? (
              <button
                type="button"
                onClick={exitSelectMode}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
              >
                Select
              </button>
            ))}
          {!selectMode && <NewProjectButton onClick={() => setCreateOpen(true)} />}
        </div>
      </div>

      {selectMode && (
        <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-md px-2 py-1 text-sm text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
            <span className="text-sm text-zinc-400">
              {selectedCount} selected
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBulkDeleteOpen(true)}
            disabled={selectedCount === 0}
            className="rounded-md bg-red-900 px-3 py-1.5 text-sm font-medium text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            Delete selected
          </button>
        </div>
      )}

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
              selectable={selectMode}
              selected={selectedIds.has(project.id)}
              onToggleSelect={toggleSelect}
              modHeld={modHeld}
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
      <BulkDeleteProjectsDialog
        open={bulkDeleteOpen}
        count={selectedCount}
        projectIds={Array.from(selectedIds)}
        onClose={() => setBulkDeleteOpen(false)}
        onDeleted={() => {
          setBulkDeleteOpen(false);
          exitSelectMode();
        }}
      />
    </div>
  );
}
