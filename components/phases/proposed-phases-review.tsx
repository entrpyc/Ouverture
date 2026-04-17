"use client";

import { useState } from "react";
import type { ProposedPhase } from "@/components/tasks/task-detail";
import { ProposedPhaseCard, toolKey } from "./proposed-phase-card";

type Props = {
  proposedPhases: ProposedPhase[];
  onCancel: () => void;
};

function initialSelection(phases: ProposedPhase[]): Set<string>[] {
  return phases.map(
    (phase) => new Set(phase.tooling.map((t) => toolKey(t.type, t.name)))
  );
}

export function ProposedPhasesReview({ proposedPhases, onCancel }: Props) {
  const [selections, setSelections] = useState<Set<string>[]>(() =>
    initialSelection(proposedPhases)
  );

  function handleToggle(phaseIndex: number, key: string) {
    setSelections((prev) => {
      const next = prev.map((set) => new Set(set));
      const target = next[phaseIndex];
      if (target.has(key)) target.delete(key);
      else target.add(key);
      return next;
    });
  }

  function handleConfirm() {
    console.log(
      "Confirm phases clicked — wiring in next ticket",
      proposedPhases.map((phase, i) => ({
        ...phase,
        tooling: phase.tooling.filter((t) =>
          selections[i].has(toolKey(t.type, t.name))
        ),
      }))
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {proposedPhases.map((phase, i) => (
          <li key={i}>
            <ProposedPhaseCard
              phase={phase}
              selectedToolKeys={selections[i]}
              onToggleTool={(key) => handleToggle(i, key)}
            />
          </li>
        ))}
      </ul>
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
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          Confirm phases
        </button>
      </div>
    </div>
  );
}
