# skill.md

Project knowledge for the Goodluck website: what it is, how the parts connect, and where the code
for each part lives.

`CLAUDE.md` in this same folder is a different document. It sets the rules for *how* to work here.
This one explains *what* you are working on. Neither repeats the other.

Written for two readers at once. Every idea is explained in plain English first, then followed by
the exact paths in the repository. If you are not a programmer, read the prose and skip the paths.
If you are an agent, the paths are the point.

All paths below are relative to `main/` unless they start with a slash or say otherwise.

---

## 1. What this project is

Goodluck Education & Migration is an education and migration consultancy. It helps people study
abroad: choosing a country and a course, applying to a university or college, preparing visa
paperwork, and coaching for the IELTS and PTE English tests.

There are three offices:

| Office | City | Role |
| --- | --- | --- |
| Australia | Melbourne | Head office |
| Nepal | Butwal | Second main office |
| Philippines | Cebu | Smaller office |

The company details, including these three, are in `src/config/site.ts`.

This repository holds **one application** that does two jobs.

**The public website** is what a prospective student sees. It explains the services, the study
destinations, the partner institutions and courses, the test preparation classes, and the team.
It carries news articles, events, and success stories from past clients. Four forms on it turn a
visitor into a lead: a general enquiry, a consultation booking, an event registration, and a
test preparation registration.

**The admin panel** at `/admin` is what staff use. It is a CMS, which means a content management
system: a set of screens that let staff change wording, photos, prices, opening hours and page
content without a developer touching the code. Staff also read and manage the enquiries and
bookings that come in through the public forms.

Nobody signs up on the public site. There are no student accounts. The only people who log in are
Goodluck staff, into the admin panel.

---

## 2. How the whole system fits together

```text
Visitor
   ↓
Website (the pages they see in a browser)
   ↓
Next.js (the framework that builds and serves those pages)
   ↓
Feature queries and application logic
   ↓
Neon PostgreSQL (the database)
```

**Next.js** is the web framework. It runs on a server, builds the HTML for a page, and sends that
HTML to the browser. It is also what routes a URL like `/services` to the file that renders it.

**PostgreSQL** is the database: tables of rows, like a very strict set of spreadsheets that can
reference each other. **Neon** is a hosting company that runs PostgreSQL for us.

Three outside services sit alongside the application:

```text
                      ┌── Cloudinary → image hosting and resizing
                      │
Website/Application ──┼── Resend → transactional email
                      │
                      └── Neon → the application database
```

**Cloudinary** stores images that staff upload and delivers them resized and re-encoded for each
place they appear. Uploading a 4 MB photo does not mean visitors download 4 MB.
Code: `src/lib/integrations/cloudinary.ts`, `src/lib/utils/media-url.ts`.

**Resend** sends email. "Transactional" means email triggered by something a person just did, like
a booking confirmation, as opposed to marketing mail.
Code: `src/lib/email/`.

**Neon** is the database. The application talks to it over the Neon HTTP driver, which sends one
HTTP request per query and holds no persistent connection. That matters because it lets Neon's
compute go to sleep when the site is quiet.
Code: `src/db/client.ts`.

Two smaller services:

**Cloudflare Turnstile** is a bot check on the public forms. It replaces a CAPTCHA and usually
shows the visitor nothing. Code: `src/lib/security/turnstile.ts`.

**Google Tag Manager** carries the analytics tag. The container id is set in the admin, not in the
code. Code: `src/components/shared/analytics.tsx`, `src/lib/integrations/analytics.ts`.

---

## 3. Repository map

At the top of the repository:

```text
goodluck/
├── CLAUDE.md            working rules for agents
├── skill.md             this file
├── .claude/             skills and agent configuration
├── .github/workflows/   CI, database migrations, backups
├── designs/             design references
├── extras/              briefs, source assets, notes. Not part of the build.
└── main/                the application. Everything that ships is here.
```

Inside `main/`:

```text
main/
├── db/migrations/   generated SQL that changes the database structure
├── db/seed/         scripts that fill an empty database with starting content
├── docs/            handover notes for staff and for whoever runs the site
├── public/          static files served as-is (about 30 MB of images, video, fonts, icons)
├── src/app/         every URL the site answers
├── src/assets/      files imported by code rather than served directly (the Inter Display fonts)
├── src/components/  UI shared across features
├── src/config/      constants: company details, asset paths, labels, admin menu
├── src/db/          database schema and client
├── src/features/    one folder per business area
├── src/lib/         cross-cutting code: auth, email, security, SEO, utilities, integrations
├── src/styles/      global CSS and font declarations
└── tests/           the test suite, mirroring the structure of src
```

### `src/app/`

Every URL. A folder becomes a URL segment, and a `page.tsx` inside it renders that URL.

- `src/app/(site)/` is the public website. `(site)` in brackets is a route group: it organises
  files without appearing in the URL, so `(site)/services/page.tsx` serves `/services`.
- `src/app/admin/` is the CMS.
- `src/app/api/` holds endpoints that return data rather than a page. This is where the public
  forms post to.

**Look here** to find which file answers a URL, or to change what a page renders.
**Do not** put database queries or business rules here. A page file should read like a list of
what it fetches and what it renders. The fetching itself belongs in a feature.

### `src/features/`

The bulk of the application, one folder per business area: `services`, `destinations`,
`institutions`, `courses`, `test-prep`, `posts` (news), `events`, `testimonials`, `team`,
`partners`, `offices`, `pages`, `leads` (enquiries and consultations), `media`, `settings`,
`site-text`, `search`, `users`.

Inside a feature, the same file names recur and each means the same thing:

| File | What it holds |
| --- | --- |
| `queries.ts` | reads for the public site. Published rows only. |
| `admin-queries.ts` | reads for the admin, including drafts, with filters and paging |
| `actions.ts` | writes. Server actions the admin forms submit to. |
| `validators.ts` | the rules a submitted form must satisfy, as Zod schemas |
| `components/` | React components for that feature, public and admin |

**Look here** for anything about one business area.
**Do not** import one feature's `actions.ts` from another feature. Sharing goes through `queries`
or through `src/lib/`.

### `src/components/`

UI with no business area of its own.

- `components/ui/` are the primitives: buttons, dropdown, animation wrapper, marquee.
- `components/shared/` are larger public pieces: hero, FAQ accordion, pagination, Turnstile widget.
- `components/layout/` are the frames: public nav and footer, admin sidebar and topbar.
- The `admin/` subfolders inside `ui/` and `shared/` are the admin-only versions.

