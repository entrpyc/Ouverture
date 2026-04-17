"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTicket } from "@/app/actions/tickets";
import type { Ticket } from "@/lib/types";

type Props = {
  open: boolean;
  ticket: Ticket;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const TEXT_INPUT_CLASS =
  "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none";
const TEXTAREA_CLASS = `${TEXT_INPUT_CLASS} resize-y`;
const LABEL_CLASS =
  "text-xs font-medium uppercase tracking-wide text-zinc-400";

export function EditTicketModal({ open, ticket, onClose }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [instructions, setInstructions] = useState<string[]>(ticket.instructions);
  const [claudeCodePrompt, setClaudeCodePrompt] = useState(ticket.claudeCodePrompt);
  const [testPrompt, setTestPrompt] = useState(ticket.testPrompt);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>(
    ticket.acceptanceCriteria
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(ticket.title);
    setDescription(ticket.description);
    setInstructions(ticket.instructions);
    setClaudeCodePrompt(ticket.claudeCodePrompt);
    setTestPrompt(ticket.testPrompt);
    setAcceptanceCriteria(ticket.acceptanceCriteria);
    setError(null);
  }, [open, ticket]);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
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

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const canSubmit =
    trimmedTitle.length > 0 && trimmedDescription.length > 0 && !pending;

  function updateListItem(
    key: "instructions" | "acceptance",
    i: number,
    value: string
  ) {
    if (key === "instructions") {
      setInstructions((prev) => prev.map((s, idx) => (idx === i ? value : s)));
    } else {
      setAcceptanceCriteria((prev) =>
        prev.map((s, idx) => (idx === i ? value : s))
      );
    }
  }

  function addListItem(key: "instructions" | "acceptance") {
    if (key === "instructions") setInstructions((prev) => [...prev, ""]);
    else setAcceptanceCriteria((prev) => [...prev, ""]);
  }

  function removeListItem(key: "instructions" | "acceptance", i: number) {
    if (key === "instructions")
      setInstructions((prev) => prev.filter((_, idx) => idx !== i));
    else setAcceptanceCriteria((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTicket(ticket.id, {
        title: trimmedTitle,
        description: trimmedDescription,
        instructions,
        claudeCodePrompt,
        testPrompt,
        acceptanceCriteria,
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
      aria-labelledby="edit-ticket-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={() => (pending ? undefined : onClose())}
        className="absolute inset-0 bg-black/60"
      />
      <div
        ref={containerRef}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl"
      >
        <h2
          id="edit-ticket-title"
          className="border-b border-zinc-800 px-6 py-4 text-base font-semibold text-zinc-100"
        >
          Edit ticket
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-ticket-title-input" className={LABEL_CLASS}>
                Title
              </label>
              <input
                id="edit-ticket-title-input"
                ref={firstFieldRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={TEXT_INPUT_CLASS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-ticket-description-input"
                className={LABEL_CLASS}
              >
                Description
              </label>
              <textarea
                id="edit-ticket-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className={TEXTAREA_CLASS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={LABEL_CLASS}>Instructions</label>
              {instructions.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {instructions.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="pt-2 text-xs text-zinc-500">
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) =>
                          updateListItem("instructions", i, e.target.value)
                        }
                        className={TEXT_INPUT_CLASS}
                      />
                      <button
                        type="button"
                        aria-label={`Remove instruction ${i + 1}`}
                        onClick={() => removeListItem("instructions", i)}
                        className="rounded-md px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => addListItem("instructions")}
                className="self-start rounded-md border border-dashed border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Add step
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-ticket-claude-input"
                className={LABEL_CLASS}
              >
                Claude Code prompt
              </label>
              <textarea
                id="edit-ticket-claude-input"
                value={claudeCodePrompt}
                onChange={(e) => setClaudeCodePrompt(e.target.value)}
                rows={8}
                className={`${TEXTAREA_CLASS} font-mono text-xs`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-ticket-test-input" className={LABEL_CLASS}>
                Test prompt
              </label>
              <textarea
                id="edit-ticket-test-input"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={8}
                className={`${TEXTAREA_CLASS} font-mono text-xs`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={LABEL_CLASS}>Acceptance criteria</label>
              {acceptanceCriteria.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {acceptanceCriteria.map((criterion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="pt-2 text-xs text-zinc-500">•</span>
                      <input
                        type="text"
                        value={criterion}
                        onChange={(e) =>
                          updateListItem("acceptance", i, e.target.value)
                        }
                        className={TEXT_INPUT_CLASS}
                      />
                      <button
                        type="button"
                        aria-label={`Remove acceptance criterion ${i + 1}`}
                        onClick={() => removeListItem("acceptance", i)}
                        className="rounded-md px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => addListItem("acceptance")}
                className="self-start rounded-md border border-dashed border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Add criterion
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
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
