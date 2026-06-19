#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${LABTORIO_ENV_FILE:-$repo_root/.env}"

read -r -p "Basic Auth username [labtorio]: " username
username="${username:-labtorio}"

if [[ -z "$username" || "$username" =~ [[:space:]] ]]; then
  printf 'Username must be non-empty and cannot contain spaces.\n' >&2
  exit 1
fi

read -r -s -p "Basic Auth password: " password
printf '\n'
read -r -s -p "Confirm Basic Auth password: " password_confirm
printf '\n'

if [[ -z "$password" ]]; then
  printf 'Password cannot be empty.\n' >&2
  exit 1
fi

if [[ "$password" != "$password_confirm" ]]; then
  printf 'Passwords did not match.\n' >&2
  exit 1
fi

# Caddy's prompt reader expects a newline-terminated password on stdin.
hash="$(printf '%s\n' "$password" | docker run --rm -i caddy:2.9-alpine caddy hash-password)"
unset password password_confirm

if [[ ! "$hash" =~ ^\$2[aby]\$ ]]; then
  printf 'Caddy did not return a bcrypt hash. Refusing to write %s.\n' "$env_file" >&2
  exit 1
fi

umask 077
tmp_file="$(mktemp "$repo_root/.env.tmp.XXXXXX")"
trap 'rm -f "$tmp_file"' EXIT

{
  printf '# Local Basic Auth settings for the edge proxy. Ignored by git.\n'
  printf 'LABTORIO_BASIC_AUTH_USER=%s\n' "$username"
  printf "LABTORIO_BASIC_AUTH_HASH='%s'\n" "$hash"
} > "$tmp_file"

mv "$tmp_file" "$env_file"
trap - EXIT

printf 'Wrote %s with a Caddy bcrypt hash.\n' "$env_file"
printf 'Restart the edge proxy to apply it:\n'
printf 'docker compose -f /home/alex/edge-proxy/compose.yaml restart caddy\n'
