DROP TABLE IF EXISTS "audit_log";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."audit_action";--> statement-breakpoint

-- Metadata is generated from the record now, so the editorial SEO columns go with the editor.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name IN ('seo_title', 'seo_description', 'seo_og_image_id', 'seo_noindex', 'canonical_url')
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', r.table_name, r.column_name);
  END LOOP;
END $$;
