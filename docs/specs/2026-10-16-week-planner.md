# Week planner agent

Feature #3 of the portfolio redesign. Branch `feat/week-planner`, cut from `feat/wear-log`
(2c26174). Research (13 sources) and options: https://claude.ai/artifact/UgDAEfNj9BTGTQoyyyvM2J.
An agent reads your week (calendar, weather) and your closet (with wear stats from #2) and
plans 7 outfits, with every tool call shown live as it runs.

## Goal

Press `Plan my week` on a new `Week` tab and watch the planner check the weather, read your
calendar and closet, then fill in an outfit for each of the next 7 days.

Done when:
- A user can connect Google Calendar (one click, read-only, 1 hour, nothing stored) or set a
  chip per day instead (Work, Gym, Dinner, Casual, Event, Travel). Chips also override the
  calendar for a day.
- `Plan my week` streams the steps live ("Checking the weather" → "7 days, 4°-14°, rain Thu"),
  then shows 7 day rows: day, weather, events, item tiles, the model's note, `Wore it`.
- Every plan has 7 days, even when the model stops early or a call fails partway.
- The plan is saved per user per week and shown again on reload.
- The free model's limit shows as "Free planning limit reached, try again tomorrow", not a
  crash.
- Unit tests cover the pure logic; `npm run verify` passes; screens are checked by eye at 1440
  and 390 in the KB shots harness with mocked APIs (no paid or Google calls).

## Decisions (Seyon, 2026-10-16)

- **Calendar: Google Calendar via OAuth.** The model sees event titles and times only.
  Access token in an httpOnly cookie for its 1 hour life; no refresh token kept, nothing in the
  database. Next week is a one-click reconnect.
- **Runtime: own tool loop over `fetch`, streamed as NDJSON.** No AI SDK, same style as
  `lib/openrouter.ts`.
- **Storage: new `week_plans` table**, one row per user per week.
- **Model: free.**

## Assumed (not asked back)

- **Default model `google/gemma-4-31b-it:free`** on OpenRouter (tool calling listed on the live
  models list, 2026-10-16). **No paid fallback.** On 429 the page says "Free planning limit
  reached, try again tomorrow". Free limits: 20 requests/min, 50/day with under 10 credits
  bought, 1000/day after (openrouter.ai/docs/api/reference/limits). A plan is about 5-10
  requests.
- **Endpoint is configurable** (OpenAI-compatible): `PLANNER_BASE_URL` (default
  `https://openrouter.ai/api/v1`), `PLANNER_MODEL`, key from `OPENROUTER_API_KEY` (optional when
  local). A local Qwen 3.5 9B via Ollama or LM Studio is then a config change; tool calls
  through Ollama's `/v1` are unverified. Ajax (a Qwen3.5-9B fine-tune, announced 2026-10-02)
  has no downloadable weights or confirmed license yet, so it is not an option.
- **Privacy note.** Free endpoints may train on prompts (OpenRouter privacy settings are per
  account). One line next to Connect says what the planner sends: event titles and times,
  the forecast, item categories and notes.
- **Location:** browser geolocation; fallback city search via Open-Meteo geocoding.
- **Weather:** Open-Meteo forecast, no key (non-commercial, under 10,000 calls/day, CC BY 4.0;
  the page credits "Weather data by Open-Meteo"). Daily `temperature_2m_max`,
  `temperature_2m_min`, `precipitation_probability_max`, `weather_code`, `wind_speed_10m_max`,
  `timezone=auto`, 7 days.
- **Google:** own OAuth 2 code flow (Auth0 holds the login, not Google tokens). Env
  `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; the Connect button is hidden when unset. Scope
  `https://www.googleapis.com/auth/calendar.events.readonly` (sensitive: capped at 100 users
  until Google verifies the app). Seyon creates the Google Cloud OAuth client himself (needs
  his login).

## Flow

```
Week tab ─► location (geolocation | city search) ─► chips per day (optional)
        ─► POST /api/planner { weekStart, lat, lon, chips } ─► NDJSON stream
server: loop ≤ 12 steps
   model ─► tool call ─► handler (server) ─► tool result ─► model ─► …
   events: tool → result → day … → done   (or error)
        ─► fill missing days (fallback) ─► save week_plans ─► done
reload: GET /api/planner?week=YYYY-MM-DD ─► saved plan
```

1. **Connect (optional).** `GET /api/planner/google/start` sets a random `state` cookie and
   redirects to Google. `GET /api/planner/google/callback` checks `state`, exchanges the code,
   sets the access token as an httpOnly, secure, `sameSite=lax` cookie with `maxAge` 3600, and
   redirects back to `/week`. No refresh token is requested (`access_type=online`).
2. **Plan.** The browser posts the week start (Monday, local), coordinates and chips. The server
   resolves the user with `getOrCreateUser` and runs the loop.
3. **Tools** the model gets. The server runs the handlers; the model never sees keys or URLs.
   - `get_weather()`: 7 day rows `{ date, high, low, rainChance, words, warmth }`.
   - `get_week()`: per day `{ date, events: [{ title, time }], chip }`, Google events plus
     chips (a chip wins for its day). Without Google, chips only.
   - `get_closet()`: owned items `{ id, category, notes, wears, daysIdle, lastWorn }` from
     `lib/wear/stats.ts`, idle first.
   - `propose_day(date, itemIds, note)`: checked by pure code: every item owned, date inside
     the week, at most one item per category except accessories, and either a top and a bottom
     or a one-piece. A bad call returns the error to the model as the tool result so it can
     try again. A good call emits a `day` event.
