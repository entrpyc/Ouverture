import Link from "next/link";
import { redirect } from "next/navigation";
import { getTask } from "@/app/actions/tasks";

export default async function TaskStubPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const result = await getTask(taskId);
  if (result.error || !result.data) {
    redirect(`/projects/${id}`);
  }

  const task = result.data;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-zinc-800 px-6 py-4">
        <Link
          href={`/projects/${id}`}
          aria-label="Back to project"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="truncate text-base font-semibold tracking-tight text-zinc-100">
          {task.title}
        </h1>
      </header>
    </main>
  );
}
