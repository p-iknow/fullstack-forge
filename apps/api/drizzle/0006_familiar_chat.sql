ALTER TABLE "products" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."product_status";