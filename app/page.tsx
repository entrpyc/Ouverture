import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Ouverture</h1>
      <p className="text-sm text-zinc-400">Logged in as {session?.user?.email}</p>
    </main>
  );
}
