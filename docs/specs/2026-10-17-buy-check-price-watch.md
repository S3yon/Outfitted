# Should I buy this? + wishlist price watch

Features #4 and #5 of the portfolio redesign. Branch `feat/buy-check-price-watch`, cut from
`feat/week-planner` (56ec49d). Research: 29 sources (prior art: Phia, Alta, Whering, Indyx,
Gensmo, Daydream, Honey Droplist, Google price insights). The gap it fills: no app shows both
"how many outfits this unlocks with what you own" and "is this a good price right now".

## Goal

Paste a product link and get a verdict (Buy, Skip or Wait) based on your own closet, then watch
the price of anything on your wishlist on the Market chart.

Done when:
- `/buy` reads a pasted product link (or a wishlist item via `?item=<id>`) into title, image,
  price, store and category, with manual entry when a store blocks reading.
- The check shows: outfits it unlocks with owned items (before → after, 3 examples), the closest
  owned item when it looks like a duplicate, estimated cost per wear, a 0-100 score, a
  Buy / Skip / Wait chip and a 2-line reason.
- `Add to wishlist` saves it and starts watching its price.
- Market has an `Outfits | Wishlist` switch. Wishlist lists watched items with current price,
  change and 90-day low; the selected item shows its real price history on the chart (step line,
  all-time low marker, 30-day low line, optional target line).
- Prices refresh when the Wishlist tab is opened (items older than 12 hours, a few per visit) and
  once a day by a Vercel cron. A row is stored only when the price changes.
- A dot on the Market nav tab shows when a watched price dropped since you last looked.
- Unit tests cover the pure logic; `npm run verify` passes; screens are checked by eye at 1440
  and 390 in the KB shots harness with mocked APIs (no paid calls).

## Decisions (Seyon, 2026-10-17)

- **Buy check: rules + embeddings + one free-model verdict.**
- **Link reading: free ladder.** JSON-LD / OpenGraph from the page → Jina Reader → Serper
  shopping by title → manual entry. No paid scraper.
- **Price refresh: on view (older than 12 h) + one daily Vercel cron.**
- **Show + alert: a Wishlist tab on Market with real price history; in-app drop badge only.**

## Assumed (not asked back)

- **Reason model:** the planner's free model config (`PLANNER_BASE_URL`, `PLANNER_MODEL`), no
  tools, one call per check. On 429 or any error the reason is written by a template from the
  same numbers, so the check never fails because of the model.
- **Wait** means the item has price history and today's price is at least 5% above its 30-day
  low. A brand-new link has no history, so it gets Buy or Skip.
- **Server fetches of user URLs are guarded:** http(s) only, ports 80/443, and the host must not
  resolve to a loopback, private, link-local or metadata address. Bodies are capped (HTML 2 MB,
  images 5 MB) with a 10 s timeout.
- **Cost:** Serper is the only paid-per-call step (2,500 free queries). It runs only when both
  the page and Jina fail. Refresh on view does at most 3 items per visit; the cron at most 100
  items per run.
- **Try-on is out of scope:** the try-on route works on a saved outfit, not a single product.
- **Cron:** `vercel.json` runs `GET /api/cron/prices` once a day (Hobby allows daily at most).
  The route requires `Authorization: Bearer $CRON_SECRET`; without the env var it refuses.

## Flow

```
/buy  paste link ─► POST /api/buy/read { url } ─► product (via page | jina | serper | manual)
      image ─► GET /api/buy/image?u= (guarded proxy) ─► FashionSigLIP in the browser ─► vector
      ─► POST /api/buy/check { product, embedding } ─► { outfits, duplicate, costPerWear,
                                                         score, verdict, reason }
      Add to wishlist ─► POST /api/wishlist (+ first price point)

Market ─► Wishlist ─► GET /api/watch ─► refresh ≤ 3 stale items ─► items + price points
cron (daily) ─► GET /api/cron/prices ─► refresh stale items, ≤ 100
```

### The check (pure, `lib/buy/`)

- **Outfits.** An outfit is a top, a bottom and shoes. Outerwear and accessories add to an
  outfit. For a new top: new outfits = bottoms × shoes; bottom: tops × shoes; shoes: tops ×
  bottoms; outerwear or accessory: the number of core outfits it can go over. Before → after is
  the core outfit count with and without the item. Examples: 3 combinations, least-worn items
  first.
