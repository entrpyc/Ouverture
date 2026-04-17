"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Ticket, TicketTooling } from "@/lib/types";
import { EditTicketModal } from "./edit-ticket-modal";
import { DeleteTicketDialog } from "./delete-ticket-dialog";
import { TicketToolingEditor } from "./ticket-tooling-editor";

type Props = {
  ticket: Ticket & { tooling: TicketTooling[] };
  projectId: string;
  taskId: string;
  phaseId: string;
};

function StatusBadge({ status }: { status: string }) {
  const isDone = status === "done";
  return (
    <span
      className={
        isDone
          ? "rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
          : "rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-200"
      }
    >
      {status}
    </span>
  );
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      // fall through to legacy path
    }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }
    if (!ok) return;
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="whitespace-pre-wrap pr-20 font-mono text-xs text-zinc-200">
        {text}
      </pre>
    </div>
  );
}

export function TicketDetail({ ticket, projectId, taskId, phaseId }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toolingEditOpen, setToolingEditOpen] = useState(false);
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

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
        <Link
          href={`/projects/${projectId}/tasks/${taskId}/phases/${phaseId}`}
          aria-label="Back to phase"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="flex-1 truncate text-base font-semibold tracking-tight text-zinc-100">
          {ticket.title}
        </h1>
        <StatusBadge status={ticket.status} />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Ticket actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="3" cy="8" r="1.25" fill="currentColor" />
              <circle cx="8" cy="8" r="1.25" fill="currentColor" />
              <circle cx="13" cy="8" r="1.25" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-9 z-10 w-32 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setEditOpen(true);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 py-6">
        {ticket.description && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Description
            </h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="whitespace-pre-wrap text-sm text-zinc-200">
                {ticket.description}
              </p>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Instructions
          </h2>
          {ticket.instructions.length === 0 ? (
            <p className="text-sm text-zinc-500">No instructions.</p>
          ) : (
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-zinc-200">
              {ticket.instructions.map((step: string, i: number) => (
                <li key={i} className="whitespace-pre-wrap">
                  {step}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Claude Code prompt
          </h2>
          <CopyBlock text={ticket.claudeCodePrompt} />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Test prompt
          </h2>
          <CopyBlock text={ticket.testPrompt} />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Acceptance criteria
          </h2>
          {ticket.acceptanceCriteria.length === 0 ? (
            <p className="text-sm text-zinc-500">No acceptance criteria.</p>
          ) : (
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-200">
              {ticket.acceptanceCriteria.map((criterion: string, i: number) => (
                <li key={i} className="whitespace-pre-wrap">
                  {criterion}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Tooling
            </h2>
            {!toolingEditOpen && (
              <button
                type="button"
                onClick={() => setToolingEditOpen(true)}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
              >
                Edit tooling
              </button>
            )}
          </div>
          {toolingEditOpen ? (
            <TicketToolingEditor
              ticketId={ticket.id}
              tooling={ticket.tooling}
              onCancel={() => setToolingEditOpen(false)}
              onSaved={() => setToolingEditOpen(false)}
            />
          ) : ticket.tooling.length === 0 ? (
            <p className="text-sm text-zinc-500">No tooling assigned.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ticket.tooling.map((tool: TicketTooling) => (
                <li
                  key={tool.id}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {tool.type}
                    </span>
                    <span className="flex-1 text-sm text-zinc-100">
                      {tool.name}
                    </span>
                    {tool.isNew && (
                      <span className="rounded-full border border-amber-800 bg-amber-950/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                        New
                      </span>
                    )}
                  </div>
                  {tool.isNew && tool.rationale && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {tool.rationale}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <EditTicketModal
        open={editOpen}
        ticket={ticket}
        onClose={() => setEditOpen(false)}
      />
      <DeleteTicketDialog
        open={deleteOpen}
        ticketId={ticket.id}
        ticketTitle={ticket.title}
        projectId={projectId}
        taskId={taskId}
        phaseId={phaseId}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
