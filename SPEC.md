# Ouverture — Spec

Ouverture is a Next.js 16 App Router web app that helps developers plan and execute Claude Code work. A user signs up, describes a project, then converts loose ideas into concrete Claude-Code-ready tickets through a structured chat → finalize → phases → tickets flow. All AI generation runs through a pluggable adapter with MiniMax as the default. Data is stored in SQLite via Prisma. The UI is dark-theme only.

This document is an accurate snapshot of the current implementation plus the prescriptive UX behaviour the product is being built toward. Code-derivable sections (data model, routes, AI roles, tech stack) match what is shipped; UX sections describe the intended behaviour and are the source of truth when the code diverges.

---

## Architecture

### Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC) |
| Runtime | Node.js |
| Auth | NextAuth.js v5 (credentials provider, JWT sessions) |
| Database | SQLite via Prisma 7 (`prisma-client` generator, output at `lib/generated/prisma/`) |
| AI | MiniMax `MiniMax-M1` via `https://api.minimaxi.chat/v1/text/chatcompletion_v2`, behind an `AIAdapter` interface |
| Password hashing | `bcryptjs` |
| API key encryption | AES-256-CBC, key derived from `ENCRYPTION_KEY` env var |
| Styling | Tailwind 4 (`@tailwindcss/postcss`), dark class on `<html>`, Geist fonts |
| Markdown rendering | `react-markdown` + `remark-gfm` |
| TypeScript | strict mode |

### Layers

1. **Pages (Server Components)** — `app/**/page.tsx`. Fetch data via server actions, render markup, delegate interactivity to client components. Per-page auth check via `auth()`.
2. **Server Actions** — `app/actions/*.ts`. All mutation and fetch logic for Project/Task/Phase/Ticket/ProjectTool/User. Every action calls `getAuthenticatedUserId()` before touching data. Return shape is `ActionResponse<T>` (`{ data, error }`).
3. **API routes** — `app/api/ai/*`, `app/api/auth/[...nextauth]`. AI routes exist because they stream (`/api/ai/chat`) or return raw JSON fed to client-side generators (`/api/ai/phases`, `/api/ai/tickets`, `/api/ai/finalize`). They live in `route.ts` rather than server actions because of the streaming requirement and the client-side JSON pipeline.
4. **AI adapter** — `lib/ai/`. `AIAdapter` interface (`chat` + `complete<T>`), `MiniMaxAdapter` implementation, per-role system prompts in `prompts.ts`. `getAdapterForUser()` reads the encrypted key, decrypts it, and constructs an adapter per-request.
5. **Client components** — `components/**`. Forms, modals, chat UI, drag-drop, menus, dialogs. All state is local or server-action-driven; there is no global store.

### Auth flow

