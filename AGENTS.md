# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-18 | **Commit:** ffcd450 | **Branch:** feat/auth-foundation

## OVERVIEW

`local-fullstack-harness` is a fullstack monorepo plus documentation and AI workflow assets for `fullstack-forge`.
This repository now includes real app/package code and docs-driven architecture guidance.

## STRUCTURE

```
./
├── apps/        # runnable apps (api, store, admin)
├── packages/    # shared packages (api-spec, design-system)
├── docs/        # PRD, architecture, learn
├── .claude/     # AI command and skill assets
├── scripts/     # workspace utility scripts
└── AGENTS.md    # this root router
```

## WHERE TO LOOK

| Task                   | Location                         | Notes                          |
| ---------------------- | -------------------------------- | ------------------------------ |
| App-level coding work  | `apps/AGENTS.md`                 | runtime units + app commands   |
| Shared package work    | `packages/AGENTS.md`             | contract/UI library boundaries |
| Docs map (all docs)    | `docs/AGENTS.md`                 | top-level docs navigation      |
| Product requirements   | `docs/01-prd/AGENTS.md`          | source of truth                |
| Architecture reasoning | `docs/02-architecture/AGENTS.md` | design + ADR only              |
| Deep rationale docs    | `docs/03-learn/AGENTS.md`        | deep rationale references      |
| AI assets routing      | `.claude/AGENTS.md`              | commands + skills hubs         |

## CODE MAP

| Area            | Entry                                    | Role                      |
| --------------- | ---------------------------------------- | ------------------------- |
| API service     | `apps/api/src/index.ts`                  | backend runtime bootstrap |
| Store app       | `apps/store/src/router.tsx`              | customer UI routing       |
| Admin app       | `apps/admin/src/router.tsx`              | operator UI routing       |
| API spec source | `packages/api-spec/src/main.tsp`         | contract source           |
| Design system   | `packages/design-system/src/components/` | shared UI modules         |

## CONVENTIONS

- Git branch: `type/kebab-case`.
- Commit format: `type(scope): description`; group by purpose, not file count.
- Tests keep `// given`, `// when`, `// then` structure.
- Preferred TS style: arrow-function defaults and explicit inline exports.
- Use declaration-time exports (`export const`, `export function`, `export type`) instead of trailing local export blocks (`const x...; export { x }`).
- Docs flow: PRD -> architecture -> learn.

## ANTI-PATTERNS

- Splitting commits by file when intent is one change.
- Skipping hooks with `--no-verify`.
- Committing secrets (`.env`, credentials).
- Breaking module boundaries (backend importing UI package, cross-app leakage).
- Duplicating local subdomain guidance in this root file.

## COMMANDS

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm nx run-many -t codegen
pnpm nx run-many -t typecheck
pnpm nx run-many -t test
pnpm nx run-many -t build
pnpm check
```

## NOTES

- Root file is intentionally short; operational detail belongs in nearest subdirectory `AGENTS.md`.
- For docs-only tasks, start in `docs/AGENTS.md`; for code tasks, start in `apps/AGENTS.md` or `packages/AGENTS.md`.
