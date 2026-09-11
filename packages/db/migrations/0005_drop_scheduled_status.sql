-- Postgres cannot drop a value from an enum, so the type is rebuilt. The columns are read from
-- the catalogue rather than listed, so this runs whether or not testimonials is still around.
-- published_at is kept: it is the date a piece went live, not a scheduling field.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.udt_name = 'content_status' AND c.table_schema = 'public'
  LOOP
    EXECUTE format('UPDATE public.%I SET %I = ''draft'' WHERE %I = ''scheduled''',
                   r.table_name, r.column_name, r.column_name);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', r.table_name, r.column_name);
  END LOOP;
END $$;--> statement-breakpoint

ALTER TYPE "public"."content_status" RENAME TO "content_status_old";--> statement-breakpoint

CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.udt_name = 'content_status_old' AND c.table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE "public"."content_status" USING %I::text::"public"."content_status"',
                   r.table_name, r.column_name, r.column_name);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT ''draft''', r.table_name, r.column_name);
  END LOOP;
END $$;--> statement-breakpoint

DROP TYPE "public"."content_status_old";
