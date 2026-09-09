# Technical handover

What this site is, where it runs, and what to do when something breaks.

## What it is

One Next.js application. Despite the folder being called `main/`, it holds the whole thing: the
public site, the admin panel, the API routes and the database schema. There is no separate
backend service and nothing else to deploy.

```
goodluck/                     git repository root
├── .github/workflows/        CI, deploy and backups. GitHub only reads these from the root.
├── DECISIONS.md              binding answers from the client
├── PROGRESS.md               an append-only build log
├── QUESTIONS.md              open questions, each with the fallback currently in use
└── main/                     the application
    ├── db/                   schema, migrations, seeds
    ├── docs/                 this file and its neighbours
    ├── public/               about 180 static assets, served from the CDN, not by the app
    ├── src/app/              routes: public pages, /admin, /api
    ├── src/components/       UI. The public components are approved and frozen.
    ├── src/lib/              auth, permissions, sanitising, dates, email, uploads
    └── src/server/           queries and server actions. Server only, never imported by a page.
```

## The stack, and why each piece

| Layer | Choice | Why |
|---|---|---|
| Hosting | Vercel | Runs a Next app as it is built, with no adapter in between |
| Database | Neon Postgres over the HTTP driver | No connection pool, so the compute suspends when idle and the free budget lasts |
| ORM | Drizzle | The schema is TypeScript, and migrations are generated from it |
| Auth | Better Auth, email and password only | No social providers were asked for |
| Uploads | Cloudinary over `fetch` | Its SDK is large and a signed request costs nothing |
| Email | Resend over `fetch` | Same reason |
| Bots | Cloudflare Turnstile | Free, and hosting has no bearing on it |
| Errors | Sentry | Free tier |

**No SDK packages for Cloudinary, Resend or AWS.** Each is a signed `fetch` call instead. The
site was first built for a host with a hard 3 MB bundle cap, and those three packages alone would
have spent most of it. The cap is gone with the move to Vercel, the `fetch` calls are staying:
they work, and they are less code than the SDKs.

## Bundle size

There is no hard cap any more, but two fixes made for the old one are worth keeping. Both times
the cause was the same shape of mistake: a heavy library imported by many route files, which the
bundler then copies into each one.

- Reading the session used to import the whole auth server. Fifty-one route files did that.
  `src/lib/session.ts` now reads the session straight from the database instead, and only the
  auth route and user creation build the full server.
- The database client had the same problem. `serverExternalPackages` in `next.config.ts` now
  keeps `drizzle-orm`, `@neondatabase/serverless`, `sanitize-html` and `nanoid` out of the
  per-route chunks.

**If a build ever gets heavy, look for a library imported from many routes before you look
anywhere else.** Several route chunks of nearly identical size is the tell.

## Environment variables

Names and where each one lives are in `main/.env.example`. In short:

- **Everything** is an environment variable on the Vercel project, public and secret alike.
- Never in a file, never in git.
- Locally they all come from `main/.env.local`, which git ignores.

Anything an administrator might want to change is in the `settings` table, not here: notification
addresses, social links and analytics ids.

**`NEXT_PUBLIC_SENTRY_DSN`** is on the Sentry project under Settings, Client Keys. A DSN is
write-only and meant to be public, which is why it carries the public prefix: the two error screens
run in the browser and cannot read any other name. Do not run Sentry's setup wizard. It installs
the SDK, which costs 0.62 MB compressed and breaks the size cap. `src/lib/sentry.ts` posts the same
envelope over `fetch`.

**There is no Google Maps key.** A map is whatever an admin pasted into the office or event, taken
from Share, then Embed a map, in Google Maps. The Maps Embed API is free but Google will not issue
a key without a card on file, and the client's plans are free ones. The Get directions links are
ordinary Google Maps addresses and never needed a key either.

## Running it locally

