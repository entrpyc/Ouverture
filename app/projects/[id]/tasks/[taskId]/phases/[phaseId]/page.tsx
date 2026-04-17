import { redirect } from "next/navigation";
import { getTask } from "@/app/actions/tasks";
import { getPhasesForTask } from "@/app/actions/phases";
import { getTicketsForPhase } from "@/app/actions/tickets";
import { PhaseDetail } from "@/components/phases/phase-detail";

export default async function PhasePage({
  params,
}: {
  params: Promise<{ id: string; taskId: string; phaseId: string }>;
}) {
  const { id, taskId, phaseId } = await params;

  const taskResult = await getTask(taskId);
  if (taskResult.error || !taskResult.data) {
    redirect(`/projects/${id}/tasks/${taskId}`);
  }

  const phasesResult = await getPhasesForTask(taskId);
  if (phasesResult.error || !phasesResult.data) {
    redirect(`/projects/${id}/tasks/${taskId}`);
  }

  const phase = phasesResult.data.find((p) => p.id === phaseId);
  if (!phase) {
    redirect(`/projects/${id}/tasks/${taskId}`);
  }

  const ticketsResult = await getTicketsForPhase(phaseId);
  const tickets = ticketsResult.data ?? [];

  return (
    <main className="flex min-h-screen flex-col">
      <PhaseDetail
        phase={phase}
        tickets={tickets}
        projectId={id}
        taskId={taskId}
      />
    </main>
  );
}
