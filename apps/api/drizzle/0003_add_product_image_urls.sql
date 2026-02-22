ALTER TABLE "products" ADD COLUMN "thumb_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "detail_url" text;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "image_url";
