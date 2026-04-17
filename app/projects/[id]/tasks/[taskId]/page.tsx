import { redirect } from "next/navigation";
import { getTask } from "@/app/actions/tasks";
import { getProject } from "@/app/actions/projects";
import {
  getAllProjects,
  getProjectTasks,
} from "@/app/actions/breadcrumbs";
import { ChatInterface } from "@/components/tasks/chat-interface";
import { TaskDetail } from "@/components/tasks/task-detail";
import { BurgerMenu } from "@/components/burger-menu";
import { BackLink } from "@/components/back-link";
import { Breadcrumb, type BreadcrumbSibling } from "@/components/breadcrumb";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;

  const [taskResult, projectResult, allProjectsResult, tasksResult] =
    await Promise.all([
      getTask(taskId),
      getProject(id),
      getAllProjects(),
      getProjectTasks(id),
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

  const projectSiblings: BreadcrumbSibling[] = (allProjectsResult.data ?? []).map(
    (p) => ({ id: p.id, title: p.title, href: `/projects/${p.id}` })
  );
  const taskSiblings: BreadcrumbSibling[] = (tasksResult.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    href: `/projects/${id}/tasks/${t.id}`,
  }));

  if (hasRequirements) {
    return (
      <main className="flex min-h-screen flex-col">
        <TaskDetail
          task={task}
          projectId={id}
          projectName={project.name}
          projectSiblings={projectSiblings}
          taskSiblings={taskSiblings}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center gap-4 px-6">
          <BackLink href={`/projects/${id}`} label="Back to project" />
          <Breadcrumb
            segments={[
              { label: "Ouverture", href: "/" },
              {
                label: project.name,
                href: `/projects/${id}`,
                siblings: projectSiblings,
                currentId: id,
              },
              {
                label: task.title,
                href: null,
                siblings: taskSiblings,
                currentId: task.id,
              },
            ]}
          />
          <div className="ml-auto">
            <BurgerMenu />
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6 py-6 pt-[calc(5rem+1.5rem)]">
        <ChatInterface task={task} projectId={id} projectTools={project.tools} />
      </section>
    </main>
  );
}
