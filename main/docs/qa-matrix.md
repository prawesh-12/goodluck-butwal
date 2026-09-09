# QA matrix

What has been tested, how, and what has not.

> **Cross-browser and device testing has not been done.** It needs real browsers and real hands,
> and this build has only ever run headless on one Linux machine. The grids below are ready to
> fill in; empty cells mean untested, not passed.

## What has been verified, and how

Every row below was measured against a running server and a real Postgres, not asserted.

| Check | Result |
|---|---|
| All 17 original public routes return 200 | yes |
| All 31 article URLs resolve at their original slugs | 31 of 31 |
| A `redirects` row produces a real 301 | yes |
| Signed out, `/admin` redirects to the login page | 307 |
| A content editor gets 403 on `/admin/users` | yes |
| A deactivated account is turned away | yes |
| A Nepal enquiry is invisible to an Australia admin, in the list and the export | yes |
| No Turnstile token writes nothing and returns 400 | yes |
| A fourth submission within an hour is refused politely | 429 |
| The honeypot reports success, writes a spam row, sends no email | yes |
| A scheduled post publishes on the cron with no deploy | yes |
| A testimonial without consent stays unpublished on that same run | yes |
| CSV export opens in Excel with UTF-8 intact | yes, byte order mark present |
| Automated tests | 309 passing |
| Editable text: an admin's wording replaces the code's | verified |
| App queries on the busiest dynamic page | 8, against a budget of 6 |

## Browsers

| Browser | Homepage | Scroll hero | Video dialog | Marquees | Mobile nav | Forms | Admin |
|---|---|---|---|---|---|---|---|
| Chrome desktop | | | | | | | |
| Safari desktop | | | | | | | |
| Firefox desktop | | | | | | | |
| Edge desktop | | | | | | | |
| iOS Safari | | | | | | | |
| Android Chrome | | | | | | | |
| Tablet width | | | | | | | |

**Watch iOS Safari especially.** The homepage hero measures the viewport and parks as you scroll,
and Lenis drives the smooth scrolling. Those two together are the most likely place for something
to behave differently there than everywhere else.

## Widths

The design has breakpoints at 640, 810, 1200 and 1440. Check each side of each.

| Width | Home | Inner page | Admin list | Admin form |
|---|---|---|---|---|
| 390 | | | | |
| 810 | | | | |
| 1200 | | | | |
| 1440 | | | | |

## Accessibility

**Statically checked, and passing:**

| Check | Result |
|---|---|
| Every `<img>` on a public page has an `alt` attribute | 0 missing |
| No page carries more than one `<h1>` | 0 pages |
| Decorative images are `alt=""` with `aria-hidden`, not undescribed | yes |
| Every form input has a label element wrapping it | yes |
| The office selector and mobile menu carry `aria-` state | yes |

That is the part a machine can answer. The rest needs a browser.

Not yet run. The plan asks for axe on twelve pages, every serious and critical finding fixed, and
one keyboard-only journey: home, destination, enquiry, submit.

| Page | axe serious | axe critical | Keyboard | Notes |
|---|---|---|---|---|
| `/` | | | | |
| `/about` | | | | |
| `/study-abroad/australia` | | | | |
| `/services/education-counselling` | | | | |
| `/news` | | | | |
| `/news/[slug]` | | | | |
| `/contact` | | | | |
| `/contact/book-consultation` | | | | |
| `/institutions` | | | | |
| `/courses` | | | | |
| `/test-preparation/batches` | | | | |
| `/events` | | | | |

Four images still have no alt text, and they are genuine photographs nobody has described. They
are listed in `QUESTIONS.md`. They will show as findings until somebody who knows what the
photographs show writes a sentence for each.

## Known and deliberate

- `/success-stories` renders no stories. Nothing is published without recorded consent, which is
  the agreed fallback. One update puts them back once consent is confirmed.
- The legal pages return 404. They stay unpublished until the client supplies the copy.
- New Zealand has no page of its own. Its card routes to the booking form, as agreed.
- Institutions and courses show placeholder rows in development only, every one marked
  `[PLACEHOLDER]`, and all of them drafts.
