#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): lint and typecheck the file the agent just edited.
# Errors in that file go back to the agent on stderr with exit 2. Anything else exits 0.
set -u

APP_SUBDIR="frontend"   # where package.json and tsconfig.json live, relative to the repo root

repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
app="$repo${APP_SUBDIR:+/$APP_SUBDIR}"

file="$(jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -n "$file" ] && [ -f "$file" ] || exit 0
file="$(cd "$(dirname "$file")" && pwd -P)/$(basename "$file")"   # drop ./ and symlinks

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac
# macOS paths are case-insensitive (~/projects vs ~/Projects), so compare lowercased.
lc() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
case "$(lc "$file")" in
  "$(lc "$app")"/*) rel="${file:$((${#app} + 1))}" ;;
  *) exit 0 ;;
esac
case "$rel" in
  node_modules/*|.next/*|out/*|build/*|*.d.ts) exit 0 ;;
esac
bin="$app/node_modules/.bin"
[ -x "$bin/tsc" ] || exit 0   # no install here (e.g. a fresh worktree): nothing to run

cd "$app" || exit 0
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Whole-project check (incremental, so later runs are fast), keeping only this file's errors.
( "$bin/tsc" --noEmit -p . --pretty false 2>&1 |
  awk -v f="$rel" 'index($0, f "(") == 1 { keep = 1; print; next }
                   /^[^ ]/ { keep = 0 }
                   keep' > "$tmp/tsc" ) &

# ESLint errors only (warnings don't block), when the repo has a flat config.
if [ -x "$bin/eslint" ] && ls eslint.config.* >/dev/null 2>&1; then
  # Exit 1 means lint errors; 2 means ESLint itself failed, which isn't the agent's to fix.
  ( "$bin/eslint" --quiet --no-warn-ignored "$rel" > "$tmp/eslint" 2>&1
    [ $? -eq 1 ] || : > "$tmp/eslint" ) &
fi
wait

if [ -s "$tmp/tsc" ] || [ -s "$tmp/eslint" ]; then
  {
    echo "Checks failed for $rel. Fix these before moving on:"
    [ -s "$tmp/tsc" ] && { echo; echo "tsc:"; cat "$tmp/tsc"; }
    [ -s "$tmp/eslint" ] && { echo; echo "eslint:"; cat "$tmp/eslint"; }
  } >&2
  exit 2
fi
exit 0
