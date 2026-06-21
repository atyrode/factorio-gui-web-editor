#!/bin/sh
set -eu

if [ -z "${LABTORIO_BASIC_AUTH_USER:-}" ]; then
  echo "LABTORIO_BASIC_AUTH_USER must be set." >&2
  exit 1
fi

if [ -z "${LABTORIO_BASIC_AUTH_PASSWORD:-}" ]; then
  echo "LABTORIO_BASIC_AUTH_PASSWORD must be set." >&2
  exit 1
fi

LABTORIO_BASIC_AUTH_GENERATED_HASH="$(printf '%s\n' "$LABTORIO_BASIC_AUTH_PASSWORD" | caddy hash-password)"
export LABTORIO_BASIC_AUTH_GENERATED_HASH
unset LABTORIO_BASIC_AUTH_PASSWORD

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
