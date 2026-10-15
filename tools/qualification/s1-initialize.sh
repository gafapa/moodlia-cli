#!/usr/bin/env bash
set -euo pipefail
root=/opt/docker/stacks/moodlia-webmcp-qa-20261015a
web=moodlia-webmcp-site-20261015a
[[ "$(cat "$root/ownership.txt")" == moodlia.webmcp.qa=20261015a ]]
docker cp /tmp/gallegotop-upload-webmcp-qa-configure.php "$web:/tmp/configure.php"
docker exec "$web" php /tmp/configure.php
docker exec "$web" sh -c 'cd /var/www/html; php admin/cli/install_database.php --agree-license --adminuser=qaadmin --adminpass="$(php -r "echo bin2hex(random_bytes(24));")" --adminemail=qa@example.invalid --fullname="MoodlIA WebMCP disposable QA" --shortname=MoodlIA-QA' > "$root/results/install.log" 2>&1
docker exec "$web" sh -c 'cd /var/www/html; public=.; test ! -d public || public=public; php "$public/admin/tool/phpunit/cli/init.php"' > "$root/results/phpunit-init.log" 2>&1
docker exec -d "$web" sh -c 'cd /var/www/html; public=.; test ! -d public || public=public; exec php -S 0.0.0.0:8080 -t "$public" > /qa/results/http-server.log 2>&1'
docker exec "$web" sh -c 'cd /var/www/html; vendor/bin/phpunit --testsuite local_moodlia_testsuite --log-junit /qa/results/phpunit.xml' > "$root/results/phpunit.log" 2>&1
printf 'native-suite-complete\n'
