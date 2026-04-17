"use client";

import { useState } from "react";
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
  const [tickets, setTickets] = useState<EditableTicket[]>(() =>
    toEditable(proposedTickets)
  );

  function updateTicket(index: number, next: EditableTicket) {
    setTickets((prev) => prev.map((t, i) => (i === index ? next : t)));
  }

  function removeTicket(index: number) {
    setTickets((prev) => prev.filter((_, i) => i !== index));
  }

  function addTicket() {
    setTickets((prev) => [...prev, blankTicket()]);
  }

  function handleConfirm() {
    // Wired up in Ticket 3
    void phaseId;
    void tickets;
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
        className="self-start rounded-md border border-dashed border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
      >
        Add ticket
      </button>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={tickets.length === 0}
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          Confirm tickets
        </button>
      </div>
    </div>
  );
}
