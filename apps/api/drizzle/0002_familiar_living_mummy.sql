CREATE TYPE "public"."point_accrual_type" AS ENUM('percentage', 'fixed_per_order');--> statement-breakpoint
CREATE TYPE "public"."point_ledger_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."point_policy_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."point_source_type" AS ENUM('order_payment', 'order_cancel', 'review_reward', 'event_reward', 'admin_adjust');--> statement-breakpoint
CREATE TYPE "public"."point_transaction_type" AS ENUM('earn', 'redeem', 'expire', 'adjust', 'rollback');--> statement-breakpoint
CREATE TABLE "loyalty_accounts" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"available_points" integer DEFAULT 0 NOT NULL,
	"pending_points" integer DEFAULT 0 NOT NULL,
	"lifetime_earned" integer DEFAULT 0 NOT NULL,
	"lifetime_redeemed" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_accounts_available_points_non_negative_chk" CHECK ("loyalty_accounts"."available_points" >= 0),
	CONSTRAINT "loyalty_accounts_pending_points_non_negative_chk" CHECK ("loyalty_accounts"."pending_points" >= 0),
	CONSTRAINT "loyalty_accounts_lifetime_earned_non_negative_chk" CHECK ("loyalty_accounts"."lifetime_earned" >= 0),
	CONSTRAINT "loyalty_accounts_lifetime_redeemed_non_negative_chk" CHECK ("loyalty_accounts"."lifetime_redeemed" >= 0)
);
--> statement-breakpoint
CREATE TABLE "point_ledgers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"policy_id" uuid,
	"transaction_type" "point_transaction_type" NOT NULL,
	"source_type" "point_source_type" NOT NULL,
	"points" integer NOT NULL,
	"status" "point_ledger_status" DEFAULT 'confirmed' NOT NULL,
	"description" text,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "point_ledgers_points_positive_chk" CHECK ("point_ledgers"."points" > 0)
);
--> statement-breakpoint
CREATE TABLE "point_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"accrual_type" "point_accrual_type" NOT NULL,
	"accrual_value" integer NOT NULL,
	"min_order_amount" integer DEFAULT 0 NOT NULL,
	"max_earn_per_order" integer DEFAULT 0 NOT NULL,
	"min_redeem_points" integer DEFAULT 0 NOT NULL,
	"point_to_currency_rate" integer DEFAULT 1 NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"status" "point_policy_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"points_used" integer NOT NULL,
	"discount_amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "point_redemptions_points_used_positive_chk" CHECK ("point_redemptions"."points_used" > 0),
	CONSTRAINT "point_redemptions_discount_amount_non_negative_chk" CHECK ("point_redemptions"."discount_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_ledgers" ADD CONSTRAINT "point_ledgers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_ledgers" ADD CONSTRAINT "point_ledgers_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_ledgers" ADD CONSTRAINT "point_ledgers_policy_id_point_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."point_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_redemptions" ADD CONSTRAINT "point_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_redemptions" ADD CONSTRAINT "point_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "point_redemptions_order_id_idx" ON "point_redemptions" USING btree ("order_id");