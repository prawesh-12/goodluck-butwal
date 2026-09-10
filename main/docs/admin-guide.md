# Running the site

Seven parts of this site are edited in the admin, at `/admin`: Team, Partners, News, Events,
Institutions, Courses and Test preparation. Enquiries and Consultations are there too, so you can
see and answer what comes in.

Everything else on the site, page wording, service descriptions, destination pages, office
details, is set by a developer. That is deliberate. It is the part of the site that is not meant
to change week to week, and keeping it out of the admin is what stops it being broken by accident.

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
| Add a staff member, change a bio or photo | Team | Your own office |
| Add a partner logo to the ticker | Partners | Australia or Nepal admin |
| Publish a news article | News. Editors can write but not publish. | Any admin |
| Sort articles into categories or tags | News, at the foot of the list | Any admin |
| Add an event and open registrations | Events | Your own office |
| See who registered | Events, then Registrations | Your own office |
| Add an institution or its gallery | Institutions | Australia or Nepal admin |
| Add courses, or many at once | Courses, or Courses then Import | Australia or Nepal admin |
| Group courses by subject area | Courses, at the foot of the list | Super admin |
| Add an IELTS or PTE batch, change fees or seats | Test preparation, then Batches | Nepal admin |
| Upload, replace or delete a picture | Images | Any admin |
| Upload, replace or delete a video | Videos | Any admin |
| See and respond to enquiries | Enquiries | Your own office |
| Confirm a consultation | Consultations, then Confirm | Your own office |
| Download enquiries as a spreadsheet | Enquiries, then Export | Your own office |
| Add a staff login or change a role | Users | Super admin |

Anything not in that table, page wording, services, destinations, office details, the announcement
bar, is a developer change. Ask, and it goes out with the next release.

## Who gets which role

Give the smallest role that does the job.

| Role | Sees |
|---|---|
| Super admin | Everything, plus users. Two people, no more. |
| Australia admin | Australian content and Australian enquiries |
| Nepal admin | Nepali content, Nepali enquiries, and IELTS and PTE |
| Content editor | Writes news and events. **Cannot publish, and never sees enquiries.** |

Nobody can change their own role or switch off their own account, and the last remaining super
admin cannot be removed. That is on purpose: it is what stops one mistake locking everyone out.

## Things worth knowing before you start

**Publishing is not instant everywhere.** A change appears within five minutes. That is normal,
not a fault. Nothing needs a developer to push it live.

**A record is either Draft, Published or Archived.** There is no way to schedule something for
later. When you want it live, publish it.

**Every image needs alt text.** It is the sentence a blind visitor hears in place of the picture.
The admin will not let you publish a record whose image has none, and it tells you which image.

**Deleting mostly means archiving.** An archived record leaves the site but stays in the admin, so
a mistake is a minute to undo. Only a super admin can truly delete something, and it asks you to
type a confirmation first.

**A picture in use cannot be deleted.** Images and Videos refuse a delete while something on the
site still shows the file, and the message names what is using it. Take it off that record first.

**Renaming a record keeps the old address working.** The site sends the old link to the new page
automatically, so a shared link or a Google result does not break.

**Google titles look after themselves.** The title and description Google shows are built from the
record's own title and summary. Write those well and the search result reads well.

## The seven things you should be able to do unaided

These are the handover test. If you cannot finish one of them, that is a fault in the admin to be
fixed, not something you failed.

### 1. Add a team member with a photo and publish them
Team, then New. Name and position. For the photo, press **Choose** and pick from the library, or
upload it in Images first. **Give the photo alt text**, otherwise publishing is refused. Set the
office, set the status to Published, save.

### 2. Write a news article, save it as a draft, publish it
News, then New. The address is filled in from the title; leave it alone unless you have a reason.
Write the body, pick a category, add tags. Save with the status Draft. When you are happy, change
the status to Published and save.

### 3. Add a news category and put an article in it
News. At the foot of the article list, open **Categories**, add the name, save. Then open the
article and pick the new category. Tags work the same way, in the panel beside it.

### 4. Replace a picture that is already on the site
Images. Search for it, press **Replace**, choose the new file. Everything showing that picture
picks up the new one, because the address does not change.

### 5. Add an IELTS batch starting next month with 20 seats and a fee
Test preparation, then Batches, then New. Pick the IELTS course. Set the start date, the days of
the week, the times, 20 seats and the fee. Save. The batches page shows it as **Open**; it changes
to **Filling fast** on its own when three seats or fewer remain, and **Full** at zero. You do not
set those labels, they follow the seats.

### 6. Find last week's enquiry, set it to Contacted, add an internal note
Enquiries. Search by name, email, phone or reference, or narrow by date. Open it. Change the
status to Contacted, write the note, save. The note is internal and the enquirer never sees it.

### 7. Create a content editor account, then deactivate it
Users, then New. Name, email, a password of at least twelve characters, role Content editor.
Save. To switch it off later, open it and untick **Active**. Deactivating is better than deleting:
the person is locked out immediately and their work keeps its author.

## When something looks wrong

- **A change has not appeared.** Wait five minutes, then reload. If it still has not, check you
  pressed Save and that the status is Published, not Draft.
- **You cannot see a menu item.** Your role does not cover it. That is the design, not a fault.
- **It refuses to publish.** Read the message: it names exactly what is missing, usually alt text
  on an image or an empty required field.
- **It refuses to delete a picture.** Something on the site is still using it. The message says
  what. Change that record first.
- **You cannot open somebody else's office record.** You are not meant to. Ask a super admin.
- **The wording you want to change is not in the admin.** It is developer-controlled. Ask, and it
  goes out with the next release.
