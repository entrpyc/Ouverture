import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";
import { encrypt } from "../lib/encryption";

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set.");
  return raw.startsWith("file:") ? raw.slice("file:".length) : raw;
}

const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "test@ouverture.dev";

  await prisma.user.deleteMany({ where: { email } });

  const passwordHash = await bcrypt.hash("password123", 10);
  const minimaxApiKey = encrypt("sk-minimax-placeholder-for-seed");

  const user = await prisma.user.create({
    data: { email, passwordHash, minimaxApiKey },
  });
  console.log(`Created user ${user.email}`);

  const projectA = await prisma.project.create({
    data: {
      userId: user.id,
      name: "Auth System",
      spec: "Build a secure authentication flow with email/password and session-based access control.",
      tools: {
        create: [
          { type: "agent", name: "auth-reviewer" },
          { type: "skill", name: "bcrypt-helper" },
          { type: "mcp", name: "github-mcp" },
        ],
      },
    },
  });

  const projectB = await prisma.project.create({
    data: {
      userId: user.id,
      name: "Dashboard Analytics",
      spec: "Build a realtime analytics dashboard with charts, filters, and CSV export.",
      tools: {
        create: [
          { type: "agent", name: "chart-designer" },
          { type: "mcp", name: "postgres-mcp" },
        ],
      },
    },
  });

  console.log(`Created projects: ${projectA.name}, ${projectB.name}`);

  await prisma.task.create({
    data: {
      projectId: projectA.id,
      userId: user.id,
      title: "Unfinalized: wire up OAuth",
      requirements: "",
      conversationHistory: [],
      status: "active",
    },
  });

  await prisma.task.create({
    data: {
      projectId: projectB.id,
      userId: user.id,
      title: "Unfinalized: dark mode toggle",
      requirements: "",
      conversationHistory: [],
      status: "active",
    },
  });

  const finalizedTask = await prisma.task.create({
    data: {
      projectId: projectA.id,
      userId: user.id,
      title: "Finalized: signup and login flows",
      requirements:
        "Users can create an account with email/password, log in, and remain authenticated across page loads. Passwords are bcrypt-hashed and sessions use JWT cookies.",
      conversationHistory: [
        { role: "user", content: "I want users to sign up and log in." },
        { role: "assistant", content: "What identity providers should be supported?" },
        { role: "user", content: "Just email and password for now." },
        { role: "assistant", content: "Should users stay signed in across reloads?" },
        { role: "user", content: "Yes, cookie-based sessions are fine." },
      ],
      status: "active",
    },
  });

  console.log(`Created 1 finalized + 2 unfinalized tasks`);

  const phase1 = await prisma.phase.create({
    data: {
      taskId: finalizedTask.id,
      title: "Scaffold auth data model",
      description: "Add User model, password hashing, and session wiring.",
      estimateHours: "4",
      priority: "high",
      tooling: {
        create: [
          { type: "skill", name: "prisma-helper", isNew: false },
          {
            type: "agent",
            name: "schema-migrator",
            isNew: true,
            rationale: "No existing agent handles incremental schema diffs cleanly.",
          },
        ],
      },
    },
  });

  const phase2 = await prisma.phase.create({
    data: {
      taskId: finalizedTask.id,
      title: "Build signup and login UIs",
      description: "Create accessible forms with server actions and error states.",
      estimateHours: "6",
      priority: "medium",
      tooling: {
        create: [
          { type: "agent", name: "form-builder", isNew: false },
          {
            type: "mcp",
            name: "accessibility-audit-mcp",
            isNew: true,
            rationale: "Needed to automate a11y checks on new forms.",
          },
        ],
      },
    },
  });

  console.log(`Created 2 phases for finalized task`);

  for (const [phase, baseOrder] of [
    [phase1, 1],
    [phase2, 10],
  ] as const) {
    const ticketDone = await prisma.ticket.create({
      data: {
        phaseId: phase.id,
        title: `${phase.title} — ticket A (done)`,
        description: "Completed scaffolding step.",
        instructions: [
          "Read the current schema.",
          "Apply the new fields.",
          "Run migrations.",
        ],
        claudeCodePrompt: `Scaffold the ${phase.title} groundwork.`,
        testPrompt: "Run the migration and verify tables exist.",
        acceptanceCriteria: [
          "Schema matches spec.",
          "Migration runs clean on a fresh DB.",
        ],
        order: baseOrder,
        status: "done",
        tooling: {
          create: [
            { type: "skill", name: "prisma-helper", isNew: false },
          ],
        },
      },
    });

    const ticketActive = await prisma.ticket.create({
      data: {
        phaseId: phase.id,
        title: `${phase.title} — ticket B (active)`,
        description: "Implement the interactive flow.",
        instructions: [
          "Wire up the server action.",
          "Render the form.",
          "Handle error and success states.",
        ],
        claudeCodePrompt: `Finish the ${phase.title} implementation.`,
        testPrompt: "Exercise the happy path and at least one error path.",
        acceptanceCriteria: [
          "Happy path works end to end.",
          "Errors are surfaced inline.",
        ],
        order: baseOrder + 1,
        status: "active",
        tooling: {
          create: [
            { type: "agent", name: "form-builder", isNew: false },
            {
              type: "mcp",
              name: "playwright-mcp",
              isNew: true,
              rationale: "Needed to script end-to-end auth flows.",
            },
          ],
        },
      },
    });

    console.log(
      `  Phase "${phase.title}" → tickets ${ticketDone.id.slice(0, 6)}, ${ticketActive.id.slice(0, 6)}`
    );
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
