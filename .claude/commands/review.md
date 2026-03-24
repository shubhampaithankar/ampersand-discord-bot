# Review Current Changes

Code review using the knowledge graph for blast-radius analysis.

## Steps

1. Call `build_or_update_graph_tool` (incremental) to ensure graph is fresh.

2. Call `get_review_context_tool` — auto-detects changed files from git diff, returns source + impact context.

3. Call `get_impact_radius_tool` — shows what else is affected by the changes.

4. Review against project conventions (`.claude/rules/conventions.md`):
   - All `run()` handlers have `deferReply()` first
   - No direct `EmbedBuilder`/`ButtonBuilder`/`ActionRowBuilder` construction
   - MongoDB updates use dot-notation `$set`
   - `flags: MessageFlags.Ephemeral` not `ephemeral: true`
   - No DB reads in `onEnd` callbacks
   - Collector IDs built via `buildCustomIds`
   - Every `run()` has try/catch with `editReply` on error

5. Output:
   - **Summary** of what changed
   - **Bugs or convention violations** (file:line)
   - **Blast radius** — other commands/events affected
   - **Suggestions** if any