- Provider: credentials (email + password). Users sign up through `app/signup/actions.ts`, which bcrypts the password and creates a `User` row.
- Sessions: JWT strategy. Token holds `id`; session callback surfaces `session.user.id` for server components. Cookie is `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod), HTTP-only, `sameSite: lax`.
- **No middleware.** Route protection is per-page: each server component calls `auth()` (or `getAuthenticatedUserId()`) and redirects to `/login` when the session is missing. API routes return 401 from the same check.
- Sign-out from the burger menu calls `signOut({ callbackUrl: "/login" })` from `next-auth/react`.

### AI integration

- User provides their own MiniMax API key in Profile. The key is encrypted with AES-256-CBC using `ENCRYPTION_KEY` (hex-64 used directly, otherwise SHA-256 derived) before storage.
- `getAdapterForUser()` on each request: resolves session → loads `User.minimaxApiKey` → decrypts → returns a `MiniMaxAdapter` instance. The plaintext key never leaves the request scope and never reaches the browser.
- `AIAdapter` exposes `chat(messages)` for SSE streaming and `complete<T>(messages)` for single-shot JSON completions. `MiniMaxAdapter.complete` strips markdown fences and `JSON.parse`s the content, throwing a descriptive error on invalid JSON.

### Encryption contract

- `lib/encryption.ts` exposes `encrypt(text)` → `ivHex:encryptedHex` and `decrypt(payload)`. Any stored secret should pass through these. Today only `User.minimaxApiKey` uses them; the function is available for future secrets.
- Rotating `ENCRYPTION_KEY` invalidates existing ciphertexts. No re-encryption migration exists; affected users re-enter their key.

### Scroll and navigation

- App-wide scroll restoration is manual, not browser-default. `components/scroll-restorer.tsx` mounted in the root layout sets `history.scrollRestoration = "manual"`, saves `scrollY` per history entry to `sessionStorage`, and restores on `popstate`.
- The header chevron is not a plain `<Link>` — it is `components/back-link.tsx`, which calls `router.back()` when browser history exists and falls back to `router.push(href)` otherwise (so deep-links still work).

---

## Data model

Hierarchy: **Project → Task → Phase → Ticket**.

Statuses are `active | done` at every level below Project. Projects do not have a status. Marking a parent done cascades to children. Marking a parent active (re-open) does not cascade. Deleting a parent cascades via Prisma `onDelete: Cascade`.

### User
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `email` | String | unique |
| `name` | String? | optional, user-editable in Profile |
| `passwordHash` | String | bcrypt |
| `minimaxApiKey` | String? | ciphertext, AES-256-CBC |
| `createdAt` | DateTime | default now |

Relations: `projects Project[]`, `tasks Task[]`.

### Project
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `userId` | String | FK User, cascade delete |
| `name` | String | |
| `spec` | String | free-text spec / description, may be empty string |
| `createdAt` / `updatedAt` | DateTime | `updatedAt` auto-touched |

Relations: `tools ProjectTool[]`, `tasks Task[]`.

### ProjectTool
Manual catalogue of agents, skills, and MCPs the user has in the project. The AI reads this list to recommend reuse vs. new tooling.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `projectId` | String | FK Project, cascade delete |
| `type` | String | `agent | skill | mcp` |
| `name` | String | |

### Task
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `projectId` / `userId` | String | FKs, cascade delete |
| `title` | String | |
| `requirements` | String? | prose written by AI on finalize |
| `conversationHistory` | Json? | `ChatMessage[]` captured during requirements chat |
| `proposedPhases` | Json? | last generated `PhaseResult[]` awaiting user confirmation |
| `status` | String | default `active` |
| `createdAt` / `updatedAt` | DateTime | |

### Phase
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `taskId` | String | FK Task, cascade delete |
| `title` / `description` | String | |
| `estimateHours` | String | e.g. `"3-5h"` |
| `priority` | String | `high | medium | low` |
| `status` | String | default `active` |
| `proposedTickets` | Json? | last generated `TicketResult[]` awaiting user confirmation |

Relations: `tooling PhaseTooling[]`, `tickets Ticket[]`.

### PhaseTooling
| Field | Type | Notes |
|---|---|---|
| `id`, `phaseId` | String | |
| `type` | String | `agent | skill | mcp` |
| `name` | String | |
| `isNew` | Boolean | AI flagged this as a tool the project does not yet have |
| `rationale` | String? | AI explanation when `isNew` |

### Ticket
| Field | Type | Notes |
|---|---|---|
| `id`, `phaseId` | String | |
| `title` / `description` | String | |
| `instructions` | Json | `string[]`, step-by-step |
| `claudeCodePrompt` | String | copy-paste prompt for Claude Code |
| `testPrompt` | String | post-implementation verification prompt |
| `acceptanceCriteria` | Json | `string[]`, verifiable conditions |
| `status` | String | default `active` |
| `order` | Int | sort within phase |

Relations: `tooling TicketTooling[]` (same shape as `PhaseTooling`).

### Ephemeral state: `proposedPhases` / `proposedTickets`

These are draft buffers. When the user clicks "Generate phases/tickets", the AI response is stored on the parent (`Task.proposedPhases` or `Phase.proposedTickets`) so that a page refresh mid-review does not lose the draft. On confirm, the drafts are persisted as real `Phase` / `Ticket` rows and the draft field is cleared. On cancel, the draft field is cleared without persisting.

---

## Route map

### Page routes

| Route | File | Auth | Purpose |
|---|---|---|---|
| `/` | `app/page.tsx` | required | Projects list (user's own) |
| `/help` | `app/help/page.tsx` | required | How-to page |
| `/profile` | `app/profile/page.tsx` | required | Name / email / MiniMax API key form |
| `/login` | `app/login/page.tsx` | public | Credentials login |
| `/signup` | `app/signup/page.tsx` | public | Credentials signup |
| `/projects/[id]` | `app/projects/[id]/page.tsx` | required (owner) | Project detail: spec, tooling, tasks |
| `/projects/[id]/tasks/[taskId]` | `.../tasks/[taskId]/page.tsx` | required (owner) | Task page: chat (pre-finalize) or `TaskDetail` view (post-finalize) |
| `/projects/[id]/tasks/[taskId]/phases/[phaseId]` | `.../phases/[phaseId]/page.tsx` | required (owner) | Phase detail: description, tooling, tickets |
| `/projects/[id]/tasks/[taskId]/phases/[phaseId]/tickets/[ticketId]` | `.../tickets/[ticketId]/page.tsx` | required (owner) | Ticket detail: instructions, prompts, criteria, tooling |

Ownership check: the page loads the entity via a server action that filters by `userId` and `redirect()`s to the parent on miss.

### API routes

| Method | Route | Purpose | Response type |
|---|---|---|---|
| POST | `/api/ai/chat` | Streaming requirements chat. Body: `{ messages, projectId }`. Adds a system message prepending `REQUIREMENTS_ANALYST` with the project name, spec, and tooling list. | `text/event-stream` (SSE) |
| POST | `/api/ai/finalize` | Ends a chat by producing `{ title, requirements }` JSON. | JSON |
| POST | `/api/ai/phases` | Generates phases from a task. Body: `{ taskId, phaseCount? }`. When `phaseCount` is provided it is forwarded to the prompt. | JSON array of proposed phases |
| POST | `/api/ai/tickets` | Generates tickets from a phase. Body: `{ phaseId }`. | JSON array of proposed tickets |
| `[nextauth]` | `/api/auth/[...nextauth]` | NextAuth handlers. | — |

Every AI route: (1) checks auth, (2) loads the target entity scoped to the user, (3) resolves the adapter via `getAdapterForUser()` (returns a specific "API key not configured" 400 with prefix `MiniMax API key not configured`), (4) calls the adapter.

### Server actions

`app/actions/*.ts` — all use the `ActionResponse<T>` shape and `getAuthenticatedUserId()`:

- `projects.ts` — `getProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`, `deleteProjects` (bulk).
- `project-tools.ts` — `addProjectTool`, `updateProjectTool`, `deleteProjectTool`.
- `tasks.ts` — `getTask`, `createTask`, `updateTask`, `deleteTask`, `updateTaskStatus`, `saveConversation`, `saveProposedPhases`, `finalizeTask`.
- `phases.ts` — `getPhase`, `updatePhase`, `deletePhase`, `updatePhaseStatus`, `saveProposedTickets`, plus tooling editors.
- `tickets.ts` — `updateTicket`, `deleteTicket`, `updateTicketStatus`, tooling editors.
- `user.ts` — `updateProfile({ name, email, apiKey })`. Encrypts `apiKey` when non-empty; empty means "don't change".

All mutating actions that change a descendant also touch the owning project's `updatedAt` via `lib/touch-project.ts`.

---

## AI roles

All prompts are centralized in `lib/ai/prompts.ts`. The adapter is constructed per-request, so streaming replies are not serialised and multiple users cannot collide on a single connection.

### Requirements analyst (`REQUIREMENTS_ANALYST`)
Used during task-creation chat via `/api/ai/chat`. Streams SSE.

Prompt responsibilities:
- Ask focused technical questions covering core goal, user-facing behaviour, technical constraints, out-of-scope, success measure.
- Adapt volume: simple tasks 1–2 rounds, complex several.
- Ask in small batches, not all at once.
- Surface tooling gaps inline with the literal prefix `Tooling suggestion:` so the UI can detect them (see `lib/parse-tooling-suggestions.ts`).
- Do **not** emit a final spec — only react — until `FINALIZE_INSTRUCTION` is appended.

The chat route prepends a dynamic system message containing project name, spec, and current tooling catalogue so the model grounds its suggestions in the real project.

### Finalize (`FINALIZE_INSTRUCTION`)
Not a role — a trailing user message appended when the user clicks Finalize. Instructs the model to emit `{ title, requirements }` JSON only. Response flows through `MiniMaxAdapter.complete<T>` which strips code fences and parses.

### Implementation architect (`IMPLEMENTATION_ARCHITECT`)
Used by `/api/ai/phases`. Input includes project name, project spec, task requirements, project tooling, and optional `phaseCount`. Output is a JSON array with one entry per phase:

```json
{
  "title": "...",
  "description": "...",
  "estimateHours": "3-5h",
  "priority": "high" | "medium" | "low",
  "tooling": [
    { "type": "agent" | "skill" | "mcp", "name": "...", "isNew": true, "rationale": "..." }
  ]
}
```

If `phaseCount` is provided, the prompt mandates exactly that many phases; otherwise the model picks a count based on complexity.

### Ticket engineer (`TICKET_ENGINEER`)
Used by `/api/ai/tickets`. Input includes project name, project spec, task requirements, and phase details (title, description, estimate, priority, tooling). Output is a JSON array per ticket:

```json
{
  "title": "...",
  "description": "...",
  "instructions": ["step 1", "step 2"],
  "claudeCodePrompt": "...",
  "testPrompt": "...",
  "acceptanceCriteria": ["..."],
  "tooling": [ /* same shape as phase tooling */ ]
}
```

Each ticket is sized to be completable in a single Claude Code session.

---

## UX flow

Two persistent UI chrome elements sit outside the page flow:

- **Header** — every authenticated page has a `fixed top-0` header with a back chevron on the left (except `/`), a context-specific title/summary in the middle, and a burger menu on the right (Profile, Sign Out).
- **Footer** — every page (incl. unauthenticated) has a footer with `/help` link and support email.

### Projects list (`/`)

- Grid/list of `ProjectCard` items ordered by `updatedAt` desc.
- Each card shows project name, spec excerpt, and last-edited relative time.
- Top of the page: "New project" action opens `ProjectModal` (name + spec).
- Selection mode supports bulk delete.
- Empty state: friendly onboarding copy.

### Project detail (`/projects/[id]`)

- Header: back to `/`, project name (with inline edit via `ProjectHeader` popover), burger menu.
- Body sections:
  1. **Spec** — renders `project.spec` (whitespace-pre-wrap). When spec is non-empty, a Copy / Download toolbar (`SpecActions`) appears inline with the heading. Copy uses `navigator.clipboard.writeText` with a legacy `execCommand` fallback for insecure contexts (HTTP). Download produces `SPEC.md` via a `Blob` with `type: "text/plain"`.
  2. **Tooling** — `ToolingSection`. Lists existing `ProjectTool` rows with inline edit/delete and an "Add tool" control. Type is `agent | skill | mcp`.
  3. **Tasks** — `TaskList`. Creates new tasks via "New task" which inserts a row and navigates to the task page. Active and done tasks are grouped via `TaskListGroups`; the done group is collapsed by default.
- Destructive: "Delete project" in the project actions menu opens `DeleteProjectDialog` (typed-name confirmation).

### Task page (`/projects/[id]/tasks/[taskId]`)

Two modes based on whether `task.requirements` is set:

#### 1. Pre-finalize — chat mode

- Renders `ChatInterface`:
  - Scrollable conversation: user bubbles on the right, assistant bubbles on the left.
  - While the assistant is streaming with no content yet, the placeholder is `<ThinkingEmoji intervalMs={3000} />` — three random emojis from a fixed pool refreshed every 3s.
  - Inline **tooling suggestions** are detected via `parseMessageContent` / `lib/parse-tooling-suggestions.ts`: any `Tooling suggestion:` block is pulled out of the message and rendered as a distinct `ToolingSuggestionCard` beneath the chat text.
  - Assistant markdown is rendered with `react-markdown` + `remark-gfm`, restyled for the dark theme (paragraphs, headings, code blocks with monospace background).
- Composer: textarea + Send button. Ctrl/Cmd+Enter sends. Disabled while `isStreaming` or `isFinalizing`.
- **Finalize button** — enabled once at least one assistant turn has landed (`messages.length >= 2`). Clicking calls `/api/ai/finalize`, then `finalizeTask` server action saves `requirements`, `title`, and clears ephemeral UI state. Button label becomes "Finalizing <ThinkingEmoji intervalMs={2000} />" while working.
- Conversation is persisted incrementally via `saveConversation` so the chat survives refresh.
- Status line below the chat reads "Thinking…" or "Generating task requirements…" as a textual companion to the streaming bubble.

#### 2. Post-finalize — `TaskDetail`

- Header includes a kebab menu with **Edit**, **Mark done / Reopen**, **Delete**.
- Body:
  1. **Requirements** — `task.requirements` in a bordered card, whitespace-pre-wrap.
  2. **Phases** section:
     - When no phases are confirmed yet: show "Generate phases" button and a numeric input. Empty input = AI decides count; an integer ≥ 1 mandates exactly that count. While generating, the button reads `Generating phases <ThinkingEmoji intervalMs={2000} />`.
     - When `proposedPhases` exists in state: render `ProposedPhasesReview` — each proposed phase is a card with title, description, estimate, priority, and an editable tooling list. User can cancel (clears drafts) or confirm (persists as real `Phase` rows).
     - When confirmed phases exist: render `ConfirmedPhaseRow` per phase, grouped by status. Done phases collapsible, same pattern as tasks.
- Delete dialog uses `DeleteTaskDialog` (typed-title confirmation).

### Phase detail (`/projects/[id]/tasks/[taskId]/phases/[phaseId]`)

- Header: back to task, phase title, priority badge, estimate, status badge, kebab (Edit / Mark done / Delete), burger menu.
- Body:
  1. **Description** — bordered card.
  2. **Tooling** — `PhaseToolingEditor`. Same add/edit/delete flow as project tooling, but entries may have `isNew: true` badges with AI rationale.
  3. **Tickets** section, same pattern as phases-in-task:
     - Empty → "Generate tickets" button with thinking emoji.
     - `proposedTickets` drafts → `ProposedTicketsReview` for edit-then-confirm.
     - Confirmed tickets → `ConfirmedTicketRow` list grouped by status.

### Ticket detail (`/projects/[id]/tasks/[taskId]/phases/[phaseId]/tickets/[ticketId]`)

- Header: back to phase, ticket title, status badge, kebab.
- Body sections:
  1. **Description**
  2. **Instructions** — ordered list from `instructions: string[]`.
  3. **Claude Code prompt** — monospace block with one-click copy.
  4. **Acceptance criteria** — bullet list.
  5. **Test prompt** — monospace block with one-click copy.
  6. **Tooling** — `TicketToolingEditor`, same shape as phase tooling.

### Proposed review (phases & tickets)

Both `ProposedPhasesReview` and `ProposedTicketsReview` share the pattern:

- Each proposed item is fully editable before confirming.
- Tooling suggestions with `isNew: true` render with a distinct "new" badge and the AI rationale.
- User can remove items individually before confirming.
- Cancel → clears the draft on the parent, returns to the "Generate" CTA.
- Confirm → persists all items as real rows with a single server action call, clears the draft, re-renders as the "confirmed" view.

### Done system

| Action | Cascade |
|---|---|
| Mark ticket done | nothing below |
| Mark phase done | phase + all tickets |
| Mark task done | task + all phases + all tickets |
| Reopen (any level) | self only |

Visual pattern (applied consistently across Tasks, Phases, Tickets):

- Active items at full opacity, larger click target.
- Done items dimmed (muted text, softened borders), grouped into a collapsed "Done (N)" section below active items.
- Reopening a done item moves it back into the active group without expanding its children's status.

### Profile (`/profile`)

- Fields:
  - **Name** — prefilled from `user.name`.
  - **Email** — prefilled, inline-validated with `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, unique-violation surfaced as "That email is already in use".
  - **MiniMax API Key** — always blank on load (security). Password-type input with eye toggle (open/closed eye SVG). Placeholder reflects whether a key is already saved: "Leave blank to keep existing key" vs. "Enter your API key".
