CREATE TABLE "week_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week_start" text NOT NULL,
	"plan" text NOT NULL,
	"created_at" text DEFAULT (now() at time zone 'utc') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "week_plans" ADD CONSTRAINT "week_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "week_plans_user_week_idx" ON "week_plans" USING btree ("user_id","week_start");