CREATE TABLE "daily_suggestions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "outfit_id" text NOT NULL REFERENCES "outfits"("id") ON DELETE CASCADE,
  "date" text NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "daily_suggestions_user_date_idx" ON "daily_suggestions" ("user_id", "date");
