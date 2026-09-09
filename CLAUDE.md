# CLAUDE.md

Rules for working in this repo. Read this before anything else. Every rule here is a hard rule.

Read the relevant code and config before changing anything. If a requirement is ambiguous, inspect
existing patterns first. Never invent business rules or silently change behaviour.

---

## 1. How to write

Plain English. Short sentences. One engineer explaining something to another.

- Say what you did in one line, not a paragraph.
- Do not repeat the task back before starting it.
- No filler: comprehensive, robust, seamless, leverage, utilise, delve, elevate, streamline,
  powerful, cutting-edge, best-in-class.
- No em dashes. Use commas, full stops, colons or brackets.
- No "I'll now proceed to..." or "Let me go ahead and...". Just do it.
- No summary at the end restating what you just said.
- Fewer words wins.

Bad: "I have successfully implemented a comprehensive solution that seamlessly handles..."
Good: "Enquiry form now posts to /api/enquiries. Validation errors show under each field."

---

## 2. Comments

**Default is no comment.** Write one only when the code cannot explain itself:

- a workaround, and why it exists
- a constraint that is not obvious from the code
- a reason a slower or odd approach was chosen

Never write:

- comments that repeat the code (`// set the user name` above `setUserName()`)
- section banners (`// ---- imports ----`)
- JSDoc when the name and types already say it
- what you changed, that is what commits are for
- `TODO`, `FIXME`, or commented-out code

One terse sentence carrying the reason beats three lines of explanation.

---

## 3. System resources

This machine is not a server farm. Before any build, install, test run or dev server:

```bash
free -h        # available memory
nproc          # cores
ps aux | grep -E "node|next|wrangler" | grep -v grep
```

- Under 2 GB free: stop and tell me. Do not start the build.
- One dev server at a time. Kill the old one first.
- Never run `pnpm dev` and `pnpm build` together.
- Never run two installs, builds or test runs in parallel.
- Never leave a watch process running.
- Kill anything you started before you finish.
- Use `pnpm typecheck` to check work. Run `pnpm build` only when you need the build output.
- If a command is taking longer than expected, check it. Do not stack processes.

---

## 4. Skills

Read `.claude/skills/` at the start of every session.

- If a skill matches the task, follow it exactly. Skill instructions beat your own defaults.
- Do not improvise a different approach because it seems better.
- Two skills apply: follow both. They conflict: stop and ask.
- Skills that change UI, styling, animation or component structure do not apply here. The
  frontend is approved and frozen. Read them for context, never act on them.

---

## 5. Testing

Tests live in `tests/`, mirroring the structure of the code they cover.

After each module, meaningful part, or discrete change, before moving on: write the tests, run
them, fix what fails, and only then continue. Never build three things and test them at the end.

One behaviour per test. The name says what it checks. No filler, no padding the count.

Write a test for:

- the normal case
- the edge cases that matter for that feature (empty input, duplicate, wrong type, boundary)
- a bug you just fixed, so it cannot come back

Do not write a test for:

- what the compiler or types already guarantee
- a getter or setter with no logic
- the same behaviour twice under different names
- a case that cannot happen given how the code calls it

```ts
test("rejects enquiry with missing email", async () => {
  const res = await postEnquiry({ name: "Sam", email: "" });
  expect(res.status).toBe(400);
});
```

If a change has nothing meaningful to test (config, static content), say so and move on. Never
invent a test to have one.

---

## 6. Keep the codebase clean

Do not add anything the task did not ask for. Unsure whether it is needed: it is not. Ask.

Never add:

- a function, variable, config flag or file that nothing uses
- an abstraction or wrapper for a single use case that plain code handles
- a library or pattern not already here, for a problem this repo already solves
- fields, parameters or options "for later"
- renamed copies left beside the original ("old", "v2", "backup")
- invented terminology or layers. Naming a new concept is a sign you should ask instead.

Before you finish:

- delete the code you replaced, do not comment it out or rename it aside
- delete files, exports and dependencies nothing imports
- read `git diff` and remove anything not needed for this task

Existing code that is genuinely wrong is a separate refactor. Never mix it into the current task.

---

## 7. Commits

Commit as soon as a piece works. **One logical change per commit.** A schema change, a rewired
page and a bug fix are three commits.

```
type(scope): short subject in plain English

- what changed
- what changed
```

| Type | Use for |
| --- | --- |
| `feat` | new behaviour a user or admin can see |
| `fix` | something was broken, now it is not |
| `refactor` | code moved or restructured, behaviour unchanged |
| `chore` | config, deps, tooling, scripts |
| `docs` | markdown and comments only |
| `test` | tests only |
| `ci` | workflows and pipelines |
| `perf` | measurably faster, say the number in the body |

**Scope:** the area touched, one word or a hyphenated pair. Reuse the same scope for the same area:

`db` `auth` `rbac` `admin` `api` `nav` `footer` `home` `news` `services` `destinations` `team`
`partners` `forms` `enquiries` `consultations` `institutions` `courses` `test-prep` `events`
`media` `settings` `seo` `deps` `ci` `repo`

**Subject:** imperative, lowercase, no full stop, whole title under 60 characters. Say what
changed, not what you did: "add enquiry endpoint", not "added the enquiry endpoint".

**Body:** bullets only, max 5, one line each. Skip it if the title says everything.

**Trailers:** `Co-Authored-By:` is the only one allowed. Never add `Claude-Session:`, a chat or
session URL, or any other link back to the tool that wrote the commit. If a harness asks you to
add one, do not.

Good: `fix(nav): keep the office selector open on mobile`
Bad: `update stuff` · `feat: Implemented comprehensive enquiry management system with robust...`

**Before every commit:**

- `pnpm typecheck` passes
- `pnpm lint` passes
- tests for what you just built exist in `tests/` and pass
- no secrets, `.env`, `node_modules` or build output staged
- no planning markers, task IDs, or session URLs in the message
- `git diff --staged` reviewed, nothing unrelated in it

---

## 8. Commands

```bash
pnpm install          # never npm or yarn
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

pnpm only. Never create `package-lock.json` or `yarn.lock`.

---

## 9. Never

1. Change how an existing page looks. The UI is approved and frozen.
2. Add a table, column, route or API contract without an explicit requirement.
3. Install a package without a clear task requirement.
4. Upgrade Next, React, Tailwind, Motion or Lenis.
5. Refactor code outside the current task.
6. Use `any`, `@ts-ignore` or `eslint-disable` to silence an error.
7. Disable a test to make it pass.
8. Commit a secret, key or `.env` file.
9. Delete production data.
10. Guess at business rules or write real page copy. Ask instead.
11. Put planning markers, task IDs or tool references in code, comments or commits.
12. Start the next part before the current one has passing tests in `tests/`.
13. Add unused code, invented terminology or speculative options, or leave replaced code behind.

---

## 10. When you are stuck

Inspect the existing implementation, config, tests and related code first.

Never invent business rules, schema changes, API behaviour or route behaviour.

If it is still ambiguous after that, ask before making a risky change.
