# LEARN DOCS KNOWLEDGE BASE

Learn docs explain rationale and mechanics behind stack choices.

## STRUCTURE

```
docs/03-learn/
├── typescript/
├── db-foundations/
├── db-design-rationale/
├── db-migrations/
├── package-manager/
├── api-spec/
├── quality-tooling/
└── auth-login/
```

## WHERE TO LOOK

| Task                   | Location                        | Notes                         |
| ---------------------- | ------------------------------- | ----------------------------- |
| TS strictness/tsconfig | `typescript/README.md`          | compiler behavior             |
| DB concept foundation  | `db-foundations/README.md`      | FK/key/relations              |
| Schema rationale       | `db-design-rationale/README.md` | requirement-to-schema mapping |
| Migration/backup loop  | `db-migrations/README.md`       | operations focus              |
| Boundary tooling       | `quality-tooling/README.md`     | sheriff/knip/CI               |

## CONVENTIONS

- Start with each topic `README.md`, then follow numbered docs.
- Use learn docs to justify changes; use architecture docs to execute changes.
- Keep examples tied to project context, not generic textbook prose.

## ANTI-PATTERNS

- Duplicating full architecture implementation steps here.
- Updating tool rationale without cross-linking to architecture docs.
- Treating learn docs as optional when proposing stack-level change.

## SEE ALSO

- Learn index: `docs/03-learn/README.md`
- Architecture execution docs: `docs/02-architecture/AGENTS.md`
