# CLAUDE WORKSPACE KNOWLEDGE BASE

This directory stores operational AI assets for this repository: reusable commands and skills.

## STRUCTURE

```
.claude/
├── commands/   # slash-command playbooks (branch, commit, pr)
└── skills/     # reusable skill packages (SKILL.md + optional refs/scripts/workflows)
```

## WHERE TO LOOK

| Task                   | Location                          | Notes                               |
| ---------------------- | --------------------------------- | ----------------------------------- |
| Generate branch name   | `commands/branch.md`              | format: `type/kebab-case`, max 50   |
| Create atomic commit   | `commands/commit.md`              | format: `type(scope): description`  |
| Create/update draft PR | `commands/pr.md`                  | always draft, includes Summary/Test |
| Skill catalog          | `skills/AGENTS.md`                | entry point for installed skills    |
| Create/validate skill  | `skills/meta-skill/SKILL.md`      | 7-phase flow + validators           |
| Add docs frontmatter   | `skills/doc-frontmatter/SKILL.md` | YAML schema + scripts               |

## CONVENTIONS

- Command docs define behavior; do not duplicate full command logic here.
- Skill folder name must match `SKILL.md` frontmatter `name`.
- Skill description must be natural prose (no `USE WHEN:` style labels).
- Keep skill-heavy details in each skill folder; this file stays as router.

## ANTI-PATTERNS

- Duplicating `commands/*.md` content into this file.
- Adding `README.md` inside skill folders instead of `SKILL.md`/`references/`.
- Embedding broad project conventions here (keep those in root `AGENTS.md`).

## SEE ALSO

- Project root: `AGENTS.md`
- Skills catalog: `.claude/skills/AGENTS.md`
