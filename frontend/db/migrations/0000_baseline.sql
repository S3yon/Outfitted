CREATE TABLE "clothing_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cloudinary_url" text NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'owned' NOT NULL,
	"notes" text,
	"wear_level" integer DEFAULT 1,
	"nft_mint_address" text,
	"brand" text,
	"price" text,
	"product_url" text,
	"solana_tx_signature" text,
	"created_at" text DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" text DEFAULT (now() at time zone 'utc') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"outfit_id" text NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"outfit_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"ticker" text NOT NULL,
	"name" text NOT NULL,
	"current_price" integer DEFAULT 100 NOT NULL,
	"total_supply" integer DEFAULT 10000 NOT NULL,
	"circulating_supply" integer DEFAULT 0 NOT NULL,
	"volume_24h" integer DEFAULT 0 NOT NULL,
	"change_24h" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT (now() at time zone 'utc') NOT NULL,
	CONSTRAINT "market_listings_ticker_unique" UNIQUE("ticker")
);
--> statement-breakpoint
CREATE TABLE "outfit_items" (
	"id" text PRIMARY KEY NOT NULL,
	"outfit_id" text NOT NULL,
	"clothing_item_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"explanation" text NOT NULL,
	"model_image_url" text,
	"season" text,
	"occasion" text,
	"created_at" text DEFAULT (now() at time zone 'utc') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_candles" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"timestamp" integer NOT NULL,
	"open" integer NOT NULL,
	"high" integer NOT NULL,
	"low" integer NOT NULL,
	"close" integer NOT NULL,
	"volume" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"products_json" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"side" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" integer NOT NULL,
	"created_at" text DEFAULT (now() at time zone 'utc') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"auth0_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"style_profile" text,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" text DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" text DEFAULT (now() at time zone 'utc') NOT NULL,
	CONSTRAINT "users_auth0_id_unique" UNIQUE("auth0_id")
);
--> statement-breakpoint
ALTER TABLE "clothing_items" ADD CONSTRAINT "clothing_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_suggestions" ADD CONSTRAINT "daily_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_suggestions" ADD CONSTRAINT "daily_suggestions_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_listing_id_market_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."market_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_clothing_item_id_clothing_items_id_fk" FOREIGN KEY ("clothing_item_id") REFERENCES "public"."clothing_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_candles" ADD CONSTRAINT "price_candles_listing_id_market_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."market_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_cache" ADD CONSTRAINT "recommendation_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_listing_id_market_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."market_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_suggestions_user_date_idx" ON "daily_suggestions" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "rec_cache_user_date_idx" ON "recommendation_cache" USING btree ("user_id","date");