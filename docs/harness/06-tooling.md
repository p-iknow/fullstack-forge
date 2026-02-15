# 06. Tooling — 품질 도구

## vitest.workspace.ts

```ts
export default [
  'packages/shared',
  'packages/base-ui',
  'apps/store',
  'apps/admin',
  'apps/api',
]
```

| 프로젝트 | 환경 | 비고 |
|----------|------|------|
| apps/* | `jsdom` | 브라우저 시뮬레이션, setupFiles 있음 (`store`=고객용, `admin`=운영용) |
| packages/base-ui | `jsdom` | React 컴포넌트 테스트 |
| packages/shared | 기본 (node) | 순수 로직 |
| apps/api | `node` | 서버 로직 |

> `packages/api-spec`은 vitest 대상 아님 — TypeSpec 검증은 `pnpm --filter @fullstack-forge/api-spec typecheck`로 처리.

## knip.json

```jsonc
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "ignoreFiles": [".claude/**", "sheriff.config.ts"],
  "ignoreDependencies": [
    "tailwindcss", "@tailwindcss/vite", "@testing-library/react",
    "@typespec/compiler", "@typespec/http", "@typespec/openapi3", "@typespec/openapi"
  ],
  "workspaces": {
    ".": {
      "ignoreDependencies": ["@vitest/coverage-v8", "vitest"]
    },
    "apps/*": {
      "entry": ["src/router.tsx", "src/routes/**/*.tsx", "src/routeTree.gen.ts"],
      "project": ["src/**/*.{ts,tsx}"],
      "ignore": ["src/routeTree.gen.ts"]
    },
    "apps/api": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/shared": {
      "includeEntryExports": true
    },
    "packages/api-spec": {
      "entry": ["generated/types.ts"],
      "project": ["src/**/*.tsp"],
      "ignore": ["generated/**"]
    },
    "packages/base-ui": {
      "entry": ["src/components/*.tsx", "src/lib/*.ts", "src/hooks/*.ts"],
      "project": ["src/**/*.{ts,tsx}"]
    }
  }
}
```

## sheriff.config.ts

```ts
import { noDependencies, sameTag, SheriffConfig } from '@softarc/sheriff-core'

export const config: SheriffConfig = {
  enableBarrelLess: true,

  entryPoints: {
    'store': './apps/store/src/router.tsx',
    'admin': './apps/admin/src/router.tsx',
    'api': './apps/api/src/index.ts',
  },

  modules: {
    'apps/<app>/src/screens': 'app:<app>',
    'apps/<app>/src/routes': 'app:<app>',
    'apps/<svc>/src': 'svc:<svc>',
    'packages/shared/src': 'lib:shared',
    'packages/base-ui/src': 'lib:base-ui',
    'packages/api-spec/src': 'lib:api-spec',
    'packages/api-spec/generated': 'lib:api-spec',
  },

  depRules: {
    'app:*': [sameTag, 'lib:shared', 'lib:base-ui', 'lib:api-spec'],
    'svc:*': [sameTag, 'lib:shared', 'lib:api-spec'],   // base-ui 의존 금지
    'lib:shared': noDependencies,
    'lib:base-ui': noDependencies,
    'lib:api-spec': noDependencies,
    root: [
      'app:store', 'app:admin', 'svc:api',
      'lib:shared', 'lib:base-ui', 'lib:api-spec', 'noTag',
    ],
    noTag: ['noTag', 'lib:shared', 'lib:base-ui', 'lib:api-spec'],
  },
}
```

### 의존 규칙 요약

```
app:*  → lib:shared ✓  lib:base-ui ✓  lib:api-spec ✓
svc:*  → lib:shared ✓  lib:base-ui ✗  lib:api-spec ✓
lib:*  → (없음)
```

worker를 별도 서비스로 분리하는 경우 권장 규칙:

```text
svc:workers:*  → lib:shared ✓  lib:api-spec ✓  lib:base-ui ✗
```

## 테스트 전략

### 테스트 분류

| 유형 | 대상 | 도구 | 실행 환경 |
|------|------|------|-----------|
| 단위 테스트 | 도메인 로직 (상태 전이, 재고 차감, 권한 검증) | vitest | node |
| 컴포넌트 테스트 | React 컴포넌트 (폼, 목록, 상태 표시) | vitest + testing-library | jsdom |
| API 통합 테스트 | Hono 라우트 + DB 연동 | vitest + `app.request` | node |
| 계약 테스트 | TypeSpec 계약 vs 실제 응답 일치 | `pnpm typecheck` | - |
| E2E 테스트 (향후) | 전체 사용자 흐름 | Playwright 등 | 브라우저 |

### 계층별 테스트 패턴

**도메인 로직 (apps/api)**:

```ts
// src/modules/orders/order-state.test.ts
import { canTransition } from './order-state'

test('created → paid 전이 허용', () => {
  expect(canTransition('created', 'paid')).toBe(true)
})

test('created → delivered 직접 전이 차단', () => {
  expect(canTransition('created', 'delivered')).toBe(false)
})
```

**API 라우트 통합 테스트**:

```ts
// src/routes/health.test.ts
import { app } from '~/app'

test('GET /health → 200', async () => {
  const res = await app.request('/health')
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('ok')
})
```

**프론트엔드 컴포넌트 테스트**:

```tsx
// src/screens/login.test.tsx
import { render, screen } from '@testing-library/react'
import { LoginForm } from './login'