**Look here** to change something that appears on many pages.
**Do not** put anything that knows about services, courses or enquiries in here. If a component
needs a business rule, the rule belongs in the feature and the component takes it as a prop.

### `src/lib/`

Code used across features.

| Folder | What it does |
| --- | --- |
| `lib/auth/` | login, sessions, the permission matrix |
| `lib/email/` | sending, templates, who each message goes to |
| `lib/security/` | bot check, rate limiting, HTML sanitising, audit log |
| `lib/seo/` | page metadata, structured data, redirects |
| `lib/utils/` | dates, slugs, CSV, media URLs, request helpers |
| `lib/integrations/` | Cloudinary, analytics |
| `lib/validators/` | validation pieces shared by several features |

### `src/db/`

`src/db/schema/` describes every table in TypeScript. `src/db/client.ts` opens the connection.
`src/db/settings.ts` and `src/db/ui-strings.ts` read the two key/value tables.

The SQL migrations and the seed scripts are one level up, in `main/db/`, because they are build
tooling rather than application code.

### `src/config/`

Values with no database row behind them: the company name and addresses (`site.ts`), paths to
static images (`assets.ts`), display labels for enum values (`content-meta.ts`, `course-meta.ts`),
and the admin menu (`admin-nav.ts`).

### `main/docs/`

Handover documents: `admin-guide.md` for staff, `qa-matrix.md`, `recovery.md`, and
`technical-handover.md`. Useful background, but `technical-handover.md` predates some changes: it
describes a `src/server/` folder and a Sentry integration, neither of which exists any more. Trust
the code over that file.

---

## 4. Public website

Every public page lives under `src/app/(site)/`. Almost every one of them also loads the site text
table, so a heading or button label can be reworded in the admin without a deploy
(`src/features/site-text/queries.ts`).

**Homepage**: the shop window. Hero, partner logos, destinations, services, reviews, success
stories, the offices orbit, news, upcoming events, FAQs.
Route: `src/app/(site)/page.tsx`
Feature code: pulls from a dozen features at once
Data: Neon, in one batch of parallel queries

**About**: the company, its mission and values, its founders, its social responsibility work,
and careers.
Routes: `src/app/(site)/about/page.tsx`, `about/message-from-co-founders/`,
`about/corporate-social-responsibility/`, `about/careers/`, `about/company-profile/`
Feature: `src/features/pages/` (`getAboutContent`)
Data: the `pages` table, which stores this content as editable JSON blocks

**Offices**: addresses, phones, opening hours, maps, and a page per office.
Routes: `src/app/(site)/about/offices/page.tsx`, `src/app/(site)/offices/[slug]/page.tsx`
Feature: `src/features/offices/`
Data: the `offices` table

**Team**: staff grid filtered by office, and a page per person.
Routes: `src/app/(site)/about/team/page.tsx`, `src/app/(site)/team/[slug]/page.tsx`
Feature: `src/features/team/`
Data: the `team_members` table

**Destinations (study abroad)**: one page per country: why study there, costs, visa notes, FAQs.
Routes: `src/app/(site)/study-abroad/page.tsx`, `study-abroad/[destination]/page.tsx`
Feature: `src/features/destinations/`
Data: `destinations` and `destination_faqs`

**Services**: what Goodluck does: education counselling, visa guidance, scholarships, test prep.
Each service has an intro, steps, facts, a document list and FAQs.
Routes: `src/app/(site)/services/page.tsx`, `services/[slug]/page.tsx`
Feature: `src/features/services/`
Data: `services` and `service_faqs`, plus a few labels held in `ui_strings`

**Institutions and courses**: partner universities and colleges, and their courses with filters
for level, destination and field.
Routes: `src/app/(site)/institutions/`, `src/app/(site)/courses/`
Features: `src/features/institutions/`, `src/features/courses/`
Data: `institutions`, `institution_images`, `courses`, `course_categories`

**Test preparation**: IELTS and PTE courses, and the class batches people can register for.
Routes: `src/app/(site)/test-preparation/page.tsx`, `test-preparation/[slug]/page.tsx`,
`test-preparation/batches/page.tsx`
Feature: `src/features/test-prep/`
Data: `test_prep_courses`, `test_prep_batches`, `test_prep_registrations`

**News**: articles, with category and tag listings.
Routes: `src/app/(site)/news/`, `news/[slug]/`, `news/category/[slug]/`, `news/tag/[slug]/`
Feature: `src/features/posts/`
Data: `posts`, `post_categories`, `tags`, `post_tags`

**Events**: seminars, fairs, webinars and workshops, with registration and seat limits.
Routes: `src/app/(site)/events/page.tsx`, `events/[slug]/page.tsx`
Feature: `src/features/events/`
Data: `events`, `event_registrations`

**Success stories and testimonials**: client quotes and outcomes, on the homepage and their own
page.
Route: `src/app/(site)/success-stories/page.tsx`
Feature: `src/features/testimonials/`
Data: the `testimonials` table

**Contact**: office cards, the general enquiry form, and FAQs.
Route: `src/app/(site)/contact/page.tsx`
Feature: `src/features/leads/` for the form, `src/features/offices/` for the cards

**Consultation booking**: pick an office, a service, a date and a time.
Route: `src/app/(site)/contact/book-consultation/page.tsx`
Feature: `src/features/leads/`
Data: writes to `consultations`

**Search**: one search box across courses, institutions, news, destinations, services and events.
Route: `src/app/(site)/search/page.tsx`
Feature: `src/features/search/`

**FAQ, legal pages, 404**: `src/app/(site)/faq/page.tsx`, `legal/[slug]/page.tsx`,
`not-found.tsx`. The catch-all at `[...slug]/page.tsx` exists so an unmatched URL renders the
styled 404 with the site's nav and footer.

**Preview**: `src/app/(site)/preview/` renders a draft that is not published yet, for an admin
checking their work. These routes are always rendered fresh and are marked no-index.

---

## 5. Admin / CMS

Sign in at `/admin/login` with an email and a password of at least twelve characters. Five wrong
attempts in fifteen minutes and it stops accepting tries for a while.

The menu is defined in `src/config/admin-nav.ts` and each row appears only if your role is allowed
to read that kind of record.

