import { redirect } from "next/navigation";
import { getTask } from "@/app/actions/tasks";
import { getProject } from "@/app/actions/projects";
import { getPhasesForTask } from "@/app/actions/phases";
import { getTicketsForPhase } from "@/app/actions/tickets";
import {
  getAllProjects,
  getProjectTasks,
} from "@/app/actions/breadcrumbs";
import { PhaseDetail } from "@/components/phases/phase-detail";
import type { BreadcrumbSibling } from "@/components/breadcrumb";

export default async function PhasePage({
  params,
}: {
  params: Promise<{ id: string; taskId: string; phaseId: string }>;
}) {
  const { id, taskId, phaseId } = await params;

  const [
    taskResult,
    projectResult,
    phasesResult,
    allProjectsResult,
    tasksResult,
  ] = await Promise.all([
    getTask(taskId),
    getProject(id),
    getPhasesForTask(taskId),
    getAllProjects(),
    getProjectTasks(id),
  ]);
  if (taskResult.error || !taskResult.data) {
    redirect(`/projects/${id}/tasks/${taskId}`);
  }
  if (projectResult.error || !projectResult.data) {
    redirect(`/projects/${id}/tasks/${taskId}`);
  }

  if (phasesResult.error || !phasesResult.data) {
    redirect(`/projects/${id}/tasks/${taskId}`);
  }

  const phase = phasesResult.data.find((p) => p.id === phaseId);
  if (!phase) {
    redirect(`/projects/${id}/tasks/${taskId}`);
  }

  const ticketsResult = await getTicketsForPhase(phaseId);
  const tickets = ticketsResult.data ?? [];

  const projectSiblings: BreadcrumbSibling[] = (allProjectsResult.data ?? []).map(
    (p) => ({ id: p.id, title: p.title, href: `/projects/${p.id}` })
  );
  const taskSiblings: BreadcrumbSibling[] = (tasksResult.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    href: `/projects/${id}/tasks/${t.id}`,
  }));
  const phaseSiblings: BreadcrumbSibling[] = phasesResult.data
    .filter((p) => p.status === "active")
    .map((p) => ({
      id: p.id,
      title: p.title,
      href: `/projects/${id}/tasks/${taskId}/phases/${p.id}`,
    }));

  return (
    <main className="flex min-h-screen flex-col">
      <PhaseDetail
        phase={phase}
        tickets={tickets}
        projectId={id}
        taskId={taskId}
        projectName={projectResult.data.name}
        taskTitle={taskResult.data.title}
        projectSiblings={projectSiblings}
        taskSiblings={taskSiblings}
        phaseSiblings={phaseSiblings}
      />
    </main>
  );
}
