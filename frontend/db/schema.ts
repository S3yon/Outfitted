import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const categoryEnum = pgEnum("category", [
  "tops",
  "bottoms",
  "shoes",
  "accessories",
  "outerwear",
]);

export const itemStatusEnum = pgEnum("item_status", ["owned", "wishlisted"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  auth0Id: text("auth0_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  styleProfile: text("style_profile"), // compiled "User Style" string from onboarding
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  solanaWalletAddress: text("solana_wallet_address"), // linked Phantom/Solflare pubkey
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Clothing Items ───────────────────────────────────────────────────────────

export const clothingItems = pgTable("clothing_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cloudinaryUrl: text("cloudinary_url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  category: categoryEnum("category").notNull(),
  status: itemStatusEnum("status").notNull().default("owned"), // owned = in closet, wishlisted = want to buy
  notes: text("notes"),
  wearLevel: integer("wear_level").default(1), // 1–5, meaningful for owned items only
  nftMintAddress: text("nft_mint_address"), // Solana SPL token mint pubkey (owned items only)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Outfits ──────────────────────────────────────────────────────────────────

export const outfits = pgTable("outfits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  explanation: text("explanation").notNull(), // AI-generated 2-sentence styling rationale
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Outfit Items (join table) ────────────────────────────────────────────────

export const outfitItems = pgTable("outfit_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  outfitId: uuid("outfit_id")
    .notNull()
    .references(() => outfits.id, { onDelete: "cascade" }),
  clothingItemId: uuid("clothing_item_id")
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

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ClothingItem = typeof clothingItems.$inferSelect;
export type NewClothingItem = typeof clothingItems.$inferInsert;
export type Outfit = typeof outfits.$inferSelect;
export type NewOutfit = typeof outfits.$inferInsert;
export type OutfitItem = typeof outfitItems.$inferSelect;
export type NewOutfitItem = typeof outfitItems.$inferInsert;