- Submit button: "Save Changes" / "Saving…" while pending.
- Success banner: "Changes saved" (emerald), auto-dismissed after 3s.
- Error banner (red) for failures from the server action, does not auto-dismiss.

### Authentication pages

- `/login` and `/signup`: centered card, no header/burger, just the form and a cross-link ("Don't have an account? Sign up" / "Already have an account? Log in").
- Post-login redirect: `/`.
- Post-signup: auto-login and redirect to `/`.

### Burger menu

Rendered via `BurgerMenu` in every authenticated header's top-right. Dropdown items:
- **Profile** → `/profile`
- **Sign Out** → `signOut({ callbackUrl: "/login" })`
Click-outside and Escape close the menu.

### Help page (`/help`)

Static marketing-ish "How to use Ouverture" explainer. Back chevron to `/`, burger on the right.

---

## Technical constraints

- **Next.js 16 App Router only** — no Pages Router, no `getServerSideProps`. This project runs a pre-release Next and the deprecation notices in `node_modules/next/dist/docs/` are authoritative when they conflict with older Next patterns.
- **Dark theme only** — `.dark` class on `<html>` in `layout.tsx`, Tailwind `@custom-variant dark` in `globals.css`. No toggle, no light mode.
- **Per-user API key** — MiniMax keys are user-scoped and encrypted at rest. The server never reads the key from `process.env`; there is no global fallback key.
- **Server-side AI only** — no direct browser → MiniMax call. Browser-side code posts to `/api/ai/*` and receives JSON or SSE.
- **Adapter-first AI** — calling code imports from `@/lib/ai` and calls `AIAdapter` methods only. Swapping in another provider means adding an adapter file, not editing call sites.
- **No middleware auth** — page-level `auth()` is the only gate. Any new protected route must repeat the pattern.
- **ActionResponse discipline** — server actions return `{ data, error }`, never throw across the boundary. Callers render `error` inline.
- **Deployable to any Node host** — Railway, Render, VPS. SQLite means one writable volume.

