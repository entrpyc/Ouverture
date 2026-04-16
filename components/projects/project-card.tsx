"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";

type Props = {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function ProjectCard({ project, onEdit, onDelete }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
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

  function navigate() {
    router.push(`/projects/${project.id}`);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate();
        }
      }}
      className="relative flex cursor-pointer flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-zinc-600"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-medium text-zinc-100">{project.name}</h3>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Project actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
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
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 z-10 w-32 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit(project);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(project);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-zinc-400">
        {project.spec ? truncate(project.spec, 120) : "No spec yet."}
      </p>
    </div>
  );
}
