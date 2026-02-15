# Skills Catalog

**Generated:** 2026-02-15 | **Commit:** 1921386

이 저장소에 설치된 AI 스킬 카탈로그. 각 스킬은 표준 구조를 따른다.

## SKILL INDEX

| Skill                                         | Triggers                                         | Purpose                                                      |
| --------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| [doc-frontmatter](doc-frontmatter/)           | "frontmatter", "add frontmatter"                 | Generate/validate YAML frontmatter for docs                  |
| [meta-prompt-engineer](meta-prompt-engineer/) | "write a prompt", "create prompt", "meta-prompt" | Generate high-quality prompts using proven techniques        |
| [meta-skill](meta-skill/)                     | "create a skill", "validate skill"               | Guide for creating and validating AI skills                  |
| [learn-writer](learn-writer/)                 | "learn docs", "deep dive", "기술 스택 왜"        | Generate docs/learn deep-dive documentation in PAR format    |
| [phased-delivery-plan](phased-delivery-plan/) | "split work", "phased plan", "branch plan"       | Build reusable phased delivery plans with gates and evidence |

## STRUCTURE PATTERN

```
skill-name/
├── SKILL.md              # Required: frontmatter + instructions
├── workflows/            # Optional: step-by-step procedures
├── references/           # Optional: on-demand documentation
├── scripts/              # Optional: validation/generation scripts
└── assets/               # Optional: templates
```

## FRONTMATTER FORMAT

```yaml
---
name: skill-name # kebab-case, matches directory
description: Natural prose describing what it does. Use when [triggers woven
  into sentences]. No structured labels like "USE WHEN:" — write 1-3 sentences.
---
```

## SEE ALSO

- Root [AGENTS.md](../../AGENTS.md) for project overview
- [docs/AGENTS.md](../../docs/AGENTS.md) for documentation structure
