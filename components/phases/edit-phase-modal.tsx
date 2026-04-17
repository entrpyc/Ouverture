"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePhase } from "@/app/actions/phases";
import type { Phase, Priority } from "@/lib/types";

type Props = {
  open: boolean;
  phase: Phase;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const PRIORITIES: Priority[] = ["high", "medium", "low"];

function isPriority(value: string): value is Priority {
  return (PRIORITIES as string[]).includes(value);
}

export function EditPhaseModal({ open, phase, onClose }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(phase.title);
  const [description, setDescription] = useState(phase.description);
  const [estimateHours, setEstimateHours] = useState(phase.estimateHours);
  const [priority, setPriority] = useState<Priority>(phase.priority as Priority);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(phase.title);
    setDescription(phase.description);
    setEstimateHours(phase.estimateHours);
    setPriority(phase.priority as Priority);
    setError(null);
  }, [open, phase]);

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

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const trimmedEstimate = estimateHours.trim();
  const canSubmit =
    trimmedTitle.length > 0 &&
    trimmedDescription.length > 0 &&
    trimmedEstimate.length > 0 &&
    !pending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await updatePhase(phase.id, {
        title: trimmedTitle,
        description: trimmedDescription,
        estimateHours: trimmedEstimate,
        priority,
      });
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
      aria-labelledby="edit-phase-title"
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
        <h2 id="edit-phase-title" className="text-base font-semibold text-zinc-100">
          Edit phase
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-phase-title-input"
              className="text-xs font-medium uppercase tracking-wide text-zinc-400"
            >
              Title
            </label>
            <input
              id="edit-phase-title-input"
              ref={firstFieldRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-phase-description-input"
              className="text-xs font-medium uppercase tracking-wide text-zinc-400"
            >
              Description
            </label>
            <textarea
              id="edit-phase-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label
                htmlFor="edit-phase-estimate-input"
                className="text-xs font-medium uppercase tracking-wide text-zinc-400"
              >
                Estimate
              </label>
              <input
                id="edit-phase-estimate-input"
                type="text"
                value={estimateHours}
                onChange={(e) => setEstimateHours(e.target.value)}
                required
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                placeholder="e.g. 1-2h"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label
                htmlFor="edit-phase-priority-input"
                className="text-xs font-medium uppercase tracking-wide text-zinc-400"
              >
                Priority
              </label>
              <select
                id="edit-phase-priority-input"
                value={priority}
                onChange={(e) => {
                  if (isPriority(e.target.value)) setPriority(e.target.value);
                }}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
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
