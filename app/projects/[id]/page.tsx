import { redirect } from "next/navigation";
import { getProject } from "@/app/actions/projects";
import { getAllProjects } from "@/app/actions/breadcrumbs";
import { ProjectHeader } from "@/components/projects/project-header";
import { ToolingSection } from "@/components/projects/tooling-section";
import { TaskList } from "@/components/tasks/task-list";
import { BurgerMenu } from "@/components/burger-menu";
import { BackLink } from "@/components/back-link";
import { SpecActions } from "@/components/projects/spec-actions";
import { formatAbsolute, formatRelative } from "@/lib/format-date";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, allProjectsResult] = await Promise.all([
    getProject(id),
    getAllProjects(),
  ]);
  if (result.error || !result.data) {
    redirect("/");
  }

  const project = result.data;
  const allProjects = (allProjectsResult.data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    href: `/projects/${p.id}`,
  }));

  return (
    <main className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center gap-4 px-6">
          <BackLink href="/" label="Back to projects" />
          <ProjectHeader project={project} allProjects={allProjects} />
          <div className="ml-auto">
            <BurgerMenu />
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-8 px-6 py-6 pt-[calc(5rem+1.5rem)]">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
          <span title={formatAbsolute(project.createdAt)}>
            Created {formatRelative(project.createdAt)}
          </span>
          <span title={formatAbsolute(project.updatedAt)}>
            Last edited {formatRelative(project.updatedAt)}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Spec
            </h2>
            {project.spec && <SpecActions spec={project.spec} />}
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            {project.spec ? (
              <p className="whitespace-pre-wrap text-sm text-zinc-200">
                {project.spec}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                No spec yet — edit the project to add one
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Tooling
          </h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <ToolingSection projectId={project.id} tools={project.tools} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Tasks
          </h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <TaskList projectId={project.id} />
          </div>
        </div>
      </section>
    </main>
  );
}
