import { redirect } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/app/actions/projects";
import { ProjectHeader } from "@/components/projects/project-header";
import { ToolingSection } from "@/components/projects/tooling-section";
import { TaskList } from "@/components/tasks/task-list";
import { formatAbsolute, formatRelative } from "@/lib/format-date";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProject(id);
  if (result.error || !result.data) {
    redirect("/");
  }

  const project = result.data;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center gap-4 px-6">
          <Link
            href="/"
            aria-label="Back to projects"
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
          <ProjectHeader project={project} />
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
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Spec
          </h2>
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
