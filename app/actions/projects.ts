"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { failure, success, type ActionResponse } from "@/lib/action-response";
import type { Project, ProjectTool } from "@/lib/types";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

export async function getProjects(): Promise<ActionResponse<Project[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return success(projects);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function getProject(
  projectId: string
): Promise<ActionResponse<Project & { tools: ProjectTool[] }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { tools: true },
    });
    if (!project) return failure("Project not found");
    return success(project);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function createProject(data: {
  name: string;
  spec: string;
}): Promise<ActionResponse<Project>> {
  try {
    const userId = await getAuthenticatedUserId();
    const name = data.name.trim();
    if (!name) return failure("Name is required");

    const project = await prisma.project.create({
      data: { userId, name, spec: data.spec },
    });
    return success(project);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function updateProject(
  projectId: string,
  data: { name?: string; spec?: string }
): Promise<ActionResponse<Project>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!existing) return failure("Project not found");

    const patch: { name?: string; spec?: string } = {};
    if (typeof data.name === "string") {
      const trimmed = data.name.trim();
      if (!trimmed) return failure("Name cannot be empty");
      patch.name = trimmed;
    }
    if (typeof data.spec === "string") patch.spec = data.spec;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: patch,
    });
    return success(project);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function deleteProject(
  projectId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!existing) return failure("Project not found");

    await prisma.project.delete({ where: { id: projectId } });
    return success({ id: projectId });
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function deleteProjects(
  projectIds: string[]
): Promise<ActionResponse<{ count: number }>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (projectIds.length === 0) return success({ count: 0 });

    const result = await prisma.project.deleteMany({
      where: { id: { in: projectIds }, userId },
    });
    return success({ count: result.count });
  } catch (err) {
    return failure(errorMessage(err));
  }
}
