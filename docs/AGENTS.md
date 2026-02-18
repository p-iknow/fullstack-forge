# DOCS KNOWLEDGE BASE

Docs are the planning and execution backbone for `fullstack-forge`: requirements, architecture, and deep rationale.

## STRUCTURE

```
docs/
├── prd/           # product requirements
├── architecture/  # system design + decisions
├── learn/         # deep rationale docs
└── README.md      # top-level entry point
```

## WHERE TO LOOK

| Task                          | Location                         | Notes                     |
| ----------------------------- | -------------------------------- | ------------------------- |
| Navigate all docs quickly     | `docs/README.md`                 | top-level reading paths   |
| Requirement truth source      | `docs/01-prd/AGENTS.md`          | conflict winner           |
| Architecture decisions/design | `docs/02-architecture/AGENTS.md` | `.adr.md` / `.md` routing |
| Stack rationale deep dive     | `docs/03-learn/AGENTS.md`        | topic-by-topic references |

## CONVENTIONS

- PRD is the source of truth when requirement conflicts appear.
- Architecture docs contain only design specs (`.md`) and ADRs (`.adr.md`).
- Completion requires evidence (no evidence -> not complete).
- Docs are primarily Korean; command/skill assets remain English-centric.

## ANTI-PATTERNS

- Putting app runtime runbooks into docs folders.
- Duplicating the same navigation table in every subdirectory.
- Mixing requirement edits into architecture execution docs.

## SEE ALSO

- Root router: `AGENTS.md`
- App runtime context: `apps/AGENTS.md`
- Package context: `packages/AGENTS.md`
