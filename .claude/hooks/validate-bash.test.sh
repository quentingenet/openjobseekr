#!/usr/bin/env bash
# Tests validate-bash.sh: each command must be blocked (exit 2) or allowed (exit 0).
# A denylist is never complete (e.g. a command name stored in a variable passes): the
# permissions of settings.json ask before every commit and push as a second safeguard.
set -uo pipefail
hook="$(dirname "$0")/validate-bash.sh"
failures=0

check() {
  local expected=$1 command=$2 status
  jq -n --arg command "$command" '{tool_input: {command: $command}}' | "$hook" 2>/dev/null
  status=$?
  if [[ $status -ne $expected ]]; then
    echo "FAIL (expected exit $expected, got $status): $command"
    failures=$((failures + 1))
  fi
}

blocked() { check 2 "$1"; }
allowed() { check 0 "$1"; }

blocked 'rm -rf dist'
blocked 'rm -r -f dist'
blocked "bash -c 'rm -fr dist'"
blocked 'git push --force origin main'
blocked 'git push -uf origin main'
blocked 'git push origin +main'
blocked 'git push --mirror'
blocked 'git reset --hard HEAD~1'
blocked 'git clean -fdx'
blocked 'git clean --force -d'
blocked 'npx prisma migrate reset --force'
blocked 'npx prisma db push --force-reset'
blocked 'npx prisma db push --accept-data-loss'
blocked 'psql -c "DROP SCHEMA public CASCADE"'
blocked 'psql -c "drop table \"Application\""'
blocked 'psql -c "DROP DATABASE openjobseekr"'
blocked 'psql -c "TRUNCATE \"User\""'
blocked 'find . -name "*.ts" -delete'
blocked 'docker system prune --volumes'
blocked 'docker compose down -v'
blocked 'docker volume rm openjobseekr_db'

allowed 'rm dist/index.js'
allowed 'git push origin main'
allowed 'git push -u origin feature'
allowed 'git reset HEAD~1'
allowed 'git clean -n'
allowed 'npx prisma migrate dev'
allowed 'npx prisma migrate deploy'
allowed 'find . -name "*.ts"'
allowed 'docker compose down'
allowed 'npm run check'

if [[ $failures -gt 0 ]]; then
  echo "$failures hook test(s) failed"
  exit 1
fi
echo "validate-bash.sh: all hook tests passed"
