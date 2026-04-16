"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { failure, success, type ActionResponse } from "@/lib/action-response";
import type { Phase, PhaseTooling, Priority, Status, ToolType } from "@/lib/types";

const VALID_STATUSES: readonly Status[] = ["active", "done"] as const;
const VALID_PRIORITIES: readonly Priority[] = ["high", "medium", "low"] as const;
const VALID_TOOL_TYPES: readonly ToolType[] = ["agent", "skill", "mcp"] as const;

type ToolingInput = {
  type: ToolType;
  name: string;
  isNew: boolean;
  rationale?: string;
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (VALID_PRIORITIES as readonly string[]).includes(value);
}

function isToolType(value: unknown): value is ToolType {
  return typeof value === "string" && (VALID_TOOL_TYPES as readonly string[]).includes(value);
}

function validateToolingList(tooling: ToolingInput[]): string | null {
  for (const item of tooling) {
    if (!isToolType(item.type)) return "Invalid tool type";
    if (typeof item.name !== "string" || !item.name.trim()) return "Tool name is required";
    if (typeof item.isNew !== "boolean") return "Tool isNew must be a boolean";
  }
  return null;
}

export async function getPhasesForTask(
  taskId: string
): Promise<ActionResponse<(Phase & { tooling: PhaseTooling[] })[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });
    if (!task) return failure("Task not found");

    const phases = await prisma.phase.findMany({
      where: { taskId },
      include: { tooling: true },
    });
    return success(phases);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function createPhase(
  taskId: string,
  data: {
    title: string;
    description: string;
    estimateHours: string;
    priority: Priority;
    tooling: ToolingInput[];
  }
): Promise<ActionResponse<Phase & { tooling: PhaseTooling[] }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true },
    });
    if (!task) return failure("Task not found");

    const title = data.title.trim();
    if (!title) return failure("Title is required");
    const description = data.description.trim();
    if (!description) return failure("Description is required");
    const estimateHours = data.estimateHours.trim();
    if (!estimateHours) return failure("Estimate hours is required");
    if (!isPriority(data.priority)) return failure("Invalid priority");
    const toolingError = validateToolingList(data.tooling);
    if (toolingError) return failure(toolingError);

    const phase = await prisma.$transaction(async (tx) => {
      const created = await tx.phase.create({
        data: {
          taskId,
          title,
          description,
          estimateHours,
          priority: data.priority,
        },
      });
      if (data.tooling.length > 0) {
        await tx.phaseTooling.createMany({
          data: data.tooling.map((t) => ({
            phaseId: created.id,
            type: t.type,
            name: t.name.trim(),
            isNew: t.isNew,
            rationale: t.rationale,
          })),
        });
      }
      return tx.phase.findUniqueOrThrow({
        where: { id: created.id },
        include: { tooling: true },
      });
    });

    return success(phase);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function updatePhase(
  phaseId: string,
  data: {
    title?: string;
    description?: string;
    estimateHours?: string;
    priority?: Priority;
  }
): Promise<ActionResponse<Phase>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.phase.findFirst({
      where: { id: phaseId, task: { userId } },
      select: { id: true },
    });
    if (!existing) return failure("Phase not found");

    const patch: {
      title?: string;
      description?: string;
      estimateHours?: string;
      priority?: Priority;
    } = {};
    if (typeof data.title === "string") {
      const trimmed = data.title.trim();
      if (!trimmed) return failure("Title cannot be empty");
      patch.title = trimmed;
    }
    if (typeof data.description === "string") {
      const trimmed = data.description.trim();
      if (!trimmed) return failure("Description cannot be empty");
      patch.description = trimmed;
    }
    if (typeof data.estimateHours === "string") {
      const trimmed = data.estimateHours.trim();
      if (!trimmed) return failure("Estimate hours cannot be empty");
      patch.estimateHours = trimmed;
    }
    if (data.priority !== undefined) {
      if (!isPriority(data.priority)) return failure("Invalid priority");
      patch.priority = data.priority;
    }

    const phase = await prisma.phase.update({
      where: { id: phaseId },
      data: patch,
    });
    return success(phase);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function replacePhaseTooling(
  phaseId: string,
  tooling: ToolingInput[]
): Promise<ActionResponse<PhaseTooling[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.phase.findFirst({
      where: { id: phaseId, task: { userId } },
      select: { id: true },
    });
    if (!existing) return failure("Phase not found");

    const toolingError = validateToolingList(tooling);
    if (toolingError) return failure(toolingError);

    const result = await prisma.$transaction(async (tx) => {
      await tx.phaseTooling.deleteMany({ where: { phaseId } });
      if (tooling.length > 0) {
        await tx.phaseTooling.createMany({
          data: tooling.map((t) => ({
            phaseId,
            type: t.type,
            name: t.name.trim(),
            isNew: t.isNew,
            rationale: t.rationale,
          })),
        });
      }
      return tx.phaseTooling.findMany({ where: { phaseId } });
    });

    return success(result);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function deletePhase(
  phaseId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.phase.findFirst({
      where: { id: phaseId, task: { userId } },
      select: { id: true },
    });
    if (!existing) return failure("Phase not found");

    await prisma.phase.delete({ where: { id: phaseId } });
    return success({ id: phaseId });
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function updatePhaseStatus(
  phaseId: string,
  status: Status
): Promise<ActionResponse<Phase>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!isStatus(status)) return failure("Invalid status");

    const existing = await prisma.phase.findFirst({
      where: { id: phaseId, task: { userId } },
      select: { id: true },
    });
    if (!existing) return failure("Phase not found");

    if (status === "done") {
      const [phase] = await prisma.$transaction([
        prisma.phase.update({ where: { id: phaseId }, data: { status: "done" } }),
        prisma.ticket.updateMany({ where: { phaseId }, data: { status: "done" } }),
      ]);
      return success(phase);
    }

    const phase = await prisma.phase.update({
      where: { id: phaseId },
      data: { status: "active" },
    });
    return success(phase);
  } catch (err) {
    return failure(errorMessage(err));
  }
}
