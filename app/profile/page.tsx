import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BurgerMenu } from "@/components/burger-menu";
import { BackLink } from "@/components/back-link";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, minimaxApiKey: true },
  });
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center gap-4 px-6">
          <BackLink href="/" label="Back to projects" />
          <h1 className="text-base font-semibold tracking-tight text-zinc-100">
            Profile
          </h1>
          <div className="ml-auto">
            <BurgerMenu />
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-6 pt-[calc(5rem+1.5rem)]">
        <ProfileForm
          initialName={user.name ?? ""}
          initialEmail={user.email}
          hasApiKey={Boolean(user.minimaxApiKey)}
        />
      </section>
    </main>
  );
}
