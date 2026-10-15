# Camera-roll importer

Feature #1 of the portfolio redesign. Branch `feat/camera-roll-import`, cut from
`feat/editorial-redesign`. Research: KB `knowledge/outfitted-research-2026-10.md`, item 1.

## Goal

Drop 1 to 50 photos of yourself wearing outfits (mirror selfies, camera-roll shots) and get a
closet: every garment found, the same garment seen in several photos merged into one item, a
review step, then the kept items saved with background removed.

Today's `Upload photos` takes product-style photos and keeps the single main item per photo.
It stays as is. The importer is a new, separate flow.

Done when:
- A user can pick up to 50 photos from the wardrobe add sheet (mobile) or an `Import` button
  (desktop), watch progress, review the found items, and save the ones they keep.
- The same garment in several photos shows as one item ("Seen in 3 photos").
- Nothing is uploaded to Cloudinary or written to the database before the user saves.
- Each saved item stores its image embedding, so feature #2 (wear log) can match photos to items.
- Unit tests cover the pure logic; `npm run verify` passes; the flow is checked by eye in
  screenshots with mocked APIs (the database is down, see KB `work/outfitted.md`).

## Flow

```
pick photos ─► downscale (browser) ─► POST /api/import/detect, 1 photo per call, 3 at a time
            ─► embed each crop (FashionSigLIP, browser worker)
            ─► group same garment ─► review ─► POST /api/import/save, 1 item per call
```

1. **Pick.** `<input type="file" accept="image/*" multiple>`, capped at 50 (extra files dropped
   with a toast).
2. **Downscale.** In the browser, long edge to 1280 px, JPEG quality 0.85
   (`createImageBitmap` + canvas). Keeps each request small (~200-400 KB) and under hosting
   body limits. A file the browser can't decode (HEIC outside Safari) is skipped and counted.
3. **Detect.** `POST /api/import/detect` (multipart, one `file`). Server: auth, then one Gemini
   call (the existing OpenRouter image model) with a multi-item prompt: every garment the main
   person wears, each with `category`, `description`, `color` and a normalized `bbox`. The server
   crops each bbox with 4% padding (sharp), resizes the crop to 512 px long edge JPEG, and
   returns `{ detections: [{ category, description, color, bbox, crop }] }` with `crop` as a
   data URL. No Cloudinary, no database. Photos run 3 at a time; one failure marks that photo
   failed and the rest carry on.
4. **Embed.** A web worker loads `Marqo/marqo-fashionSigLIP` vision model (int8 ONNX, ~94 MB,
   cached by the browser after the first load) via `@huggingface/transformers` and returns a
   normalized 768-d vector per crop. Starts loading when the importer opens, in parallel with
   detection. If it fails to load, grouping falls back to text only.
5. **Group.** Pure function. Two detections are the same garment when the category matches and
   either cosine similarity of embeddings ≥ 0.88, or (no embeddings) description-word overlap
   (Jaccard) ≥ 0.6 with the same colour. Groups are connected components (union-find). The
   group's cover is its largest crop. The 0.88 threshold is a starting value, not measured;
   tune it on real photos.
6. **Review.** Grid of groups in the editorial tile style: white image, caps category, caption,
   `Seen in N photos`. Each tile toggles keep/skip (all kept by default). Opening a tile shows its
   crops; `Not the same` on a crop splits it into its own group. Category can be changed with
   caps tabs. Footer: `Save 14 items` (ink button).
7. **Save.** `POST /api/import/save` (JSON: `crop`, `category`, `description`, `embedding`), one
   item per call, 3 at a time. Server: auth, validate, `uploadWithBgRemoval`, insert with
   `status: "owned"`, `notes: description`, `embedding`. Saved items go into the store as they
   land; a final toast says how many were added and how many failed.

## Data

`clothing_items.embedding text` (nullable): JSON array of 768 floats. Text, not pgvector, because
the database is unreachable today and pgvector support on the project is unverified; #2 can
move it to `vector(768)` once the database is back. Migration `0001_*` via `drizzle-kit
generate` (runs offline); applying it waits on the database.

## Dedupe options considered

| Option | For | Against |
|---|---|---|
| **FashionSigLIP in the browser (picked)** | Apache-2.0, fashion-tuned, no server cost, embeddings reused by #2 | ~94 MB first download; slow on old phones |
| FashionSigLIP on the server (onnxruntime-node) | No client download | Large server bundle; serverless size limits |
| Gemini groups the descriptions in one extra call | No model to ship | Text only; a second paid call; no embeddings for #2 |
| Text similarity of descriptions only | Free, instant | Misses "black tee" vs "black crew-neck"; kept as the fallback |
| Perceptual hash of crops | Tiny | Fails across poses and lighting |

## Files

- `lib/import/geometry.ts`: bbox clamp, pad and pixel conversion (pure).
- `lib/import/parse.ts`: parse and validate the model's JSON (pure).
- `lib/import/group.ts`: cosine, text similarity, union-find grouping, cover pick, split (pure).
- `lib/import/detect-prompt.ts`: the multi-item prompt text.
- `lib/openrouter.ts`: `detectOutfitItems(base64, mime)` reusing the request code.
- `app/api/import/detect/route.ts`, `app/api/import/save/route.ts`.
- `lib/import/embed-worker.ts` + `lib/import/use-embedder.ts`: worker and React hook.
- `lib/import/downscale.ts`: browser downscale.
- `components/wardrobe/import-flow.tsx`: full-screen overlay with progress, review, save.
- Wardrobe page: `Import outfit photos` row in the add sheet, `Import` button on desktop.
- Tests: `lib/import/*.test.ts`, run by `npm test` (Node's built-in runner, no new dev deps),
  added to `scripts/verify.sh`.

## Out of scope

- Matching found items against what is already in the wardrobe (old items have no embeddings).
- Wishlist status in the importer (camera-roll photos are clothes you own).
- Replacing Cloudinary background removal with SAM-style segmentation.
- Background jobs that keep running if the tab closes.

## Build order

1. Pure logic test-first: geometry, parse, group.
2. Prompt + `detectOutfitItems` + detect route.
3. Schema column + migration + save route.
4. Downscale, embed worker, hook.
5. Import flow UI + wardrobe entry points.
6. Harness screens `import-progress`, `import-review` (mocked detect and save); check by eye at
   1440 and 390; `npm run verify`; scan.
