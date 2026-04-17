import { getTasksForProject } from "@/app/actions/tasks";
import { NewTaskButton } from "./new-task-button";
import { TaskListGroups } from "./task-list-groups";

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

      {!result.error && <TaskListGroups projectId={projectId} tasks={tasks} />}
    </div>
  );
}
