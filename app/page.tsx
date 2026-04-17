import { getProjects } from "@/app/actions/projects";
import { ProjectsList } from "@/components/projects/projects-list";
import { BurgerMenu } from "@/components/burger-menu";
import { Breadcrumb } from "@/components/breadcrumb";
import { BackLink } from "@/components/back-link";

export default async function Home() {
  const result = await getProjects();
  const projects = result.data ?? [];

  return (
    <main className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center gap-4 px-6">
          <BackLink label="Back" disabled />
          <Breadcrumb segments={[{ label: "Ouverture", href: "/" }]} />
          <BurgerMenu />
        </div>
      </header>
      <section className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6 py-6 pt-[calc(5rem+1.5rem)]">
        {result.error ? (
          <p className="text-sm text-red-400">Failed to load projects: {result.error}</p>
        ) : (
          <ProjectsList projects={projects} />
        )}
      </section>
    </main>
  );
}
