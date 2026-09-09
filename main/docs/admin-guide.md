# Running the site

Everything on this site is edited in the admin, at `/admin`. You never need a developer to change
wording, a phone number, a photo, a price or a page.

> Screenshots are added once the site is on its real address. Every step below is written so it
> can be followed without them.

## Signing in

Go to `/admin/login`. Use your email and your password, which is at least twelve characters. If
you have forgotten it, use the reset link and check your email.

If you are told the email and password do not match, that is all it says on purpose. It never
tells you which of the two was wrong, because that would tell a stranger which addresses exist.

Five wrong attempts in fifteen minutes and it stops accepting tries for a while. Wait, or ask a
super admin.

## Where to change what

| I want to change... | Go to | Who can |
|---|---|---|
| A heading or button label anywhere | Site text | Any admin |
| A phone number, address, hours or map | Offices | Your own office |
| Add a staff member, change a bio or photo | Team | Your own office |
| Text on a destination page | Destinations | Australia or Nepal admin |
| Add an FAQ question | Destinations or Services, then FAQs | Australia or Nepal admin |
| A service description or its steps | Services | Australia or Nepal admin |
| Add a partner logo to the ticker | Partners | Australia or Nepal admin |
| Add an institution or its gallery | Institutions | Australia or Nepal admin |
| Add courses, or many at once | Courses, or Courses then Import | Australia or Nepal admin |
| Add an IELTS or PTE batch, change fees or seats | Test prep, then Batches | Nepal admin |
| Publish a news article | Posts. Editors can write but not publish. | Any admin |
| Schedule an article for later | Posts, set the status to Scheduled | Any admin |
| Add an event and open registrations | Events | Your own office |
| See who registered | Events, then Registrations | Your own office |
| Add a success story or video testimonial | Testimonials | Australia or Nepal admin |
| Hide a student's name | Testimonials, then Anonymise | Australia or Nepal admin |
| See and respond to enquiries | Enquiries | Your own office |
| Confirm a consultation | Consultations, then Confirm | Your own office |
| Download enquiries as a spreadsheet | Enquiries, then Export | Your own office |
| The page title Google shows | That record's SEO section | Whoever owns the record |
| Which address gets enquiry notifications | Settings, Notifications | Super admin |
| The announcement bar, social links, Google rating | Settings | Super admin |
| Add a staff login or change a role | Users | Super admin |
| Send an old address to a new page | Redirects | Super admin |
| See who changed what | Audit log | Any admin |

## Who gets which role

Give the smallest role that does the job.

| Role | Sees |
|---|---|
| Super admin | Everything, plus users, settings and redirects. Two people, no more. |
| Australia admin | Australian content and Australian enquiries |
| Nepal admin | Nepali content, Nepali enquiries, and IELTS and PTE |
| Content editor | Writes posts, events and testimonials. **Cannot publish, and never sees enquiries.** |

Nobody can change their own role or switch off their own account, and the last remaining super
admin cannot be removed. That is on purpose: it is what stops one mistake locking everyone out.

## Things worth knowing before you start

**Publishing is not instant everywhere.** A change appears within five minutes. That is normal,
not a fault. Nothing needs a developer to push it live.

**Every image needs alt text.** It is the sentence a blind visitor hears in place of the picture.
The admin will not let you publish a page whose image has none, and it tells you which image.

**A testimonial cannot be published without consent.** Tick the consent box only when you
genuinely have the person's permission to show their words, name or face. This is the one rule
that protects the business rather than the website.

**Deleting mostly means archiving.** An archived record leaves the site but stays in the admin, so
a mistake is a minute to undo. Only a super admin can truly delete something, and it asks you to
type a confirmation first.

**Renaming a page keeps the old address working.** The site sends the old link to the new page
automatically, so a shared link or a Google result does not break.

## The eight things you should be able to do unaided

These are the handover test. If you cannot finish one of them, that is a fault in the admin to be
fixed, not something you failed.

### 1. Change the Nepal office phone number
Offices, then Nepal Office. Change **Phone as written** (the version visitors see) and **Phone**
(the version the call button dials, starting with `+`). Save. Open the site: the header, the
footer and the contact cards all show the new number within five minutes.

### 2. Change the heading above the destinations section on the homepage
Site text. Search for the wording you can see on the homepage. Change the value, save.
Only the wording changes; you cannot break the layout from here.

### 3. Add a team member with a photo and publish them
Team, then New. Name and position. For the photo, press **Choose** and pick from the media
library, or upload it there first. **Give the photo alt text**, otherwise publishing is refused.
Set the office, set the status to Published, save.

### 4. Write a news article, save it as a draft, preview it, publish it
Posts, then New. The address is filled in from the title; leave it alone unless you have a
reason. Write the body. Save with the status Draft, then use Preview to see it as a visitor
would. When you are happy, change the status to Published and save.

### 5. Add an IELTS batch starting next month with 20 seats and a fee
Test prep, then Batches, then New. Pick the IELTS course. Set the start date, the days of the
week, the times, 20 seats and the fee. Save. The batches page shows it as **Open**; it changes to
**Filling fast** on its own when three seats or fewer remain, and **Full** at zero. You do not set
those labels, they follow the seats.

### 6. Add a video testimonial, tick consent, publish it
Testimonials, then New. Set the kind to **Video**, paste the link and say where it is hosted.
Tick **Consent given** only if you actually have permission. Publish. Without consent the site
tells you "Record consent before publishing." and refuses.

### 7. Find last week's enquiry, set it to Contacted, add an internal note
Enquiries. Search by name, email, phone or reference, or narrow by date. Open it. Change the
status to Contacted, write the note, save. The note is internal and the enquirer never sees it.

### 8. Create a content editor account, then deactivate it
Users, then New. Name, email, a password of at least twelve characters, role Content editor.
Save. To switch it off later, open it and untick **Active**. Deactivating is better than
deleting: the person is locked out immediately, and the audit log still shows what they did.

## When something looks wrong

- **A change has not appeared.** Wait five minutes, then reload. If it still has not, check you
  pressed Save and that the status is Published, not Draft.
- **You cannot see a menu item.** Your role does not cover it. That is the design, not a fault.
- **It refuses to publish.** Read the message: it names exactly what is missing, usually alt text
  on an image or an empty required field.
- **You cannot open somebody else's office record.** You are not meant to. Ask a super admin.
- **Something genuinely broken.** The audit log shows who changed what and when, which is usually
  the fastest way to find out what happened.
