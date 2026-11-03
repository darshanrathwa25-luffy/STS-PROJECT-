# CLAUDE.md

Read `CODEBASE_CONTEXT.md` in this folder before making changes. It describes the repo as it actually exists (branch `refactor/epic-lab`) and lists known bugs and doc/code mismatches.

## Rules
- Geometry math lives in `src/geometry-engine/`. UI components call it; never re-derive angle sums in React code.
- Before finishing: `npx tsc --noEmit` and `npm test` must pass; run `npm run build` for larger changes.
- Don't change the Triangle Lab architecture or restore/extend Compare mode without asking.
- `CODEBASE_CONTEXT.md` §11 explains why an older doc in `D:\Projects\sts project` disagrees with this code. Ask the user which version is authoritative before large refactors.

## Commands
`npm install` · `npm run dev` (port 3000) · `npm test` · `npx tsc --noEmit` · `npm run build`