| Section | What you manage | Screens |
| --- | --- | --- |
| Enquiries | enquiries and consultation requests, their status, CSV export | `admin/enquiries`, `admin/consultations` |
| Editorial | news posts, categories, tags, events and their registrations, testimonials | `admin/posts`, `admin/events`, `admin/testimonials` |
| Study | destinations, institutions, courses, course categories, IELTS/PTE courses and batches | `admin/destinations`, `admin/institutions`, `admin/courses`, `admin/test-prep` |
| Site | About-style pages, services, offices, team, partners, site text, media library | `admin/pages`, `admin/services`, `admin/offices`, `admin/team`, `admin/partners`, `admin/site-text`, `admin/media` |
| Admin | settings, users, audit log, help | `admin/settings`, `admin/users`, `admin/audit-log`, `admin/help` |

Homepage content is not one screen. It is assembled from the features it shows: change a service
in Services, a partner logo in Partners, a story in Testimonials, the hero image and Google rating
in Settings, and the headings in Site text.

### What happens when you save

```text
Administrator edits a record and clicks save
        ↓
Admin screen posts to a server action
        ↓
The action checks the session, checks permissions, validates the fields, cleans any HTML
        ↓
Row is written to Neon and an audit entry is recorded
        ↓
revalidatePath() marks the affected public pages stale
        ↓
The next visitor to those pages gets the new version
```

The server actions are the `actions.ts` file in each feature, for example
`src/features/services/actions.ts`. Every one of them follows the same order: `requireActor()`
from `src/lib/auth/session.ts`, then `requirePermission()` from `src/lib/auth/rbac.ts`, then the
Zod schema from that feature's `validators.ts`, then `sanitize()` from
`src/lib/security/sanitize.ts` for any rich text, then the write, then `writeAudit()` from
`src/lib/security/audit.ts`, then `revalidatePath()`.

Content can also be scheduled. Setting a status of "scheduled" with a future date leaves the row
invisible until a cron job publishes it. That job runs every 15 minutes
(`vercel.json` → `src/app/api/cron/publish-scheduled/route.ts`) and revalidates the pages the newly
published rows appear on.

---

## 6. Understanding CMS data

Two kinds of content sit on this site, and the difference is why some things are editable in the
admin and others are not.

**CMS-managed content** lives in the database. Staff change it and the site follows.

Examples: office phone numbers and opening hours, staff bios and photos, service descriptions and
their step lists, destination pages, courses and institutions, news articles, events, testimonials,
the hero image, the Google rating, footer links, and almost every visible heading and button label.

**Application content** lives in the code and needs a developer and a deploy to change.

Examples:

- Company constants: the legal name, founding year, main email, canonical domain, and the
  fallback office list. `src/config/site.ts`
- Static artwork: the sky and meadow behind the hero, background textures, icons, arrows, flags.
  `src/config/assets.ts`, files in `public/images/`
- Enum labels: how the value `education_fair` is displayed as "Education fair".
  `src/config/content-meta.ts`, `src/config/course-meta.ts`
- Page structure: which sections appear on the homepage and in what order. `src/app/(site)/page.tsx`
- The set of site text keys. An admin edits the value behind a key; adding a new key is a code
  change, because something has to read it.

The dividing line is this: **anything a client would reasonably want to change on a Tuesday
afternoon is in the database. Anything that changes the shape of a page is in the code.**

One case sits deliberately between the two. Every call to `t("home.hero.cta", "Book a
consultation")` carries its own English fallback. The database only needs a row when someone wants
to override the wording, and clearing that row falls back to the code rather than showing a blank.
See `src/features/site-text/queries.ts`.

The office list is the other in-between case. The `offices` table drives the contact cards,
office pages, form routing and email routing. The array in `src/config/site.ts` is what seeded that
table and is still read directly by `/about` and by the team grid's office tabs.

---

## 7. Database explained simply

The database stores the information the CMS manages. It is PostgreSQL, hosted by Neon.

The structure is declared in TypeScript rather than SQL, in `src/db/schema/`. Each file groups
related tables:

| File | Tables |
| --- | --- |
| `core.ts` | `users`, `sessions`, `accounts`, `verifications`, `offices`, `media_assets` |
| `people.ts` | `team_members`, `partners` |
| `content.ts` | `pages`, `ui_strings` |
| `destinations.ts` | `destinations`, `destination_faqs`, `services`, `service_faqs` |
| `institutions.ts` | `institutions`, `institution_images`, `courses`, `course_categories` |
| `test-prep.ts` | `test_prep_courses`, `test_prep_batches`, `test_prep_registrations` |
| `editorial.ts` | `posts`, `post_categories`, `tags`, `post_tags`, `events`, `event_registrations`, `testimonials` |
| `leads.ts` | `enquiries`, `consultations` |
| `system.ts` | `settings`, `redirects`, `audit_log` |
| `enums.ts` | the fixed value lists: statuses, roles, categories, levels |

Most content tables share three sets of columns, defined once in `core.ts` and spread into each
table: `base` (id, created and updated timestamps, who created and updated it), `publishing`
(status, published date, sort order) and `seo` (title, description, social image, no-index flag,
canonical URL).

Some relationships worth picturing:

```text
Office
  ├── team members
  ├── media assets
  ├── events
  └── enquiries and consultations routed to it

Service                    Destination                Institution
  └── service FAQs           └── destination FAQs       ├── gallery images
                                                        └── courses

Post ── category            IELTS/PTE course           Event
  └── tags (many to many)     └── batches                └── registrations
                                    └── registrations
```

Two tables are simple key/value stores rather than content:

- `settings` holds one row per setting: the hero image id, the Google rating, the analytics
  container id, the notification email for each office. Read through `src/db/settings.ts`.
- `ui_strings` holds one row per piece of interface text. Developers add keys, admins edit values.
  Read through `src/db/ui-strings.ts`.

**Client**: `src/db/client.ts` creates the Drizzle client over the Neon HTTP driver. Every query
in the app goes through the `db` export from this file.

**Migrations**: a migration is a versioned change to the database structure, checked into the
repository so every copy of the database can be brought to the same shape. They are generated from
the schema by Drizzle Kit and live in `db/migrations/`. Configuration: `drizzle.config.ts`.

**Seeds**: scripts that fill an empty database with the starting content: offices, services,
destinations, site text, the media rows for everything in `public/`. In `db/seed/`, entry point
`db/seed/from-content.ts`, run with `pnpm db:seed:dev` locally or `pnpm db:seed:prod` against
production. Every step matches on a natural key and upserts, so running the seed twice changes
nothing.

**Local database**: `docker-compose.yml` runs PostgreSQL plus a small proxy that speaks Neon's
HTTP protocol in front of it, on port 4444. This exists so local development and production run
the same driver and the same client code with no branching.

