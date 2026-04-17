"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProjects } from "@/app/actions/projects";

type Props = {
  open: boolean;
  count: number;
  projectIds: string[];
  onClose: () => void;
  onDeleted: () => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function BulkDeleteProjectsDialog({
  open,
  count,
  projectIds,
  onClose,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pending) return;
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
  }, [open, pending, onClose]);

  if (!open) return null;

  function handleDelete() {
    setError(null);
    const ids = [...projectIds];
    startTransition(async () => {
      const result = await deleteProjects(ids);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDeleted();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-projects-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={() => (pending ? undefined : onClose())}
        className="absolute inset-0 bg-black/60"
      />
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
      >
        <h2
          id="bulk-delete-projects-title"
          className="text-base font-semibold text-zinc-100"
        >
          Delete {count} {count === 1 ? "project" : "projects"}?
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          This will permanently delete the selected projects and all tasks and
          everything nested under them. This cannot be undone.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-md bg-red-900 px-3 py-1.5 text-sm font-medium text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
