import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import {
  getAdapterForUser,
  TICKET_ENGINEER,
  type AIMessage,
} from "@/lib/ai";
import type { ToolType } from "@/lib/types";

const MISSING_API_KEY_PREFIX = "MiniMax API key not configured";

type TicketResult = {
  title: string;
  description: string;
  instructions: string[];
  claudeCodePrompt: string;
  testPrompt: string;
  acceptanceCriteria: string[];
  tooling: {
    type: ToolType;
    name: string;
    isNew: boolean;
    rationale: string | null;
  }[];
};

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { phaseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { phaseId } = body;
  if (typeof phaseId !== "string" || !phaseId) {
    return NextResponse.json({ error: "phaseId is required" }, { status: 400 });
  }

  const phase = await prisma.phase.findFirst({
    where: { id: phaseId, task: { userId } },
    include: {
      tooling: true,
      task: {
        select: {
          requirements: true,
          project: { select: { name: true, spec: true } },
        },
      },
    },
  });
  if (!phase) {
    return NextResponse.json({ error: "Phase not found" }, { status: 404 });
  }

  let adapter;
  try {
    adapter = await getAdapterForUser();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load adapter";
    if (message.startsWith(MISSING_API_KEY_PREFIX)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const userMessage: AIMessage = {
    role: "user",
    content: JSON.stringify({
      projectName: phase.task.project.name,
      projectSpec: phase.task.project.spec ?? "",
      phaseDetails: {
        title: phase.title,
        description: phase.description,
        estimateHours: phase.estimateHours,
        priority: phase.priority,
        tooling: phase.tooling.map((t) => ({
          type: t.type,
          name: t.name,
          isNew: t.isNew,
          rationale: t.rationale,
        })),
      },
      taskRequirements: phase.task.requirements,
    }),
  };

  try {
    const tickets = await adapter.complete<TicketResult[]>([
      TICKET_ENGINEER,
      userMessage,
    ]);
    return NextResponse.json(tickets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ticket generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
