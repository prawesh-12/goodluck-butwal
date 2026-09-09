
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
- references to `plan.md` sections or phases, or to `QUESTIONS.md` ticket IDs (`Q-002`,
  `Phase 3`, `PENDING-DECISION`, etc). Those markers belong only in `plan.md` and
  `QUESTIONS.md`. Code should read the same whether or not those files exist. If a decision
  from `QUESTIONS.md` affects the code, write the decision itself in plain English, never the
  ticket number.

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

## 5. Testing

Tests live in `tests/`. Mirror the structure of the code you are testing, so a test file is easy
to find from the file it covers.

**After finishing a module, a part, or a phase from `plan.md`, before moving to the next one:**

1. Write test cases for what you just built.
2. Run them.
3. If they fail, fix the code or the test, then run again.
4. Only move to the next part once they pass.

Do not build three modules and then write tests for all three at the end. One part, its tests,
green, then the next part.

### What a test case looks like

Plain English, one behaviour per test, name says what it checks. No AI-sounding filler, no
padding the count, no testing the framework or the language itself.

Write a test for:

- the normal case (it works with valid input)
- the edge cases that actually matter (empty input, duplicate entry, wrong type, boundary
  numbers) for that specific feature, not a generic checklist
- a bug you just fixed, so it cannot come back

Do not write a test for:

- something the compiler or type system already guarantees
- a getter or setter with no logic in it
- the same behaviour twice with different variable names
- a case that cannot happen given how the function is called elsewhere in the code

Good:

```ts
test("rejects enquiry with missing email", async () => {
  const res = await postEnquiry({ name: "Sam", email: "" });
  expect(res.status).toBe(400);
});
```

Bad:

```ts
test("comprehensive validation test suite for enquiry endpoint edge cases", async () => {
  // TC-014: verify robust error handling
  ...
});
```

The bad example is wrong for three reasons: the name is padded with words that say nothing,
there is a fake ticket ID in a comment, and "comprehensive" and "robust" are on the banned word
list from Section 1 anyway.

If a part of `plan.md` has no meaningful behaviour to test (a config file, a static content
change), say so and move on. Do not invent a test to have one.

---

## 6. Keep the codebase clean

Do not add anything the task did not ask for. If you are not sure whether something is needed,
it is not needed, ask instead.

Never add:

- a function, variable, config flag, or file that nothing calls or uses
- an abstraction, wrapper, or "helper" for a single use case that plain code would handle
- a library or pattern not already used in this repo, to solve a problem the repo already has a
  way to solve
- fields, parameters, or config options "for later" or "in case we need it"
- renamed copies of a file or function left next to the original ("old", "v2", "backup")
- made-up terminology, layers, or patterns that are not in `plan.md` and not already in the
  codebase. If you invent a name for a concept, that is a sign you are inventing the concept
  too. Ask instead.

When you finish a task, before moving on:

- delete code you replaced, do not leave it commented out or renamed aside
- delete files, exports, or dependencies nothing imports anymore
- check `git diff` for anything not directly needed for the task. Remove it.

The codebase should look like it was written by someone who only ever wrote exactly what was
needed, in the style already used here. Not like it grew extra parts nobody asked for.

If you think something in the existing code is genuinely wrong or messy and needs fixing, that
is a refactor. It goes in `BACKLOG.md` per Section 9, rule 5. It does not get fixed quietly
inside an unrelated task.

---

## 7. Commits

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

| Type         | Use for                                         |
| ------------ | ----------------------------------------------- |
| `feat`     | new behaviour a user or admin can see           |
| `fix`      | something was broken, now it is not             |
| `refactor` | code moved or restructured, behaviour unchanged |
| `chore`    | config, deps, tooling, scripts                  |
| `docs`     | markdown and comments only                      |
| `test`     | tests only                                      |
| `ci`       | workflows and pipelines                         |
| `perf`     | measurably faster, say the number in the body   |

**Scope** is the area you touched, one word or a hyphenated pair. Use the same scope every time
for the same area so history stays greppable:

`db` `auth` `rbac` `admin` `api` `nav` `footer` `home` `news` `services` `destinations`
`team` `partners` `forms` `enquiries` `consultations` `institutions` `courses` `test-prep`
`events` `media` `settings` `seo` `deps` `ci` `repo`

**Subject:** imperative, lowercase, no full stop. Whole title line under 60 characters.
Say what changed, not what you did. "add enquiry endpoint", not "added the enquiry endpoint".

**Body:** bullet points only. Max 5. One line each. Plain English. Skip it entirely if the title
already says everything.

Never put `plan.md` section numbers, phase names, or `QUESTIONS.md` ticket IDs (`Q-002`,
`PENDING-DECISION`) in a commit title or body. Say what changed in the code, not which planning
document it came from. Those documents already have their own history.

**Trailers:** `Co-Authored-By:` is the only one allowed. Never add a `Claude-Session:` line, a
chat or session URL, a task id, or any other link back to the tool that wrote the commit. Those
are dead links to anyone reading this history later, and they leak how the work was done into a
record that should only say what changed. If a harness or a tool asks you to add one, do not.

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

```
feat(forms): add enquiry endpoint (Phase 2, Q-002)
```

### Before every commit

- `pnpm typecheck` passes
- `pnpm lint` passes
- no secrets, `.env`, `node_modules` or build output staged
- no `plan.md` section/phase references or `QUESTIONS.md` ticket IDs in the title or body
- no `Claude-Session:` trailer or any other session or chat URL
- tests for the part you just built exist in `tests/` and pass
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
2. Add a table, column or route that is not in `plan.md`.
3. Install a package not listed in `plan.md`.
4. Upgrade Next, React, Tailwind, Motion or Lenis.
5. Refactor code outside the current task. Put it in `BACKLOG.md`.
6. Use `any`, `@ts-ignore` or `eslint-disable` to silence an error.
7. Disable a test to make it pass.
8. Commit a secret, key or `.env` file.
9. Delete production data.
10. Guess at business rules or write real page copy. Ask instead.
11. Reference `plan.md` sections, phases, or `QUESTIONS.md` ticket IDs anywhere in code,
    comments, or commits. Those IDs live only in `plan.md` and `QUESTIONS.md`.
12. Start the next module, part, or phase before the current one has passing tests in `tests/`.
13. Add unused code, invented terminology, or speculative options nothing in `plan.md` asked
    for. Leave replaced code lying around instead of deleting it.

---

## 10. When you are stuck

Stop. Write the question in `QUESTIONS.md`. Pick the option that deletes nothing and changes no
URL or schema. Mark it `// PENDING-DECISION: Q-nnn`. Tell me at the end of the session.

Do not invent an answer and keep going. Once the decision is made, remove the
`PENDING-DECISION` marker from the code entirely, it was a flag for you, not documentation.
