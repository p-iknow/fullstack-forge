# Scaffolding Plan - Template Compliant

## Progress Summary

| Unit | Branch                           | Status      | Notes                                            |
| ---- | -------------------------------- | ----------- | ------------------------------------------------ |
| 1    | `config/workspace-foundation`    | ✅ Complete | Merged to main. All exit criteria pass.          |
| 2    | `config/packages-shared-apispec` | ✅ Complete | WIP committed. shared deferred (YAGNI).          |
| 3    | `config/packages-design-system`  | ✅ Complete | shadcn/ui + Base UI + Tailwind v4 + CVA + tsdown.|
| 4    | `config/apps-api`                | ✅ Complete | Hono + vite-build. Health endpoint verified.     |
| 5    | `config/apps-frontend`           | ✅ Complete | TanStack Start store (3001) + admin (3002).      |
| 6    | `config/quality-tooling`         | ✅ Complete | knip, sheriff, CI, route codegen, vitest v4 fix. |

**Last updated:** 2026-02-15

## Gap Analysis

| Item                | Current                                | Target (harness)                                |
| ------------------- | -------------------------------------- | ----------------------------------------------- |
| Root config files   | Not present (only `docs/`, `.claude/`) | tsconfig, workspace, nx, lint/format, gitignore |
| `packages/` layer   | Not present                            | `shared`, `api-spec`, `design-system`           |
| `apps/` layer       | Not present                            | `store`, `admin`, `api`                         |
| Quality tooling     | Not present                            | vitest workspace, knip, sheriff, CI             |
| Runtime/infra setup | Not present                            | Added in later execution stages                 |

## Branch/PR Strategy

- Unit granularity: 1 branch = 1 independently verifiable scaffolding unit.
- Dependency order: lower layer first (`packages` before `apps`).
- Merge policy: Unit N starts only after Unit N-1 merged.
- Branch naming (user decision): `config/*`.

```text
Unit 1 -> Unit 2 -> Unit 3 -> Unit 4 -> Unit 5 -> Unit 6

config/workspace-foundation
  -> config/packages-shared-apispec
  -> config/packages-design-system
  -> config/apps-api
  -> config/apps-frontend
  -> config/quality-tooling
```

## Unit 1: `config/workspace-foundation` ✅

### Step Objective

- Implementation goal: Create root-level monorepo foundation files.
- Learning/operational goal: Establish a stable baseline for all downstream packages/apps.

### Prerequisite

- [x] Repository baseline review completed.
- [x] `docs/execution/00-workspace-baseline.md` Step 0 reviewed.

### References

- `docs/harness/01-foundation.md`
- `docs/execution/00-workspace-baseline.md`

### Progressive Tasks

1. [x] Add root config files (`tsconfig.base.json`, `tsconfig.json`, `pnpm-workspace.yaml`, `nx.json`, `.npmrc`, `.oxlintrc.json`, `.oxfmtrc.json`, `.gitignore`).
2. [x] Add root `package.json` scripts for lint/format/build/dev/typecheck/test.
3. [x] Keep `tsconfig.json` references empty (`[]`) until packages/apps are created.
4. [x] Add `vitest.workspace.ts` as empty array for staged project onboarding.

### Exit Criteria

- [x] Root config files exist with content aligned to harness foundation.
- [x] `pnpm install` succeeds (lockfile regenerated after dep bumps).
- [x] `pnpm lint` succeeds (0 warnings, 0 errors).
- [x] `pnpm format:check` succeeds (all 94 files pass).
- [x] `pnpm typecheck` succeeds (no tasks — expected, no packages yet).
- [x] `pnpm build` succeeds (no tasks — expected, no packages yet).
- [x] `pnpm test` succeeds (no tasks — expected, no packages yet).
- [x] `pnpm exec nx show projects` runs without errors.

### Commits (on branch `config/workspace-foundation`)

| Hash      | Description                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------ |
| `6839be4` | config(workspace): add root monorepo foundation files                                            |
| `fc38672` | style: apply oxfmt formatting to pre-existing files                                              |
| `3b927e0` | config(deps): bump knip, oxfmt, oxlint to latest                                                 |
| `c9c77c7` | config(build): migrate to tsdown and @hono/vite for dev/build                                    |
| `355b81c` | config(vscode): add cSpell dictionary for project terms                                          |
| `0b58670` | config(cspell): extract dictionary to standalone cspell.json                                     |
| `0d5f949` | config(tsconfig): add erasableSyntaxOnly compiler option                                         |
| `ba72adb` | docs(learn): add TypeScript tsconfig deep-dive documentation                                     |
| `23f118a` | config(cspell): add project terminology                                                          |
| `6c62935` | feat(skills): add learn-writer skill for docs/learn generation                                   |
| `ff3c3c5` | refactor(learn): rewrite TypeScript docs in PAR format                                           |
| `42797b2` | refactor(skills): improve learn-writer from cross-agent review                                   |
| `30a4928` | docs(plans): update scaffolding plan with Unit 1 progress                                        |
| `981eeac` | config(deps): regenerate lockfile after dependency bumps                                         |
| `dd63a94` | style: apply oxfmt formatting to all files                                                       |
| `ab03d60` | config(pnpm): clean up .npmrc defaults, add packageManager field, and replace npx with pnpm exec |
| `0f78abe` | docs(learn): add package-manager deep-dive documentation                                         |

