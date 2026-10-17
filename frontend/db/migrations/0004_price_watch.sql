CREATE TABLE "price_points" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"price" integer NOT NULL,
	"currency" text,
	"source" text NOT NULL,
	"checked_at" text DEFAULT (now() at time zone 'utc') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clothing_items" ADD COLUMN "price_checked_at" text;--> statement-breakpoint
ALTER TABLE "clothing_items" ADD COLUMN "target_price" integer;--> statement-breakpoint
ALTER TABLE "price_points" ADD CONSTRAINT "price_points_item_id_clothing_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."clothing_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "price_points_item_checked_idx" ON "price_points" USING btree ("item_id","checked_at");