#!/usr/bin/env bash
# PostToolUse hook for Edit|Write: formats and lints only the edited file.
# The edit is always kept. Remaining ESLint errors are sent back to Claude (exit code 2
# on PostToolUse shows stderr to Claude without undoing anything) so it can fix them.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null) || exit 0
project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"

[[ -n "$file" && -f "$file" ]] || exit 0
# Only files inside this repository.
[[ "$file" == "$project_dir"/* ]] || exit 0

cd "$project_dir" || exit 0
[[ -x node_modules/.bin/prettier ]] || exit 0

node_modules/.bin/prettier --write --ignore-unknown --log-level warn "$file" >&2

case "$file" in
  *.ts | *.tsx | *.js | *.mjs | *.cjs)
    if ! lint_output=$(node_modules/.bin/eslint --fix --no-warn-ignored "$file" 2>&1); then
      echo "ESLint errors remain in $file after --fix:" >&2
      echo "$lint_output" >&2
      exit 2
    fi
    ;;
esac

exit 0
