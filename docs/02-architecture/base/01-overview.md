# 00. Overview

`fullstack-forge` 레포를 처음부터 fullstack으로 설계하는 greenfield 계획.

이 문서 세트는 목표 아키텍처 설계 문서이며, 실행 가능한 템플릿/체크리스트를 함께 제공한다.

현재 레포 상태와 차이가 있을 수 있으므로, 실제 적용 시에는 갭 점검부터 시작한다.

이 하네스의 1차 목적은 **퀵커머스 주문-배송 앱을 실제로 구현**하는 것이다.
auth/API/infra 문서는 분리되어 있지만, 모두 같은 앱을 완성하기 위한 단계로 동작한다.

- 기준 도메인: **퀵커머스 주문-배송 오케스트레이션**
- 기준 구현 경로: [execution-index](../README.md)

## 스택

| 계층            | 기술                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| **API 명세**    | **Hono route schema(`@hono/zod-openapi`) → OpenAPI 3.1 생성**                  |
| 프론트엔드      | TanStack Start + React 19 + Tailwind v4                                        |
| UI 라이브러리   | shadcn/ui 디자인 시스템 (Base UI 프리미티브 + CVA)                             |
| 백엔드          | Hono + `@hono/node-server` + Drizzle ORM + PostgreSQL + Redis (Node.js 24 LTS) |
| 이벤트 메시징   | SNS -> SQS fanout (fauxqs 로컬 에뮬레이션 + AWS 전이)                          |
| 엣지/게이트웨이 | Nginx reverse proxy (로컬) + Ingress (k8s)                                     |
| 모니터링        | Prometheus + Grafana (`/metrics` 스크레이프)                                   |
| 배포/운영       | Docker + Kubernetes                                                            |
| 프론트 API 계층 | ky + TanStack Query + Suspensive (`@fullstack-forge/api-spec` 생성 타입 소비)  |
| 빌드/번들       | Vite (프론트/백엔드), tsdown (패키지)                                          |
| 태스크 러너     | Nx (pure — 플러그인/제너레이터 없음)                                           |
| 패키지 매니저   | pnpm (workspaces, catalog, hoist=false)                                        |
| 린트/포맷       | oxlint + oxfmt                                                                 |
| 테스트          | vitest (workspace mode)                                                        |
| 품질            | Knip (미사용 코드), Sheriff (의존성 규칙)                                      |

## 스택 선택 근거 (2025-2026 기준)

| 기술                       | 선택 이유                                                    | 주의점/전환 기준                                                                      | 최신 레퍼런스                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TanStack Start             | Router/Query 생태계 통합 + Vite 기반 빠른 개발               | pre-v1(Release Candidate 단계) 변경 가능성 고려. 안정성 최우선이면 Next.js/Remix 검토 | https://tanstack.com/start/latest/docs/framework/react/overview                                                                                                               |
| Hono + `@hono/node-server` | 경량, 타입 친화, 멀티런타임 전환 용이                        | Node 최소 버전/런타임별 어댑터 차이 확인 필요                                         | https://hono.dev/docs/getting-started/nodejs                                                                                                                                  |
| Drizzle ORM + drizzle-kit  | SQL 가시성 + 타입 안전 스키마 + 코드베이스 중심 마이그레이션 | `drizzle.config.ts`와 팀 단위 migration 충돌 정책 필수                                | https://orm.drizzle.team/docs/kit-overview                                                                                                                                    |
| `@hono/zod-openapi`        | 라우트 스키마와 계약 동기화 + OpenAPI 자동 생성              | 라우트 파일 비대화 방지를 위한 feature 경계 관리 필요                                 | https://hono.dev/examples/zod-openapi , https://spec.openapis.org/oas/latest.html                                                                                             |
| Tailwind v4                | 설정 단순화 + 빌드 성능 개선 + Vite 플러그인                 | v3 대비 breaking change 고려                                                          | https://tailwindcss.com/blog/tailwindcss-v4                                                                                                                                   |
| Nx + pnpm                  | codegen/build/typecheck 의존 순서 강제 + 모노레포 운영       | 캐시/타깃 의존 이해 필요                                                              | https://nx.dev , https://pnpm.io/workspaces                                                                                                                                   |
| Prometheus + Grafana       | 표준 metrics 스택, 로컬/클라우드 전이 용이                   | 스크레이프/대시보드 초기 셋업 러닝커브                                                | https://prometheus.io/docs/prometheus/latest/getting_started/ , https://grafana.com/docs/                                                                                     |
| minikube                   | 로컬 k8s 학습 진입 장벽 낮음                                 | 리소스 사용량 높음. CI/멀티노드는 kind/k3d 검토                                       | https://minikube.sigs.k8s.io/docs/start/                                                                                                                                      |
| MinIO                      | S3 호환 API 학습 집중                                        | AWS 전체 연동 시 별도 에뮬레이터 필요                                                 | https://min.io/docs/minio/linux/index.html                                                                                                                                    |
| fauxqs                     | SNS/SQS/DLQ TypeScript 네이티브 에뮬레이터                   | 신생 프로젝트(2026-02 출시). endpoint 전환으로 LocalStack/AWS 즉시 복귀 가능          | https://github.com/kibertoad/fauxqs                                                                                                                                           |
| SNS + SQS fanout           | 이벤트 생산자/소비자 분리, 독립 확장, 장애 격리(DLQ)         | at-least-once 전제. idempotency + DLQ redrive runbook 필수                            | https://docs.aws.amazon.com/sns/latest/dg/sns-sqs-as-subscriber.html , https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html |
| Nginx reverse proxy        | 프론트/API 단일 진입점 구성, 로컬에서 ingress 전 단계 학습   | 운영에서는 WAF/ALB/Ingress 계층으로 확장, trust proxy/real ip 정책 필요               | https://nginx.org/en/docs/                                                                                                                                                    |