**Production database**: Neon itself. `src/db/client.ts` applies the proxy settings only when
`DATABASE_URL` points at `localtest.me`.

---

## 8. How a page gets its data

```text
Page (a server component)
  ↓
Feature query
  ↓
Neon
  ↓
Rows returned and mapped into the shape the components want
  ↓
Server component renders
  ↓
HTML
  ↓
Visitor
```

A **server component** is a React component that runs on the server only. It can read the database
directly, and its code is never sent to the browser. Most pages here are server components. The
handful that need to react to clicks or typing are marked `"use client"` and are sent to the
browser: forms, the FAQ accordion, the office context, the animation wrappers.

### Example: the homepage

`src/app/(site)/page.tsx` starts fourteen queries at once inside a single `Promise.all`, because
none of them depends on another. Each is a feature query, for example `listServices()` from
`src/features/services/queries.ts` and `listReviews()` from
`src/features/testimonials/queries.ts`. Each returns rows already shaped for the components. The
page then passes those objects straight into `<Hero>`, `<Services>`, `<Reviews>` and the rest.

### Example: a service page

`src/app/(site)/services/[slug]/page.tsx` serves `/services/visa-guidance` and every other
service. `generateStaticParams` lists the published slugs at build time so each one gets a
prebuilt page. The page then calls into `src/features/services/queries.ts` for that service's row,
its FAQs and its artwork, joining `media_assets` to turn an image id into a URL.

Note the join. Content tables never store an image URL. They store an id pointing at
`media_assets`, and the query turns that into a URL through `mediaUrl()`.

---

## 9. Caching and performance

The site does not query the database for every visitor. It cannot afford to: the database bills by
compute time, most visitors see exactly the same page as the previous one, and a page built once
and reused is far faster than one built on demand.

**ISR**, Incremental Static Regeneration, is the Next.js mechanism that makes this work. The
page is generated once, kept, and served from that copy. After a set time it is regenerated in the
background. Visitors always get the stored copy immediately; nobody waits for a rebuild.

```text
Visitor
   ↓
Stored page
   ↓
No database request
```

```text
The stored copy has gone stale, or an admin saved a change
        ↓
Next.js regenerates it in the background
        ↓
Neon is queried
        ↓
New page
        ↓
Stored, and served from then on
```

**Current behaviour.** `src/app/(site)/layout.tsx` sets `export const revalidate = 300`, which
applies to every public page under it: five minutes. Four pages under `src/app/(site)/` restate the same 300
explicitly: `events/page.tsx`, `events/[slug]/page.tsx`, `about/offices/page.tsx` and
`offices/[slug]/page.tsx`.

Nine dynamic routes prebuild their pages with `generateStaticParams`: services, destinations,
news, news categories, events, offices, team, test preparation and legal pages.

The homepage is regenerated when its stored copy is more than five minutes old and someone asks
for it, or immediately after an admin save that calls `revalidatePath("/")`.

**What an admin change does.** A server action calls `revalidatePath()` with the paths its record
appears on, so the change does not wait out the five minutes. The scheduled-publish cron does the
same for everything it publishes (`src/app/api/cron/publish-scheduled/route.ts`).

**What is never cached.** The whole admin panel is marked `force-dynamic`, because a CMS showing a
five-minute-old list would be wrong. So are the form endpoints, the preview routes, the CSV
exports and the health check.

**React `cache()`** appears throughout the feature queries. It memoises a function **for the
duration of one render**. The homepage and the layout both call `listOffices()`; `cache()` is why
that is one query rather than two. It is not a persistent cache. It does not survive the request,
it saves nothing between visitors, and it is not what keeps the database quiet. ISR is.

**Why keeping the public site cacheable matters.** Reading a cookie or a header on the server
turns a page dynamic, and a dynamic page queries the database on every single request. This is
exactly why the office selection is resolved in the browser rather than from a cookie on the
server. See `src/features/offices/components/office.tsx`.

---

## 10. Performance decisions already made

Each of these is in the code now.

**Images are resized before delivery.** Every Cloudinary URL carries `f_auto,q_auto,w_<width>`:
pick the best format the browser supports, pick a sensible quality, and resize to the width this
particular slot needs. A thumbnail asks for 96 or 240 pixels wide, a card for 640 or 960, the hero
for 1920.
`src/lib/utils/media-url.ts`, `src/lib/integrations/cloudinary.ts`

**Images below the fold are lazy-loaded**, so a visitor who never scrolls never downloads them.
The hero images are the opposite: marked `fetchPriority="high"` so they start immediately.
31 component files use `loading="lazy"`, including `src/components/shared/hero.tsx`

**The desktop-only meadow is never downloaded on mobile.** The hero uses a `<picture>` element
with a `min-width: 1200px` source, so a phone fetches a 1×1 placeholder instead of a large image
it would not show.
`src/components/shared/hero.tsx`

**Pages fetch columns, not rows.** The homepage news cards select the title, date, category,
excerpt and banner. They never select `body_html`, which is the largest column in the table.
`src/features/posts/queries.ts`

**Independent queries run together.** The homepage awaits one `Promise.all` of fourteen queries
rather than fourteen sequential awaits. Over an HTTP database driver, that is the difference
between one round trip's latency and fourteen.
`src/app/(site)/page.tsx`

**Search is one round trip.** Six searches across six tables are combined with `UNION ALL` in a
single statement.
`src/features/search/queries.ts`

**Only the font weights actually used are loaded.** Two weights of Inter Display, self-hosted
because it is not on Google Fonts, and one weight of Bricolage Grotesque.
`src/styles/fonts.ts`

**Heavy server-only packages are not bundled per route.** Drizzle, the Neon driver, sanitize-html,
nanoid and zod are listed in `serverExternalPackages`, so each route chunk does not get its own
copy.
`next.config.ts`

**Redirects do not put a query in front of the site.** Middleware runs on every request, so the
redirect table is loaded once and held in memory for five minutes, with one refresh in flight at a
time and the previous map kept if a refresh fails.
`src/lib/seo/redirects.ts`

**Static assets are served with a one-year immutable cache header** under `/images` and `/brand`.
`next.config.ts`

---

## 11. Email system

Resend is the service that delivers the site's email. The application posts a JSON message to
Resend's API and Resend does the rest.

```text
Visitor submits a form
      ↓
Validate the submission (schema, bot check, rate limit)
      ↓
Save the row to Neon
      ↓
Send the emails through Resend
```

