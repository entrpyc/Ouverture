import { redirect } from "next/navigation";
import { getTask } from "@/app/actions/tasks";
import { getProject } from "@/app/actions/projects";
import { getTicketsForPhase } from "@/app/actions/tickets";
import {
  getAllProjects,
  getProjectTasks,
} from "@/app/actions/breadcrumbs";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import type { BreadcrumbSibling } from "@/components/breadcrumb";
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

  const [taskResult, projectResult, allProjectsResult, tasksResult] =
    await Promise.all([
      getTask(taskId),
      getProject(id),
      getAllProjects(),
      getProjectTasks(id),
    ]);
  if (taskResult.error || !taskResult.data) {
    redirect(`/projects/${id}/tasks/${taskId}/phases/${phaseId}`);
  }
  if (projectResult.error || !projectResult.data) {
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

  const projectSiblings: BreadcrumbSibling[] = (allProjectsResult.data ?? []).map(
    (p) => ({ id: p.id, title: p.title, href: `/projects/${p.id}` })
  );
  const taskSiblings: BreadcrumbSibling[] = (tasksResult.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    href: `/projects/${id}/tasks/${t.id}`,
  }));
  const phaseSiblings: BreadcrumbSibling[] = taskResult.data.phases
    .filter((p: Phase) => p.status === "active")
    .map((p: Phase) => ({
      id: p.id,
      title: p.title,
      href: `/projects/${id}/tasks/${taskId}/phases/${p.id}`,
    }));
  const ticketSiblings: BreadcrumbSibling[] = ticketsResult.data
    .filter((t: Ticket & { tooling: TicketTooling[] }) => t.status === "active")
    .map((t: Ticket & { tooling: TicketTooling[] }) => ({
      id: t.id,
      title: t.title,
      href: `/projects/${id}/tasks/${taskId}/phases/${phaseId}/tickets/${t.id}`,
    }));

  return (
    <main className="flex min-h-screen flex-col">
      <TicketDetail
        ticket={ticket}
        projectId={id}
        taskId={taskId}
        phaseId={phaseId}
        projectName={projectResult.data.name}
        taskTitle={taskResult.data.title}
        phaseTitle={phase.title}
        projectSiblings={projectSiblings}
        taskSiblings={taskSiblings}
        phaseSiblings={phaseSiblings}
        ticketSiblings={ticketSiblings}
      />
    </main>
  );
}
