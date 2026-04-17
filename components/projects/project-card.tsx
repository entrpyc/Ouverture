"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";

type Props = {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (project: Project) => void;
  modHeld?: boolean;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  selectable = false,
  selected = false,
  onToggleSelect,
  modHeld = false,
}: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const showAsSelectable = selectable || modHeld;

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

  function activate(modKey: boolean) {
    if (selectable || modKey) {
      onToggleSelect?.(project);
      return;
    }
    router.push(`/projects/${project.id}`);
  }

  const ariaLabel = showAsSelectable
    ? `${selected ? "Deselect" : "Select"} ${project.name}`
    : undefined;

  return (
    <div
      role={showAsSelectable ? "checkbox" : "button"}
      aria-checked={showAsSelectable ? selected : undefined}
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={(e) => activate(e.ctrlKey || e.metaKey)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(e.ctrlKey || e.metaKey);
        }
      }}
      className={`relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-zinc-900 p-4 transition focus:outline-none focus:ring-2 focus:ring-zinc-600 ${
        selected
          ? "border-zinc-500 bg-zinc-800/60"
          : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {showAsSelectable && (
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                selected
                  ? "border-zinc-300 bg-zinc-100 text-zinc-900"
                  : "border-zinc-600 bg-zinc-900"
              }`}
            >
              {selected && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 5.5L4 7.5L8 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          )}
          <h3 className="text-base font-medium text-zinc-100">{project.name}</h3>
        </div>
        {!showAsSelectable && (
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
        )}
      </div>
      <p className="text-sm text-zinc-400">
        {project.spec ? truncate(project.spec, 120) : "No spec yet."}
      </p>
    </div>
  );
}
