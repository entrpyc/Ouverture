import { prisma } from "@/lib/prisma";

type Ref =
  | { projectId: string }
  | { taskId: string }
  | { phaseId: string }
  | { ticketId: string };

async function resolveProjectId(ref: Ref): Promise<string | null> {
  if ("projectId" in ref) return ref.projectId;
  if ("taskId" in ref) {
    const task = await prisma.task.findUnique({
      where: { id: ref.taskId },
      select: { projectId: true },
    });
    return task?.projectId ?? null;
  }
  if ("phaseId" in ref) {
    const phase = await prisma.phase.findUnique({
      where: { id: ref.phaseId },
      select: { task: { select: { projectId: true } } },
    });
    return phase?.task.projectId ?? null;
  }
  const ticket = await prisma.ticket.findUnique({
    where: { id: ref.ticketId },
    select: { phase: { select: { task: { select: { projectId: true } } } } },
  });
  return ticket?.phase.task.projectId ?? null;
}

export async function touchProject(ref: Ref): Promise<void> {
  const projectId = await resolveProjectId(ref);
  if (!projectId) return;
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });
}
