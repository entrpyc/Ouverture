import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import {
  getAdapterForUser,
  FINALIZE_INSTRUCTION,
  type AIMessage,
} from "@/lib/ai";

const MISSING_API_KEY_PREFIX = "MiniMax API key not configured";

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { messages?: AIMessage[]; projectId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, projectId } = body;
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  }
  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
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

  try {
    const result = await adapter.complete<{
      title: string;
      requirements: string;
      assumptions?: string;
    }>([...messages, FINALIZE_INSTRUCTION]);
    return NextResponse.json({
      title: result.title,
      requirements: result.requirements,
      assumptions: typeof result.assumptions === "string" ? result.assumptions : "",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Finalize request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
