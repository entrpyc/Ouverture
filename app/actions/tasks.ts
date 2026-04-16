"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { failure, success, type ActionResponse } from "@/lib/action-response";
import type { Phase, Status, Task } from "@/lib/types";

const VALID_STATUSES: readonly Status[] = ["active", "done"] as const;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

export async function getTasksForProject(
  projectId: string
): Promise<ActionResponse<Task[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!project) return failure("Project not found");

    const tasks = await prisma.task.findMany({
      where: { projectId, userId },
      orderBy: { createdAt: "desc" },
    });
    return success(tasks);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function getTask(
  taskId: string
): Promise<ActionResponse<Task & { phases: Phase[] }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      include: { phases: true },
    });
    if (!task) return failure("Task not found");
    return success(task);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function createTask(
  projectId: string,
  data: { title: string }
): Promise<ActionResponse<Task>> {
  try {
    const userId = await getAuthenticatedUserId();
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!project) return failure("Project not found");

    const title = data.title.trim();
    if (!title) return failure("Title is required");

    const task = await prisma.task.create({
      data: {
        projectId,
        userId,
        title,
        requirements: "",
        conversationHistory: [],
        status: "active",
      },
    });
    return success(task);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function finalizeTask(
  taskId: string,
  data: { requirements: string; conversationHistory: object[] }
): Promise<ActionResponse<Task>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });
    if (!existing) return failure("Task not found");

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        requirements: data.requirements,
        conversationHistory: data.conversationHistory,
      },
    });
    return success(task);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function updateTask(
  taskId: string,
  data: { title?: string; requirements?: string }
): Promise<ActionResponse<Task>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });
    if (!existing) return failure("Task not found");

    const patch: { title?: string; requirements?: string } = {};
    if (typeof data.title === "string") {
      const trimmed = data.title.trim();
      if (!trimmed) return failure("Title cannot be empty");
      patch.title = trimmed;
    }
    if (typeof data.requirements === "string") patch.requirements = data.requirements;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: patch,
    });
    return success(task);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function deleteTask(
  taskId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });
    if (!existing) return failure("Task not found");

    await prisma.task.delete({ where: { id: taskId } });
    return success({ id: taskId });
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: Status
): Promise<ActionResponse<Task>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!isStatus(status)) return failure("Invalid status");

    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });
    if (!existing) return failure("Task not found");

    if (status === "done") {
      const [task] = await prisma.$transaction([
        prisma.task.update({ where: { id: taskId }, data: { status: "done" } }),
        prisma.phase.updateMany({ where: { taskId }, data: { status: "done" } }),
        prisma.ticket.updateMany({
          where: { phase: { taskId } },
          data: { status: "done" },
        }),
      ]);
      return success(task);
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: "active" },
    });
    return success(task);
  } catch (err) {
    return failure(errorMessage(err));
  }
}
