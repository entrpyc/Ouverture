import Link from "next/link";
import { redirect } from "next/navigation";
import { getTask } from "@/app/actions/tasks";
import { getProject } from "@/app/actions/projects";
import { ChatInterface } from "@/components/tasks/chat-interface";
import { TaskDetail } from "@/components/tasks/task-detail";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;

  const [taskResult, projectResult] = await Promise.all([
    getTask(taskId),
    getProject(id),
  ]);

  if (taskResult.error || !taskResult.data) {
    redirect(`/projects/${id}`);
  }
  if (projectResult.error || !projectResult.data) {
    redirect(`/projects/${id}`);
  }

  const task = taskResult.data;
  const project = projectResult.data;
  const hasRequirements =
    typeof task.requirements === "string" && task.requirements.length > 0;

  if (hasRequirements) {
    return (
      <main className="flex min-h-screen flex-col">
        <TaskDetail task={task} projectId={id} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center gap-4 px-6">
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
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6 py-6 pt-[calc(5rem+1.5rem)]">
        <ChatInterface task={task} projectId={id} projectTools={project.tools} />
      </section>
    </main>
  );
}
