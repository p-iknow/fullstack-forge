# PACKAGES WORKSPACE KNOWLEDGE BASE

Reusable workspace packages live here: API contract and design system.

## STRUCTURE

```
packages/
├── api-spec/       # TypeSpec -> OpenAPI -> TS types
└── design-system/  # UI component library
```

## WHERE TO LOOK

| Task                    | Location                                             | Notes                      |
| ----------------------- | ---------------------------------------------------- | -------------------------- |
| API contract source     | `api-spec/src/main.tsp`                              | codegen input              |
| Generated API artifacts | `api-spec/generated/`                                | `openapi.yaml`, `types.ts` |
| API-spec scripts        | `api-spec/package.json`                              | `codegen`, `codegen:check` |
| UI components           | `design-system/src/components/`                      | exported component modules |
| UI hooks/lib            | `design-system/src/hooks/`, `design-system/src/lib/` | reusable helpers           |
| UI styles exports       | `design-system/src/styles/`                          | CSS side effects           |

## CONVENTIONS

- `api-spec` is source-of-truth for OpenAPI/contracts; generated files are outputs, not handwritten docs.
- `design-system` exports per subpath (`./components/*`, `./lib/*`, `./hooks/*`, `./styles/*.css`).
- Validate changes with package-local scripts before workspace-wide checks.
- Use declaration-time exports (`export const`, `export function`, `export type`) instead of trailing local export blocks.

## ANTI-PATTERNS

- Editing generated contract artifacts without updating TypeSpec source.
- App-specific logic inside shared packages.
- Moving package-specific guidance into root file (keep local details here).

## QUICK COMMANDS

```bash
pnpm nx run @fullstack-forge/api-spec:codegen
pnpm nx run @fullstack-forge/design-system:build
pnpm nx run @fullstack-forge/design-system:test
```

## SEE ALSO

- Project root: `AGENTS.md`
- App consumers: `apps/AGENTS.md`
