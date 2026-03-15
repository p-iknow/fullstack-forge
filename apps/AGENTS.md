# APPS WORKSPACE KNOWLEDGE BASE

Monorepo runtime units live here: one backend service and two frontend apps.

## STRUCTURE

```
apps/
├── api/    # Hono API service (backend)
├── store/  # customer web app (TanStack Start)
└── admin/  # admin web app (TanStack Start)
```

## WHERE TO LOOK

| Task                      | Location                                           | Notes                 |
| ------------------------- | -------------------------------------------------- | --------------------- |
| API endpoints/auth flows  | `api/src/routes/`                                  | domain route modules  |
| DB schema/migrations/seed | `api/src/db/`                                      | Drizzle schema + seed |
| API app bootstrap         | `api/src/app.ts`, `api/src/index.ts`               | app wiring + entry    |
| Store routes/pages        | `store/src/routes/`, `store/src/pages/`            | file-based routing    |
| Admin routes/pages        | `admin/src/routes/`, `admin/src/pages/`            | file-based routing    |
| Shared frontend API calls | `store/src/@shared/api/`, `admin/src/@shared/api/` | domain clients        |

## CONVENTIONS

- Run commands with Nx targets: `pnpm nx run @fullstack-forge/<app>:<target>`.
- Backend follows service boundaries; frontend apps consume `@fullstack-forge/api-spec` and `@fullstack-forge/design-system`.
- Keep tests aligned with project convention (`// given`, `// when`, `// then`).
- Use declaration-time exports (`export const`, `export function`, `export type`) instead of trailing local export blocks.

## ANTI-PATTERNS

- Cross-app imports (`store` <-> `admin`) for feature code.
- Backend importing UI package (`@fullstack-forge/design-system`).
- Duplicating app-specific runbooks into root `AGENTS.md`.

## QUICK COMMANDS

```bash
pnpm nx run @fullstack-forge/api:dev
pnpm nx run @fullstack-forge/store:dev
pnpm nx run @fullstack-forge/admin:dev
pnpm nx run @fullstack-forge/api:test
```

## SEE ALSO

- Project root: `AGENTS.md`
- Package contracts/UI libs: `packages/AGENTS.md`
