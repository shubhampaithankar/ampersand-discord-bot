# New Init Module

Add a new configurable module to the `/init` panel system.

## Arguments

`$ARGUMENTS` — module name (e.g. `welcome`, `autorole`)

## Steps

1. Read `src/interactions/modules/init.ts` and `src/models/guild/autoGamble.service.ts` before writing anything.

2. **`src/models/guild/schema.ts`** — add sub-schema and register on GuildSchema.

3. **`src/models/guild/<module>.service.ts`** — `get`, `update` (dot-notation `$set`), any `add`/`remove` helpers.

4. **`src/interactions/modules/init.ts`** — add `handle<Module>` method following the `handleAutoGamble` pattern:
   - `buildPanel()` closure: fetch DB → build embed + rows
   - `showPanel()` closure: `editReply({ embeds, components })`
   - `createButtonHandler` (no `max`) for the panel
   - `toggleButton(enabled, ids.toggle)` for enable/disable
   - `createChainedCollector` for any channel/value selection sub-flows
   - `onEnd` re-renders panel with components removed

5. Register the module in the slash command choices and `run()` dispatch.

6. All DB updates must use dot-notation `$set` — see `.claude/rules/conventions.md`.
