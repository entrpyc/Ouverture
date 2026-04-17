import Link from "next/link";
import { redirect } from "next/navigation";
import { getTicketsForPhase } from "@/app/actions/tickets";

export default async function TicketPage({
  params,
}: {
  params: Promise<{
    id: string;
    taskId: string;
    phaseId: string;
    ticketId: string;
  }>;
}) {
  const { id, taskId, phaseId, ticketId } = await params;

  const ticketsResult = await getTicketsForPhase(phaseId);
  if (ticketsResult.error || !ticketsResult.data) {
    redirect(`/projects/${id}/tasks/${taskId}/phases/${phaseId}`);
  }

  const ticket = ticketsResult.data.find((t) => t.id === ticketId);
  if (!ticket) {
    redirect(`/projects/${id}/tasks/${taskId}/phases/${phaseId}`);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
        <Link
          href={`/projects/${id}/tasks/${taskId}/phases/${phaseId}`}
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
      </header>
    </main>
  );
}
