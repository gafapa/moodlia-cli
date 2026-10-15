#!/usr/bin/env bash
set -euo pipefail
root=/opt/docker/stacks/moodlia-webmcp-qa-20261015a
web=moodlia-webmcp-site-20261015a
database=moodlia-webmcp-db-20261015a
network=moodlia-webmcp-qa-20261015a
label=moodlia.webmcp.qa=20261015a
[[ "$(cat "$root/ownership.txt")" == "$label" ]]
[[ "$(docker inspect -f '{{index .Config.Labels "moodlia.webmcp.qa"}}' "$web")" == 20261015a ]]
[[ "$(docker inspect -f '{{index .Config.Labels "moodlia.webmcp.qa"}}' "$database")" == 20261015a ]]
docker rm -fv "$web" "$database" >/dev/null
docker run -d --name "$database" --label "$label" --network "$network" --network-alias database \
  --memory 384m --cpus 0.5 --env-file "$root/database.env" postgres:16-alpine >/dev/null
docker run -d --name "$web" --label "$label" --network "$network" --memory 1536m --cpus 1.5 \
  --env-file "$root/database.env" -p 127.0.0.1:18097:8080 --mount "type=bind,src=$root,dst=/qa" \
  --entrypoint sh local/moodle-aula:4.5.15-1 -c 'sleep 14400' >/dev/null
docker cp /tmp/gallegotop-upload-webmcp-qa-plugin.zip "$web:/tmp/plugin.zip"
docker exec --user 0 "$web" sh -c 'public=/var/www/html; test ! -d /var/www/html/public || public=/var/www/html/public; test "$public/local/moodlia" = /var/www/html/local/moodlia || test "$public/local/moodlia" = /var/www/html/public/local/moodlia; rm -rf "$public/local/moodlia"; mkdir -p "$public/local/moodlia"; chown 65534:65534 "$public/local/moodlia"'
docker exec "$web" sh -c 'public=/var/www/html; test ! -d /var/www/html/public || public=/var/www/html/public; unzip -oq /tmp/plugin.zip -d "$public/local"'
docker exec --user 0 "$web" rm /tmp/plugin.zip
docker exec --user 0 "$web" apk add --no-cache php83-pecl-pcov > "$root/results/pcov-install-45.log" 2>&1
docker exec "$web" sh -c 'cd /var/www/html; composer install --no-interaction --prefer-dist --no-progress' > "$root/results/composer-45.log" 2>&1
printf 'oldest-lab-ready\n'
