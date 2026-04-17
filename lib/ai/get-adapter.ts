import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { decrypt } from "@/lib/encryption";
import { MiniMaxAdapter } from "./minimax-adapter";
import type { AIAdapter } from "./adapter";

export async function getAdapterForUser(): Promise<AIAdapter> {
  const userId = await getAuthenticatedUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { minimaxApiKey: true },
  });

  if (!user?.minimaxApiKey) {
    throw new Error(
      "MiniMax API key not configured. Please add your API key in settings."
    );
  }

  return new MiniMaxAdapter(decrypt(user.minimaxApiKey));
}
