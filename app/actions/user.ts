"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { failure, success, type ActionResponse } from "@/lib/action-response";
import { encrypt } from "@/lib/encryption";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

type UpdateProfileInput = {
  name: string | null;
  email: string;
  apiKey: string | null;
};

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResponse<{ success: true }>> {
  try {
    const userId = await getAuthenticatedUserId();

    const email = input.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return failure("Please enter a valid email address");
    }

    const name =
      typeof input.name === "string" ? input.name.trim() || null : null;

    const trimmedKey =
      typeof input.apiKey === "string" ? input.apiKey.trim() : "";

    const data: { name: string | null; email: string; minimaxApiKey?: string } =
      {
        name,
        email,
      };
    if (trimmedKey) {
      data.minimaxApiKey = encrypt(trimmedKey);
    }

    try {
      await prisma.user.update({ where: { id: userId }, data });
    } catch (err) {
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code?: string }).code === "P2002"
      ) {
        return failure("That email is already in use");
      }
      throw err;
    }

    return success({ success: true });
  } catch (err) {
    return failure(errorMessage(err));
  }
}