- **Duplicate.** Cosine similarity between the product's embedding and owned items of the same
  category. At or above 0.85 (the wear matcher's threshold) it is a duplicate; the closest item
  is shown either way when above 0.75.
- **Cost per wear.** Price ÷ expected wears in a year. Expected wears = the median yearly wear
  rate of owned items in the same category (wears ÷ days owned × 365), or 30 when there is no
  history.
- **Score (0-100).** Starts from new outfits, on the better of two scales: absolute (log, 20
  new outfits ≈ full marks) and relative (doubling what the closet makes = full marks, so small
  closets aren't punished). Minus up to 40 for a look-alike (0.75 → 0.85 similarity), up to 20
  when the category is crowded (4+ items and above the median category size; full at twice),
  up to 20 when cost per wear is over $5 (full at $10).
- **Verdict.** Skip: duplicate, or it unlocks no outfit (with a reason like "you own no
  bottoms"). Wait: price history says it's 5%+ above its 30-day low. Buy: score ≥ 50. Else Skip.

### Price watch (pure, `lib/watch/`)

- `isStale(checkedAt, now, hours)`, `shouldStore(lastPrice, price)` (only on change),
  `summary(points, now)` → current, first, change %, all-time low, 30-day and 90-day lows,
  `dropped` (last point lower than the one before), `droppedSince(points, seenAt)`.
- The chart uses `lightweight-charts` (already a dependency, v4) with a line series in step
  mode, a marker on the all-time low, and price lines for the 30-day low and the target.

## Data

New table `price_points`:

| column | type | note |
|---|---|---|
| `id` | text pk | uuid |
| `item_id` | text fk clothing_items | cascade |
| `price` | integer | cents |
| `currency` | text | e.g. `USD`, null when unknown |
| `source` | text | `page`, `jina`, `serper`, `manual` |
| `checked_at` | text | when this price was first seen |

Index on `(item_id, checked_at)`. New columns on `clothing_items`: `price_checked_at` (text,
null) and `target_price` (integer cents, null). Migration `0004_*` via `drizzle-kit generate`
(offline); applying it waits, like `0001`-`0003`.

## Options considered

| Option | For | Against |
|---|---|---|
| **Rules + embeddings + free verdict (picked)** | Exact, explainable, uses stored embeddings | Colour harmony not modelled |
| Rules only | Free, no quota | Templated reason only |
| Vision model judges all | Most nuanced | 50 free calls/day, not repeatable |
| Learned compatibility model | Most rigorous | Training + hosting, much bigger build |
| **Free extraction ladder (picked)** | $0, reuses Serper | Zara/H&M (Akamai 403) often end at manual |
| Paid scraper last rung (Firecrawl, Diffbot) | Fewer failures | Per-call cost, new key |
| **On view + daily cron (picked)** | Free on Hobby, fresh when you look | Daily at best otherwise |
| GitHub Actions hourly | More points | Runs late, disabled after 60 idle days |
| SerpApi multi-store | Clean data | 250 free/month, then $25/month |
| **Market Wishlist tab, in-app badge (picked)** | Gives the market chart a real job | No alert outside the app |
| Email via Resend | Real alerts | Key and domain setup |

## Files

- `lib/buy/product.ts`: HTML → product from JSON-LD (`Product`, `@graph`, `Offer`,
  `AggregateOffer`) or OpenGraph tags; title from a URL slug (pure).
- `lib/buy/category.ts`: title → category (moved from `app/api/wishlist/route.ts`) (pure).
- `lib/buy/outfits.ts`: outfit counts, unlocks, examples (pure).
- `lib/buy/verdict.ts`: duplicate, cost per wear, score, verdict, templated reason (pure).
- `lib/buy/reason.ts`: the free-model prompt (pure) and call.
- `lib/net/safe-url.ts`: URL and address checks (pure) + guarded fetch.
- `lib/buy/read.ts`: the ladder (page → Jina → Serper), with injected fetchers for tests.
- `lib/watch/history.ts`: stale, store, summary (pure). `lib/watch/refresh.ts`: refresh one item.
- `db/schema.ts` + `db/migrations/0004_*`.
- `app/api/buy/read`, `app/api/buy/image`, `app/api/buy/check`, `app/api/watch`,
  `app/api/watch/[id]` (PATCH target, POST seen), `app/api/cron/prices`. `vercel.json`.
- `app/(app)/buy/page.tsx` + `components/buy/*`. Market: `components/market/watch-*`.
- `components/app-nav.tsx`: drop dot on Market. `proxy.ts`: add `/buy`.
- Wardrobe: a `Should I buy this?` link in the header and `Check` on wishlist items.

## Out of scope

Try-on from the check, email or push alerts, multi-store price comparison, currency conversion
(prices are compared within one item, in its own currency), colour harmony.

## Build order

1. `lib/buy/*`, `lib/watch/history.ts`, `lib/net/safe-url.ts` test-first (`npm test`).
2. Schema + migration 0004 (offline).
3. Routes, then `vercel.json`.
4. `/buy` page, Market Wishlist tab, nav dot, wardrobe links.
5. KB shots harness: `buy`, `buy-manual`, `market-wishlist`; check at 1440 and 390.
6. `npm run verify`, scan, ask to push. Never merge to main.
