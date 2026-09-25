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
PORT="${PORT:-4173}"

# Dummy Auth0 config, set in the shell so it wins over any local env file
# Next would otherwise load. With no real tenant there's no way to hold a
# session, which is the point: the smoke run only ever sees logged-out
# behaviour and can't touch real credentials, the database or a paid API.
AUTH0_DOMAIN=smoke.invalid \
AUTH0_CLIENT_ID=smoke \
AUTH0_CLIENT_SECRET=smoke \
AUTH0_SECRET="$(openssl rand -hex 32)" \
APP_BASE_URL="http://localhost:$PORT" \
  npm run start -- --port "$PORT" >/tmp/outfitted-verify-serve.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  if curl -fs -o /dev/null "http://localhost:$PORT"; then break; fi
  sleep 1
done

python3 scripts/smoke.py "http://localhost:$PORT"

printf '\nverify ok\n'
