CREATE TABLE IF NOT EXISTS "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fipe_code" text NOT NULL,
	"vehicle_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_fipe_code_unique" UNIQUE("user_id","fipe_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fipe_code" text NOT NULL,
	"reference_month" text NOT NULL,
	"old_price_brl" integer NOT NULL,
	"new_price_brl" integer NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_logs_user_id_fipe_code_reference_month_unique" UNIQUE("user_id","fipe_code","reference_month")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_snapshots" (
	"fipe_code" text PRIMARY KEY NOT NULL,
	"price_brl" integer NOT NULL,
	"reference_month" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
