FROM caddy:2-alpine

COPY deploy/labtorio.Caddyfile /etc/caddy/Caddyfile
COPY index.html /srv/labtorio/index.html
COPY src /srv/labtorio/src
COPY docs /srv/labtorio/docs
COPY README.md /srv/labtorio/README.md

EXPOSE 8080
