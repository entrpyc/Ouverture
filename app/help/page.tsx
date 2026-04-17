import Link from "next/link";

export default function HelpPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-800">
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
          <h1 className="text-base font-semibold tracking-tight text-zinc-100">
            How to use Ouverture
          </h1>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-300">
            Ouverture helps you plan and execute Claude Code work. You describe
            what you want to build; Ouverture drives a structured flow from a
            loose idea to concrete tickets you can paste into Claude Code.
          </p>
          <p className="text-sm text-zinc-400">
            The hierarchy is{" "}
            <span className="text-zinc-200">
              Project → Task → Phase → Ticket
            </span>
            . Each level owns the one below it.
          </p>
        </div>

        <Section title="1. Projects">
          <p>
            A project groups related work. Each project has a name and a free-text
            spec that describes what it is about. Create one from the projects
            page via <em>New project</em>.
          </p>
          <p>
            Inside a project you manage tooling — the agents, skills, and MCPs
            that Claude Code has available. Tooling is entered manually; nothing
            scans your filesystem. Good tooling entries give the AI accurate
            context when it generates phases and tickets.
          </p>
        </Section>

        <Section title="2. Tasks">
          <p>
            A task is one unit of work inside a project. Creating a task opens
            a chat with a requirements analyst. Describe what you want to build
            — the AI asks clarifying questions, and the number of rounds adapts
            to the complexity of the task.
          </p>
          <p>
            During the conversation the AI may suggest new agents, skills, or
            MCPs inline if it spots a gap in the project&rsquo;s tooling. Click{" "}
            <em>Finalize</em> when the conversation captures what you want;
            Ouverture turns the chat into structured requirements.
          </p>
        </Section>

        <Section title="3. Phases">
          <p>
            From a task, generate phases. The implementation architect returns
            a list of phases with a title, description, hour estimate, priority,
            and tooling selections. New tooling suggestions are shown with a
            badge and rationale.
          </p>
          <p>
            Review, adjust tooling per phase, and confirm. Phases can be edited
            or deleted afterward.
          </p>
        </Section>

        <Section title="4. Tickets">
          <p>
            From a phase, generate tickets. Each ticket has a title, description,
            step-by-step instructions, a ready-to-paste Claude Code terminal
            prompt, acceptance criteria, and a test prompt for verifying the
            result.
          </p>
          <p>
            The Claude Code prompt and test prompt both have one-click copy
            buttons. Edit, add, or remove tickets before confirming.
          </p>
        </Section>

        <Section title="5. The done system">
          <p>
            Marking something done does not delete it. Done items move to a
            collapsed <em>Done</em> section inside their parent view and can be
            re-opened individually.
          </p>
          <ul className="list-disc pl-5 text-sm text-zinc-300">
            <li>Mark a ticket done — ticket moves to its phase&rsquo;s done section.</li>
            <li>Mark a phase done — phase and all its tickets move to done.</li>
            <li>Mark a task done — task, phases, and tickets all move to done.</li>
          </ul>
          <p className="text-sm text-zinc-400">
            Re-opening a parent does not cascade to children — each re-opens
            independently.
          </p>
        </Section>

        <Section title="6. Bulk selection">
          <p>
            On the projects page you can select multiple projects and delete them
            in one action.
          </p>
          <ul className="list-disc pl-5 text-sm text-zinc-300">
            <li>
              Click <em>Select</em> in the header to enter selection mode. Cards
              turn into checkboxes — click to toggle, and the action menu is
              hidden.
            </li>
            <li>
              Hold <Key>Ctrl</Key> (or <Key>Cmd</Key> on Mac) to preview
              selection without entering the mode — cards show a checkbox
              indicator while the key is held.
            </li>
            <li>
              <Key>Ctrl</Key>-click (or <Key>Cmd</Key>-click) any card to select
              it and auto-enter selection mode.
            </li>
            <li>
              A toolbar at the top shows the selected count, a{" "}
              <em>Select all</em> / <em>Clear all</em> toggle, and a{" "}
              <em>Delete selected</em> button.
            </li>
          </ul>
        </Section>

        <Section title="Hotkeys">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900">
            <Hotkey combo={<><Key>Ctrl</Key> / <Key>Cmd</Key></>} description="Hold to preview selection mode on the projects page" />
            <Hotkey combo={<><Key>Ctrl</Key>+click</>} description="Toggle selection on a project card (auto-enters selection mode)" />
            <Hotkey combo={<Key>Esc</Key>} description="Exit selection mode, or close any open dialog" />
            <Hotkey combo={<Key>Enter</Key>} description="Activate a focused project card (navigate, or toggle in selection mode)" last />
          </div>
        </Section>
      </section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-sm text-zinc-300">{children}</div>
    </section>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-200">
      {children}
    </kbd>
  );
}

function Hotkey({
  combo,
  description,
  last = false,
}: {
  combo: React.ReactNode;
  description: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 ${
        last ? "" : "border-b border-zinc-800"
      }`}
    >
      <div className="w-40 shrink-0 text-sm text-zinc-200">{combo}</div>
      <div className="text-sm text-zinc-400">{description}</div>
    </div>
  );
}
