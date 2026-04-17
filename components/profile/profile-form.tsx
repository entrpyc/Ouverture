"use client";

import { useEffect, useState } from "react";
import { updateProfile } from "@/app/actions/user";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  initialName: string;
  initialEmail: string;
  hasApiKey: boolean;
};

export function ProfileForm({ initialName, initialEmail, hasApiKey }: Props) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailInvalid = emailTouched && !EMAIL_REGEX.test(email.trim());

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(false), 3000);
    return () => clearTimeout(id);
  }, [success]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailTouched(true);
    if (!EMAIL_REGEX.test(email.trim())) return;
    if (submitting) return;

    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const result = await updateProfile({
        name: name.trim() || null,
        email: email.trim(),
        apiKey: apiKey.trim() || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setApiKey("");
      setShowApiKey(false);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-name" className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-email" className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          disabled={submitting}
          aria-invalid={emailInvalid}
          aria-describedby={emailInvalid ? "profile-email-error" : undefined}
          className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500"
        />
        {emailInvalid && (
          <p id="profile-email-error" className="text-xs text-red-400">
            Please enter a valid email address
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-api-key" className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          MiniMax API Key
        </label>
        <div className="relative">
          <input
            id="profile-api-key"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={submitting}
            placeholder={hasApiKey ? "Leave blank to keep existing key" : "Enter your API key"}
            autoComplete="off"
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowApiKey((v) => !v)}
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
            aria-pressed={showApiKey}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            {showApiKey ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.5 21.5 0 0 1 5.06-6.06" />
                <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.5 21.5 0 0 1-3.17 4.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-emerald-400">
          Changes saved
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          {submitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
