"use client";

import type { ToolType } from "@/lib/types";

export type EditableTicketTooling = {
  type: ToolType;
  name: string;
  isNew: boolean;
  rationale: string | null;
  selected: boolean;
};

export type EditableTicket = {
  title: string;
  description: string;
  instructions: string[];
  claudeCodePrompt: string;
  testPrompt: string;
  acceptanceCriteria: string[];
  tooling: EditableTicketTooling[];
};

type Props = {
  ticket: EditableTicket;
  index: number;
  titleInvalid?: boolean;
  onChange: (next: EditableTicket) => void;
  onRemove: () => void;
};

const TEXT_INPUT_CLASS =
  "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none";
const TEXTAREA_CLASS = `${TEXT_INPUT_CLASS} resize-y`;
const LABEL_CLASS =
  "text-[10px] font-semibold uppercase tracking-wide text-zinc-500";

export function ProposedTicketCard({
  ticket,
  index,
  titleInvalid,
  onChange,
  onRemove,
}: Props) {
  function updateField<K extends keyof EditableTicket>(
    key: K,
    value: EditableTicket[K]
  ) {
    onChange({ ...ticket, [key]: value });
  }

  function updateListItem(
    key: "instructions" | "acceptanceCriteria",
    itemIndex: number,
    value: string
  ) {
    const next = [...ticket[key]];
    next[itemIndex] = value;
    updateField(key, next);
  }

  function addListItem(key: "instructions" | "acceptanceCriteria") {
    updateField(key, [...ticket[key], ""]);
  }

  function removeListItem(
    key: "instructions" | "acceptanceCriteria",
    itemIndex: number
  ) {
    const next = ticket[key].filter((_, i) => i !== itemIndex);
    updateField(key, next);
  }

  function toggleTool(toolIndex: number) {
    const next = ticket.tooling.map((tool, i) =>
      i === toolIndex ? { ...tool, selected: !tool.selected } : tool
    );
    updateField("tooling", next);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Ticket {index + 1}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Remove ticket
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS}>Title</label>
        <input
          type="text"
          value={ticket.title}
          onChange={(e) => updateField("title", e.target.value)}
          className={
            titleInvalid
              ? `${TEXT_INPUT_CLASS} border-red-700 focus:border-red-600`
              : TEXT_INPUT_CLASS
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS}>Description</label>
        <textarea
          value={ticket.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL_CLASS}>Instructions</label>
        {ticket.instructions.length > 0 && (
          <ul className="flex flex-col gap-2">
            {ticket.instructions.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="pt-2 text-xs text-zinc-500">{i + 1}.</span>
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
        <label className={LABEL_CLASS}>Claude Code prompt</label>
        <textarea
          value={ticket.claudeCodePrompt}
          onChange={(e) => updateField("claudeCodePrompt", e.target.value)}
          rows={4}
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS}>Test prompt</label>
        <textarea
          value={ticket.testPrompt}
          onChange={(e) => updateField("testPrompt", e.target.value)}
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL_CLASS}>Acceptance criteria</label>
        {ticket.acceptanceCriteria.length > 0 && (
          <ul className="flex flex-col gap-2">
            {ticket.acceptanceCriteria.map((criterion, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="pt-2 text-xs text-zinc-500">•</span>
                <input
                  type="text"
                  value={criterion}
                  onChange={(e) =>
                    updateListItem("acceptanceCriteria", i, e.target.value)
                  }
                  className={TEXT_INPUT_CLASS}
                />
                <button
                  type="button"
                  aria-label={`Remove acceptance criterion ${i + 1}`}
                  onClick={() => removeListItem("acceptanceCriteria", i)}
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
          onClick={() => addListItem("acceptanceCriteria")}
          className="self-start rounded-md border border-dashed border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Add criterion
        </button>
      </div>

      {ticket.tooling.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className={LABEL_CLASS}>Tooling</label>
          <ul className="flex flex-col gap-2">
            {ticket.tooling.map((tool, i) => (
              <li
                key={`${tool.type}::${tool.name}::${i}`}
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={tool.selected}
                    onChange={() => toggleTool(i)}
                    className="h-4 w-4 cursor-pointer accent-zinc-200"
                  />
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
                </label>
                {tool.isNew && tool.rationale && (
                  <p className="mt-1 pl-7 text-xs text-zinc-500">
                    {tool.rationale}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
