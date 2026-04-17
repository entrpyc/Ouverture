"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { failure, success, type ActionResponse } from "@/lib/action-response";
import { touchProject } from "@/lib/touch-project";
import type { ProjectTool, ToolType } from "@/lib/types";

const VALID_TOOL_TYPES: readonly ToolType[] = ["agent", "skill", "mcp"] as const;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

function isToolType(value: unknown): value is ToolType {
  return typeof value === "string" && (VALID_TOOL_TYPES as readonly string[]).includes(value);
}

export async function addProjectTool(
  projectId: string,
  data: { type: ToolType; name: string }
): Promise<ActionResponse<ProjectTool>> {
  try {
    const userId = await getAuthenticatedUserId();
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!project) return failure("Project not found");

    if (!isToolType(data.type)) return failure("Invalid tool type");
    const name = data.name.trim();
    if (!name) return failure("Name is required");

    const tool = await prisma.projectTool.create({
      data: { projectId, type: data.type, name },
    });
    await touchProject({ projectId });
    return success(tool);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function updateProjectTool(
  toolId: string,
  data: { type?: ToolType; name?: string }
): Promise<ActionResponse<ProjectTool>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.projectTool.findFirst({
      where: { id: toolId, project: { userId } },
      select: { id: true, projectId: true },
    });
    if (!existing) return failure("Tool not found");

    const patch: { type?: ToolType; name?: string } = {};
    if (data.type !== undefined) {
      if (!isToolType(data.type)) return failure("Invalid tool type");
      patch.type = data.type;
    }
    if (typeof data.name === "string") {
      const trimmed = data.name.trim();
      if (!trimmed) return failure("Name cannot be empty");
      patch.name = trimmed;
    }

    const tool = await prisma.projectTool.update({
      where: { id: toolId },
      data: patch,
    });
    await touchProject({ projectId: existing.projectId });
    return success(tool);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function deleteProjectTool(
  toolId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.projectTool.findFirst({
      where: { id: toolId, project: { userId } },
      select: { id: true, projectId: true },
    });
    if (!existing) return failure("Tool not found");

    await prisma.projectTool.delete({ where: { id: toolId } });
    await touchProject({ projectId: existing.projectId });
    return success({ id: toolId });
  } catch (err) {
    return failure(errorMessage(err));
  }
}
