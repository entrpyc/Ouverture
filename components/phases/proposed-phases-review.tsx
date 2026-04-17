"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPhase } from "@/app/actions/phases";
import type { ProposedPhase } from "@/components/tasks/task-detail";
import { ProposedPhaseCard, toolKey } from "./proposed-phase-card";

type Props = {
  taskId: string;
  proposedPhases: ProposedPhase[];
  onCancel: () => void;
};

function initialSelection(phases: ProposedPhase[]): Set<string>[] {
  return phases.map(
    (phase) => new Set(phase.tooling.map((t) => toolKey(t.type, t.name)))
  );
}

export function ProposedPhasesReview({
  taskId,
  proposedPhases,
  onCancel,
}: Props) {
  const router = useRouter();
  const [selections, setSelections] = useState<Set<string>[]>(() =>
    initialSelection(proposedPhases)
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleToggle(phaseIndex: number, key: string) {
    setSelections((prev) => {
      const next = prev.map((set) => new Set(set));
      const target = next[phaseIndex];
      if (target.has(key)) target.delete(key);
      else target.add(key);
      return next;
    });
  }

  async function handleConfirm() {
    if (isConfirming) return;
    setError(null);
    setIsConfirming(true);

    const results = await Promise.allSettled(
      proposedPhases.map((phase, i) => {
        const selectedKeys = selections[i];
        const tooling = phase.tooling
          .filter((t) => selectedKeys.has(toolKey(t.type, t.name)))
          .map((t) => ({
            type: t.type,
            name: t.name,
            isNew: t.isNew,
            rationale: t.rationale ?? undefined,
          }));
        return createPhase(taskId, {
          title: phase.title,
          description: phase.description,
          estimateHours: phase.estimateHours,
          priority: phase.priority,
          tooling,
        });
      })
    );

    const anyFailed = results.some(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error)
    );

    if (anyFailed) {
      setError(
        "Some phases could not be saved. Please delete any partially saved phases and try again."
      );
      setIsConfirming(false);
      return;
    }

    router.refresh();
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
          disabled={isConfirming}
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          {isConfirming ? "Saving phases…" : "Confirm phases"}
        </button>
      </div>
    </div>
  );
}
