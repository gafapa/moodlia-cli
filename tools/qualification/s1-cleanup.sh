#!/usr/bin/env bash
set -euo pipefail
root=/opt/docker/stacks/moodlia-webmcp-qa-20261015a
[[ "$(realpath -m "$root")" == /opt/docker/stacks/moodlia-webmcp-qa-20261015a ]]
if [[ -e "$root" ]]; then
  [[ "$(cat "$root/ownership.txt")" == moodlia.webmcp.qa=20261015a ]]
fi
for container in moodlia-webmcp-site-20261015a moodlia-webmcp-db-20261015a; do
  if docker container inspect "$container" >/dev/null 2>&1; then
    [[ "$(docker inspect -f '{{index .Config.Labels "moodlia.webmcp.qa"}}' "$container")" == 20261015a ]]
    docker rm -fv "$container" >/dev/null
  fi
done
network=moodlia-webmcp-qa-20261015a
if docker network inspect "$network" >/dev/null 2>&1; then
  [[ "$(docker network inspect -f '{{index .Labels "moodlia.webmcp.qa"}}' "$network")" == 20261015a ]]
  docker network rm "$network" >/dev/null
fi
rm -rf -- "$root"
rm -f -- /tmp/gallegotop-upload-webmcp-qa-plugin.zip /tmp/gallegotop-upload-webmcp-qa-configure.php \
  /tmp/gallegotop-upload-webmcp-qa-fixture.php /tmp/gallegotop-upload-webmcp-qa-bridge.php \
  /tmp/gallegotop-upload-webmcp-qa-tests.php /tmp/gallegotop-upload-webmcp-qa-completion.php \
  /tmp/gallegotop-upload-webmcp-qa-gradebook-tests.php /tmp/gallegotop-webmcp-composer-20261015a.log \
  /tmp/gallegotop-webmcp-native-20261015a.log /tmp/gallegotop-webmcp-bridge-20261015a.log \
  /tmp/gallegotop-webmcp-native-final-20261015a.log /tmp/gallegotop-webmcp-bridge-final-20261015a.log \
  /tmp/gallegotop-webmcp-evidence-20261015a.tgz
[[ -z "$(docker ps -aq --filter label=moodlia.webmcp.qa=20261015a)" ]]
[[ -z "$(docker network ls -q --filter label=moodlia.webmcp.qa=20261015a)" ]]
[[ ! -e "$root" ]]
printf 'Owned test containers, anonymous volumes, network, private data, and temporary files removed.\n'
docker ps --format '{{.Names}} {{.Status}}'
