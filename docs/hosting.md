# Hosting

Labtorio is a React/Vite browser app served as static files. The repository
provides an app container that builds the React bundle and serves it on
Docker-only port `8080`; it does not bind public host ports.

Use one neutral edge proxy on the host for public HTTP and HTTPS. That proxy is
the only container that should bind host ports `80` and `443`.

## One-Time Host Setup

Create a shared Docker network:

```sh
docker network create web
```

Run Labtorio from this repository:

```sh
docker compose up -d --build
```

The app service is then reachable to other containers on the `web` network as:

```text
http://labtorio:8080
```

## Shared Edge Proxy

Keep the public Caddy container in a neutral directory such as
`~/edge-proxy`, not inside either app repository. The examples in
`deploy/edge-compose.yaml.example` and `deploy/edge.Caddyfile.example` can be
copied there.

Before starting or recreating the edge proxy, create this repository's local
`.env` and set Basic Auth credentials. Keep the file local; it is ignored by
git. The recommended setup command is:

```sh
scripts/setup-basic-auth-env.sh
docker compose -f /home/alex/edge-proxy/compose.yaml restart caddy
```

The script prompts for the password without echoing it, generates a Caddy
bcrypt hash, and writes `.env` with this shape:

```dotenv
LABTORIO_BASIC_AUTH_USER=labtorio
LABTORIO_BASIC_AUTH_HASH='<bcrypt-hash-from-caddy-hash-password>'
```

The hash must be the exact Caddy bcrypt output. It should start like `$2a$`,
`$2b$`, or `$2y$` and contain three `$` separators. A raw password, SHA-256
digest, or base64 value will not work.

If you generate the hash manually, run Caddy in prompt mode so the plaintext
password does not land in shell history:

```sh
docker run --rm -it caddy:2.9-alpine caddy hash-password
```

When the edge proxy lives in `~/edge-proxy`, point its compose file at the repo
`.env` so the secret source stays in one ignored file:

```yaml
services:
  caddy:
    env_file:
      - /home/alex/factorio-gui-web-editor/.env
```

The Labtorio route is:

```caddyfile
labtorio.tyrode.dev {
	@protected {
		not path /@vite-hmr
	}

	basicauth @protected {
		{$LABTORIO_BASIC_AUTH_USER} {$LABTORIO_BASIC_AUTH_HASH}
	}

	reverse_proxy labtorio:8080
}
```

Point DNS for `labtorio.tyrode.dev` at the host running the edge proxy. Caddy
will request and renew the HTTPS certificate automatically.

Basic Auth is enforced at the edge proxy because it is the public entry point
for both the production static container and the Vite development override.

## Hot Reload Development

For visible styling work, the same public domain can be switched to Vite dev
mode without changing the edge proxy route:

```sh
docker compose -f compose.yaml -f compose.dev.yaml up -d
```

The override runs `node:24-trixie-slim`, mounts the repository at `/app`, and
serves Vite on internal port `8080`. It keeps `/app/node_modules` and Vite's
cache in Docker named volumes, while `vite.config.js` defaults local dev cache
to a per-UID directory under `/tmp`. That prevents the dev container or local
tooling from leaving root-owned or remapped Vite cache files in the host
checkout. The override sets `LABTORIO_HMR_HOST` to `labtorio.tyrode.dev` and
`LABTORIO_HMR_CLIENT_PORT` to `443`, so browser HMR uses the public HTTPS
route. It also moves the WebSocket to `/@vite-hmr`, letting the edge proxy pass
that Vite token-protected upgrade before applying Basic Auth to the rest of the
site. Stop using the override and rebuild the static container before treating
the service as production again:

```sh
docker compose up -d --build
```

## Coexisting Projects

Any other project-level Caddy container on the same host cannot keep binding
host ports `80` and `443` if a neutral edge proxy owns those ports. Migrate
other projects behind the edge proxy once:

- attach the other stack to the external `web` network;
- remove public host port bindings from the other stack;
- route the other project's public domain from the neutral edge proxy to that
  stack's internal service and port.

That keeps the application repositories separate while making one explicit
network boundary responsible for public traffic.
