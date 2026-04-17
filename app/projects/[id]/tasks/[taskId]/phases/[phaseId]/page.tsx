import Link from "next/link";
import { redirect } from "next/navigation";
import { getPhasesForTask } from "@/app/actions/phases";

export default async function PhasePage({
  params,
}: {
  params: Promise<{ id: string; taskId: string; phaseId: string }>;
}) {
  const { id, taskId, phaseId } = await params;

  const result = await getPhasesForTask(taskId);
  if (result.error || !result.data) {
    redirect(`/projects/${id}/tasks/${taskId}`);
  }

  const phase = result.data.find((p) => p.id === phaseId);
  if (!phase) {
    redirect(`/projects/${id}/tasks/${taskId}`);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-zinc-800 px-6 py-4">
        <Link
          href={`/projects/${id}/tasks/${taskId}`}
          aria-label="Back to task"
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
        <h1 className="truncate text-base font-semibold tracking-tight text-zinc-100">
          {phase.title}
        </h1>
      </header>
      <section className="flex flex-1 flex-col px-6 py-6">
        <p className="text-sm text-zinc-500">Phase detail coming soon.</p>
      </section>
    </main>
  );
}