## 핵심 설계 원칙

| 원칙                      | 적용                                                                              |
| ------------------------- | --------------------------------------------------------------------------------- |
| **런타임 중립 base**      | `tsconfig.base.json`에 DOM, jsx, Node 타입 없음. 각 프로젝트가 자기 런타임을 선언 |
| **계층 분리**             | `apps/` (프론트 + 백엔드 배포 단위), `packages/` (공유) — 2계층                   |
| **Nx = 순수 태스크 러너** | 플러그인/제너레이터 없음. `targetDefaults`만 사용                                 |
| **독립 의존성**           | 각 프로젝트가 자기 deps를 소유. 루트에는 tooling만                                |
| **소스 레벨 공유**        | `@fullstack-forge/source` 조건부 export로 빌드 없이 타입 공유                     |
| **Code-first API 계약**   | Hono route schema로 API 계약 정의 → OpenAPI 생성 → TS 타입/클라이언트 생성        |
| **계층 간 import 제어**   | Sheriff로 백엔드→UI, 패키지 간 순환 의존 차단                                     |

## 구현 대상(앱 관점)

이 문서 세트는 아래 앱 기능을 완성하는 것을 목표로 한다.

- 사용자 인증: signup/login/logout/me
- 로그인 채널: Email 로그인 + Google OAuth + Kakao OAuth
- 주문 생성/조회: `POST /orders`, `GET /orders/:id`
- 고객 리뷰: `POST /reviews`, `PATCH /reviews/:id`, `POST /reviews/:id/comments`
- 고객 문의: `POST /inquiries`, `GET /inquiries/:id`, `POST /inquiries/:id/replies`
- 이벤트 fanout: `OrderCreated` -> notifications/inventory/dispatch
- 신뢰성: idempotency + DLQ/redrive
- 엣지/운영: Nginx ingress + Prometheus/Grafana + rollout hardening

### 기존(프론트 전용) 설계와의 차이

| 항목                   | 기존                    | 신규 (fullstack)               | 이유                            |
| ---------------------- | ----------------------- | ------------------------------ | ------------------------------- |
| `tsconfig.base.json`   | DOM + react-jsx 포함    | **런타임 중립** (DOM/jsx 없음) | 백엔드가 오버라이드할 필요 없음 |
| 프론트 tsconfig        | base에서 전부 상속      | `jsx`, `lib` 2줄 추가          | 각 계층이 자기 런타임 선언      |
| 백엔드 tsconfig        | jsx/DOM 오버라이드 필요 | `types: ["node"]`만 추가       | 오버라이드가 아닌 추가          |
| pnpm workspace         | `apps/*` + `packages/*` | 2계층 구조                     | fullstack 전제                  |
| `verbatimModuleSyntax` | 없음                    | `true`                         | `import type` 강제 (ESM 최적화) |

## 디렉토리 구조

```
./
├── apps/                           # 배포 단위 (프론트 + 백엔드)
│   ├── store/                      # store 역할 (port 3001)
│   ├── admin/                      # admin 역할 (port 3002)
│   └── api/                        # Hono API (port 8080)
│
├── packages/                       # 공유 라이브러리
│   ├── shared/                     # 범용 유틸 (런타임 무관)
│   ├── api-spec/                   # OpenAPI + TS 타입 산출물 패키지
│   └── design-system/              # shadcn/ui 디자인 시스템 (Base UI 프리미티브)
│
└── (root config files)             # → 01-foundation.md 참조
```