### Remaining Work

1. [x] ~~Run `pnpm install` to regenerate lockfile after dependency bumps.~~
2. [x] ~~Run `pnpm format` to fix 13 formatting issues.~~
3. [x] ~~Verify all exit criteria commands pass.~~
4. [x] ~~Clean up .npmrc (remove v10 defaults), add `packageManager` field, replace `npx` → `pnpm exec`.~~
5. [x] ~~Generate `docs/learn/package-manager/` documentation.~~
6. [ ] PR review and merge.

### Side Deliverables (produced during Unit 1, not in original plan)

- `docs/learn/typescript/` — 5 TypeScript tsconfig deep-dive documents (PAR format)
- `docs/learn/package-manager/` — 4 pnpm package manager deep-dive documents (PAR format)
- `.claude/skills/learn-writer/` — Reusable skill for generating docs/learn documentation
- `cspell.json` — Standalone spell-check dictionary

### Evidence

- Command logs: All 7 exit criteria passed (pnpm install, lint, format:check, typecheck, build, test, `pnpm exec nx show projects`).
- Artifacts: root config files, `.npmrc` (cleaned to comments-only), `package.json` with `packageManager` field.
- Notes: deferred items (`sheriff`, `knip`, CI) explicitly tracked for Unit 6. Storybook hoist-pattern deferred to Unit 3+.

### Output for Next Step

- Root workspace and task-runner baseline ready.
- Empty references/workspace test registry ready for package registration.

## Unit 2: `config/packages-shared-apispec`

### Step Objective

- Implementation goal: Create `packages/api-spec` with TypeSpec codegen pipeline.
- Learning/operational goal: Establish spec-first contract flow for frontend/backend.

### Design Decision: `packages/shared` deferred

원래 계획에 포함된 `packages/shared`는 YAGNI 원칙에 따라 이 단계에서 생성하지 않는다.
범용 "shared" 패키지 대신, 실제 공유 코드가 필요해지는 시점에 **목적별로 명확히 분리된 패키지**
(예: `@fullstack-forge/domain`, `@fullstack-forge/validation`)를 생성한다.

### Prerequisite

- [x] Unit 1 merged.
- [x] Root workspace settings validated.

### References

- `docs/harness/02-packages.md`
- `docs/execution/00-workspace-baseline.md`
- `docs/harness/05-integration.md`

### Progressive Tasks

1. ~~Create `packages/shared` package with runtime-neutral TypeScript baseline.~~ → Deferred (YAGNI).
2. [x] Create `packages/api-spec` with TypeSpec source and codegen scripts.
3. [x] Run API spec codegen.
4. Root TypeScript references update not needed (api-spec uses `tsp compile`, not `tsc -b`).

### Exit Criteria

- [x] `packages/api-spec` is created and wired.
- [x] `pnpm --filter @fullstack-forge/api-spec codegen` succeeds.
- [x] `packages/api-spec/generated/openapi.yaml` is generated.
- [x] `packages/api-spec/generated/types.ts` is generated.
- [x] `pnpm --filter @fullstack-forge/api-spec typecheck` succeeds.

### Evidence

- Command logs: codegen + api-spec typecheck output.
- Artifacts: generated OpenAPI and types files.
- Notes: TypeSpec 1.9.0 requires `#{}` object literal syntax (harness doc uses older `{}` syntax).

### Output for Next Step

- API contract and generated types available for UI/API packages.
- Purpose-scoped shared packages to be created when actual need arises.

## Unit 3: `config/packages-design-system`

### Step Objective

- Implementation goal: Create `packages/design-system` with base components and style foundation.
- Learning/operational goal: Establish reusable UI layer consumed by app frontends.

### Prerequisite

- [ ] Unit 2 merged.
- [ ] API spec generation path is stable.

### References

- `docs/harness/02-packages.md`
- `docs/harness/03-frontend.md`

### Progressive Tasks

1. Create `packages/design-system` package structure (`components`, `hooks`, `lib`, `styles`).
2. Configure package exports and TypeScript build settings.
3. Add baseline utility (`cn`) and initial component set.
4. Register package in root references and test workspace as needed.

### Exit Criteria