**The order matters, and it is the most important rule in this system: the row is saved before any
email is attempted, and a failed send never fails the request.** A lead that reached the database
is a lead the staff can still work, even if the mail provider is having a bad day. This is what
`sendEmailQuietly()` enforces: it catches every failure, logs the subject and the reason, and
returns `false`. `sendEmail()`, which throws, is used only where the caller genuinely needs to
know, such as the admin password reset.

The failure log deliberately records the subject line and the reason only, never the message body,
because the body carries what the enquirer wrote about their own situation.

### The four flows

| Flow | Endpoint | Who gets email |
| --- | --- | --- |
| General enquiry | `src/app/api/enquiries/route.ts` | office staff, and an acknowledgement to the enquirer |
| Consultation booking | `src/app/api/consultations/route.ts` | office staff, and a confirmation to the visitor |
| Event registration | `src/app/api/events/[id]/register/route.ts` | the registrant, and a notice to staff |
| IELTS/PTE registration | `src/app/api/test-prep/register/route.ts` | the registrant, and a notice to staff |

There is a fifth message that is not a lead: the admin password reset, sent from
`src/lib/auth/index.ts`.

### Where the code is

**Sending**: `src/lib/email/index.ts`. Plain `fetch` to `https://api.resend.com/emails`, not the
Resend SDK. The plain-text alternative is derived from the HTML so the two versions cannot drift
apart.

**Templates**: `src/lib/email/templates.ts`. Every value interpolated into a template goes through
`esc()`, which turns `<`, `>`, `&`, `"` and `'` into HTML entities. Half of these values were typed
into a public form, so a name of `<img onerror=...>` must reach a staff inbox as text, not as
markup.

**Recipients**: `src/lib/email/recipients.ts`. Staff mail is routed by office: a Nepal-office
submission goes to the `notify_email_np` setting, everything else to `notify_email_au`, falling
back to the company address if neither is set. Both are editable in admin Settings.

**Configuration**: `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the environment, never in the code.
The from address must be on a domain verified with Resend, or Resend answers 403 and nothing sends.

**Tests**: `tests/lib/email.test.ts`, `tests/lib/email-templates.test.ts`,
`tests/db/submission-email.test.ts`. Resend is mocked. The suite never sends real mail.

---

## 12. Authentication and permissions

The admin area requires you to sign in. Different administrators see different things depending on
their role and which office they belong to. The public site requires no account at all.

**Authentication** is proving who you are. Here that is an email address and a password of at
least twelve characters, handled by Better Auth. There are no social logins. Nobody can create
their own account: sign-up over HTTP is blocked outright, and accounts are created by a super
admin from `admin/users`. A deactivated account is refused at the moment a session is created.
`src/lib/auth/index.ts`

**A session** is the record that keeps you signed in after you close the tab. It is a random token
in a cookie, matched against a row in the `sessions` table. Sessions last a week from last use and
are refreshed at most once a day.

**RBAC**, role-based access control, decides what each administrator may do. There are four
roles:

| Role | Roughly |
| --- | --- |
| `super_admin` | everything, including users, settings, redirects and all offices |
| `au_admin` | full content control, scoped to the Australia office. No test-prep editing. |
| `np_admin` | full content control, scoped to the Nepal office, including test prep |
| `content_editor` | can create and edit posts, events and testimonials, but cannot publish them |

The complete matrix of role × entity × action is in `src/lib/auth/rbac.ts`, and that file is the
only place in the application that decides who may do what. Nothing else should carry its own
version of these rules.

**Office scoping.** A super admin sees every record. Everyone else sees records belonging to their
own office plus records that belong to no office. Two functions do this: `scopedWhere()` adds the
office condition to a list query, and `requireOwnership()` checks a single record before it is
changed. `requireOwnership()` checks the row that came back from the database, never the office id
that came in with the form.

**How a request is protected.** Three layers, deliberately:

1. `src/middleware.ts` checks only that a session cookie is present, and redirects to the login
   page if it is not. It does no database work and imports no auth library, because middleware
   runs on every single request.
2. `src/app/admin/(dashboard)/layout.tsx` calls `requireActor()`, which looks the token up in the
   database and confirms the account is still active and the session has not expired.
3. Each page calls `allow()` (`src/lib/auth/guard.ts`) and each server action calls
   `requirePermission()` (`src/lib/auth/rbac.ts`) for the specific thing being done.

**An import boundary worth respecting.** `src/lib/auth/session.ts` deliberately does not import
`src/lib/auth/index.ts`. Importing it would pull the entire Better Auth server into every admin
route chunk. Only `src/app/api/auth/[...all]/route.ts` builds the full auth object. `session.ts`
does its own token lookup instead, which is safe because the token is a random secret matched
against a row: a forged one matches nothing.

**Every write is recorded.** `writeAudit()` (`src/lib/security/audit.ts`) logs who did what to
which record, including logins and failed logins. Visible at `admin/audit-log`.

---

## 13. Forms and submissions

Four public forms. All four follow the same path:

```text
Visitor submits the form
        ↓
Schema validation (Zod). Bad input stops here with a 400 and per-field messages.
        ↓
Turnstile bot check. Honeypot field checked.
        ↓
Rate limit: at most 3 submissions per hour from one IP for that form
        ↓
Write the row to Neon
        ↓
Send the emails, failures swallowed
        ↓
