CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"display_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
INSERT INTO "categories" ("name", "slug", "display_order", "is_active") VALUES
  ('상온 간편식', 'convenience-food', 1, true),
  ('음료', 'beverage', 2, true),
  ('위생용품', 'hygiene', 3, true),
  ('세탁/청소', 'laundry-cleaning', 4, true),
  ('반려소모품', 'pet-supplies', 5, true),
  ('셀프케어', 'self-care', 6, true);
--> statement-breakpoint
UPDATE "products" SET "category_id" = c."id"
  FROM "categories" c
  WHERE "products"."category_id" = ('cat-' || c."display_order"::text);
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category_id" SET DATA TYPE uuid USING "category_id"::uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
