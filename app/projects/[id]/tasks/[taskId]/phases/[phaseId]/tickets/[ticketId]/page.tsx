import { redirect } from "next/navigation";
import { getTask } from "@/app/actions/tasks";
import { getTicketsForPhase } from "@/app/actions/tickets";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import type { Phase, Ticket, TicketTooling } from "@/lib/types";

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

  const taskResult = await getTask(taskId);
  if (taskResult.error || !taskResult.data) {
    redirect(`/projects/${id}/tasks/${taskId}/phases/${phaseId}`);
  }

  const phase = taskResult.data.phases.find((p: Phase) => p.id === phaseId);
  if (!phase) {
    redirect(`/projects/${id}/tasks/${taskId}/phases/${phaseId}`);
  }

  const ticketsResult = await getTicketsForPhase(phaseId);
  if (ticketsResult.error || !ticketsResult.data) {
    redirect(`/projects/${id}/tasks/${taskId}/phases/${phaseId}`);
  }

  const ticket = ticketsResult.data.find(
    (t: Ticket & { tooling: TicketTooling[] }) => t.id === ticketId
  );
  if (!ticket) {
    redirect(`/projects/${id}/tasks/${taskId}/phases/${phaseId}`);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <TicketDetail
        ticket={ticket}
        projectId={id}
        taskId={taskId}
        phaseId={phaseId}
      />
    </main>
  );
}