Answer the browser
```

The form components are client components that `fetch()` the endpoint and render the result in
place. The endpoints are all `force-dynamic`, since a cached form endpoint would be meaningless.

**General enquiry**
Form: `src/features/leads/components/forms.tsx` (`EnquiryForm`)
Endpoint: `src/app/api/enquiries/route.ts`
Validation: `src/features/leads/validators.ts` (`enquirySchema`)
Table: `enquiries`

**Consultation booking**
Form: `src/features/leads/components/forms.tsx` (`BookingForm`)
Endpoint: `src/app/api/consultations/route.ts`
Validation: `src/features/leads/validators.ts` (`consultationSchema`)
Table: `consultations`. The requested time is stored as a plain date and time, and displayed in
that office's own timezone.

**Event registration**
Form: `src/features/events/components/registration-form.tsx`
Endpoint: `src/app/api/events/[id]/register/route.ts`
Validation: `src/features/events/validators.ts`
Table: `event_registrations`. Seats are checked before insert and re-counted after, and a unique
index on `(event_id, lower(email))` blocks a duplicate registration.

**IELTS/PTE registration**
Endpoint: `src/app/api/test-prep/register/route.ts`
Validation: `src/features/test-prep/validators.ts`, seat rules in `src/features/test-prep/seats.ts`
Table: `test_prep_registrations`. The seat is claimed by a conditional `UPDATE` on the batch, so
two people cannot take the last one.

### Shared protections

- **Honeypot**: a hidden field named `company_website`. A real person never fills it in. When it
  comes back filled, the endpoint answers as if everything succeeded and either records the row as
  spam or writes nothing, so the bot learns nothing.
- **Turnstile**: `src/lib/security/turnstile.ts`. With no secret key configured it passes in
  development and **fails closed in production**, rather than quietly letting everything through.
- **Rate limiting**: `src/lib/security/rate-limit.ts`. Counted from the submission rows themselves
  against a hashed IP, so there is no separate store to keep in sync.
- **IP hashing**: raw IP addresses are never stored. `hashIp()` in `src/lib/utils/request.ts`
  hashes with `IP_HASH_SALT`.
- **Reference codes**: enquiries and consultations get a human-quotable code, `ENQ-…` and `CON-…`.

Submissions are read in the admin at `admin/enquiries` and `admin/consultations`, with CSV export
through `src/app/api/admin/export/[entity]/route.ts`.

---

## 14. Media and images

```text
Staff upload an image in the admin
        ↓
media_assets row
        ↓
Cloudinary (uploaded files) or /public (files that ship with the code)
        ↓
