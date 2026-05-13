CREATE TYPE "public"."user_role" AS ENUM('admin', 'standard');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'standard' NOT NULL;