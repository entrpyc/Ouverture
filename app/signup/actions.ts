"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type SignupState = {
  error?: string;
  values?: { email: string };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const values = { email };

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Please enter a valid email address.", values };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", values };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", values };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "That email is already in use.", values };
  }

  const passwordHash = await hash(password, 10);
  await prisma.user.create({ data: { email, passwordHash } });

  redirect("/login");
}
