---
name: phased-delivery-plan
description: Build reusable phased implementation plans for this repository.
  Use when users want to split work into branch-sized units with explicit gates,
  evidence, and handoff outputs for the next phase.
---

# Phased Delivery Plan

Create a plan document that can be reused across scaffolding, feature delivery, refactoring, and migration work.

## Use When

- Users ask for phased rollout, branch-by-branch execution, or progressive delivery
- Users want objective completion gates before starting the next unit
- Users want one reusable planning flow for multiple task types

## Workflow

1. Read source-of-truth docs for scope (`docs/prd`, `docs/harness`, `docs/execution`, `docs/roadmap`)
2. Perform gap analysis for current state vs target state
3. Slice work into independent units with strict dependency order
4. Apply mandatory section template to every unit
5. Add unit-level and stage-level gates
6. Add evidence requirements and next-step outputs
7. Save one plan file under `docs/plans/`

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

- A top-level unit dependency map
- A full mandatory section block for each unit
- A final stage gate section
