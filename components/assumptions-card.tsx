"use client";

function parseAssumptions(assumptions: string): string[] {
  return assumptions
    .split("\n")
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

export function AssumptionsCard({ assumptions }: { assumptions: string }) {
  const items = parseAssumptions(assumptions);
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-400">
        Assumptions
      </h2>
      <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-4">
        <ul className="flex list-disc flex-col gap-1 whitespace-pre-wrap pl-5 text-sm text-amber-100/90">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
