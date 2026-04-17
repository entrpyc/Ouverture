import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import {
  getAdapterForUser,
  IMPLEMENTATION_ARCHITECT,
  type AIMessage,
} from "@/lib/ai";
import type { Priority, ToolType } from "@/lib/types";

const MISSING_API_KEY_PREFIX = "MiniMax API key not configured";

type PhaseResult = {
  title: string;
  description: string;
  estimateHours: string;
  priority: Priority;
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

  let body: { taskId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { taskId } = body;
  if (typeof taskId !== "string" || !taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: { project: { include: { tools: true } } },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
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

  const projectTooling = task.project.tools.map((t) => ({
    type: t.type,
    name: t.name,
  }));
  const userMessage: AIMessage = {
    role: "user",
    content: JSON.stringify({
      projectName: task.project.name,
      projectSpec: task.project.spec ?? "",
      taskRequirements: task.requirements,
      projectTooling,
    }),
  };

  try {
    const phases = await adapter.complete<PhaseResult[]>([
      IMPLEMENTATION_ARCHITECT,
      userMessage,
    ]);
    return NextResponse.json(phases);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Phase generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
