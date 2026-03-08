# Outfitted

> **AI-powered digital wardrobe & personal stylist.** Digitize your closet, build your style profile, and let AI dress you every morning.

Built for **Hack Canada** — targeting four tracks: **Best Use of Auth0**, **Best Use of Cloudinary**, **Best Use of Google Gemini API**, and **[MLH] Best Use of Solana**.

---

## What It Is

Outfitted is a high-end web app where users photograph their clothing. The app strips the background via AI and stores every piece in a sleek virtual closet. Items can be marked as **Owned** (in your physical closet) or **Wishlisted** (items you want). From there, a Gemini-powered stylist reads your style profile and assembles curated outfit flatlay cards using only your owned items — and Solana records ownership of those items on-chain.

---

## Tech Stack

| Layer | Tools |
|---|---|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Zustand |
| **Backend** | Next.js API Routes, Drizzle ORM, PostgreSQL |
| **Auth** | Auth0 |
| **Media & AI Cutout** | Cloudinary (AI Background Removal) |
| **Outfit AI** | Google Gemini API |
| **Blockchain** | Solana (devnet) — `@solana/web3.js`, wallet adapters |

---

## UI/UX Design Language

- **Aesthetic:** Minimalist Luxury — dark mode by default
- **Style:** Glassmorphism (frosted overlays), masonry/grid layouts, bold typography
- **Palette:** Monochrome with subtle gold or neon accents — premium fashion platform energy

---

## How It Works

### 1. Landing & Auth
A high-conversion landing page. Users hit **Get Started** and are routed through Auth0 for secure sign-up or login.

### 2. Onboarding & Vibe Check
First-time users go through a two-part onboarding flow:

- **The Guide** — A skippable tutorial with tips for photographing clothes (flat surface, good lighting, contrasting background).
- **The Questionnaire** — A 5–10 question multi-step form covering personal style, vibe, fit preferences, and typical occasions.
- **The Result** — Answers compile into a single **User Style string** saved to their profile, which becomes the AI's context.

### 3. The Wardrobe
The core engine:

1. **Upload** — Drag-and-drop clothing photos from phone or computer.
2. **Tag** — Each item is marked as **Owned** (you have it) or **Wishlisted** (you want it).
3. **Process** — The image is sent to Cloudinary, which returns a clean transparent PNG via AI background removal.
4. **On-Chain** — Owned items are minted as lightweight NFTs on Solana devnet, creating a verifiable ownership record.
5. **Display** — Items are laid over glassmorphic cards in a filterable grid. Filter by category, status (Owned/Wishlisted), wear frequency, or search by notes.

### 4. The Outfits
Where the magic happens:

1. **The Brains** — Backend sends the User Style string + **owned** wardrobe items to the Gemini API. Wishlisted items are excluded — you can't wear what you don't have.
2. **The Output** — Gemini returns outfit groupings (item IDs) with a 2-sentence stylist explanation for each look.
3. **The Canvas** — The frontend assembles the transparent PNGs into a beautiful e-commerce-style flatlay **Outfit Card** using CSS Grid.

### 5. The Profile
The user's identity hub:

- Manage account & logout
- View **Style Badges** generated from their questionnaire (e.g., *"Streetwear Minimalist"*, *"Corporate Goth"*)
- Retake the questionnaire anytime to update the AI stylist's parameters

---

## Project Structure

```
outfitted/
├── frontend/     # Next.js app
└── backend/      # API routes & DB layer
```

---

## Getting Started

> Setup instructions coming soon. The app requires Auth0, Cloudinary, Google Gemini API keys, a local PostgreSQL instance, and a Solana wallet (Phantom recommended) connected to devnet.

---

## Hackathon Tracks

| Track | Integration |
|---|---|
| **Best Use of Auth0** | Secure authentication & user session management |
| **Best Use of Cloudinary** | AI background removal on clothing uploads |
| **Best Use of Google Gemini API** | LLM-powered outfit generation & style badge creation |
| **[MLH] Best Use of Solana** | On-chain ownership records for wardrobe items (NFT minting on devnet) |
