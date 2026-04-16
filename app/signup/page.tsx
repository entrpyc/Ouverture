"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-semibold tracking-tight">
          Create your account
        </h1>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-zinc-400">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={state.values?.email ?? ""}
              className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-600"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-zinc-400">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-600"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-zinc-400">Confirm password</span>
            <input
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-600"
            />
          </label>

          {state.error && (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-zinc-100 underline underline-offset-4 hover:text-white">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
