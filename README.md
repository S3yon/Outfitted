# Outfitted

> **AI-powered digital wardrobe & personal stylist.** Digitize your closet, build your style profile, and let AI dress you every morning.

Built for **Hack Canada** — targeting three tracks: **Best Use of Auth0**, **Best Use of Cloudinary**, and **Best Use of Google Gemini API**.

---

## What It Is

Outfitted is a high-end web app inspired by [Indyx](https://www.indyx.com). Users photograph their clothing, the app strips the background via AI, and stores every piece in a sleek virtual closet. From there, a Gemini-powered stylist reads your style profile and assembles curated outfit flatlay cards — daily, automatically.

---

## Tech Stack

| Layer | Tools |
|---|---|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Zustand |
| **Backend** | Next.js API Routes, Drizzle ORM, PostgreSQL |
| **Auth** | Auth0 |
| **Media & AI Cutout** | Cloudinary (AI Background Removal) |
| **Outfit AI** | Google Gemini API |

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
2. **Process** — The image is sent to Cloudinary, which returns a clean transparent PNG via AI background removal.
3. **Display** — Items are laid over glassmorphic cards in a filterable grid. Filter by category (Tops, Bottoms, Shoes, etc.), wear frequency, or search by notes.

### 4. The Outfits
Where the magic happens:

1. **The Brains** — Backend sends the User Style string + wardrobe item metadata to the Gemini API.
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

> Setup instructions coming soon. The app requires Auth0, Cloudinary, and Google Gemini API keys, plus a local PostgreSQL instance.

---

## Hackathon Tracks

| Track | Integration |
|---|---|
| **Best Use of Auth0** | Secure authentication & user session management |
| **Best Use of Cloudinary** | AI background removal on clothing uploads |
| **Best Use of Google Gemini API** | LLM-powered outfit generation & style badge creation |