test('로그인 폼에 3가지 로그인 옵션 표시', () => {
  render(<LoginForm />)
  expect(screen.getByText('Email')).toBeInTheDocument()
  expect(screen.getByText('Google')).toBeInTheDocument()
  expect(screen.getByText('Kakao')).toBeInTheDocument()
})
```

### 테스트 우선순위

1. **P0**: 도메인 불변 규칙 (상태 전이 차단, 음수 재고 차단, 구매 검증)
2. **P1**: API 엔드포인트 정상/에러 응답
3. **P2**: 프론트엔드 핵심 화면 컴포넌트
4. **P3**: 경계값/엣지 케이스 (동시성, 타임아웃)

### 실행 명령

```bash
# 전체 테스트
pnpm test

# 특정 프로젝트
pnpm --filter @fullstack-forge/api test
pnpm --filter @fullstack-forge/store test

# 커버리지
pnpm test -- --coverage
```

## CI — .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  actions: read
  contents: read

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          filter: tree:0
          fetch-depth: 0

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: npx nx run-many -t codegen
      - run: git diff --exit-code packages/api-spec/generated/openapi.yaml
        # openapi.yaml이 stale이면 CI 실패 → codegen 후 커밋 필요
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm sheriff
      - run: pnpm knip
      - run: npx nx run-many -t typecheck build test
```

> `codegen` 단계가 lint/typecheck/build 전에 실행되어 `generated/types.ts`가 최신 상태임을 보장.
>
> `nx run-many`가 모든 프로젝트를 자동 포함. 새 앱/서비스 추가 시 CI 변경 불필요.
>
> codegen 상세 운영 규칙(수동/자동 실행, stale 대응)은 [05-integration](./05-integration.md)의 `Codegen 워크플로`를 단일 기준으로 사용.

## 환경변수/시크릿 관리 (로컬 -> CI)

### 파일 정책

- `.env.example`: 커밋 (키 목록과 기본값 템플릿)
- `.env`, `.env.local`: 미커밋 (개인/로컬 비밀값)
- CI 비밀값: GitHub Actions Secrets/Variables로 주입

### 필수 키 검증 스크립트

```bash
required_keys="DATABASE_URL REDIS_URL PROMETHEUS_ENABLED PORT"

for key in $required_keys; do
  grep -q "^$key=" apps/api/.env.example || {
    echo "missing key in .env.example: $key"
    exit 1
  }
done
```

### 시크릿 스캔 (권장)

```bash
# gitleaks 예시
docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect --source=/repo
```

### 운영 규칙

- 시크릿은 코드/문서에 하드코딩 금지
- 회전 정책(예: 분기 1회)과 사고 시 즉시 회전 절차(runbook) 문서화
- 로컬 학습이라도 DB 비밀번호/토큰은 샘플값과 실제값 분리

## Monitoring / Infra 품질 도구

Redis/Prometheus/Grafana 및 Docker/Kubernetes 설정이 추가되었으므로, 애플리케이션 코드 외에 인프라 설정 자체도 검증 대상에 포함.

### Prometheus 설정 검증

```bash
# prometheus.yml 문법 검증
docker run --rm \
  -v "$PWD/infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus:v3.5.0 \
  promtool check config /etc/prometheus/prometheus.yml
```

### Kubernetes 매니페스트 검증

```bash
# kubeconform으로 스키마 검증
docker run --rm -v "$PWD:/work" -w /work ghcr.io/yannh/kubeconform:v0.7.0 \
  -strict -summary apps/api/k8s/api-deployment.yaml apps/api/k8s/api-servicemonitor.yaml
```

### Docker 이미지 검증

```bash
# API 이미지 빌드 확인
pnpm --filter @fullstack-forge/api docker:build

# 런타임 smoke test
pnpm --filter @fullstack-forge/api docker:run
curl http://localhost:8080/health
```

### 마이그레이션/스키마 검증

```bash
# drizzle migration 생성 가능 여부
pnpm --filter @fullstack-forge/api db:generate

# drizzle migration 적용 가능 여부
pnpm --filter @fullstack-forge/api db:migrate
```

검증 규칙:

- migration 생성 후 SQL diff를 PR에서 리뷰
- destructive DDL은 단계적 적용(추가 -> 백필 -> 전환 -> 삭제)
- rollback SQL 또는 복구 절차가 없는 변경은 병합 금지

### Kubernetes dry-run 검증

```bash
kubectl apply --dry-run=server -f apps/api/k8s/api-deployment.yaml
kubectl apply --dry-run=server -f apps/api/k8s/api-servicemonitor.yaml
```

## CI 확장 예시 (관측/배포 설정 포함)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: npx nx run-many -t codegen
      - run: git diff --exit-code packages/api-spec/generated/openapi.yaml
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm sheriff
      - run: pnpm knip
      - run: npx nx run-many -t typecheck build test

  infra:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

      - name: Validate Prometheus config
        run: |
          docker run --rm \
            -v "$PWD/infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
            prom/prometheus:v3.5.0 \
            promtool check config /etc/prometheus/prometheus.yml

      - name: Validate Kubernetes manifests
        run: |
          docker run --rm -v "$PWD:/work" -w /work ghcr.io/yannh/kubeconform:v0.7.0 \
            -strict -summary apps/api/k8s/api-deployment.yaml apps/api/k8s/api-servicemonitor.yaml

      - name: Validate env template keys
        run: |
          required_keys="DATABASE_URL REDIS_URL PROMETHEUS_ENABLED PORT"
          for key in $required_keys; do
            grep -q "^$key=" apps/api/.env.example || exit 1
          done

      - name: Validate migration scripts
        run: |
          pnpm --filter @fullstack-forge/api db:generate

      - name: Build API container image
        run: docker build -t repo-api:ci -f apps/api/Dockerfile .
```

> `infra` job을 분리하면 애플리케이션 코드 실패와 인프라 설정 실패를 독립적으로 확인 가능.
