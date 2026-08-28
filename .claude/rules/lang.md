# Project Language Rules

@~/.claude/rules/lang/ts.md

## Project Overrides

- Runner: Bun, not `node --test`. No test suite exists — the `ts.md` Testing section is inert here.
- Lint/format: Biome + Oxlint (not ESLint/Prettier). Config in `biome.json` / `.oxlintrc.json`.
- `tsconfig.json` does not yet set `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` — `ts.md` still requires narrowing at boundaries by hand.
