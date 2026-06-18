FROM node:24-trixie-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html ./
COPY src ./src
COPY docs ./docs
COPY scripts ./scripts
COPY README.md ./
RUN npm run build

FROM caddy:2.9-alpine

COPY deploy/labtorio.Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv/labtorio

EXPOSE 8080
