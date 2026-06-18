#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if command -v node >/dev/null 2>&1; then
  node --check src/app.js >/dev/null
else
  echo "node not found; skipping JavaScript parse checks." >&2
fi

python3 scripts/check-app.py

echo "Checks passed."
