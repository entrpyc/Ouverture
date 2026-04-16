"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/app/actions/projects";
import type { Project } from "@/lib/types";

type Props = {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ProjectModal({ open, project, onClose }: Props) {
  const router = useRouter();
  const isEdit = Boolean(project);

  const [name, setName] = useState(project?.name ?? "");
  const [spec, setSpec] = useState(project?.spec ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? "");
    setSpec(project?.spec ?? "");
    setError(null);
  }, [open, project]);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const trimmedName = name.trim();
  const trimmedSpec = spec.trim();
  const canSubmit = trimmedName.length > 0 && trimmedSpec.length > 0 && !pending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = isEdit && project
        ? await updateProject(project.id, { name: trimmedName, spec: trimmedSpec })
        : await createProject({ name: trimmedName, spec: trimmedSpec });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
      >
        <h2
          id="project-modal-title"
          className="text-base font-semibold text-zinc-100"
        >
          {isEdit ? "Edit project" : "New project"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="project-modal-name"
              className="text-xs font-medium uppercase tracking-wide text-zinc-400"
            >
              Name
            </label>
            <input
              id="project-modal-name"
              ref={firstFieldRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
              placeholder="My project"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="project-modal-spec"
              className="text-xs font-medium uppercase tracking-wide text-zinc-400"
            >
              Spec
            </label>
            <textarea
              id="project-modal-spec"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              required
              rows={6}
              className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
              placeholder="High-level description of what this project is about."
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
