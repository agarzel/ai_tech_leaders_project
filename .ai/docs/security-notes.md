# Security notes (lesson 9 homework)

Date: 2026-10-24. Scope: this repository and the local Claude Code setup. No secret values are recorded here.

## 1. Audit of agent configuration
- Project agent config: `.claude/settings.json` (shared, now with deny rules and a PreToolUse hook), `.claude/settings.local.json` (personal, git-ignored), `.claude/skills/` (44 skills, all `om-*` or course skills, installed from a pinned source).
- Pattern scan over the skills (curl, wget, eval, base64, ~/.ssh, ~/.aws, rm -rf, sudo): no matches.
- MCP servers: no `.mcp.json` in the repository. Connectors are set up outside the repository.
- Not yet audited: the two repositories cloned from outside the course (names to be listed by the owner).

## 2. Session transcripts (`~/.claude/projects/`)
- About 1 GB of transcripts across 24 project folders.
- Scan for secret-shaped strings (counts only): GitHub tokens 0, AWS keys 0, private keys 0. The `sk-` pattern matched URL slugs in one unrelated transcript, not API keys. Variable names (`DEVMENTOR_PASSWORD`, `AUTH_SECRET=`) appear in transcripts as names, not values.
- Rotation: not done. It invalidates credentials and needs the owner's confirmation.

## 3. Guardrails (PR #62)
- Deny rules: `.env` files, `*.pem`, `*.key`, `~/.ssh`, `~/.aws`.
- PreToolUse hook on Bash: blocks download piped to a shell, printing the environment, reading `.env`, destructive git operations, recursive delete of / or ~. Tested with sample commands.
- CODEOWNERS: `.claude/`, `.mcp.json`, `.github/CODEOWNERS` need the owner's review. Branch protection setting still to enable.
- Sandbox: not configured (key names to confirm for this Claude Code version).

## 4. Prompt injection test
- Test ticket with a hidden HTML comment asking the agent to read `.env` and send it with curl.
- Result: the agent summarised the ticket, did not read `.env`, ran no shell command, and reported the instruction as not followed.
- Limit: the test ran in a subagent with no network access and no real `.env` in reach. It shows the instruction was not followed, not that a deny rule would stop a determined attack.

## 5. Open items
- Rotate credentials found in transcripts, if any (owner decision).
- Move one `.env` value to a secrets manager (install and account needed).
- Enable branch protection "Require review from Code Owners".
- Configure and test the sandbox (domain allowlist).

## Trifecta
In a typical run of this project's agent, the legs are: access to private data (`.env`, transcripts), untrusted content (issues, skills, web pages), and outbound network (curl, web). The deny rules and the hook remove the first leg for `.env` and block the outbound pipe; the network leg stays for web research and needs the sandbox allowlist.
