"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = {
  error?: string;
  values?: { email: string };
};

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password.", values: { email } };
    }
    throw error;
  }
}