- [ ] `packages/design-system` package exists with build/typecheck scripts.
- [ ] `pnpm --filter @fullstack-forge/design-system build` succeeds.
- [ ] `pnpm --filter @fullstack-forge/design-system typecheck` succeeds.

### Evidence

- Command logs: design-system build/typecheck output.
- Artifacts: initial component and style files list.
- Notes: additional UI deps deferred policy captured.

### Output for Next Step

- UI library ready for store/admin apps.
- Frontend app scaffolding can import shared UI primitives.

## Unit 4: `config/apps-api`

### Step Objective

- Implementation goal: Create `apps/api` scaffolding with health endpoint.
- Learning/operational goal: Establish backend app boundary and runtime loop.

### Prerequisite

- [ ] Unit 3 merged.
- [ ] Shared and api-spec packages are consumable.

### References

- `docs/harness/04-backend.md`
- `docs/execution/00-workspace-baseline.md`

### Progressive Tasks

1. Create `apps/api` project structure and scripts.
2. Configure Hono app entrypoint and runtime settings.
3. Add `/health` endpoint.
4. Wire package dependencies to `shared` and `api-spec`.

### Exit Criteria

- [ ] API dev server starts.
- [ ] `curl http://localhost:8080/health` returns expected health payload.
- [ ] API project typecheck/build succeed for current scope.

### Evidence

- Command logs: API dev/build/typecheck output.
- Artifacts: API entrypoint and route file list.
- Notes: DB/Redis integration deferred to later stages is explicit.

### Output for Next Step

- Running backend baseline available for frontend integration.

## Unit 5: `config/apps-frontend`

### Step Objective

- Implementation goal: Create `apps/store` and `apps/admin` scaffolding.
- Learning/operational goal: Establish two frontend app boundaries consuming shared packages.

### Prerequisite

- [ ] Unit 4 merged.
- [ ] API baseline is reachable locally.

### References

- `docs/harness/03-frontend.md`
- `docs/harness/05-integration.md`
- `docs/execution/00-workspace-baseline.md`

### Progressive Tasks

1. Create `apps/store` and `apps/admin` project structures.
2. Configure router/dev/build/typecheck scripts.
3. Wire dependencies to `shared`, `design-system`, and `api-spec`.
4. Ensure dev entrypoints are runnable on expected ports.

### Exit Criteria

- [ ] Store dev server starts on `:3001`.
- [ ] Admin dev server starts on `:3002`.
- [ ] Frontend app typecheck/build succeed for current scope.

### Evidence

- Command logs: store/admin dev + typecheck/build output.
- Artifacts: app router/entrypoint file list.
- Notes: integration boundaries and deferred features captured.

### Output for Next Step

- Full app triad (`store`, `admin`, `api`) is scaffolded and runnable.

## Unit 6: `config/quality-tooling`

### Step Objective

- Implementation goal: Add workspace quality gates (vitest workspace, knip, sheriff, CI).
- Learning/operational goal: Enforce repeatable verification pipeline before next phases.

### Prerequisite

- [ ] Unit 5 merged.
- [ ] All apps/packages are present for quality rule wiring.

### References

- `docs/harness/06-tooling.md`
- `docs/execution/00-workspace-baseline.md`
- `docs/execution/README.md`

### Progressive Tasks

1. Finalize `vitest.workspace.ts` project registration.
2. Add `knip.json` and `sheriff.config.ts` rules.
3. Add CI workflow for codegen/lint/format/typecheck/build/test.
4. Re-enable root scripts that depend on quality config (`sheriff`, `knip`, `check`).

### Exit Criteria

- [ ] `pnpm sheriff` succeeds.
- [ ] `pnpm knip` succeeds.
- [ ] `pnpm check` succeeds.
- [ ] Integrated verification command succeeds: `pnpm exec nx run-many -t codegen && pnpm check && pnpm build && pnpm test`.

### Evidence

- Command logs: sheriff/knip/check/full verification output.
- Artifacts: quality config files and CI workflow file list.
- Notes: known warnings or deferred hardening tasks documented.

### Output for Next Step

- Workspace baseline is complete and quality-gated.
- Ready to enter next execution stages (DB/auth/domain/infra).

## Stage Gate (Final)

### Entry Criteria

- [ ] Unit scope and references fixed.
- [ ] Unit dependency order agreed.

### Exit Criteria

- [ ] All six units satisfy their Exit Criteria.
- [ ] All unit Evidence is captured.
- [ ] Stage-0-level open risks are documented for follow-up stages.

### Evidence

- Consolidated command result summary by unit.
- Final artifact checklist (root/apps/packages/quality files).
- Open risks list for `execution/01+` stages.

## Notes

- This plan is derived from `docs/execution/00-workspace-baseline.md` Step 0-7.
- Source-of-truth requirements remain in PRD/Harness/Execution/Roadmap docs.
