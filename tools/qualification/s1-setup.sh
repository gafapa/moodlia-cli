#!/usr/bin/env bash
set -euo pipefail

root=/opt/docker/stacks/moodlia-webmcp-qa-20261015a
label=moodlia.webmcp.qa=20261015a
network=moodlia-webmcp-qa-20261015a
database=moodlia-webmcp-db-20261015a
web=moodlia-webmcp-site-20261015a

[[ "$(realpath -m "$root")" == /opt/docker/stacks/moodlia-webmcp-qa-20261015a ]]
[[ ! -e "$root" ]]
available=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
(( available >= 3 * 1024 * 1024 ))
install -d -o 65534 -g 65534 -m 700 "$root" "$root/results" "$root/data"
printf '%s\n' "$label" > "$root/ownership.txt"
docker ps --format '{{.Names}} {{.Status}}' > "$root/results/baseline-services.txt"
umask 077
password=$(openssl rand -hex 32)
printf 'POSTGRES_DB=moodleqa\nPOSTGRES_USER=moodleqa\nPOSTGRES_PASSWORD=%s\n' "$password" > "$root/database.env"
chown 65534:65534 "$root/database.env"
docker network create --label "$label" "$network" >/dev/null
docker run -d --name "$database" --label "$label" --network "$network" --network-alias database \
  --memory 384m --cpus 0.5 --env-file "$root/database.env" postgres:17-alpine >/dev/null
docker run -d --name "$web" --label "$label" --network "$network" --memory 1536m --cpus 1.5 \
  --env-file "$root/database.env" -p 127.0.0.1:18097:8080 --mount "type=bind,src=$root,dst=/qa" \
  --entrypoint sh erseco/alpine-moodle:v5.2.4 -c 'sleep 14400' >/dev/null
docker cp /tmp/gallegotop-upload-webmcp-qa-plugin.zip "$web:/tmp/plugin.zip"
docker exec "$web" sh -c 'mkdir -p /var/www/html/public/local; unzip -q /tmp/plugin.zip -d /var/www/html/public/local'
docker exec --user 0 "$web" rm /tmp/plugin.zip
docker exec --user 0 "$web" apk add --no-cache php83-pecl-pcov > "$root/results/pcov-install.log" 2>&1
docker exec "$web" sh -c 'cd /var/www/html; composer install --no-interaction --prefer-dist --no-progress' > "$root/results/composer.log" 2>&1
printf 'lab-ready\n'
