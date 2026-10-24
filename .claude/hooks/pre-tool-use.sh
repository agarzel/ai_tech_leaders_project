#!/usr/bin/env bash
# PreToolUse guardrail for Bash. Reads the tool call as JSON on stdin; exit 2 blocks the call.
set -uo pipefail

command -v jq >/dev/null 2>&1 || { echo "pre-tool-use: jq is required" >&2; exit 2; }

input="$(cat)"
tool="$(printf '%s' "$input" | jq -r '.tool_name // empty')"
[[ "$tool" == "Bash" ]] || exit 0

cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"

block() {
  echo "Blocked by .claude/hooks/pre-tool-use.sh: $1" >&2
  exit 2
}

# Remote code straight into a shell.
if printf '%s' "$cmd" | grep -Eq '(curl|wget)[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(sh|bash|zsh)\b'; then
  block "piping a download into a shell"
fi
# Dumping the environment or secret files.
if printf '%s' "$cmd" | grep -Eq '(^|[[:space:];&|])(printenv|env)([[:space:]]*$|[[:space:];&|])'; then
  block "printing the environment (may expose secrets)"
fi
if printf '%s' "$cmd" | grep -Eq '(cat|less|more|head|tail|grep|sed|awk|source|\.)[[:space:]]+[^|;&]*\.env([[:space:]]|$|\.)'; then
  block "reading a .env file (secrets stay out of the agent's context)"
fi
# Destructive git operations that hide or discard local work.
if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+(stash|reset[[:space:]]+--hard|checkout[[:space:]]+--|clean[[:space:]]+-f)'; then
  block "destructive git operation (never stash or discard local changes)"
fi
# Deleting the root or the home directory.
if printf '%s' "$cmd" | grep -Eq 'rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*f?[[:space:]]+(/|~|\$HOME)([[:space:]]|$)'; then
  block "recursive delete of / or the home directory"
fi

exit 0
