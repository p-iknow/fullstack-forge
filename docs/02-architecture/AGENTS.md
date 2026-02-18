# ARCHITECTURE DOCS KNOWLEDGE BASE

Architecture docs define decisions and design specs.

## STRUCTURE

```
docs/02-architecture/
├── base/         # workspace foundation, infra, tooling
├── backend/      # API/data/event architecture
├── frontend/     # UI/state/pattern architecture
└── integration/  # runtime/deploy/integration architecture
```

## WHERE TO LOOK

| Task                     | Location                            | Notes                         |
| ------------------------ | ----------------------------------- | ----------------------------- |
| Global architecture map  | `base/01-overview.md`               | starting point                |
| Backend stack rationale  | `backend/01-backend.adr.md`         | Hono/Drizzle/Postgres/Redis   |
| Frontend stack rationale | `frontend/01-frontend.adr.md`       | TanStack Start/React/Tailwind |
| Integration rationale    | `integration/01-integration.adr.md` | Docker/K8s/LocalStack         |

## CONVENTIONS

- `.adr.md` = architecture decision records (why this choice).
- plain `.md` = design specification/reference.
- Keep PRD traceability explicit for ADRs.

## ANTI-PATTERNS

- Mixing execution checklist details into ADR rationale sections.
- Adding app-level run commands here (belongs to workspace guides).
- Copying unchanged content from `docs/AGENTS.md`.

## SEE ALSO

- Docs root: `docs/AGENTS.md`
- PRD source of truth: `docs/01-prd/AGENTS.md`
- Deep rationale: `docs/03-learn/AGENTS.md`