Browser
```

Every image the CMS knows about has a row in `media_assets`. Content tables never store a URL,
only an id pointing at that row. The row's `kind` column says where the file actually is:

- `kind = "cloudinary"`: uploaded through the admin. The row holds a Cloudinary public id, and
  the URL is built with `f_auto,q_auto,w_<width>`.
- `kind = "static"`: a file in `public/`, seeded into the table by `db/seed/media.ts` so the
  picker can offer it. The row holds a path such as `/images/hero/sky-v2.webp`.

`mediaUrl(row, width)` in `src/lib/utils/media-url.ts` is the one function that turns a row into a
URL. It is the reason the two kinds can coexist: callers pass the row and the width they need and
do not care which kind it is.

**Uploads** go to `src/app/api/admin/media/image/route.ts`. That route checks the session and the
`media: create` permission, refuses anything over 8 MB, and identifies the file type by reading
its first bytes rather than trusting the browser's declared MIME type or the filename. JPEG, PNG,
WebP and AVIF only.

**The media library** at `admin/media` lists everything, filters by folder, type and kind, and
flags images with no alt text. Deleting is blocked while an asset is in use, and the refusal names
what is using it (`findUsage()` in `src/features/media/queries.ts`). Images embedded in rich text
are referenced by URL rather than by id, so those are found by searching the HTML.

**Static assets that are not CMS-managed** are the page furniture: the hero sky and meadow,
background textures, arrows, icons, flags, the brand logo. They are referenced from
`src/config/assets.ts` and served from `public/`, with a one-year immutable cache header.

**Before adding another image mechanism**, read `src/lib/utils/media-url.ts`, the `media_assets`
part of `src/db/schema/core.ts`, and `src/lib/integrations/cloudinary.ts`. There is one path from
a stored image to a rendered URL and it already handles both kinds, both a fixed width and the
format negotiation. Note also that the Content Security Policy in `next.config.ts` only permits
images from the site itself, `res.cloudinary.com` and the analytics hosts. A fourth image host
would be blocked in the browser with no visible error.

---

## 15. Office system

Goodluck runs three offices: Melbourne in Australia, Butwal in Nepal, and Cebu in the Philippines.
The site adapts to which one a visitor is dealing with, and the admin restricts each administrator
to their own.

**Office records** live in the `offices` table: address, phone, WhatsApp, email, timezone, opening
hours, map links, and a profile. They are edited at `admin/offices` and each has a public page at
`/offices/<slug>`. Read through `src/features/offices/queries.ts`.

**How the public site picks an office.** A visitor's choice is stored in a `gem_office` cookie for
a year. With no cookie, the browser's own timezone decides: an `Asia/Kathmandu` clock gets Nepal,
everything else gets Australia. Only a code that matches a published office is accepted, so a
tampered cookie cannot decide what the header shows.
`src/features/offices/cookie.ts`, `src/features/offices/components/office.tsx`

This resolution happens **in the browser, not on the server**, and that is deliberate. Reading a
cookie on the server would make every public page dynamic and put a database query in front of
every visit. The server always renders "au" first and the browser corrects it. See section 9.

What follows the selection: the footer contact block, the office contact cards, the team grid's
starting tab, the events list, and the office preselected in the booking form.

**Office-specific data.** Team members, events, media and leads each carry an office id. Services
carry an `office_scope` of `both`, `au` or `np`: a service with no office of its own is shared, one
pinned to an office belongs to that office alone.

**Office permissions in the admin.** Roles are `au_admin` and `np_admin`. Each sees records for
their own office plus records belonging to no office, enforced by `scopedWhere()` and
`requireOwnership()` in `src/lib/auth/rbac.ts`. Only Nepal and super admins may edit test
preparation, since the classes run there.

**Office-based email routing.** A submission tied to the Nepal office notifies the
`notify_email_np` address, everything else notifies `notify_email_au`.
`src/lib/email/recipients.ts`

**Note on the Philippines.** It is a full office in the `offices` table and on the public site, but
there is no `ph_admin` role. Cebu records are managed by a super admin.

---

## 16. Where to make common changes

| I need to change... | Start here |
| --- | --- |
| A public page's layout or sections | `src/app/(site)/<route>/page.tsx` |
| Homepage sections | `src/app/(site)/page.tsx`, then the feature each section comes from |
| Service content or its queries | `src/features/services/` |
| Destination content | `src/features/destinations/` |
| News | `src/features/posts/` |
| Events and registration rules | `src/features/events/` |
| Courses and institutions | `src/features/courses/`, `src/features/institutions/` |
| IELTS/PTE courses, batches, seats | `src/features/test-prep/` |
| Enquiries and consultations | `src/features/leads/` |
| Offices | `src/features/offices/` |
| Email sending, wording or routing | `src/lib/email/` |
| Database structure | `src/db/schema/`, then `db/migrations/` |
| Shared UI | `src/components/ui/`, `src/components/shared/` |
| Nav or footer | `src/components/layout/` |
| Form validation | the feature's `validators.ts`, or `src/lib/validators/` for shared pieces |
| Authentication and sessions | `src/lib/auth/` |
| Who may do what | `src/lib/auth/rbac.ts` |
| Company name, address, canonical URL | `src/config/site.ts` |
| Static image paths | `src/config/assets.ts` |
| Page titles and structured data | `src/lib/seo/` |
| Security headers and CSP | `next.config.ts` |

### The usual path for each kind of change

**Add a CMS field to existing content**: add the column in `src/db/schema/<file>.ts`, generate a
migration with Drizzle Kit into `db/migrations/`, add the field to the feature's `validators.ts`,
handle it in `actions.ts`, add the input to the feature's editor component, then select it in
`queries.ts` and render it. Six files, in that order.

**Add a new admin screen**: add the page under `src/app/admin/(dashboard)/`, add its entity to the
matrix in `src/lib/auth/rbac.ts`, add a row to `src/config/admin-nav.ts`, and write the reads in
`admin-queries.ts` and the writes in `actions.ts`.

**Change a public page**: the page file under `src/app/(site)/`. If the change needs different
data, change the feature's `queries.ts`, not the page. The public UI is approved and frozen, so
check `CLAUDE.md` before changing how anything looks.

**Change a form**: the field goes in three places: the schema in the feature's `validators.ts`,
the input in the form component, and the insert in the API route. Add a test alongside the
existing ones in `tests/lib/`.

**Change an email**: wording and layout in `src/lib/email/templates.ts`, who receives it in
`src/lib/email/recipients.ts`, delivery itself in `src/lib/email/index.ts`. Any new interpolated
value must go through `esc()`.

**Change image handling**: `src/lib/utils/media-url.ts` for how a URL is built,
`src/lib/integrations/cloudinary.ts` for upload and delete, `src/app/api/admin/media/image/route.ts`
for the upload endpoint. Check the CSP in `next.config.ts` if a new host is involved.

**Change database structure**: always schema first, then a generated migration. Never hand-edit a
migration that has already been applied, and never change the database directly. `migrate.yml`
applies migrations to production on every push to `main`.

---

## 17. Important rules and boundaries

Short list. Each of these can cause a real problem.

**Do not make a public page dynamic without a reason.** Reading cookies or headers on the server,
or setting `force-dynamic`, removes that page from ISR and puts a database query on every request.
This is why office selection is resolved in the browser.

**Do not bypass the database layer.** Every query goes through the `db` client in
`src/db/client.ts` and lives in a feature's `queries.ts` or `admin-queries.ts`.

**Do not put business logic in shared UI components.** `src/components/` must not know what a
service or an enquiry is. Pass what it needs as props.

**Do not write permission checks anywhere but `src/lib/auth/rbac.ts`.** Every action calls
`requirePermission()`; every ownership check uses the row from the database, never an id from a
form.

**Do not skip validation.** Every public endpoint and every server action parses its input with a
Zod schema before touching the database.

**Do not render user HTML without sanitising it.** Rich text goes through `sanitize()`
(`src/lib/security/sanitize.ts`) on the way in. Values interpolated into email HTML go through
`esc()` (`src/lib/email/templates.ts`).

**Do not expose server-only secrets to the browser.** Only `NEXT_PUBLIC_`-prefixed variables reach
client code, and that prefix is a decision, not a formality. `CLOUDINARY_API_SECRET`,
`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET`, `IP_HASH_SALT` and `BETTER_AUTH_SECRET`
must stay server-side.

**Do not change database structure without a migration.** Schema first, generated migration
second, and never hand-edit one that has already run.

**Do not import `src/lib/auth/index.ts` from a page or a server action.** Use
`src/lib/auth/session.ts`. See section 12.

---

## 18. Important gotchas

Non-obvious things that are easy to break.

**The auth import boundary**
What can go wrong: importing `lib/auth/index.ts` outside `api/auth/[...all]`.
Why: it pulls the entire Better Auth server into every route chunk that touches it.
Instead: use `requireActor()` from `src/lib/auth/session.ts`.

**Office selection is client-side on purpose**
What can go wrong: "simplifying" it by reading the `gem_office` cookie in a server component.
Why: every public page becomes dynamic and hits the database on every request.
Instead: leave it in `src/features/offices/components/office.tsx`. The server snapshot is always
"au" so the first client render matches the HTML.

**React `cache()` is not a cache between requests**
What can go wrong: relying on it to keep the database quiet.
Why: it memoises for one render only.
Instead: ISR is what does that. See section 9.

**Event seats are re-counted after insert**
What can go wrong: deleting the re-count in `src/app/api/events/[id]/register/route.ts` as
redundant.
Why: the check before the insert is a read and races with a simultaneous registration.
Instead: leave it. If the insert tipped the event over capacity, the row is deleted and the
registration refused. Test prep solves the same problem differently, with a conditional `UPDATE`
that claims the seat.

**Search ordering needs `row_number`**
What can go wrong: removing it from `src/features/search/queries.ts` as unnecessary.
Why: `UNION ALL` does not promise to preserve each branch's ordering, so results would come back
arbitrarily ordered and the per-group cut-off would drop the wrong rows.
Instead: leave it. The slug breaks ties.

**Three tables must stay in one schema module**
What can go wrong: splitting `users`, `offices` and `media_assets` out of `src/db/schema/core.ts`.
Why: they reference each other, and TypeScript cannot infer a table type across a file cycle.
Instead: keep them together. The comment at the top of the file says so.

**A content table stores an image id, not a URL**
What can go wrong: selecting `static_path` directly from a joined `media_assets` row.
Why: that silently ignores Cloudinary rows, whose path is null, and the image renders blank.
Instead: select `kind`, `staticPath` and `cloudinaryPublicId` together and call `mediaUrl()`.

**Turnstile fails closed in production**
What can go wrong: deploying without `TURNSTILE_SECRET_KEY`.
Why: with no secret in production, `verifyTurnstile()` returns false and every submission is
refused. Locally, it passes.
Instead: make sure the variable is set in the hosting environment.

**Cloudinary assets are not deleted with their rows**
What can go wrong: assuming deleting a media record removes the file.
Why: `deleteImage()` exists in `src/lib/integrations/cloudinary.ts` but is not called from
`src/features/media/actions.ts`. The Cloudinary file is left behind.
Instead: know that this is the current behaviour before writing code that depends on either
outcome.

**`admin/redirects` is in the menu but has no page**
What can go wrong: assuming the screen exists because `src/config/admin-nav.ts` links to it.
Why: the entity and the permissions exist, and `src/lib/seo/redirects.ts` serves redirects from
the table, but there is no page under `src/app/admin/(dashboard)/redirects/`.
Instead: rows go in by hand, or the page needs building.

**The seed overwrites what it seeds**
What can go wrong: running `pnpm db:seed:prod` against a database an admin has been editing.
Why: most steps upsert the seeded fields, so an admin's edit to a seeded row can be reverted.
Instead: seed an empty or development database. Do not run it against production content.

---

## 19. Production setup

```text
Vercel
   ↓
