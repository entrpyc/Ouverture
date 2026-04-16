"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { failure, success, type ActionResponse } from "@/lib/action-response";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

export async function updateApiKey(
  apiKey: string
): Promise<ActionResponse<{ success: true }>> {
  try {
    const userId = await getAuthenticatedUserId();

    if (typeof apiKey !== "string") return failure("API key must be a string");
    const trimmed = apiKey.trim();
    if (!trimmed) return failure("API key is required");

    await prisma.user.update({
      where: { id: userId },
      data: { minimaxApiKey: trimmed },
    });

    return success({ success: true });
  } catch (err) {
    return failure(errorMessage(err));
  }
}
