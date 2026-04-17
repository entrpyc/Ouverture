"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicketsBulk } from "@/app/actions/tickets";
import type { ProposedTicket } from "@/components/phases/phase-detail";
import {
  ProposedTicketCard,
  type EditableTicket,
} from "./proposed-ticket-card";

type Props = {
  phaseId: string;
  proposedTickets: ProposedTicket[];
  onCancel: () => void;
};

function toEditable(tickets: ProposedTicket[]): EditableTicket[] {
  return tickets.map((t) => ({
    title: t.title,
    description: t.description,
    instructions: [...t.instructions],
    claudeCodePrompt: t.claudeCodePrompt,
    testPrompt: t.testPrompt,
    acceptanceCriteria: [...t.acceptanceCriteria],
    tooling: t.tooling.map((tool) => ({
      type: tool.type,
      name: tool.name,
      isNew: tool.isNew,
      rationale: tool.rationale,
      selected: true,
    })),
  }));
}

function blankTicket(): EditableTicket {
  return {
    title: "",
    description: "",
    instructions: [],
    claudeCodePrompt: "",
    testPrompt: "",
    acceptanceCriteria: [],
    tooling: [],
  };
}

export function ProposedTicketsReview({
  phaseId,
  proposedTickets,
  onCancel,
}: Props) {
  const router = useRouter();
  const [tickets, setTickets] = useState<EditableTicket[]>(() =>
    toEditable(proposedTickets)
  );
  const [invalidIndices, setInvalidIndices] = useState<Set<number>>(
    () => new Set()
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTicket(index: number, next: EditableTicket) {
    setTickets((prev) => prev.map((t, i) => (i === index ? next : t)));
    if (invalidIndices.has(index) && next.title.trim().length > 0) {
      setInvalidIndices((prev) => {
        const out = new Set(prev);
        out.delete(index);
        return out;
      });
    }
  }

  function removeTicket(index: number) {
    setTickets((prev) => prev.filter((_, i) => i !== index));
    setInvalidIndices(new Set());
  }

  function addTicket() {
    setTickets((prev) => [...prev, blankTicket()]);
  }

  async function handleConfirm() {
    if (isConfirming) return;

    const invalid = new Set<number>();
    tickets.forEach((t, i) => {
      if (t.title.trim().length === 0) invalid.add(i);
    });
    if (invalid.size > 0) {
      setInvalidIndices(invalid);
      setError("All tickets must have a title before confirming.");
      return;
    }

    setInvalidIndices(new Set());
    setError(null);
    setIsConfirming(true);

    const payload = tickets.map((t, i) => ({
      title: t.title,
      description: t.description,
      instructions: t.instructions,
      claudeCodePrompt: t.claudeCodePrompt,
      testPrompt: t.testPrompt,
      acceptanceCriteria: t.acceptanceCriteria,
      order: i,
      tooling: t.tooling
        .filter((tool) => tool.selected)
        .map((tool) => ({
          type: tool.type,
          name: tool.name,
          isNew: tool.isNew,
          rationale: tool.rationale ?? undefined,
        })),
    }));

    const result = await createTicketsBulk(phaseId, payload);
    if (result.error) {
      setError("No tickets were saved. Please try again.");
      setIsConfirming(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {tickets.length > 0 && (
        <ul className="flex flex-col gap-3">
          {tickets.map((ticket, i) => (
            <li key={i}>
              <ProposedTicketCard
                ticket={ticket}
                index={i}
                titleInvalid={invalidIndices.has(i)}
                onChange={(next) => updateTicket(i, next)}
                onRemove={() => removeTicket(i)}
              />
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addTicket}
        disabled={isConfirming}
        className="self-start rounded-md border border-dashed border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
      >
        Add ticket
      </button>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirming || tickets.length === 0}
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          {isConfirming ? "Saving tickets…" : "Confirm tickets"}
        </button>
      </div>
    </div>
  );
}
