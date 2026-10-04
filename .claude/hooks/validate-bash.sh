#!/usr/bin/env bash
# PreToolUse hook for Bash: blocks destructive commands.
# Exit code 2 blocks the tool call; the message on stderr is shown to Claude.
set -uo pipefail
set -f # no glob expansion when splitting commands into words

block() {
  echo "Blocked by .claude/hooks/validate-bash.sh: $1. Ask the user to run it themselves if it is really needed." >&2
  exit 2
}

if ! command=$(jq -r '.tool_input.command // empty' 2>/dev/null); then
  block "could not parse the hook input (is jq installed?)"
fi

# Remove quotes and backslashes so `bash -c 'rm -rf x'`, `\rm` or `rm "-rf"` look like plain
# commands, then split into simple commands on shell separators.
normalized=$(tr -d "'\"\\\\" <<<"$command")

if grep -Eiq 'drop[[:space:]]+database' <<<"$normalized"; then
  block "DROP DATABASE"
fi

while IFS= read -r segment; do
  read -ra words <<<"$segment"
  [[ ${#words[@]} -gt 0 ]] || continue

  has() {
    local w
    for w in "${words[@]}"; do [[ "$w" == "$1" ]] && return 0; done
    return 1
  }

  # rm with both recursive and force flags in any form (-rf, -fr, -r -f, --recursive --force),
  # also through a path (/bin/rm) or a wrapper (sudo, bash -c, git rm).
  in_rm=false recursive=false force=false
  for word in "${words[@]}"; do
    if [[ "${word##*/}" == rm ]]; then
      in_rm=true
      continue
    fi
    $in_rm || continue
    case "$word" in
      --recursive) recursive=true ;;
      --force) force=true ;;
      --*) ;;
      -*)
        [[ "$word" == *[rR]* ]] && recursive=true
        [[ "$word" == *f* ]] && force=true
        ;;
    esac
  done
  if $recursive && $force; then
    block "recursive forced deletion (rm -rf)"
  fi

  if has git && has push; then
    for word in "${words[@]}"; do
      case "$word" in
        --force | --force-with-lease | --force-with-lease=* | -f | -*f) block "force push (git push --force)" ;;
      esac
    done
  fi

  if { has docker || has docker-compose; } && has volume && { has rm || has remove || has prune; }; then
    block "Docker volume removal"
  fi

  if { { has docker && has compose; } || has docker-compose; } && has down; then
    if has -v || has --volumes; then
      block "docker compose down with volumes (-v)"
    fi
  fi
done < <(tr ';&|()`\n' '\n\n\n\n\n\n\n' <<<"$normalized")

exit 0
