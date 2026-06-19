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

The Labtorio route is:

```caddyfile
labtorio.tyrode.dev {
	reverse_proxy labtorio:8080
}
```

Point DNS for `labtorio.tyrode.dev` at the host running the edge proxy. Caddy
will request and renew the HTTPS certificate automatically.

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
route. Stop using the override and rebuild the static container before treating
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
