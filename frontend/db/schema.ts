import { relations, sql } from "drizzle-orm";
import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  auth0Id: text("auth0_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  styleProfile: text("style_profile"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(now() at time zone 'utc')`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(now() at time zone 'utc')`),
});

// ─── Clothing Items ───────────────────────────────────────────────────────────

export const clothingItems = pgTable("clothing_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cloudinaryUrl: text("cloudinary_url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  category: text("category").notNull(), // tops, bottoms, shoes, accessories, outerwear
  status: text("status").notNull().default("owned"), // owned | wishlisted
  notes: text("notes"),
  wearLevel: integer("wear_level").default(1),
  nftMintAddress: text("nft_mint_address"),
  brand: text("brand"),
  price: text("price"),
  productUrl: text("product_url"),
  solanaTxSignature: text("solana_tx_signature"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(now() at time zone 'utc')`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(now() at time zone 'utc')`),
});

// ─── Outfits ──────────────────────────────────────────────────────────────────

export const outfits = pgTable("outfits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  explanation: text("explanation").notNull(),
  modelImageUrl: text("model_image_url"),
  season: text("season"),
  occasion: text("occasion"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(now() at time zone 'utc')`),
});

// ─── Outfit Items (join table) ────────────────────────────────────────────────

export const outfitItems = pgTable("outfit_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  outfitId: text("outfit_id")
    .notNull()
    .references(() => outfits.id, { onDelete: "cascade" }),
  clothingItemId: text("clothing_item_id")
    .notNull()
    .references(() => clothingItems.id, { onDelete: "cascade" }),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  clothingItems: many(clothingItems),
  outfits: many(outfits),
}));

export const clothingItemsRelations = relations(clothingItems, ({ one, many }) => ({
  user: one(users, {
    fields: [clothingItems.userId],
    references: [users.id],
  }),
  outfitItems: many(outfitItems),
}));

export const outfitsRelations = relations(outfits, ({ one, many }) => ({
  user: one(users, {
    fields: [outfits.userId],
    references: [users.id],
  }),
  outfitItems: many(outfitItems),
}));

export const outfitItemsRelations = relations(outfitItems, ({ one }) => ({
  outfit: one(outfits, {
    fields: [outfitItems.outfitId],
    references: [outfits.id],
  }),
  clothingItem: one(clothingItems, {
    fields: [outfitItems.clothingItemId],
    references: [clothingItems.id],
  }),
}));

// ─── Market Listings ─────────────────────────────────────────────────────────

export const marketListings = pgTable("market_listings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  outfitId: text("outfit_id")
    .notNull()
    .references(() => outfits.id, { onDelete: "cascade" }),
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull().unique(),
  name: text("name").notNull(),
  currentPrice: integer("current_price").notNull().default(100), // in cents
  totalSupply: integer("total_supply").notNull().default(10000),
  circulatingSupply: integer("circulating_supply").notNull().default(0),
  volume24h: integer("volume_24h").notNull().default(0),
  change24h: integer("change_24h").notNull().default(0), // basis points (+250 = +2.5%)
  createdAt: text("created_at")
    .notNull()
    .default(sql`(now() at time zone 'utc')`),
});

// ─── Price History (OHLC candles) ────────────────────────────────────────────

export const priceCandles = pgTable("price_candles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  listingId: text("listing_id")
    .notNull()
    .references(() => marketListings.id, { onDelete: "cascade" }),
  timestamp: integer("timestamp").notNull(), // unix seconds
  open: integer("open").notNull(),
  high: integer("high").notNull(),
  low: integer("low").notNull(),
  close: integer("close").notNull(),
  volume: integer("volume").notNull().default(0),
});

// ─── Holdings ────────────────────────────────────────────────────────────────

export const holdings = pgTable("holdings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  listingId: text("listing_id")
    .notNull()
    .references(() => marketListings.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
});

// ─── Trade History ───────────────────────────────────────────────────────────

export const trades = pgTable("trades", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  listingId: text("listing_id")
    .notNull()
    .references(() => marketListings.id, { onDelete: "cascade" }),
  side: text("side").notNull(), // "buy" | "sell"
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // price per unit at time of trade
  createdAt: text("created_at")
    .notNull()
    .default(sql`(now() at time zone 'utc')`),
});

// ─── Market Relations ────────────────────────────────────────────────────────

export const marketListingsRelations = relations(marketListings, ({ one, many }) => ({
  outfit: one(outfits, {
    fields: [marketListings.outfitId],
    references: [outfits.id],
  }),
  creator: one(users, {
    fields: [marketListings.creatorId],
    references: [users.id],
  }),
  candles: many(priceCandles),
  trades: many(trades),
  holdings: many(holdings),
}));

export const priceCandlesRelations = relations(priceCandles, ({ one }) => ({
  listing: one(marketListings, {
    fields: [priceCandles.listingId],
    references: [marketListings.id],
  }),
}));

export const holdingsRelations = relations(holdings, ({ one }) => ({
  user: one(users, {
    fields: [holdings.userId],
    references: [users.id],
  }),
  listing: one(marketListings, {
    fields: [holdings.listingId],
    references: [marketListings.id],
  }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, {
    fields: [trades.userId],
    references: [users.id],
  }),
  listing: one(marketListings, {
    fields: [trades.listingId],
    references: [marketListings.id],
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ClothingItem = typeof clothingItems.$inferSelect;
export type NewClothingItem = typeof clothingItems.$inferInsert;
export type Outfit = typeof outfits.$inferSelect;
export type NewOutfit = typeof outfits.$inferInsert;
export type OutfitItem = typeof outfitItems.$inferSelect;
export type NewOutfitItem = typeof outfitItems.$inferInsert;
export type MarketListing = typeof marketListings.$inferSelect;
export type PriceCandle = typeof priceCandles.$inferSelect;
export type Holding = typeof holdings.$inferSelect;
export type Trade = typeof trades.$inferSelect;