---

## Known limitations and non-goals

- No filesystem scanning for agents/skills/MCPs — tooling catalogue is user-entered.
- No team/multi-user sharing — every entity is single-user-scoped.
- No version history — edits overwrite.
- No offline support.
- No mobile-first treatment — dark desktop is the design target; mobile is tolerated.
- No plaintext/bcrypt migration for existing MiniMax keys stored before the encryption change: affected users re-enter.

---

## Build phases (history and current baseline)

| # | Name | Scope | Estimate |
|---|---|---|---|
| 1 | Scaffold and auth | Next.js setup, dark theme, Prisma + SQLite, NextAuth v5, login and signup pages, per-page auth gate | 4–5h |
| 2 | Data layer | Full Prisma schema, typed server actions for all CRUD, user-scoped queries | 3–4h |
| 3 | MiniMax adapter and AI service | `AIAdapter` interface, `MiniMaxAdapter`, prompt roles, API routes, SSE streaming, per-user key retrieval | 3–5h |
| 4 | Projects UI | Projects list, project inner page, create/edit/delete, manual tooling management | 3–4h |
| 5 | Task creation and requirements chat | Chat interface, adaptive clarifying questions, inline tooling suggestions, finalize flow, task view/edit/delete | 4–6h |
| 6 | Phase generation and management | Phase generation, tooling checklist, new tooling badges, phase view/edit/delete, draft buffer on Task | 3–4h |
| 7 | Ticket generation and management | Ticket generation, prompt copy buttons, new tooling badges, ticket view/edit/delete, draft buffer on Phase | 5–6h |
| 8 | Done system | Cascading done, done sections, reopen flow, visual treatment | 3–4h |
| 9 | Profile + encryption | `/profile`, encrypted API key, `updateProfile` action | 1–2h |
| 10 | Polish | Thinking-emoji indicator, scroll restoration, `BackLink` with `router.back()`, spec Copy/Download, burger menu | 2–3h |