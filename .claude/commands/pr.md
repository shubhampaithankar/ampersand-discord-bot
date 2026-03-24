# Create Pull Request

Open a PR for the current branch using the GitHub MCP.

## Arguments

`$ARGUMENTS` — optional PR title override

## Steps

1. Run `git status` and `git log develop..HEAD` to understand what's on the branch.

2. Check for a PR template: look for `.github/PULL_REQUEST_TEMPLATE.md` or `.github/PULL_REQUEST_TEMPLATE/` — use it if present.

3. Call `get_review_context_tool` from code-review-graph to summarise the changes.

4. Use `mcp-server-github` `create_pull_request`:
   - Base branch: `master`
   - Title: concise, under 70 chars (use `$ARGUMENTS` if provided)
   - Body: summary of changes, what was added/fixed, blast radius if relevant

5. Return the PR URL.

## Notes

- Never force-push or target `master` directly
- If checks are failing after push, use `gh pr checks` or `mcp-server-github` `pull_request_read` to investigate
