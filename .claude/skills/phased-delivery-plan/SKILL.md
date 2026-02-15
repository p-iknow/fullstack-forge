---
name: phased-delivery-plan
description: Build reusable phased implementation plans for this repository.
  Use when users want to split work into branch-sized units with explicit gates,
  evidence, and handoff outputs for the next phase.
---

# Phased Delivery Plan

Create a plan document that can be reused across scaffolding, feature delivery, refactoring, and migration work.

## Scoping Rule — One Roadmap Step per Plan

**1 plan = 1 roadmap step.** 여러 roadmap 단계를 하나의 plan에 묶지 않는다.

| Roadmap Step | Plan File                      |
| ------------ | ------------------------------ |
| 01 DB        | `01-db-and-migrations-plan.md` |
| 02 Auth      | `02-auth-plan.md`              |
| 02a Commerce | `03-commerce-core-plan.md`     |
| 03 Infra     | `04-infra-plan.md`             |
| ...          | 순번 증가                      |

Plan 번호(`01-`, `02-`, ...)는 생성 순서. Roadmap 번호와 1:1 대응하되, plan 파일명에 주제를 명시한다.

범위가 모호하면 **더 작게** 자른다. 큰 plan을 나중에 합치는 것보다, 작은 plan을 순차 실행하는 것이 안전하다.

## Use When

- Users ask for phased rollout, branch-by-branch execution, or progressive delivery
- Users want objective completion gates before starting the next unit
- Users want one reusable planning flow for multiple task types

## Workflow

1. **Identify the single roadmap step** that this plan covers (e.g., `roadmap/01-db-design-and-migrations.md`)
2. Read source-of-truth docs for that step (`docs/prd`, `docs/harness`, `docs/execution`, `docs/roadmap`)
3. Perform gap analysis for current state vs target state of that step only
4. Slice work into branch-sized units (typically 2~4 units per plan)
5. Apply mandatory section template to every unit
6. Add unit-level and stage-level gates
7. Add evidence requirements and next-step outputs
8. Save one plan file under `docs/plans/`

## Mandatory Sections

Each unit must include:

1. `Step Objective`
2. `Prerequisite`
3. `References`
4. `Progressive Tasks`
5. `Exit Criteria`
6. `Evidence`
7. `Output for Next Step`

Use [references/plan-template.md](references/plan-template.md).

## Optional Sections

Add only when useful:

- `Gap Analysis` for greenfield or recovery work
- `Branch/PR Strategy` for team parallelization
- `Troubleshooting` for likely failure points
- `Parameters` when reusing flow with different names/ports/paths

## Anti-Drift Rules

1. No `Exit Criteria` without matching `Evidence`.
2. No unit without both `Prerequisite` and `Output for Next Step`.
3. No claim based only on local judgment; cite at least one source doc in `References`.

## Repository Alignment

- Requirements: `docs/prd/05-phased-delivery-plan.md`
- Execution gates: `docs/execution/README.md`
- Step format: `docs/roadmap/README.md`
- Architecture constraints: `docs/harness/00-overview.md`

## Output Contract

Generate one document under `docs/plans/` with:

- **Scope** section stating which single roadmap step this plan covers
- A top-level unit dependency map (typically 2~4 units)
- A full mandatory section block for each unit
- A final stage gate section
- **Notes** section clarifying what is deferred to the next plan
