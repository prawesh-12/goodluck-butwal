# CLAUDE.md

Rules for working in this repo. Read this before anything else.

`plan.md` is the spec. If something is not in it, ask. Do not decide it yourself.

---

## 1. How to write

Write plain English. Short sentences. Like one engineer explaining something to another.

- Say what you did in one line. Do not write a paragraph.
- Do not repeat the task back to me before starting it.
- No filler words: comprehensive, robust, seamless, leverage, utilise, delve, elevate, streamline, powerful, cutting-edge, best-in-class.
- No em dashes. Use commas, full stops, colons or brackets.
- No "I'll now proceed to..." or "Let me go ahead and...". Just do it.
- No summary at the end restating what you just said.
- If you can say it in fewer words, do that.

Bad: "I have successfully implemented a comprehensive solution that seamlessly handles the enquiry form submission flow with robust error handling."

Good: "Enquiry form now posts to /api/enquiries. Validation errors show under each field."

---

## 2. Comments

**Default is no comment.** Most code does not need one.

Write a comment only when the code cannot explain itself:

- a workaround and why it exists
- a constraint that is not obvious from the code
- a reason a slower or odd approach was chosen

Never write:

- comments that repeat the code (`// set the user name` above `setUserName()`)
- section banners (`// ---- imports ----`, `// === helpers ===`)
- JSDoc on functions whose name and types already say everything
- comments explaining what you changed, that is what commits are for
- `TODO`, `FIXME`, or commented-out code

Keep comments one line, plain English, no fluff.

```ts
// Neon HTTP driver has no pooling, so a long-lived pool would keep compute awake.
export const db = drizzle(neon(process.env.DATABASE_URL!));
```

---

## 3. System resources

The machine is not a server farm. Check before you run anything heavy.

**Before a build, install, test run or dev server:**

```bash
free -h        # available memory
nproc          # cores
ps aux | grep -E "node|next|wrangler" | grep -v grep
```

Rules:

- If free memory is under 2 GB, stop and tell me. Do not start the build.
- One dev server at a time. Kill the old one before starting a new one.
- Never run `pnpm dev` and `pnpm build` at the same time.
- Never leave a watch process running in the background.
- Never run two installs, builds or test runs in parallel.
- Kill anything you started before you finish the task.
- Use `pnpm typecheck` to check your work. Only run a full `pnpm build` when you actually need the build output.

If a command has been running longer than expected, check it before starting another one. Do not stack processes.

---

## 4. Skills

Read `.claude/skills/` at the start of every session.

- If a skill matches the task, follow it exactly.
- Skill instructions beat your own defaults.
- Do not improvise a different approach because it seems better.
- If two skills apply, follow both. If they conflict, stop and ask.
- Skills that change UI, styling, animation or component structure do not apply here. The
  frontend is approved and frozen. Read them for context if you like, never act on them.

---

## 5. Commits

Commit as soon as a piece works. Do not batch a day of work into one commit.

**One logical change per commit.** A schema change, a rewired page and a bug fix are three commits.

### Format

```
type(scope): short subject in plain English

- what changed
- what changed
- what changed
```

**Types:**

| Type | Use for |
|---|---|
| `feat` | new behaviour a user or admin can see |
| `fix` | something was broken, now it is not |
| `refactor` | code moved or restructured, behaviour unchanged |
| `chore` | config, deps, tooling, scripts |
| `docs` | markdown and comments only |
| `test` | tests only |
| `ci` | workflows and pipelines |
| `perf` | measurably faster, say the number in the body |

**Scope** is the area you touched, one word or a hyphenated pair. Use the same scope every time
for the same area so history stays greppable:

`db` `auth` `rbac` `admin` `api` `nav` `footer` `home` `news` `services` `destinations`
`team` `partners` `forms` `enquiries` `consultations` `institutions` `courses` `test-prep`
`events` `media` `settings` `seo` `deps` `ci` `repo`

**Subject:** imperative, lowercase, no full stop. Whole title line under 60 characters.
Say what changed, not what you did. "add enquiry endpoint", not "added the enquiry endpoint".

**Body:** bullet points only. Max 5. One line each. Plain English. Skip it entirely if the title
already says everything.

### Good

```
feat(forms): add enquiry endpoint

- POST /api/enquiries stores the row and returns a reference code
- Turnstile token verified before any database write
- staff and visitor emails sent after the write
```

```
refactor(team): read team data from the database

- team_members seeded with 22 rows
- team-grid and the about page read from the database
- content/team.ts deleted
```

```
fix(nav): keep the office selector open on mobile
```

```
chore(deps): move from npm to pnpm

- pnpm-lock.yaml generated with pnpm import, versions unchanged
- package-lock.json removed
- packageManager pinned in package.json
```

### Bad

```
feat: Implemented comprehensive enquiry management system with robust
validation, seamless error handling, and complete email integration

This commit introduces a full-featured solution that...
```

```
update stuff
fix various issues
WIP
```

### Before every commit

- `pnpm typecheck` passes
- `pnpm lint` passes
- no secrets, `.env`, `node_modules` or build output staged
- `git diff --staged` reviewed, nothing unrelated in it

---

## 6. Commands

```bash
pnpm install          # never npm or yarn
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm bundle:check     # Worker bundle must stay under 2.50 MB
```

pnpm only. Never create `package-lock.json` or `yarn.lock`.

---

## 7. Never

1. Change how an existing page looks. The UI is approved and frozen.
2. Add a table, column or route that is not in `plan.md`.
3. Install a package not listed in `plan.md`.
4. Upgrade Next, React, Tailwind, Motion or Lenis.
5. Refactor code outside the current task. Put it in `BACKLOG.md`.
6. Use `any`, `@ts-ignore` or `eslint-disable` to silence an error.
7. Disable a test to make it pass.
8. Commit a secret, key or `.env` file.
9. Delete production data.
10. Guess at business rules or write real page copy. Ask instead.

---

## 8. When you are stuck

Stop. Write the question in `QUESTIONS.md`. Pick the option that deletes nothing and changes no
URL or schema. Mark it `// PENDING-DECISION: Q-nnn`. Tell me at the end of the session.

Do not invent an answer and keep going.