4. **Stop.** The loop ends when the model stops calling tools, all 7 days are proposed, or 12
   steps run out. Missing days are filled by `fallback.ts` from idle items that suit the day's
   warmth, marked `filled` so the UI can say so.
5. **Stream.** `POST /api/planner` returns `application/x-ndjson`, one event per line:
   `{type:"tool", name, args}`, `{type:"result", name, summary}`, `{type:"day", day}`,
   `{type:"done", plan}`, `{type:"error", message}`.
6. **Save.** Upsert into `week_plans` on `(user_id, week_start)`.
7. **Wore it.** Each day row's button calls `POST /api/wear` with source `manual` for that
   day's items (reuses #2).

## Data

New table `week_plans`:

| column | type | note |
|---|---|---|
| `id` | text pk | uuid |
| `user_id` | text fk users | cascade |
| `week_start` | text | `YYYY-MM-DD`, the Monday, user's local date |
| `plan` | text | JSON: `{ days: [{ date, weather, events, itemIds, note, filled }] }` |
| `created_at` | text | default now |

Unique index on `(user_id, week_start)`. Migration `0003_*` via `drizzle-kit generate`
(offline); applying it waits, like `0001` and `0002`. Google tokens are never stored.

`GET /api/planner?week=YYYY-MM-DD` returns `{ plan }` or `{ plan: null }` for the caller only.

## Options considered

| Option | For | Against |
|---|---|---|
| **Google Calendar OAuth (picked)** | Real events, one click | Sensitive scope, 100-user cap until verified; Seyon sets up the client |
| Paste an `.ics` URL (recommended in research) | No OAuth, no verification | Secret URL to paste; less polished |
| Chips only | No calendar access at all | Manual; kept as fallback and override |
| **Own tool loop over fetch, NDJSON (picked)** | No new dependency; matches `lib/openrouter.ts`; testable with an injected `complete()` | Hand-rolled tool-call chunk merging |
| Vercel AI SDK `streamText` + tools | Less code | New dependency; hides the loop the demo is meant to show |
| **`week_plans` table (picked)** | Plan survives reload; one row per week | One more migration waiting on prod |
| Keep the plan in the browser only | No schema change | Lost on reload or another device |
| **Free model on OpenRouter (picked)** | Costs nothing | 50 requests/day until credits bought; quality varies |
| Paid Gemini (the app's current model) | Reliable tools | Costs per plan; Seyon asked for free |
| Local Qwen via Ollama | Free, private | Only on his machine; tool calls unverified; works via `PLANNER_BASE_URL` |

## Files

- `lib/planner/weather.ts`: Open-Meteo JSON → 7 day rows; weather code → words; temperature →
  warmth band (pure).
- `lib/planner/events.ts`: Google events JSON → per-day titles, all-day and timed, local dates
  (pure).
- `lib/planner/closet.ts`: closet + wear stats → compact tool result, idle first (pure).
- `lib/planner/validate.ts`: `propose_day` checks (pure).
- `lib/planner/stream.ts`: merge `delta.tool_calls` chunks; NDJSON event encode and decode
  (pure).
- `lib/planner/loop.ts`: the tool loop with an injected `complete()`, so tests need no network.
- `lib/planner/fallback.ts`: fill missing days from idle items by warmth (pure).
- `lib/planner/model.ts`: the streaming `complete()` over `fetch` to `PLANNER_BASE_URL`.
- `db/schema.ts` + `db/migrations/0003_*`: `week_plans`.
- `app/api/planner/route.ts` (POST stream, GET saved plan).
- `app/api/planner/google/start/route.ts`, `app/api/planner/google/callback/route.ts`.
- `app/(app)/week/page.tsx`: the Week tab. `components/week/*` for the steps list and day rows.
- `components/app-nav.tsx`: `Week` tab between Outfits and Wear. `proxy.ts`: add `/week` to
  `protectedPaths`.
- Tests: `lib/planner/*.test.ts`, run by `npm test`.
- KB harness `work/outfitted-shots/shots.py`: screens `week` (saved plan), `week-live`
  (mid-stream, steps visible), `week-empty`; mock `/api/planner` (NDJSON body), `/api/wear`,
  `/api/wardrobe`.

## UI

- Header like Wear: `Week`, button `Plan my week`. Location line and chips under it.
- While planning: a steps list as hairline rows, each a tool's label and its one-line result.
- Then 7 day rows: day label, weather line, events, item tiles (3:4 white tiles like Wear),
  the model's note, `Wore it`. A filled day says `Filled from idle items`. No boxed grids.
- Footer credit: "Weather data by Open-Meteo".

## Out of scope

- `Swap` an item in a day (next step).
- Writing anything back to Google Calendar; refresh tokens; other calendars (Outlook, iCloud).
- A paid model fallback; rate limiting the route (the free model's own limit applies).
- Multiple plans per week or plan history beyond the saved row.

## Build order

1. Pure logic test-first: weather, events, closet, validate, stream, fallback, loop.
2. Schema + migration 0003.
3. Routes: `/api/planner` (POST, GET), Google start and callback; `model.ts`.
4. Week page + nav tab + `proxy.ts`.
5. KB harness screens `week`, `week-live`, `week-empty`; check by eye at 1440 and 390;
   `npm run verify`; scan; ask "Push?". Never merge to main.
