#!/usr/bin/env bash
# Gate for anything automated touching this app.
#
# ~90 source files, zero tests. Nothing else catches a regression here, so
# this is the whole net: typecheck, lint, build, smoke. Each stage has to
# pass before the next one runs, because a lint error in a file that does
# not compile is noise, not information.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf '\n==> %s\n' "$1"; }

# npm ci, not npm install — the lockfile is the truth. This exists because
# embla-carousel-react sat in package.json with nothing in node_modules and
# typecheck failed on an import that was, in fact, perfectly correct.
if [ ! -d node_modules ]; then
  step "installing (no node_modules)"
  npm ci
fi

step "typecheck"
npm run typecheck

step "lint"
npm run lint

step "build"
npm run build

step "smoke"
if [ -f scripts/smoke.py ]; then
  PORT="${PORT:-4173}"

  npm run start -- --port "$PORT" >/tmp/outfitted-verify-serve.log 2>&1 &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null "http://localhost:$PORT"; then break; fi
    sleep 1
  done

  python3 scripts/smoke.py "http://localhost:$PORT"
else
  # Deliberately not a failure — the gate is useful without it, and a
  # always-red gate gets ignored, which is worse than a narrow green one.
  #
  # But do not call a verify run "smoke tested" while this branch is the
  # one that ran. It asserts nothing. The flows it needs to cover are the
  # ones with no other coverage at all:
  #   1. landing renders and its CTA reaches /login
  #   2. an unauthenticated hit on /wardrobe redirects to /
  #   3. /api/wardrobe returns 401 without a session
  # All three are reachable without credentials, which is the point —
  # the authed flows need secrets this script must never handle.
  echo "  SKIP  scripts/smoke.py not present — build verified, behaviour is NOT"
fi

printf '\nverify ok\n'
