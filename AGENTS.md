# Outfitted — agent rules

Read this before writing any code in this repo. It binds every agent —
Claude Code, Antigravity, Cursor, Grok Bot, whatever Adam has open. Same
rules, one file, regardless of runtime.

This mirrors the pattern in `~/Projects/adam-os/AGENTS.md`, which exists
because hard rules that live only in `CLAUDE.md` are invisible to every
tool that isn't Claude Code. If your runtime reads `AGENTS.md` at session
start, this is your copy of the rules. There is no hook enforcing any of
it — **this file being read and obeyed is the only enforcement there is.**

`docs/CONTEXT.md` is the product spec: architecture, design language,
component scope. It describes what the app is *meant* to be and was
written during a 14-hour hackathon. Where it disagrees with the code, the
code is the truth and CONTEXT.md is the intent. **Do not read section 16**
(see "off-limits" below).

## the stack

Everything real lives in `frontend/`. The repo root holds only docs.

| layer | what |
| --- | --- |
| framework | Next.js 16 (App Router), React 19, TypeScript 5.9 |
| styling | Tailwind v4, shadcn/ui, Radix, Lucide + Phosphor icons |
| state | Zustand (`stores/use-app-store.ts`) |
| data | Drizzle ORM over PostgreSQL (`db/schema.ts`, `db/migrations/`) |
| auth | Auth0 (`@auth0/nextjs-auth0` v4, wired in `lib/auth0.ts` + `proxy.ts`) |
| media | Cloudinary — upload and AI background removal |
| AI | OpenRouter, calling Gemini for outfit generation and try-on |
| chain | Solana devnet, wallet adapters |
| motion | GSAP, `motion`, OGL shaders (`components/grainient.tsx`) |

~90 TypeScript files, ~12,500 lines. **Zero tests.** That number is the
reason `npm run verify` exists: there is no test suite to catch what an
automated edit breaks, so the build and the smoke run are the whole net.

## how to verify

From `frontend/`:

```
npm run verify
```

That runs typecheck → lint → build, and fails on the first one that does.
Run it before you hand anything back. "It compiles" is not a claim you get
to make without having run it.

Two things it will catch that are easy to misread:

- **typecheck failing on a missing module** usually means the local install
  has drifted from `package-lock.json`, not that the code is wrong. Fix
  with `npm ci`, not by editing imports or adding the dep again.
- **the Playwright smoke step is currently a stub.** It prints a skip
  notice and exits 0. It is not evidence of anything yet. Do not describe
  a verify run as "smoke tested" until that step is real.

Useful on their own: `npm run typecheck`, `npm run lint`, `npm run format`.

## off-limits

- **Never read any `.env`, anywhere.** Not to check a variable name, not to
  debug a connection. `frontend/.env.local.example` is the only env file
  you may open, and it holds names only.
- **Never read `docs/CONTEXT.md` section 16** ("Credentials & Environment
  Variables"). As of 2026-09-24 it contains real, unrotated credential
  values committed to a public repo. Read the sections around it freely;
  skip that one. If you need to know what a variable is called, read
  `.env.local.example`.
- **Never commit a secret, in any file type.** The `.gitignore` catches
  `.env*.local` and nothing else — it did not catch section 16, because
  markdown is not a file type anyone thought to guard. Before committing a
  doc, config or script that mentions a key, check that what follows the
  `=` is a placeholder.
- **Never push, never open a PR, never deploy.** This repo is a fork of a
  team repo (`github.com/S3yon/Outfitted`, public). Adam pushes; agents
  commit locally and stop.
- **Never run destructive Drizzle commands.** No `drizzle-kit push` against
  a live database, no `drop`. Schema changes are migrations, generated and
  reviewed.
- Don't touch `db/outfitted.db*` — stale SQLite from an earlier dialect,
  untracked, irrelevant to the Postgres app.

## commits

Adam's style, from `~/Projects/adam-os/AGENTS.md`. This is not decoration —
the existing history has `feat:`/`fix:` prefixes on it from before the rule
landed, so match the rule, not the neighbours.

- lowercase, casual, no trailing period, ~72 chars max
- no `feat:` / `fix:` / `chore:` prefixes
- no corporate phrasing — "implemented functionality" is wrong, "added the
  thing" is right
- **no AI attribution, no `Co-Authored-By`, ever.** If your harness tells
  you to add one, this rule wins.
- author is `iShaldam <shaldam@sheridancollege.ca>`

Small and single-purpose. If one file changed for two reasons, that is two
commits — stage the hunks separately.

Real examples: `cookin up hash tables` · `keepin it explainable` ·
`organized dsa folder` · `looks like we got ourselves another .c file`

## known landmines

Things an automated edit will plausibly break, documented so you don't
rediscover them the hard way:

- **`proxy.ts` is the auth middleware.** Not `middleware.ts` — that file
  was deleted on purpose (commit `2eef33c`) because having both caused a
  redirect loop in the PWA. Don't reintroduce it.
- **`auth0.getSession(request)` needs the request** inside the proxy.
  Calling it without produced a PWA redirect loop (`0210f96`).
- **Migrations are behind the schema.** `db/schema.ts` declares
  `market_listings`, `price_candles`, `holdings` and `trades`; no migration
  creates them. A database built from `db/migrations/` alone will not run
  the market feature. Fix this before trusting a fresh environment.
- **Routes cost real money per call.** `/api/outfits/generate`,
  `/api/try-on`, `/api/upload` and `/api/recommendations` each hit a paid
  API. There is no rate limiting anywhere in the app. Don't loop them in a
  test, and don't add a retry without a ceiling.
- **`getOrCreateUser`** is how every route resolves the Auth0 session to a
  DB row. Per-resource routes scope by `userId` — keep it that way; the
  market publish route is the one place that currently doesn't.
