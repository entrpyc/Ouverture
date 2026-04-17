"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { failure, success, type ActionResponse } from "@/lib/action-response";

export type BreadcrumbItem = { id: string; title: string };

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

export async function getAllProjects(): Promise<ActionResponse<BreadcrumbItem[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const rows = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    });
    return success(rows.map((r) => ({ id: r.id, title: r.name })));
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function getProjectTasks(
  projectId: string
): Promise<ActionResponse<BreadcrumbItem[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!project) return failure("Project not found");

    const rows = await prisma.task.findMany({
      where: { projectId, userId, status: "active" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    });
    return success(rows);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function getTaskPhases(
  taskId: string
): Promise<ActionResponse<BreadcrumbItem[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });
    if (!task) return failure("Task not found");

    const rows = await prisma.phase.findMany({
      where: { taskId, status: "active" },
      select: { id: true, title: true },
    });
    return success(rows);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function getPhaseTickets(
  phaseId: string
): Promise<ActionResponse<BreadcrumbItem[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const phase = await prisma.phase.findFirst({
      where: { id: phaseId, task: { userId } },
      select: { id: true },
    });
    if (!phase) return failure("Phase not found");

    const rows = await prisma.ticket.findMany({
      where: { phaseId, status: "active" },
      orderBy: { order: "asc" },
      select: { id: true, title: true },
    });
    return success(rows);
  } catch (err) {
    return failure(errorMessage(err));
  }
}
