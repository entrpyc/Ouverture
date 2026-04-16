import Link from "next/link";
import { getTasksForProject } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";
import { NewTaskButton } from "./new-task-button";

type Props = {
  projectId: string;
};

export async function TaskList({ projectId }: Props) {
  const result = await getTasksForProject(projectId);
  const tasks = result.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          All tasks
        </h3>
        <NewTaskButton projectId={projectId} />
      </div>

      {result.error && (
        <p className="text-sm text-red-400">Failed to load tasks: {result.error}</p>
      )}

      {!result.error && tasks.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No tasks yet — create one to get started
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskRow projectId={projectId} task={task} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({ projectId, task }: { projectId: string; task: Task }) {
  const isDone = task.status === "done";
  return (
    <Link
      href={`/projects/${projectId}/tasks/${task.id}`}
      className="flex items-center justify-between gap-4 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 transition hover:border-zinc-700 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-600"
    >
      <span className="truncate text-sm text-zinc-100">{task.title}</span>
      <span
        className={
          isDone
            ? "rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-500"
            : "rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200"
        }
      >
        {isDone ? "done" : "active"}
      </span>
    </Link>
  );
}
