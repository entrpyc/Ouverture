"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/app/actions/tasks";

type Props = {
  projectId: string;
};

export function NewTaskButton({ projectId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createTask(projectId, { title: "Untitled task" });
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to create task");
        return;
      }
      router.push(`/projects/${projectId}/tasks/${result.data.id}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-400">{error}</span>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      >
        {pending ? (
          "Creating…"
        ) : (
          <>
            <span aria-hidden="true">+</span>
            New task
          </>
        )}
      </button>
    </div>
  );
}
