ALTER TABLE "destinations" DROP COLUMN "hero_image_id";--> statement-breakpoint
ALTER TABLE "destinations" DROP COLUMN "flag_image_id";--> statement-breakpoint
ALTER TABLE "destinations" DROP COLUMN "card_image_id";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "artwork_id";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "reel_id";--> statement-breakpoint
ALTER TABLE "pages" DROP COLUMN "hero_image_id";--> statement-breakpoint
ALTER TABLE "offices" DROP COLUMN "hero_image_id";--> statement-breakpoint
DELETE FROM "settings" WHERE "key" IN ('hero_image_id', 'hero_video_id', 'default_og_image_id');--> statement-breakpoint
DELETE FROM "ui_strings" WHERE "key" LIKE 'service.%.poster';
