import { getTasksForProject } from "@/app/actions/tasks";
import type { Task } from "@/lib/types";
import { NewTaskButton } from "./new-task-button";
import { TaskRow } from "./task-row";

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
          {tasks.map((task: Task) => (
            <li key={task.id}>
              <TaskRow projectId={projectId} task={task} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
