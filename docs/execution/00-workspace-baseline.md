# 00. Workspace Baseline — 레포 셋업 + 빌드 + 품질

Roadmap 시작 전 harness 기준으로 workspace를 완성하는 단계.
모든 실행 문서의 전제 조건이다.

## Harness 참조

- [00-overview](../harness/00-overview.md)
- [01-foundation](../harness/01-foundation.md)
- [02-packages](../harness/02-packages.md)
- [06-tooling](../harness/06-tooling.md)

## 셋업 순서

```
Step 0 ─── Gap 점검 (현재 레포 vs 목표 설계)
  │         docs/harness/와 실제 파일 구조 차이 확인
  │         누락 파일(예: Dockerfile, k8s, drizzle config, .env.example) 식별
  │         우선순위: 실행 blocker 먼저 보완
  │
Step 1 ─── 레포 초기화 + 루트 설정
  │         git init, pnpm init
  │         → 01-foundation.md 의 모든 파일
  │
Step 2 ─── packages/ 계층 (shared + api-spec)
  │         packages/shared
  │         packages/api-spec (TypeSpec + tspconfig.yaml + main.tsp)
  │         → 02-packages.md
  │
Step 3 ─── API codegen 실행 ★
  │         pnpm --filter @fullstack-forge/api-spec codegen
  │         → openapi.yaml + types.ts 생성 확인
  │         → openapi.yaml을 git commit
  │
  │         ⚠️ codegen 세부 정책(자동 실행/장애 대응)은
  │            05-integration.md `Codegen 워크플로`를 단일 기준으로 따름
  │
Step 4 ─── packages/base-ui
  │         packages/base-ui (컴포넌트 + shadcn)
  │         → 02-packages.md
  │
Step 5 ─── apps/api 계층
  │         apps/api (Hono + Drizzle + PostgreSQL + Redis)
  │         → 04-backend.md
  │
Step 6 ─── apps/ 계층
  │         apps/store, apps/admin
  │         TanStack Start + ky + TanStack Query + Suspensive + proxy + Storybook
  │         → 03-frontend.md
  │
Step 7 ─── 품질 도구
            vitest.workspace.ts, knip.json, sheriff.config.ts, .github/workflows/ci.yml
            → 06-tooling.md
```

## 검증 체크리스트

### 기본 동작

- [ ] `pnpm install` — 정상 설치
- [ ] `pnpm exec nx show projects` — 6개 프로젝트 (store, admin, api, shared, api-spec, base-ui)
- [ ] `pnpm exec nx graph` — 의존성 그래프 정상

### API Spec / Codegen

- [ ] `pnpm --filter @fullstack-forge/api-spec codegen` — 정상 실행
- [ ] `packages/api-spec/generated/openapi.yaml` 생성됨 (git committed)
- [ ] `packages/api-spec/generated/types.ts` 생성됨 (gitignored)
- [ ] `pnpm --filter @fullstack-forge/api-spec typecheck` — TypeSpec 문법 에러 없음
- [ ] 생성된 `types.ts`에 `paths`, `components` 인터페이스 포함

### 타입 체크

- [ ] `pnpm typecheck` — 전체 통과 (codegen 자동 선행)
- [ ] 백엔드에 DOM 관련 타입 에러 없음 (base에 DOM 없으므로)
- [ ] 프론트에 Node 관련 타입 에러 없음

### 빌드

- [ ] `pnpm build` — 전체 성공
- [ ] `apps/api/dist/index.mjs` 생성됨
- [ ] `apps/store/.output/` 생성됨

### 테스트

- [ ] `pnpm test` — vitest 전체 통과
- [ ] api 테스트 = node 환경
- [ ] app/base-ui 테스트 = jsdom 환경

### 린트/포맷

- [ ] `pnpm lint` — oxlint 통과
- [ ] `pnpm format:check` — oxfmt 통과

### 품질

- [ ] `pnpm sheriff` — 의존성 규칙 통과
  - 특히: `svc:api → lib:base-ui` 차단 확인
- [ ] `pnpm knip` — 미사용 코드 없음

### Dev 서버 기본 확인

- [ ] `pnpm --filter @fullstack-forge/api dev` → `http://localhost:8080`
- [ ] `curl http://localhost:8080/health` → `{"status":"ok"}`
- [ ] `pnpm --filter @fullstack-forge/store dev` → `http://localhost:3001`
- [ ] `pnpm --filter @fullstack-forge/admin dev` → `http://localhost:3002`

## Troubleshooting

### `Cannot find module '@fullstack-forge/api-spec/types'`

```bash
pnpm --filter @fullstack-forge/api-spec codegen
```

### Spec 수정 후 타입이 갱신되지 않음

```bash
pnpm --filter @fullstack-forge/api-spec codegen
pnpm exec nx reset
pnpm typecheck
```

### CI에서 `openapi.yaml` stale 실패

```bash
pnpm --filter @fullstack-forge/api-spec codegen
git add packages/api-spec/generated/openapi.yaml
git commit -m "chore(api-spec): regenerate OpenAPI contract"
```

## Next

- DB/인프라 준비 → [01-db-and-migrations](./01-db-and-migrations.md)
