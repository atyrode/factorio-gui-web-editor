#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if command -v npm >/dev/null 2>&1; then
  npm run check
else
  echo "npm not found; skipping React build checks." >&2
fi

node scripts/check-layout-tree.mjs
python3 scripts/check-app.py

echo "Checks passed."
