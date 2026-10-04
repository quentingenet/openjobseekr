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

# SQL only runs through psql or `prisma db execute`; elsewhere these words are just text (a
# commit message, a grep pattern). A .sql file passed with --file is not inspected.
if grep -Eq '(^|[[:space:]/])psql([[:space:]]|$)|prisma[[:space:]]+db[[:space:]]+execute' <<<"$normalized" &&
  grep -Eiq 'drop[[:space:]]+(database|schema|table)|truncate[[:space:]]|delete[[:space:]]+from' <<<"$normalized"; then
  block "SQL that drops or deletes data (DROP DATABASE/SCHEMA/TABLE, TRUNCATE, DELETE FROM)"
fi

while IFS= read -r segment; do
  read -ra words <<<"$segment"
  [[ ${#words[@]} -gt 0 ]] || continue
  # A commit only records changes; its message may mention any command.
  [[ "${words[0]}" == git && "${words[1]:-}" == commit ]] && continue

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
        --force | --force-with-lease | --force-with-lease=* | -f | -*f | +*)
          block "force push (git push --force or a +refspec)"
          ;;
        --mirror) block "git push --mirror" ;;
      esac
    done
  fi

  if has git && has reset && has --hard; then
    block "git reset --hard"
  fi

  # Commands that throw away uncommitted work or unmerged commits.
  if has git && has checkout && { has . || has -f || has --force; }; then
    block "git checkout that discards local changes"
  fi
  if has git && has restore && ! { { has --staged || has -S; } && ! has --worktree && ! has -W; }; then
    block "git restore of working tree files"
  fi
  if has git && has stash && { has drop || has clear; }; then
    block "git stash drop/clear"
  fi
  if has git && has branch && { has -D || { has --delete && has --force; }; }; then
    block "forced branch deletion (git branch -D)"
  fi

  # git clean only deletes with a force flag; -x also deletes ignored files such as .env.
  if has git && has clean; then
    for word in "${words[@]}"; do
      if [[ "$word" == --force || ("$word" == -[!-]* && "$word" == *f*) ]]; then
        block "git clean with --force"
      fi
    done
  fi

  if has prisma && { { has migrate && has reset; } || has --force-reset || has --accept-data-loss; }; then
    block "Prisma command that resets the database"
  fi

  if has find && has -delete; then
    block "find -delete"
  fi

  if has docker && has prune && has --volumes; then
    block "Docker prune with volumes"
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
