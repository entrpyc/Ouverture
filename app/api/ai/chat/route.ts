import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import {
  getAdapterForUser,
  REQUIREMENTS_ANALYST,
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
    include: { tools: true },
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

  const projectTools = project.tools.map((t) => ({ type: t.type, name: t.name }));
  const systemMessage: AIMessage = {
    role: "system",
    content:
      REQUIREMENTS_ANALYST.content +
      "\n\nProject tooling available: " +
      JSON.stringify(projectTools),
  };

  try {
    const stream = await adapter.chat([systemMessage, ...messages]);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
