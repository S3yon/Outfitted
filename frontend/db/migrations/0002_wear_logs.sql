CREATE TABLE "wear_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"clothing_item_id" text NOT NULL,
	"worn_on" text NOT NULL,
	"source" text NOT NULL,
	"created_at" text DEFAULT (now() at time zone 'utc') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wear_logs" ADD CONSTRAINT "wear_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_logs" ADD CONSTRAINT "wear_logs_clothing_item_id_clothing_items_id_fk" FOREIGN KEY ("clothing_item_id") REFERENCES "public"."clothing_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wear_logs_item_day_idx" ON "wear_logs" USING btree ("clothing_item_id","worn_on");