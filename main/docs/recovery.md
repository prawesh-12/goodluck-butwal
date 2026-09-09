# Recovery

What to do when the database is gone, wrong, or somebody deleted something they should not have.

> **This procedure has been written but not yet performed.** The plan requires a real restore
> with measured numbers before handover, and that needs the Neon and R2 accounts, which do not
> exist yet. Every step below is written to be followed exactly; the timings and row counts are
> the parts still missing. Do not treat this as verified until the table at the end is filled in.

## Where the backups are

| | |
|---|---|
| Bucket | `gem-backups` on Cloudflare R2 |
| Path | `db/{yyyy}/{mm}/gem-{date}.dump.gz` |
| Written by | `.github/workflows/backup.yml`, daily at 18:00 UTC |
| Kept for | 30 days, older files are deleted by the same job |
| Marker | `db/last_success`, rewritten on every successful run |
| Watchdog | a weekly job fails, and opens an issue, if the marker is over 48 hours old |

R2 is reached over the S3 API with the AWS CLI. The site itself does not touch it, only the
backup workflow does, so the bucket is independent of where the site is hosted.

## Who has access

Fill this in at handover. It needs to name real people, not roles, because in an emergency you
need to know who to phone.

| What | Who | Notes |
|---|---|---|
| Vercel account | | Owns the deployed site and its environment variables |
| Cloudflare account | | Owns R2, DNS and Turnstile |
| Neon account | | Owns the database and its branches |
| GitHub repository | | Owns the workflows and the secrets |

## Restoring

**Do not restore over the live database.** Restore into a new Neon branch, check it, and only
then repoint. A branch costs nothing and is instant, and it means a bad restore is not a second
outage.

1. **Find the dump you want.**
   ```bash
   aws s3 ls s3://gem-backups/db/2026/09/ \
     --endpoint-url https://<account-id>.r2.cloudflarestorage.com
   ```

2. **Download and unpack it.**
   ```bash
   aws s3 cp s3://gem-backups/db/2026/09/gem-2026-09-08.dump.gz . \
     --endpoint-url https://<account-id>.r2.cloudflarestorage.com
   gunzip gem-2026-09-08.dump.gz
   ```

3. **Make a branch to restore into.** In the Neon console, branch from `main` and name it for the
   date you are restoring, for example `restore-2026-09-08`. Copy its connection string.

4. **Restore.**
   ```bash
   pg_restore --clean --if-exists --no-owner --dbname "<branch connection string>" gem-2026-09-08.dump
   ```

5. **Check it before you trust it.** Row counts should match the day the dump was taken, not
   today. If a table is empty that should not be, stop and use an older dump.
   ```sql
   select 'offices', count(*) from offices
   union all select 'team_members', count(*) from team_members
   union all select 'partners', count(*) from partners
   union all select 'services', count(*) from services
   union all select 'destinations', count(*) from destinations
   union all select 'posts', count(*) from posts
   union all select 'testimonials', count(*) from testimonials
   union all select 'enquiries', count(*) from enquiries
   union all select 'consultations', count(*) from consultations
   union all select 'media_assets', count(*) from media_assets
   order by 1;
   ```

6. **Point the site at the branch.** Change `DATABASE_URL` in the Vercel project's environment
   variables to the branch string, then redeploy. Check that the homepage, one article and the
   admin all load before you tell anyone it is fixed.

7. **Afterwards.** Once the restored branch has been live and correct for a day, promote it or
   copy it back to `main`, and delete the temporary branch so nobody restores into it by mistake.

## If somebody deleted one thing, not everything

Most content is archived rather than deleted, so check the admin first: set the status filter to
Archived and look for it. That takes a minute and needs no restore. Only a hard delete, which is
restricted to a super admin and asks for typed confirmation, actually removes a row.

## What is not in the database

Restoring Postgres does not bring these back:

- **Uploaded images** live in Cloudinary and are not in the dump. They have their own retention.
- **Files in `public/`** are in git, so a `git checkout` is the restore.
- **Secrets** are in Vercel and GitHub, not in the dump. Keep a copy somewhere safe and offline.

## Measured results

Fill this in when the first real restore is done. It is a deliverable, not a formality: an
untested backup is not a backup.

| | |
|---|---|
| Date performed | |
| Dump size | |
| Download time | |
| Restore time | |
| Row counts matched | |
| Performed by | |
