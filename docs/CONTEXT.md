# Outfitted — Full Project Context & Scope

> This document is the single source of truth for all LLMs working on this codebase.
> It covers architecture, design language, component scope, API integrations, and implementation constraints.
> Read this before writing any code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design System & UI Language](#2-design-system--ui-language)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Auth0 Integration](#5-auth0-integration)
6. [Zustand Global Store](#6-zustand-global-store)
7. [Onboarding Flow](#7-onboarding-flow)
8. [Wardrobe Section](#8-wardrobe-section)
9. [Outfit Cards — CSS Compositing Engine](#9-outfit-cards--css-compositing-engine)
10. [Profile Page](#10-profile-page)
11. [Database Schema (Drizzle + PostgreSQL)](#11-database-schema-drizzle--postgresql)
12. [Cloudinary Upload Pipeline](#12-cloudinary-upload-pipeline)
13. [Gemini API — Outfit Generation](#13-gemini-api--outfit-generation)
14. [Solana Integration — On-Chain Ownership](#14-solana-integration--on-chain-ownership)
15. [API Route Reference](#15-api-route-reference)
16. [Credentials & Environment Variables](#16-credentials--environment-variables)
17. [Hackathon Constraints & Shortcuts](#17-hackathon-constraints--shortcuts)

---

## 1. Project Overview

**Outfitted** is a high-end, AI-powered digital wardrobe and personal stylist web app.

Users photograph their real-life clothing items, upload them, and the app automatically strips the background using Cloudinary AI. The resulting transparent PNGs are stored in a virtual closet. A Gemini-powered AI stylist reads the user's style profile and assembles curated daily outfit combinations, displayed as beautiful flatlay "Outfit Cards."

**Hackathon:** Hack Canada
**Time Limit:** 14 hours
**Target Tracks:**
- Best Use of Auth0
- Best Use of Cloudinary
- Best Use of Google Gemini API
- [MLH] Best Use of Solana

---

## 2. Design System & UI Language

Every component, every page, and every animation must conform to this aesthetic. Do not deviate.

### Aesthetic: Minimalist Luxury

| Property | Value |
|---|---|
| **Color Mode** | Dark mode by default, always |
| **Primary Style** | Glassmorphism — frosted overlays with `backdrop-filter: blur` |
| **Layouts** | Masonry grids, clean CSS Grid, bold typographic hierarchy |
| **Palette** | Monochrome (blacks, deep greys, off-whites) |
| **Accents** | Subtle **gold** (`#C9A84C`, `#FFD700`) or **neon** (`#39FF14`, soft electric blues) |
| **Typography** | Bold, editorial. Large headings. Tight letter-spacing on labels. |
| **Animations** | Smooth, subtle. `transition-all duration-300 ease-in-out`. No jarring snaps. |
| **Borders** | `border border-white/10` or `border border-gold/20`. Thin, refined. |
| **Shadows** | Soft glows. `shadow-lg shadow-black/50`. No hard drop shadows. |

### Glassmorphism Recipe (Tailwind)

```tsx
// Standard glassmorphic card
className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl"

// Elevated glassmorphic card
className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-black/40"
```

### Component Rules
- Use **shadcn/ui** components as the base for all interactive elements (Cards, Buttons, Inputs, Dialogs, Badges).
- Use **Lucide Icons** for all iconography — no other icon libraries.
- All buttons must have hover states with subtle glow or border transitions.
- Loading states must use a glassmorphic spinner overlay, never a plain browser spinner.

---

## 3. Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| **Next.js 14+ (App Router)** | Framework, routing, SSR/SSG |
| **TypeScript** | Type safety across all files |
| **Tailwind CSS** | All styling — utility-first, no CSS modules |
| **shadcn/ui** | Base component library (Cards, Buttons, Inputs, Badges, Dialogs) |
| **Lucide Icons** | All icons |
| **Zustand** | Global client state — wardrobe items, outfits, filters, user profile |

### Backend
| Tool | Purpose |
|---|---|
| **Next.js API Routes** | All backend logic lives in `app/api/` |
| **Drizzle ORM** | Type-safe DB queries |
| **PostgreSQL** | Database, running locally via pgAdmin |

### External APIs
| API | Purpose |
|---|---|
| **Auth0** | Authentication — login, signup, session management |
| **Cloudinary** | Image hosting + AI Background Removal add-on |
| **Google Gemini API** | LLM-powered outfit generation and style badge creation |
| **Solana (devnet)** | On-chain ownership records for wardrobe items via NFT minting |

### Solana Packages
```bash
npm install @solana/web3.js @solana/spl-token @metaplex-foundation/js
```

---

## 4. Project Structure

```
outfitted/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with Auth0Provider
│   │   ├── page.tsx                # Landing page
│   │   ├── wardrobe/
│   │   │   └── page.tsx            # Wardrobe grid + upload
│   │   ├── outfits/
│   │   │   └── page.tsx            # Outfit cards display
│   │   ├── profile/
│   │   │   └── page.tsx            # Profile + style badges
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...auth0]/
│   │       │       └── route.ts    # Auth0 handler
│   │       ├── upload/
│   │       │   └── route.ts        # Cloudinary upload pipeline
│   │       ├── generate-outfits/
│   │       │   └── route.ts        # Gemini outfit generation (owned items only)
│   │       ├── onboarding/
│   │       │   └── route.ts        # Save style string on first login
│   │       ├── user/
│   │       │   └── route.ts        # Get/update user profile
│   │       └── solana/
│   │           ├── mint/
│   │           │   └── route.ts    # Mint owned item as NFT on Solana devnet
│   │           └── wallet/
│   │               └── route.ts    # Link/get user's Solana wallet address
│   ├── components/
│   │   ├── onboarding/
│   │   │   └── OnboardingFlow.tsx  # Multi-step onboarding modal
│   │   ├── wardrobe/
│   │   │   ├── UploadButton.tsx    # Image file input + POST to /api/upload
│   │   │   └── WardrobeGrid.tsx    # Masonry/grid of clothing items
│   │   ├── outfits/
│   │   │   └── OutfitCard.tsx      # CSS compositing flatlay card
│   │   └── ui/                     # shadcn/ui generated components
│   ├── store/
│   │   └── useAppStore.ts          # Zustand global store
│   ├── lib/
│   │   ├── db.ts                   # Drizzle DB connection
│   │   └── schema.ts               # Drizzle schema definition
│   └── middleware.ts               # Auth0 route protection middleware
```

---

## 5. Auth0 Integration

### Overview
Auth0 handles all authentication. We use the `@auth0/nextjs-auth0` package. Session is managed server-side via HTTP-only cookies.

### Required Package
```bash
npm install @auth0/nextjs-auth0
```

### API Route Handler
File: `app/api/auth/[auth0]/route.ts`

```ts
import { handleAuth } from "@auth0/nextjs-auth0";
export const GET = handleAuth();
```

This single route handles: `/api/auth/login`, `/api/auth/logout`, `/api/auth/callback`, `/api/auth/me`.

### Root Layout Wrapper
File: `app/layout.tsx`

```tsx
import { UserProvider } from "@auth0/nextjs-auth0/client";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
```

### Reading Auth State (Client Components)
```tsx
import { useUser } from "@auth0/nextjs-auth0/client";

const { user, isLoading } = useUser();
// user.sub is the Auth0 user ID (maps to auth0_id in DB)
// user.name, user.email, user.picture available
```

### Middleware Route Protection
File: `middleware.ts` at root of `frontend/`

```ts
import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";

export default withMiddlewareAuthRequired();

export const config = {
  matcher: ["/wardrobe/:path*", "/outfits/:path*", "/profile/:path*"],
};
```

### First-Login Detection
After Auth0 callback, check the DB for the user's `auth0_id`. If no record exists → new user → trigger Onboarding Flow. If record exists but `style_string` is null/empty → also trigger onboarding.

---

## 6. Zustand Global Store

File: `store/useAppStore.ts`

### Store Shape

```ts
import { create } from "zustand";

// Types
export type WardrobeItem = {
  id: string;
  cloudinary_url: string;
  category: "top" | "bottom" | "shoes" | "outerwear" | "accessory";
  status: "owned" | "wishlisted"; // owned = in physical closet, wishlisted = want to buy
  wear_level: number; // 1-5 scale (only meaningful for owned items)
  notes: string;
  user_id: string;
  nft_mint_address: string | null; // Solana NFT mint address, set after on-chain mint (owned items only)
};

export type GeneratedOutfit = {
  id: string;
  item_ids: string[];
  items: WardrobeItem[];  // populated after fetch
  explanation: string;
  outfit_description: string;
};

export type UserProfile = {
  auth0_id: string;
  name: string;
  email: string;
  picture: string;
  style_string: string;
  has_completed_onboarding: boolean;
};

// Store interface
type AppStore = {
  // User
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;

  // Wardrobe
  wardrobeItems: WardrobeItem[];
  setWardrobeItems: (items: WardrobeItem[]) => void;
  addWardrobeItem: (item: WardrobeItem) => void;

  // Outfits
  generatedOutfits: GeneratedOutfit[];
  setGeneratedOutfits: (outfits: GeneratedOutfit[]) => void;
  isGeneratingOutfits: boolean;
  setIsGeneratingOutfits: (val: boolean) => void;

  // Filters (Wardrobe)
  activeCategory: string | null;  // null = "All"
  setActiveCategory: (category: string | null) => void;
  activeStatus: "owned" | "wishlisted" | null;  // null = show all
  setActiveStatus: (status: "owned" | "wishlisted" | null) => void;

  // Onboarding
  showOnboarding: boolean;
  setShowOnboarding: (val: boolean) => void;

  // Solana
  solanaWalletAddress: string | null;
  setSolanaWalletAddress: (address: string | null) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),

  wardrobeItems: [],
  setWardrobeItems: (items) => set({ wardrobeItems: items }),
  addWardrobeItem: (item) =>
    set((state) => ({ wardrobeItems: [...state.wardrobeItems, item] })),

  generatedOutfits: [],
  setGeneratedOutfits: (outfits) => set({ generatedOutfits: outfits }),
  isGeneratingOutfits: false,
  setIsGeneratingOutfits: (val) => set({ isGeneratingOutfits: val }),

  activeCategory: null,
  setActiveCategory: (category) => set({ activeCategory: category }),
  activeStatus: null,
  setActiveStatus: (status) => set({ activeStatus: status }),

  showOnboarding: false,
  setShowOnboarding: (val) => set({ showOnboarding: val }),

  solanaWalletAddress: null,
  setSolanaWalletAddress: (address) => set({ solanaWalletAddress: address }),
}));
```

### Usage Pattern
Never pass props for global state. Always read directly from the store:

```tsx
const { wardrobeItems, activeCategory, activeStatus } = useAppStore();
const filtered = wardrobeItems
  .filter(i => activeCategory ? i.category === activeCategory : true)
  .filter(i => activeStatus ? i.status === activeStatus : true);
```

---

## 7. Onboarding Flow

### Trigger Condition
Show the `OnboardingFlow` modal **only** when:
- User has just completed Auth0 login
- AND `user.has_completed_onboarding === false` (check from DB)

### Component: `OnboardingFlow.tsx`

A full-screen modal overlay (glassmorphic backdrop). Renders one step at a time. Has a progress indicator (dots or a thin top bar). Has a "Skip" button available at all times (skipping sets a default style string).

### Step Structure

| Step | Type | Content |
|---|---|---|
| **1** | Guide | Welcome screen — "Welcome to Outfitted. Let's build your virtual closet." Bold headline, short subtext. |
| **2** | Guide | "How to photograph your clothes" — Tips: flat surface, good lighting (near a window), solid contrasting background, item fully in frame. Include icons or a simple illustration mockup. |
| **3** | Guide | "How AI styling works" — Explain the Gemini stylist reads their wardrobe + profile to build outfits. Set expectations. |
| **4** | Questionnaire | "What's your overall vibe?" — Multiple choice: Streetwear, Minimalist, Preppy, Bohemian, Corporate, Eclectic |
| **5** | Questionnaire | "How do you like your fits?" — Multiple choice: Oversized, Slim/Fitted, Relaxed, Tailored |
| **6** | Questionnaire | "What occasions do you dress for most?" — Multi-select: Casual, Work, Nightlife, Gym, Formal |
| **7** | Questionnaire | "Pick 2-3 colors you wear most" — Color swatches (black, white, navy, grey, brown, green, red, etc.) |
| **8** | Questionnaire | "Any style icons or brands you love?" — Free text input (optional) |

### Style String Assembly
After Step 8 (or on skip), concatenate answers into a single descriptive string:

```ts
const styleString = `Vibe: ${vibe}. Fit preference: ${fit}. Occasions: ${occasions.join(", ")}. Preferred colors: ${colors.join(", ")}. Influences: ${influences || "None specified"}.`;
// Example output:
// "Vibe: Minimalist. Fit preference: Slim/Fitted. Occasions: Work, Casual. Preferred colors: black, white, navy. Influences: Acne Studios, Bottega Veneta."
```

### API Call on Completion
```ts
await fetch("/api/onboarding", {
  method: "POST",
  body: JSON.stringify({ style_string: styleString }),
  headers: { "Content-Type": "application/json" },
});
```

The backend saves `style_string` to the `users` table and sets `has_completed_onboarding = true`.

---

## 8. Wardrobe Section

### Page: `app/wardrobe/page.tsx`

The wardrobe page has two zones:
1. Top: Category filter pills + Upload button
2. Main: Responsive grid of clothing items

### Component: `UploadButton.tsx`

- A styled button that opens a hidden `<input type="file" accept="image/*">`.
- Before upload, prompt the user to select **Owned** or **Wishlisted** (a two-button toggle or a small modal). This is required — do not default silently.
- On file select: show a glassmorphic full-screen loading overlay with a spinner and "Processing..." text.
- POST the file as `FormData` to `/api/upload` — include the `status` field.
- On success:
  - Call `addWardrobeItem(newItem)` from the Zustand store.
  - If `status === "owned"`, trigger a Solana mint call to `/api/solana/mint` (fire-and-forget is acceptable for demo; update item's `nft_mint_address` in store when complete).
- On error: show a toast notification (use shadcn/ui `toast`).

```tsx
const handleUpload = async (file: File, status: "owned" | "wishlisted") => {
  setIsLoading(true);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("status", status);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const newItem = await res.json();
  addWardrobeItem(newItem);

  // Kick off Solana mint for owned items (non-blocking)
  if (status === "owned" && solanaWalletAddress) {
    fetch("/api/solana/mint", {
      method: "POST",
      body: JSON.stringify({ itemId: newItem.id, walletAddress: solanaWalletAddress }),
      headers: { "Content-Type": "application/json" },
    });
  }

  setIsLoading(false);
};
```

### Component: `WardrobeGrid.tsx`

- Reads `wardrobeItems` and `activeCategory` from Zustand.
- Filters items client-side.
- Renders items in a responsive CSS grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`.
- Each item card:
  - White or near-white background (`bg-white` or `bg-zinc-50`) so transparent PNGs pop against the dark page.
  - Rounded corners, subtle border.
  - The clothing image fills the card (object-contain).
  - On hover: reveal a small overlay with item details (category, wear level, notes).
  - A small category badge in the corner.

### Category Filter Pills
```tsx
const categories = ["All", "Tops", "Bottoms", "Shoes", "Outerwear", "Accessories"];
// Render as pill buttons that set activeCategory in Zustand
```

### Owned / Wishlisted Toggle
A secondary filter row (below categories) with two pill buttons: **Owned** and **Wishlisted**. Selecting one sets `activeStatus` in Zustand. Deselecting returns to showing all.

Visual distinction on item cards:
- **Owned** items: show a small gold checkmark badge (`✓ Owned`)
- **Wishlisted** items: show a small neon heart/bookmark badge (`♡ Wishlist`)

---

## 9. Outfit Cards — CSS Compositing Engine

### Critical Constraint
**Do NOT use HTML5 Canvas.** All outfit rendering is done purely with CSS — Grid, Flexbox, and absolute positioning.

### Component: `OutfitCard.tsx`

**Props:**
```ts
type OutfitCardProps = {
  outfit: GeneratedOutfit; // contains items[] with cloudinary_url
  explanation: string;     // 2-sentence AI explanation
};
```

**Layout Logic:**
The card uses a defined grid layout to position items like a fashion flatlay:

```
┌─────────────────────────────┐
│  [TOP ITEM]    [OUTERWEAR]  │  ← upper row, side by side
│  [BOTTOM ITEM] [SHOES]      │  ← lower row, side by side
└─────────────────────────────┘
```

Implemented with CSS Grid `grid-template-areas` or absolute positioning:

```tsx
// Card container
<div className="relative w-full aspect-[3/4] bg-white rounded-2xl overflow-hidden">
  {/* Top item - upper left */}
  <div className="absolute top-4 left-4 w-[45%] h-[45%]">
    <Image src={topItem.cloudinary_url} fill style={{ objectFit: "contain" }} alt="Top" />
  </div>
  {/* Bottom item - lower left */}
  <div className="absolute bottom-4 left-4 w-[45%] h-[45%]">
    <Image src={bottomItem.cloudinary_url} fill style={{ objectFit: "contain" }} alt="Bottom" />
  </div>
  {/* Shoes - lower right */}
  <div className="absolute bottom-4 right-4 w-[40%] h-[35%]">
    <Image src={shoesItem.cloudinary_url} fill style={{ objectFit: "contain" }} alt="Shoes" />
  </div>
  {/* AI Explanation overlay at bottom */}
  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-3">
    <p className="text-white text-xs leading-relaxed">{explanation}</p>
  </div>
</div>
```

**Fallback:** If an outfit has fewer items, center the available items gracefully. Never show broken layout.

**Card Wrapper (dark mode context):**
The OutfitCard sits inside a dark page, so the white card background makes the transparent clothes pop visually — this is the core visual trick.

---

## 10. Profile Page

### Page: `app/profile/page.tsx`

Sections:
1. **Account Info** — Avatar (from Auth0 `user.picture`), Name, Email. A "Logout" button that calls `/api/auth/logout`.
2. **Style DNA** — Display the raw `style_string` in a styled quote block.
3. **Style Badges** — Dynamically generated badges derived from the `style_string`. Parse the string to extract keywords and render them as shadcn/ui `<Badge>` components with gold accent styling.
4. **Re-calibrate** — A button labeled "Update My Style Profile" that triggers the Onboarding questionnaire (steps 4-8 only, skip the guide) again. On completion, POSTs updated `style_string` to `/api/user`.

### Style Badge Generation Logic
```ts
// Simple client-side badge extraction from style_string
const generateBadges = (styleString: string): string[] => {
  const badges: string[] = [];
  if (styleString.includes("Minimalist")) badges.push("Minimalist");
  if (styleString.includes("Streetwear")) badges.push("Streetwear");
  if (styleString.includes("Slim/Fitted")) badges.push("Slim Fit");
  if (styleString.includes("Oversized")) badges.push("Oversized");
  if (styleString.includes("Work") || styleString.includes("Formal")) badges.push("Office-Ready");
  if (styleString.includes("Nightlife")) badges.push("Night Out");
  // ... etc
  return badges;
};
```

---

## 11. Database Schema (Drizzle + PostgreSQL)

File: `lib/schema.ts`

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| `auth0_id` | `varchar(255)` | **Primary Key** — from `user.sub` |
| `email` | `varchar(255)` | |
| `name` | `varchar(255)` | |
| `style_string` | `text` | Nullable — set after onboarding |
| `has_completed_onboarding` | `boolean` | Default: `false` |
| `solana_wallet_address` | `varchar(255)` | Nullable — linked Phantom/Solflare wallet pubkey |
| `created_at` | `timestamp` | Default: `now()` |

#### `items`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary Key, `defaultRandom()` |
| `user_id` | `varchar(255)` | FK → `users.auth0_id` |
| `cloudinary_url` | `text` | URL of processed PNG |
| `cloudinary_public_id` | `varchar(255)` | For deletion |
| `category` | `varchar(50)` | `top`, `bottom`, `shoes`, `outerwear`, `accessory` |
| `status` | `varchar(20)` | `owned` or `wishlisted` — **required on upload** |
| `wear_level` | `integer` | 1–5 scale (relevant for owned items only) |
| `notes` | `text` | User-added notes |
| `nft_mint_address` | `varchar(255)` | Nullable — Solana NFT mint pubkey (owned items only) |
| `created_at` | `timestamp` | Default: `now()` |

#### `outfits`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary Key, `defaultRandom()` |
| `user_id` | `varchar(255)` | FK → `users.auth0_id` |
| `outfit_description` | `text` | AI-generated name/description |
| `item_ids` | `text[]` | Array of item UUIDs (PostgreSQL array) |
| `explanation` | `text` | AI 2-sentence style explanation |
| `created_at` | `timestamp` | Default: `now()` |

### Drizzle Schema Code

```ts
import { pgTable, varchar, text, boolean, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  auth0_id: varchar("auth0_id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }),
  style_string: text("style_string"),
  has_completed_onboarding: boolean("has_completed_onboarding").default(false),
  solana_wallet_address: varchar("solana_wallet_address", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: varchar("user_id", { length: 255 }).references(() => users.auth0_id),
  cloudinary_url: text("cloudinary_url").notNull(),
  cloudinary_public_id: varchar("cloudinary_public_id", { length: 255 }),
  category: varchar("category", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("owned"), // "owned" | "wishlisted"
  wear_level: integer("wear_level").default(1),
  notes: text("notes"),
  nft_mint_address: varchar("nft_mint_address", { length: 255 }), // Solana mint pubkey
  created_at: timestamp("created_at").defaultNow(),
});

export const outfits = pgTable("outfits", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: varchar("user_id", { length: 255 }).references(() => users.auth0_id),
  outfit_description: text("outfit_description"),
  item_ids: text("item_ids").array(),
  explanation: text("explanation"),
  created_at: timestamp("created_at").defaultNow(),
});
```

---

## 12. Cloudinary Upload Pipeline

### API Route: `app/api/upload/route.ts`

**Method:** POST
**Input:** `FormData` with a `file` field (image)
**Output:** JSON with the new `WardrobeItem` record

### Flow
1. Parse `FormData`, extract the file.
2. Upload to Cloudinary with `background_removal: "cloudinary_ai"`.
3. **Critical fallback:** If background removal fails, use the standard image URL.
4. Save the resulting URL to the `items` table in PostgreSQL.
5. Return the new item record as JSON.

### Cloudinary Configuration
```ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

### Background Removal Constraint
- We have **15 free background removal credits** total — use them carefully during development.
- The `eager` transformation with `background_removal` is async on free plans — handle the `eager` result carefully.
- Fallback: if `result.eager` is undefined or errors, use `result.secure_url` (the plain uploaded image).

### Upload with Background Removal
```ts
const result = await new Promise((resolve, reject) => {
  cloudinary.uploader.upload_stream(
    {
      folder: "outfitted",
      background_removal: "cloudinary_ai",
      // eager: [{ background_removal: "cloudinary_ai" }] // alternative
    },
    (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }
  ).end(buffer);
});

// Fallback logic
const finalUrl = result.eager?.[0]?.secure_url ?? result.secure_url;
```

---

## 13. Gemini API — Outfit Generation

### API Route: `app/api/generate-outfits/route.ts`

**Method:** POST (or GET with auth via session)
**Output:** JSON with array of 3 generated outfits

### SDK
```bash
npm install @google/generative-ai
```

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

### Owned Items Filter
**Critical:** Only pass `status === "owned"` items to Gemini. Wishlisted items are aspirational — the user cannot wear them yet.

```ts
const ownedItems = wardrobeItems.filter(item => item.status === "owned");
// Also warn if fewer than 3 owned items — return early with a helpful message
if (ownedItems.length < 3) {
  return NextResponse.json({ error: "not_enough_items", message: "Add at least 3 owned items to generate outfits." }, { status: 400 });
}
```

### Prompt Structure
```ts
const prompt = `
You are a luxury fashion stylist AI. Your client has the following style profile:
"${user.style_string}"

Their owned wardrobe contains these items (JSON):
${JSON.stringify(ownedItems, null, 2)}

Generate exactly 3 outfit combinations from these items.

Respond ONLY with valid JSON in this exact format:
{
  "outfits": [
    {
      "outfit_description": "Short, stylish outfit name (e.g., 'Quiet Luxury Monday')",
      "item_ids": ["uuid1", "uuid2", "uuid3"],
      "explanation": "Two sentences max. Explain why this outfit works for their specific vibe and when to wear it."
    }
  ]
}

Rules:
- Only use item IDs that exist in the wardrobe JSON above.
- Each outfit should have 2-4 items.
- Vary the outfits — don't repeat the same items across all three.
- Match the user's stated style profile.
- The explanation must feel like it's written by a high-end personal stylist.
`;
```

### Response Parsing
```ts
const result = await model.generateContent(prompt);
const text = result.response.text();

// Strip markdown code blocks if Gemini wraps in ```json
const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
const parsed = JSON.parse(cleaned);
```

### Saving Outfits to DB
After parsing, save each outfit to the `outfits` table and return the full array.

---

## 14. Solana Integration — On-Chain Ownership

### Track Goal
Use Solana's high-throughput, near-zero-fee network to record clothing ownership on-chain. Every item marked **Owned** gets minted as a compressed NFT (or a simple SPL token) on Solana devnet — creating a verifiable, permanent ownership record. This is the core Solana story: your wardrobe, on-chain.

### Why It Fits
- **Owned items** = real clothes in your closet → mint an NFT to prove it
- **Wishlisted items** = aspirational → stay off-chain in the DB only
- When a wishlisted item is later marked as Owned (user bought it), trigger the mint at that point

### Packages
```bash
npm install @solana/web3.js @solana/spl-token @metaplex-foundation/js
```

### Wallet Connection (Frontend)
Users connect their Solana wallet (Phantom, Solflare) via the wallet adapter. On first connect, save the public key to the DB via `PATCH /api/solana/wallet`.

```tsx
// In profile page or a "Connect Wallet" button in the nav
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Once connected:
const { publicKey } = useWallet();
// Save to DB: PATCH /api/solana/wallet { walletAddress: publicKey.toString() }
// Save to Zustand: setSolanaWalletAddress(publicKey.toString())
```

### API Route: `POST /api/solana/mint`

**Input:**
```ts
{
  itemId: string;         // UUID of the wardrobe item
  walletAddress: string;  // User's Solana public key (recipient)
}
```

**Flow:**
1. Get the item from the DB — verify it belongs to the authenticated user and `status === "owned"`.
2. Get the item's `cloudinary_url` as the NFT image/metadata URI.
3. Create a connection to Solana devnet.
4. Use a backend keypair (funded devnet wallet) as the fee payer/mint authority.
5. Mint a compressed NFT or a simple SPL token representing the item.
6. Update the item's `nft_mint_address` in the DB.
7. Return the mint address and explorer URL.

**Implementation (Simple SPL Token approach for hackathon speed):**
```ts
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { createMint, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Backend payer keypair — funded devnet wallet
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.SOLANA_PAYER_PRIVATE_KEY!))
);

const userPubkey = new PublicKey(walletAddress);

// Create mint (1 token = 1 item ownership)
const mint = await createMint(connection, payer, payer.publicKey, null, 0);

// Create recipient token account
const tokenAccount = await getOrCreateAssociatedTokenAccount(
  connection, payer, mint, userPubkey
);

// Mint exactly 1 token to the user's wallet
await mintTo(connection, payer, mint, tokenAccount.address, payer, 1);

// Save mint.toBase58() as nft_mint_address in the items table
```

**Output:**
```json
{
  "mintAddress": "AbcXyz...",
  "explorerUrl": "https://explorer.solana.com/address/AbcXyz...?cluster=devnet",
  "itemId": "uuid-here"
}
```

### API Route: `PATCH /api/solana/wallet`

Save a user's connected wallet address to the DB.

**Input:** `{ walletAddress: string }`
**Action:** Update `users.solana_wallet_address` for the authenticated user.

### API Route: `GET /api/solana/wallet`

Return the user's linked wallet address and a list of their minted item mint addresses (joined from the `items` table).

### Environment Variable
```env
# A devnet Solana keypair (JSON array of 64 numbers) — fund it with devnet SOL via faucet
SOLANA_PAYER_PRIVATE_KEY=[1,2,3,...] # 64 numbers
```

Fund the payer wallet:
```bash
solana airdrop 2 <PAYER_PUBKEY> --url devnet
```

### Demo Story
For the demo: upload an item, mark it Owned, and show the Solana Explorer link to the minted token — proof that the item's ownership is recorded immutably on-chain. This is the "wow" moment for the Solana track.

---

## 15. API Route Reference

| Method | Route | Purpose | Auth Required |
|---|---|---|---|
| `GET` | `/api/auth/[auth0]` | Auth0 handler (login, logout, callback, me) | No |
| `POST` | `/api/onboarding` | Save `style_string` after questionnaire | Yes |
| `GET` | `/api/user` | Fetch user profile + check onboarding status | Yes |
| `PATCH` | `/api/user` | Update `style_string` (re-calibrate) | Yes |
| `POST` | `/api/upload` | Upload image to Cloudinary, save item to DB (include `status` field) | Yes |
| `GET` | `/api/wardrobe` | Fetch all wardrobe items for current user | Yes |
| `PATCH` | `/api/wardrobe/[id]` | Update item status (e.g., wishlisted → owned) + trigger mint | Yes |
| `DELETE` | `/api/wardrobe/[id]` | Delete a wardrobe item | Yes |
| `POST` | `/api/generate-outfits` | Call Gemini with owned items only, generate outfits, save to DB | Yes |
| `GET` | `/api/outfits` | Fetch saved outfits for current user | Yes |
| `POST` | `/api/solana/mint` | Mint owned item as SPL token on Solana devnet | Yes |
| `GET` | `/api/solana/wallet` | Get user's linked wallet + minted items | Yes |
| `PATCH` | `/api/solana/wallet` | Link user's Solana wallet address to their profile | Yes |

---

## 16. Credentials & Environment Variables

> **HACKATHON ONLY.** Rotate all secrets after the event.

### `.env.local` file (in `frontend/`)

```env
# Auth0
AUTH0_SECRET=use_openssl_rand_hex_32_to_generate
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://adamshaldam.ca.auth0.com
AUTH0_CLIENT_ID=BBXNhOVGlpuZohKa9p6MK85fICUEmFhD
AUTH0_CLIENT_SECRET=fEsuTuGWLMXLBHyC2OZs1AuIvbymUBPI-Q_bdDprPbZ9zZsm46QYO0vHf-AWHkik

# PostgreSQL
DATABASE_URL=postgresql://localhost:5432/outfitted

# Cloudinary
CLOUDINARY_CLOUD_NAME=da6fuzpyp
CLOUDINARY_API_KEY=427842624251227
CLOUDINARY_API_SECRET=gESLE1MCxM2KBxE3JbHPt7x4tnU

# Google Gemini
GEMINI_API_KEY=AIzaSyCg4Z_Vzgx6czeFvnVGrFbd6g39qxl7G_U

# Solana (devnet payer keypair — JSON array of 64 numbers)
# Generate with: solana-keygen new --outfile payer.json
# Fund with:     solana airdrop 2 <PUBKEY> --url devnet
SOLANA_PAYER_PRIVATE_KEY=[1,2,3,...]
```

### Auth0 App Settings (Dashboard)
- **Application Type:** Regular Web Application
- **Allowed Callback URLs:** `http://localhost:3000/api/auth/callback`
- **Allowed Logout URLs:** `http://localhost:3000`
- **Allowed Web Origins:** `http://localhost:3000`

---

## 17. Hackathon Constraints & Shortcuts

| Constraint | Decision |
|---|---|
| **No HTML5 Canvas** | CSS Grid + absolute positioning for outfit compositing |
| **15 BG removal credits** | Fallback to raw upload URL if Cloudinary AI errors |
| **Local PostgreSQL** | Use pgAdmin for local DB — no cloud DB setup required |
| **No separate backend server** | Everything runs as Next.js API routes in the same project |
| **Gemini response format** | Always demand strict JSON. Strip code block wrappers before parsing. |
| **Gemini items filter** | Only pass `status === "owned"` items. Wishlisted items are excluded from outfit generation. |
| **Onboarding skip behavior** | Skipping sets a generic default style string: `"Vibe: Classic. Fit preference: Relaxed. Occasions: Casual."` |
| **Outfit fallback** | If user has fewer than 3 owned items, show a placeholder card prompting them to upload more. |
| **Solana network** | Use **devnet** only. Never mainnet during a hackathon. |
| **Solana mint approach** | SPL token (1 token = 1 item) is fastest. Compressed NFTs (Metaplex Bubblegum) are better but more complex. |
| **Solana wallet** | Wallet connection is optional for the user — the app works without it. Minting only triggers if a wallet is linked. |
| **Solana payer** | Use a backend keypair as fee payer. Fund it with `solana airdrop` on devnet. Never expose this key client-side. |

---

## Key Gotchas

- **Auth0 `user.sub`** is the Auth0 ID. This maps to `auth0_id` in your DB. Always use this as the user identifier, never the email.
- **Cloudinary background removal** is asynchronous on free plans. You may need to poll or use webhooks. For the hackathon, use the `eager` param and accept slight delay.
- **Zustand store resets on page refresh.** Fetch wardrobe items from the API on each page load and populate the store in a `useEffect` on the wardrobe page.
- **`getSession()` server-side:** In API routes, use `import { getSession } from "@auth0/nextjs-auth0"` to get the current user's session securely.
- **Drizzle migrations:** Run `npx drizzle-kit push:pg` (or `generate` + `migrate`) to sync schema to the local DB.
- **Gemini model:** Use `gemini-1.5-flash` — it's fastest and most cost-effective for the hackathon.
- **Gemini only sees owned items.** Filter wardrobe items to `status === "owned"` before building the Gemini prompt. Wishlisted items must never appear in generated outfits.
- **`status` field is required on upload.** The `/api/upload` route must reject requests without a valid `status` value (`owned` or `wishlisted`). Default to `owned` in the UI toggle, not silently in the backend.
- **Solana PublicKey serialization:** `PublicKey` objects from `@solana/web3.js` must be converted with `.toString()` or `.toBase58()` before storing in the DB or returning in JSON.
- **Solana devnet airdrop:** Devnet airdrops are rate-limited. Fund the payer wallet early. Keep 1–2 SOL on hand; each mint costs ~0.002 SOL.
- **`nft_mint_address` is nullable.** Items minted successfully will have it set. Items where the user has no wallet linked, or mint failed, will have it as `null`. The app must handle both cases gracefully — never block the UI on mint status.
- **Wallet adapter setup:** The Solana wallet adapter requires `ConnectionProvider` and `WalletProvider` wrapping the app in `layout.tsx`. Configure endpoint to `clusterApiUrl("devnet")`.
- **`next/image` with Cloudinary:** Add `res.cloudinary.com` to the `images.domains` array in `next.config.js`.
