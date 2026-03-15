# Skills Catalog

**Generated:** 2026-02-18

이 저장소에 설치된 AI 스킬 카탈로그. 각 스킬은 표준 구조를 따른다.

## SKILL INDEX

| Skill                                               | Triggers                                                 | Purpose                                                                      |
| --------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [doc-frontmatter](doc-frontmatter/)                 | "frontmatter", "add frontmatter"                         | Generate/validate YAML frontmatter for docs                                  |
| [frontend-api-patterns](frontend-api-patterns/)     | "API pattern", "useSuspenseQuery", "Route Loader"        | Apply TanStack Query + Suspensive data fetching patterns                     |
| [frontend-error-handling](frontend-error-handling/) | "AsyncResult", "HTTPError", "ErrorBoundary"              | Standardize frontend error handling for async flows and UI boundaries        |
| [frontend-design](frontend-design/)                 | "polish UI", "a11y", "dark mode", "state coverage", "token consistency" | Build production-grade frontend UI with token-first styling, accessibility, dark mode, and complete state coverage |
| [frontend-page-structure](frontend-page-structure/) | "screens/ structure", "page folder", "@shared"           | Apply cohesion-driven screens/ folder structure conventions                  |
| [frontend-style-layout](frontend-style-layout/)     | "Tailwind v4", "spacing", "responsive image", "layout"   | Apply Tailwind v4 styling, spacing, and responsive image patterns            |
| [meta-prompt-engineer](meta-prompt-engineer/)       | "write a prompt", "create prompt", "meta-prompt"         | Generate high-quality prompts using proven techniques                        |
| [meta-skill](meta-skill/)                           | "create a skill", "validate skill"                       | Guide for creating and validating AI skills                                  |
| [learn-writer](learn-writer/)                       | "learn docs", "deep dive", "기술 스택 왜"                | Generate docs/learn deep-dive documentation in PAR format                    |
| [phased-delivery-plan](phased-delivery-plan/)       | "split work", "phased plan", "branch plan"               | Build reusable phased delivery plans with gates and evidence                 |
| [frontend-testing](frontend-testing/)               | "given when then", "test conventions", "testable design" | Apply testing conventions, testable function design, vitest patterns         |
| [frontend-code-quality](frontend-code-quality/)     | "code quality", "code review", "frontend fundamentals"   | Apply Toss FF 4 principles: readability, predictability, cohesion, coupling  |
| [typescript-patterns](typescript-patterns/)         | "PredefinedType", "discriminated union", "const object"  | TypeScript type design: PredefinedType, tagged unions, const object, Zod     |
| [mermaid-syntax](mermaid-syntax/)                   | "mermaid", "diagram", "flowchart", "sequenceDiagram"     | Enforce correct Mermaid syntax: `<br>` line breaks, safe labels, edge syntax |
| [prd-review](prd-review/)                           | "PRD review", "requirements gap", "cross-domain check"   | Review PRD docs for completeness, consistency, and depth from domain expert view |
| [adr-prd-sync](adr-prd-sync/)                       | "ADR review", "architecture sync", "PRD traceability"    | Review backend ADRs against PRD for decision adequacy, traceability, consistency |
| [slice-planner](slice-planner/)                     | "plan slice", "session plan", "세부구현"                 | Create agent-executable session plans for vertical slices with progressive tasks |
| [suspensive-refactoring](suspensive-refactoring/)   | "isPending/isError 제거", "Suspensive 전환", "refactor to Suspense" | Migrate manual useQuery state checks to declarative Suspensive boundaries    |
| [frontend-optimistic-updates](frontend-optimistic-updates/) | "optimistic", "useOptimistic", "setQueryData rollback" | Apply optimistic UI update patterns: TQ cache imperative, useOptimistic, hybrid |

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

- Workspace router: [`.claude/AGENTS.md`](../AGENTS.md)
- Root [AGENTS.md](../../AGENTS.md) for project overview
- [docs/AGENTS.md](../../docs/AGENTS.md) for documentation structure
