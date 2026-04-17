"use client";

import type { ProposedPhase } from "@/components/tasks/task-detail";

type Props = {
  phase: ProposedPhase;
  selectedToolKeys: Set<string>;
  onToggleTool: (toolKey: string) => void;
};

function PriorityBadge({ priority }: { priority: string }) {
  const styles =
    priority === "high"
      ? "border-red-800 bg-red-950/60 text-red-300"
      : priority === "medium"
        ? "border-amber-800 bg-amber-950/60 text-amber-300"
        : "border-emerald-800 bg-emerald-950/60 text-emerald-300";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles}`}
    >
      {priority}
    </span>
  );
}

export function toolKey(type: string, name: string): string {
  return `${type}::${name}`;
}

export function ProposedPhaseCard({
  phase,
  selectedToolKeys,
  onToggleTool,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start gap-3">
        <h3 className="flex-1 text-sm font-semibold text-zinc-100">
          {phase.title}
        </h3>
        <PriorityBadge priority={phase.priority} />
        <span className="text-xs text-zinc-400">{phase.estimateHours}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-zinc-300">
        {phase.description}
      </p>
      {phase.tooling.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Tooling
          </p>
          <ul className="flex flex-col gap-2">
            {phase.tooling.map((tool) => {
              const key = toolKey(tool.type, tool.name);
              const checked = selectedToolKeys.has(key);
              return (
                <li
                  key={key}
                  className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleTool(key)}
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
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
