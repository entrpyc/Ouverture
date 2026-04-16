import { getProjects } from "@/app/actions/projects";
import { ProjectsList } from "@/components/projects/projects-list";

export default async function Home() {
  const result = await getProjects();
  const projects = result.data ?? [];

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <span className="text-base font-semibold tracking-tight text-zinc-100">
          Ouverture
        </span>
      </header>
      <section className="flex flex-1 flex-col px-6 py-6">
        {result.error ? (
          <p className="text-sm text-red-400">Failed to load projects: {result.error}</p>
        ) : (
          <ProjectsList projects={projects} />
        )}
      </section>
    </main>
  );
}
