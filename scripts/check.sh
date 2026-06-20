#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found; cannot run project checks." >&2
  exit 1
fi

npm run check

echo "Checks passed."