### 앱 역할 매핑 (커머스 기준)

- `apps/store`: 고객용 store (상품/주문/리뷰/문의/내 주문 상태)
- `apps/admin`: 운영용 admin (주문 상태 전이, 배차/재고/알림, 리뷰/문의 운영)
- `apps/api`: 단일 API 경계(초기). 내부를 도메인 모듈로 분리해 점진 확장

### 권장 목표 구조 (점진 전환)

```text
apps/
  store/
  admin/
  api/
  workers/      (notifications, inventory, dispatch)

packages/
  shared/
  api-spec/
  design-system/
```

문서와 구현 경로는 `store`, `admin` 기준으로 유지한다.

## 타입 흐름

```
@fullstack-forge/api (route-level zod-openapi schema)
    │
    ├── OpenAPI export ──→ openapi.yaml  (git committed — 언어 무관 계약)
    │                       │
    │                       └── openapi-typescript ──→ TS 타입 (generated/)
    │
    ├── 프론트 소비: ky + TanStack Query + Suspensive + 생성된 타입
    ├── 백엔드 소비: 생성된 타입으로 계약 준수
    └── (향후) Kotlin/Go: openapi.yaml → openapi-generator / oapi-codegen
```

## 의존성 그래프

```
@fullstack-forge/store  ──→  @fullstack-forge/shared, @fullstack-forge/design-system, @fullstack-forge/api-spec
@fullstack-forge/admin  ──→  @fullstack-forge/shared, @fullstack-forge/design-system, @fullstack-forge/api-spec
@fullstack-forge/api    ──→  @fullstack-forge/shared, @fullstack-forge/api-spec
```

역할 관점으로는 아래와 같이 본다.

```text
store           ──→ shared, design-system, api-spec
admin           ──→ shared, design-system, api-spec
api               ──→ shared, api-spec
workers(추가 예정) ──→ shared, api-spec
```

### 금지 관계 (Sheriff로 강제)

| from                             | to                               | 사유                          |
| -------------------------------- | -------------------------------- | ----------------------------- |
| `@fullstack-forge/api`           | `@fullstack-forge/design-system` | 백엔드에 UI 의존성 유입 차단  |
| `@fullstack-forge/design-system` | `@fullstack-forge/api-spec`      | UI 라이브러리에 API 의존 차단 |
| `@fullstack-forge/shared`        | 어디든                           | 순수 유틸, 외부 의존 없음     |
| `@fullstack-forge/api-spec`      | 어디든                           | 순수 명세, 외부 의존 없음     |

## 문서 구조

| 문서                                               | 내용                                                      |
| -------------------------------------------------- | --------------------------------------------------------- |
| **00-overview** (이 문서)                          | 설계 원칙, 아키텍처                                       |
| [02-foundation](./02-foundation.md)                | 루트 설정 파일 전체                                       |
| [03-packages](./03-packages.md)                    | packages/ 계층                                            |
| [01-frontend](../frontend/01-frontend.md)          | apps/ 계층                                                |
| [01-backend](../backend/01-backend.md)             | apps/api 계층                                             |
| [01-integration](../integration/01-integration.md) | 프론트-백엔드 연동                                        |
| [04-tooling](./04-tooling.md)                      | 품질 도구 (vitest, knip, sheriff, CI)                     |
| [execution-index](../README.md)                    | 실행 순서 + 검증 (별도 디렉토리)                          |
| [prd-index](../../01-prd/README.md)                | 제품 요구사항(PRD): 상세 요구사항 + 단계별 구현/학습 계획 |

## 운영 baseline (필수)

아래 항목은 선택이 아니라 학습 하네스의 최소 완성 기준이다.

- **보안 기본선**: secure cookie 정책, refresh token rotation/reuse detection, 로그인 rate limit, OAuth state/nonce 검증 (`../backend/01-backend.md`)
- **운영 안정성**: DB 백업/복구 리허설, migration rollback runbook (`../backend/01-backend.md`)
- **릴리즈 품질**: codegen stale 차단, lint/typecheck/test + infra 검증 CI (`04-tooling.md`)
- **관측 강화**: metrics + 로그/트레이스 상관관계(trace-id) (`../backend/01-backend.md`, `04-tooling.md`)
- **개발 생산성**: seed 데이터, e2e(auth), 로컬 bootstrap 절차