```bash
cd main
pnpm install
docker compose up -d          # Postgres, plus a proxy that speaks Neon's protocol
cp .env.example .env.local    # then fill it in
pnpm db:seed:dev              # content, plus placeholder catalogue rows
pnpm dev
```

The proxy matters. The app only speaks Neon's HTTP protocol, so a plain local Postgres is
unreachable without it. With it, development and production run the same driver and the same
client code, which means a query that works locally works deployed.

`drizzle-kit migrate` is the one tool that cannot use the proxy, because it wants a WebSocket.
Apply migrations locally with `psql` instead:

```bash
docker compose exec -T postgres psql -U postgres -d goodluck -v ON_ERROR_STOP=1 < db/migrations/0000_init.sql
```

Production migrations run through `drizzle-kit migrate` in the deploy workflow, which is the path
that matters.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm typecheck` | Types only. Use this rather than a build while you work. |
| `pnpm lint` | ESLint. Runs with a raised heap; the codebase outgrew Node's default. |
| `pnpm test` | Vitest. The database tests stand aside when `DATABASE_URL` is unset. |
| `pnpm build` | The Next build, the same one Vercel runs |
| `pnpm db:seed` | Real content only |
| `pnpm db:seed:dev` | Adds placeholder catalogue rows, marked `[PLACEHOLDER]`, as drafts |

pnpm only. Never `npm` or `yarn`, and never commit a second lockfile.

## Deploying

Push to `main`. Vercel builds and releases it from the push, and
`.github/workflows/migrate.yml` runs the migrations from the same push. The two run alongside
each other, so a migration that has to land before the code that needs it should go out on its
own push first.

The build needs a `DATABASE_URL` even though it never queries: Better Auth constructs its adapter
when the module loads, and Next loads every route module during a build. CI passes a placeholder,
Vercel passes the real one.

The scheduled publish runs from `vercel.json`, a cron every 15 minutes against
`/api/cron/publish-scheduled`. Vercel sends `CRON_SECRET` as a bearer token and the route refuses
anything else.

## Permissions

One matrix, held as data in `src/lib/rbac.ts`. Nothing else in the app decides who may do what.

- `can(user, entity, action)` answers the question.
- `requirePermission` throws, for server actions.
- `allow` and `allowOwn` in `src/lib/guard.ts` answer a real 403, for pages.
- `scopedWhere(table, user)` pins a query to the user's office. **Never compare `office_id`
  anywhere else.**
- Ownership is always re-checked on the row that came back from the database, never on the id
  that came from the form. Someone can post an id belonging to another office.

## Sessions

`src/lib/session.ts` reads the session cookie, takes the token before the dot, and looks it up in
the `sessions` table joined to `users`. It does not verify the cookie signature, and that is
deliberate: the token is a random secret, so a forged cookie matches no row. The same query
enforces expiry and `is_active`, which is why a deactivated account is turned away immediately
rather than at its next sign-in.

## Backups and recovery

See `recovery.md`. Read it before you need it.

## The free-tier limits, and what each would cost to pass

| Service | Free limit | What happens at the limit |
|---|---|---|
| Vercel | Hobby is free but forbids commercial use. Pro is $20 per user per month. | See the note below. |
| Neon | 100 CU-hours/month, 0.5 GB | The compute stops. This is why the driver has no pool: an idle site must suspend. |
| Cloudinary | 25 credits/month | Uploads fail. Existing images keep serving. |
| Resend | 3,000 emails/month, 100/day | Sends fail. A failure is logged and never fails the visitor's request. |
| Sentry | 5,000 errors/month | Errors stop being recorded. |
| R2 | 10 GB | Backups fail, and the weekly check opens an issue. |

The client asked for free plans throughout. Everything above still is, with one exception:
Vercel's free Hobby plan does not permit commercial use, and this is a commercial site. Moving to
Vercel means Pro, at $20 per user per month. That was a deliberate choice, not an oversight.

Nothing else here upgrades itself, and nothing will start charging without someone choosing to.
