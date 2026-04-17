"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { failure, success, type ActionResponse } from "@/lib/action-response";
import { touchProject } from "@/lib/touch-project";
import type { Status, Ticket, TicketTooling, ToolType } from "@/lib/types";

const VALID_STATUSES: readonly Status[] = ["active", "done"] as const;
const VALID_TOOL_TYPES: readonly ToolType[] = ["agent", "skill", "mcp"] as const;

type ToolingInput = {
  type: ToolType;
  name: string;
  isNew: boolean;
  rationale?: string;
};

type TicketInput = {
  title: string;
  description: string;
  instructions: string[];
  claudeCodePrompt: string;
  testPrompt: string;
  acceptanceCriteria: string[];
  order: number;
  tooling: ToolingInput[];
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
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

function validateStringArray(value: unknown, label: string): string | null {
  if (!Array.isArray(value)) return `${label} must be an array`;
  for (const item of value) {
    if (typeof item !== "string") return `${label} must be an array of strings`;
  }
  return null;
}

function validateTicketInput(data: TicketInput): string | null {
  if (typeof data.title !== "string" || !data.title.trim()) return "Title is required";
  if (typeof data.description !== "string" || !data.description.trim()) return "Description is required";
  if (typeof data.claudeCodePrompt !== "string") return "claudeCodePrompt must be a string";
  if (typeof data.testPrompt !== "string") return "testPrompt must be a string";
  if (!Number.isInteger(data.order)) return "Order must be an integer";
  const instructionsError = validateStringArray(data.instructions, "Instructions");
  if (instructionsError) return instructionsError;
  const acceptanceError = validateStringArray(data.acceptanceCriteria, "Acceptance criteria");
  if (acceptanceError) return acceptanceError;
  return validateToolingList(data.tooling);
}

export async function getTicketsForPhase(
  phaseId: string
): Promise<ActionResponse<(Ticket & { tooling: TicketTooling[] })[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const phase = await prisma.phase.findFirst({
      where: { id: phaseId, task: { userId } },
      select: { id: true },
    });
    if (!phase) return failure("Phase not found");

    const tickets = await prisma.ticket.findMany({
      where: { phaseId },
      include: { tooling: true },
      orderBy: { order: "asc" },
    });
    return success(tickets as (Ticket & { tooling: TicketTooling[] })[]);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function createTicket(
  phaseId: string,
  data: TicketInput
): Promise<ActionResponse<Ticket & { tooling: TicketTooling[] }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const phase = await prisma.phase.findFirst({
      where: { id: phaseId, task: { userId } },
      select: { id: true },
    });
    if (!phase) return failure("Phase not found");

    const validationError = validateTicketInput(data);
    if (validationError) return failure(validationError);

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          phaseId,
          title: data.title.trim(),
          description: data.description.trim(),
          instructions: data.instructions,
          claudeCodePrompt: data.claudeCodePrompt,
          testPrompt: data.testPrompt,
          acceptanceCriteria: data.acceptanceCriteria,
          order: data.order,
        },
      });
      if (data.tooling.length > 0) {
        await tx.ticketTooling.createMany({
          data: data.tooling.map((t) => ({
            ticketId: created.id,
            type: t.type,
            name: t.name.trim(),
            isNew: t.isNew,
            rationale: t.rationale,
          })),
        });
      }
      return tx.ticket.findUniqueOrThrow({
        where: { id: created.id },
        include: { tooling: true },
      });
    });

    await touchProject({ phaseId });
    return success(ticket as Ticket & { tooling: TicketTooling[] });
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function createTicketsBulk(
  phaseId: string,
  tickets: TicketInput[]
): Promise<ActionResponse<Ticket[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const phase = await prisma.phase.findFirst({
      where: { id: phaseId, task: { userId } },
      select: { id: true },
    });
    if (!phase) return failure("Phase not found");

    for (const ticket of tickets) {
      const validationError = validateTicketInput(ticket);
      if (validationError) return failure(validationError);
    }

    const created = await prisma.$transaction(async (tx) => {
      const results: Ticket[] = [];
      for (const input of tickets) {
        const raw = await tx.ticket.create({
          data: {
            phaseId,
            title: input.title.trim(),
            description: input.description.trim(),
            instructions: input.instructions,
            claudeCodePrompt: input.claudeCodePrompt,
            testPrompt: input.testPrompt,
            acceptanceCriteria: input.acceptanceCriteria,
            order: input.order,
          },
        });
        if (input.tooling.length > 0) {
          await tx.ticketTooling.createMany({
            data: input.tooling.map((t) => ({
              ticketId: raw.id,
              type: t.type,
              name: t.name.trim(),
              isNew: t.isNew,
              rationale: t.rationale,
            })),
          });
        }
        results.push(raw as Ticket);
      }
      return results;
    });

    await touchProject({ phaseId });
    return success(created);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function updateTicket(
  ticketId: string,
  data: Partial<{
    title: string;
    description: string;
    instructions: string[];
    claudeCodePrompt: string;
    testPrompt: string;
    acceptanceCriteria: string[];
    order: number;
  }>
): Promise<ActionResponse<Ticket>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, phase: { task: { userId } } },
      select: { id: true },
    });
    if (!existing) return failure("Ticket not found");

    const patch: {
      title?: string;
      description?: string;
      instructions?: string[];
      claudeCodePrompt?: string;
      testPrompt?: string;
      acceptanceCriteria?: string[];
      order?: number;
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
    if (data.instructions !== undefined) {
      const error = validateStringArray(data.instructions, "Instructions");
      if (error) return failure(error);
      patch.instructions = data.instructions;
    }
    if (typeof data.claudeCodePrompt === "string") {
      patch.claudeCodePrompt = data.claudeCodePrompt;
    }
    if (typeof data.testPrompt === "string") {
      patch.testPrompt = data.testPrompt;
    }
    if (data.acceptanceCriteria !== undefined) {
      const error = validateStringArray(data.acceptanceCriteria, "Acceptance criteria");
      if (error) return failure(error);
      patch.acceptanceCriteria = data.acceptanceCriteria;
    }
    if (data.order !== undefined) {
      if (!Number.isInteger(data.order)) return failure("Order must be an integer");
      patch.order = data.order;
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: patch,
    });
    await touchProject({ ticketId });
    return success(ticket as Ticket);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function replaceTicketTooling(
  ticketId: string,
  tooling: ToolingInput[]
): Promise<ActionResponse<TicketTooling[]>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, phase: { task: { userId } } },
      select: { id: true },
    });
    if (!existing) return failure("Ticket not found");

    const toolingError = validateToolingList(tooling);
    if (toolingError) return failure(toolingError);

    const result = await prisma.$transaction(async (tx) => {
      await tx.ticketTooling.deleteMany({ where: { ticketId } });
      if (tooling.length > 0) {
        await tx.ticketTooling.createMany({
          data: tooling.map((t) => ({
            ticketId,
            type: t.type,
            name: t.name.trim(),
            isNew: t.isNew,
            rationale: t.rationale,
          })),
        });
      }
      return tx.ticketTooling.findMany({ where: { ticketId } });
    });

    await touchProject({ ticketId });
    return success(result);
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function deleteTicket(
  ticketId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const userId = await getAuthenticatedUserId();
    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, phase: { task: { userId } } },
      select: {
        id: true,
        phase: { select: { task: { select: { projectId: true } } } },
      },
    });
    if (!existing) return failure("Ticket not found");

    await prisma.ticket.delete({ where: { id: ticketId } });
    await touchProject({ projectId: existing.phase.task.projectId });
    return success({ id: ticketId });
  } catch (err) {
    return failure(errorMessage(err));
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: Status
): Promise<ActionResponse<Ticket>> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!isStatus(status)) return failure("Invalid status");

    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, phase: { task: { userId } } },
      select: { id: true },
    });
    if (!existing) return failure("Ticket not found");

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
    });
    await touchProject({ ticketId });
    return success(ticket as Ticket);
  } catch (err) {
    return failure(errorMessage(err));
  }
}