The Next.js application
   ↓
Neon PostgreSQL
```

External services:

```text
Cloudinary  → images
Resend      → email
Cloudflare  → Turnstile bot checks
Google Tag Manager → analytics
```

**Deployment.** Vercel builds and deploys from the repository. `main/vercel.json` registers one
scheduled job: `/api/cron/publish-scheduled` every fifteen minutes.

**Database.** Neon Postgres. Schema changes are applied by GitHub Actions, not by Vercel:
`.github/workflows/migrate.yml` runs `drizzle-kit migrate` on every push to `main`, while Vercel
builds the app from the same push.

**CI.** `.github/workflows/ci.yml` runs typecheck, lint and the test suite on every pull request.

**Backups.** `.github/workflows/backup.yml` runs three jobs: a daily database dump to Cloudflare
R2 with 30-day retention, a weekly copy of the Cloudinary originals to R2, and a Monday freshness
check that opens an issue if either backup has gone stale. Restore steps are in
`main/docs/recovery.md`.

**Environment variables**, by purpose. Values live in the hosting project's settings, never in a
file in the repository. `main/.env.example` is the annotated list.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon connection string |
| `BETTER_AUTH_SECRET` | signs auth material |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL` | the site's own origin, both required |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | public, appears in every delivery URL |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | signing uploads and deletes |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | email. The from domain must be verified with Resend. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | the bot check |
| `CRON_SECRET` | guards the scheduled-publish route |
| `IP_HASH_SALT` | hashes IPs for rate limiting. Changing it resets rate limits. |
| `NEXT_PUBLIC_GTM_ID` | analytics container. A Settings value overrides it. |
| `BUILD_CPUS` | local builds only. See below. |

**Caching in production.** Public pages are ISR at five minutes, plus immediate revalidation when
an admin saves. Static files under `/images` and `/brand` carry a one-year immutable header. The
admin, the form endpoints and the exports are never cached.

**Security headers** are set for every response in `next.config.ts`: a Content Security Policy,
HSTS, `X-Content-Type-Options`, `X-Frame-Options`, a referrer policy and a permissions policy. The
CSP is restrictive. Adding a new script, font, image or API host means editing it, or the browser
blocks the request with no visible error.

**How content reaches production.** Staff edit at `/admin` on the live site and it writes to the
production Neon database. Content does not travel through the repository and a content change
needs no deploy.

**Local-only.** The `docker-compose.yml` PostgreSQL and Neon HTTP proxy are development only;
production talks to Neon directly. `BUILD_CPUS` exists because the local proxy accepts far fewer
connections than Neon, so a local build sets it to 1 to prerender one page at a time. Leave it
unset in CI and production.

**Health check.** `GET /api/health` runs `select 1` and answers 200 or 503. It never returns the
driver's error message, because that carries the connection string.

---

## 20. Development and verification

```bash
pnpm install     # install dependencies. pnpm only, never npm or yarn.
pnpm dev         # start the local development server on :3000
pnpm typecheck   # check every type without building. The fastest useful check.
pnpm lint        # check code style and catch common mistakes
pnpm test        # run the test suite once (Vitest)
pnpm build       # produce the production build, including prerendered pages
pnpm db:seed:dev # fill the local database with starting content
```

All of these run from `main/`.

The local database comes from `docker compose up -d` in `main/`: PostgreSQL plus the Neon HTTP
proxy on port 4444. `DATABASE_URL` then points at `db.localtest.me`, which
`src/db/client.ts` recognises.

**Before considering a change complete**, run `pnpm typecheck`, `pnpm lint` and `pnpm test`. These
are the three CI runs on every pull request, so a failure here is a failure there. `pnpm build` is
slower and is only needed when you have changed something that affects the build itself: route
configuration, `generateStaticParams`, `next.config.ts`.

Tests live in `tests/`, mirroring `src/`. Some need a database and skip themselves with
`test.runIf(hasDb)` when `DATABASE_URL` is not set, so a green run with no database is not a full
run. The suite never calls a real external service: Resend, Cloudinary and Turnstile are mocked.

Read `CLAUDE.md` before committing. It covers commit format, comment policy, and what not to
change.

---

## 21. Glossary

**CMS**: content management system. Screens that let staff change website content without
touching source code. Here, everything under `/admin`.

**Server component**: a React component that runs only on the server. It can read the database
directly and its code is never sent to the browser. Most pages here are server components.

**Client component**: a component marked `"use client"`, sent to the browser so it can respond to
clicks and typing. The forms, the FAQ accordion and the animations.

**Server action**: a function marked `"use server"` that a form submits to directly. It runs on
the server. Every admin save goes through one.

**API route**: a URL that returns data rather than a page. The four public forms post to API
routes under `src/app/api/`.

**ISR**: Incremental Static Regeneration. A Next.js mechanism that generates a page once, serves
that copy to everyone, and refreshes it in the background after a set time. Five minutes here.

**Revalidation**: telling Next.js that a stored page is out of date so it will be regenerated.
`revalidatePath("/services")` after an admin saves a service.

**Migration**: a versioned, checked-in change to the database structure, so every copy of the
database can be brought to the same shape.

**Seed**: a script that fills an empty database with starting content.

**RBAC**: role-based access control. Which role may do what to which kind of record.
`src/lib/auth/rbac.ts`.

**Slug**: the URL-safe name of a record. `visa-guidance` in `/services/visa-guidance`.

**Cloudinary**: the service that stores uploaded images and delivers them resized and re-encoded.

**Resend**: the service that delivers the site's email.

**Neon**: the company that hosts the PostgreSQL database.

**Turnstile**: Cloudflare's bot check on the public forms. Usually invisible to the visitor.

**Drizzle**: the library that lets the database schema be written in TypeScript and turns
TypeScript into SQL queries.

**Zod**: the library used to declare what a valid form submission looks like.

**Honeypot**: a hidden form field a real person never fills in. When it comes back filled, the
submission is from a bot.

**Audit log**: the record of who changed what in the admin. `admin/audit-log`.
