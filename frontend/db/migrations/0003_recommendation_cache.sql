CREATE TABLE "recommendation_cache" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "products_json" text NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "rec_cache_user_date_idx" ON "recommendation_cache" ("user_id", "date");
