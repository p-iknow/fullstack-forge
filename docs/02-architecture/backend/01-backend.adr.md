# ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택

- Status: Accepted
- Date: 2026-02-15
- Decision Makers: Architecture, Backend

## Context

PRD는 인증/세션/권한, 주문 상태 무결성, 리뷰/문의 정책 집행을 요구한다.
이를 위해 경량 HTTP 계층, 타입 안전한 DB 접근, 트랜잭션 무결성, TTL 기반 보조 상태 저장이 필요하다.
Node.js 런타임을 전제로 하며, TypeScript first 환경에서 최소 복잡도를 유지하면서도
상태 머신 전이, 낙관적 락, 보상 트랜잭션 등 도메인 정합성 요구를 코드 수준에서 강제할 수 있어야 한다.

## Decision Drivers

- 도메인 정책을 코드/스키마 수준에서 강제
- 세션/레이트리밋/멱등 키 저장을 위한 빠른 KV 계층
- Node 런타임에서 단순하고 확장 가능한 API 구조
- SQL 가시성과 팀 마이그레이션 관리 가능성
- OpenAPI 스키마 자동 생성으로 프론트엔드-백엔드 계약 단일화

## Considered Options

### Option 1: Hono + Drizzle + PostgreSQL + Redis

경량 HTTP 프레임워크 + SQL-first ORM + 관계형 DB + KV 캐시.

### Option 2: NestJS + TypeORM + PostgreSQL + Redis

풀스택 프레임워크 + Active Record ORM.

### Option 3: Fastify + Prisma + PostgreSQL + Redis

성능 중심 HTTP + 선언적 스키마 ORM.

## Decision

옵션 1을 채택한다.

## 상세 비교

### HTTP 프레임워크: Hono vs NestJS vs Fastify

| 기준 | Hono | NestJS | Fastify |
|------|------|--------|---------|
| 번들 크기 | ~14KB (ultralight) | ~2MB+ (framework + decorators) | ~250KB |
| 러닝커브 | 낮음 (Express-like, 추가 개념 최소) | 높음 (DI, Module, Guard, Pipe, Interceptor) | 중간 (plugin 생태계 학습) |
| TypeScript 통합 | Native (generics 기반 타입 추론) | 데코레이터 기반 (reflect-metadata 의존) | 플러그인별 상이 |
| OpenAPI 통합 | `@hono/zod-openapi`로 route 정의 시 자동 생성 | `@nestjs/swagger` 데코레이터 수동 부착 | `@fastify/swagger` 스키마 별도 관리 |
| 아키텍처 강제 | 없음 — 자유도 높음, 규율 직접 수립 | 강제 — Module/Controller/Service 구조 고정 | 약한 강제 — plugin 중심 |
| 런타임 호환 | Node, Bun, Deno, Cloudflare Workers, Vercel Edge 등 | Node 전용 (Express/Fastify adapter) | Node 전용 |

**Hono 선택 근거:**

- 이 프로젝트는 학습 하네스(harness) 성격이므로, 프레임워크 추상화보다 **도메인 로직이 드러나는 구조**가 적합하다.
  NestJS의 DI/Module/데코레이터 체계는 대규모 팀에서 유효하지만, 소규모 팀에서는 boilerplate 비용이 학습 비용을 초과한다.
- `@hono/zod-openapi`가 **route 정의와 OpenAPI 스키마를 단일 코드에서 생성**하여
  `packages/api-spec`과의 계약 동기화가 자연스럽다.
  NestJS/Fastify에서는 OpenAPI 스키마가 데코레이터/별도 파일로 분산되어 동기화 비용이 높다.
- Hono의 자유도는 규율 부재 위험이 있지만, `01-backend.md`에서 디렉토리/파일 컨벤션(G1~G9)을 명시적으로 고정하여 해소한다.

**기각된 옵션:**

- NestJS: DI 컨테이너와 데코레이터 기반 아키텍처가 학습 비용 대비 이 규모에서는 과잉. 또한 `reflect-metadata` 의존과 데코레이터 기반 OpenAPI는 런타임 오버헤드와 타입 추론 한계가 있다.
- Fastify: 성능은 우수하지만, 플러그인 캡슐화 모델과 Hono 대비 OpenAPI 통합 DX가 떨어진다. 멀티 런타임 지원도 불필요하지만, Hono의 표준 Web API 기반 설계가 향후 유연성을 확보한다.

### ORM: Drizzle vs TypeORM vs Prisma

| 기준 | Drizzle | TypeORM | Prisma |
|------|---------|---------|--------|
| 쿼리 스타일 | SQL-first (TypeScript로 SQL을 작성) | Active Record / Data Mapper | 선언적 Client API |
| 생성 SQL 가시성 | 높음 — 작성한 코드가 거의 그대로 SQL | 낮음 — 내부 query builder 변환 | 중간 — `prisma.log`로 확인 가능 |
| 타입 안전성 | 스키마에서 추론 (zero codegen) | 데코레이터 기반 (런타임 타입) | codegen 기반 (빌드 타임 생성) |
| 마이그레이션 | `drizzle-kit generate` → SQL 리뷰 → `migrate` | `synchronize: true` 또는 수동 | `prisma migrate dev` → SQL 자동 |
| 관계 조인 | `relations()` API + `with` 절 | `@ManyToOne` 데코레이터 | `include` / `select` 중첩 |
| Raw SQL 접근 | `sql` template literal (first-class) | `query()` 메서드 | `$queryRaw` (escape hatch) |

**Drizzle 선택 근거:**

- 이 프로젝트는 **상태 전이 무결성**(주문, 장바구니, 리뷰 등)과 **낙관적 락**이 핵심이다.
  이를 위해 `WHERE status = $current AND version = $v` 같은 조건부 UPDATE를 자주 작성해야 한다.
  Drizzle의 SQL-first 접근은 이런 패턴을 **코드에서 직접 표현**할 수 있어 ORM 추상화 뒤에 숨는 위험이 없다.
- `drizzle-kit generate`가 생성하는 SQL을 리뷰한 후 적용하는 워크플로는
  운영 DB에 의도하지 않은 DDL이 적용되는 사고를 예방한다.
  Prisma의 `migrate dev`는 편리하지만 생성 SQL이 자동 적용되어 destructive 변경 감지가 어렵다.
- TypeScript 스키마 정의에서 타입이 추론되므로 codegen 단계가 없고,
  Prisma처럼 `prisma generate` 후 IDE 재시작이 필요한 DX 마찰이 없다.

**기각된 옵션:**

- TypeORM: Active Record 패턴과 `synchronize: true` 옵션이 마이그레이션 사고를 유발할 수 있다. 데코레이터 기반 타입이 런타임에서만 검증되어 컴파일 타임 안전성이 부족하다.
- Prisma: DX는 우수하지만, (1) codegen 의존으로 스키마 변경 시 빌드 단계가 필수, (2) Raw SQL이 escape hatch 수준이라 복잡한 조건부 UPDATE/CTE 작성이 번거롭다, (3) edge 런타임에서 Prisma Client 크기가 제약이 된다.

### 데이터베이스: PostgreSQL

이 프로젝트에서 PostgreSQL은 사실상 유일한 선택이다.

- **트랜잭션 무결성**: 주문→결제→재고 보상 트랜잭션, 낙관적 락(`version` 컬럼), Row Lock(`SELECT FOR UPDATE`)이 ACID 보장 위에서 동작해야 한다.
- **JSON 지원**: 이벤트 payload, 프로모션 스냅샷 등 반정형 데이터를 `jsonb`로 저장하면서도 인덱싱/쿼리가 가능하다.
- **운영 성숙도**: 커머스 도메인에서 가장 검증된 관계형 DB. 대부분의 SaaS 커머스 플랫폼(Medusa, Saleor)이 PostgreSQL을 기본으로 사용한다.

MySQL 대비 장점: `RETURNING` 절 지원, 부분 인덱스, jsonb 네이티브 지원, CTE 성능.
NoSQL(MongoDB 등) 기각: 도메인 정합성(FK 제약, 트랜잭션)이 핵심 요구사항이므로 부적합.

### 보조 저장소: Redis

Redis는 **영속 데이터가 아닌 휘발성/TTL 기반 데이터**의 전용 저장소로 사용한다.

| 용도 | 키 패턴 | TTL | 근거 |
|------|---------|-----|------|
| 세션 (refresh token hash) | `session:{id}` | 7~14일 | 빠른 조회 + TTL 기반 자동 만료 |
| Rate limit 카운터 | `ratelimit:{surface}:{type}:{key}` | 15분 | 윈도우 기반 카운팅, 원자적 INCR |
| OAuth state/nonce | `oauth:{type}:{provider}:{value}` | 5분 | 1회성 소비 후 즉시 삭제 |
| 멱등 키 | `idempotency:{consumer}:{eventId}` | 7일 | 이벤트 중복 처리 방지 |

**PostgreSQL이 아닌 Redis를 사용하는 이유:**

- 위 데이터는 모두 **TTL 만료 시 자연 소멸**해야 한다. PostgreSQL에서는 TTL 만료를 위해 배치 정리 작업이 필요하지만, Redis는 `EXPIRE`로 자동 처리된다.
- Rate limit은 **초당 수십~수백 회 INCR**이 발생할 수 있어 PostgreSQL에 부담을 주는 것이 부적절하다.
- In-memory 캐시(Node Map 등) 기각: 멀티 인스턴스 배포 시 상태 공유가 불가능하다.

## Consequences

### Good

- 도메인 모델과 SQL 가시성을 동시에 확보 — 상태 전이/락 쿼리가 코드에서 그대로 보인다
- 경량 프레임워크로 러닝커브/오버헤드 감소 — 프레임워크가 아닌 도메인에 집중
- Redis TTL로 보안/신뢰성 정책 구현이 단순해짐 — 별도 만료 배치 불필요
- OpenAPI 스키마가 route 정의와 동일 위치에서 생성 — 프론트엔드 계약 동기화 자동화
- 마이그레이션 SQL 리뷰 워크플로 — 의도하지 않은 DDL 적용 방지

### Bad

- Hono의 자유도로 인해 **아키텍처 규율을 직접 수립/유지**해야 한다 — `01-backend.md` G1~G9 규칙으로 해소
- Drizzle은 NestJS/Prisma 대비 **생태계와 커뮤니티가 작다** — 복잡한 패턴에서 레퍼런스 부족 가능성
- Redis 장애 시 세션/rate-limit이 동시에 영향받는 **단일 장애점(SPOF)** — 초기에는 수용, 이후 Sentinel/Cluster로 전환 가능

## 아키텍처 제약 (이 선택에서 파생)

1. **Anti-Abstraction Rule**: Handler → Service → Drizzle 직접 호출. Repository 패턴이나 Use-Case 레이어를 추가하지 않는다. 새 추상화 레이어 추가 시 별도 ADR 필수.
2. **lib/ 4파일 제한**: `create-app.ts`, `types.ts`, `errors.ts`, `openapi.ts`. "utils", "helpers", "common" 금지.
3. **Redis는 캐시/TTL 전용**: 영속 데이터(사용자, 주문, 리뷰 등)를 Redis에 저장하지 않는다.
4. **마이그레이션은 리뷰 후 적용**: `drizzle-kit generate` → SQL 리뷰 → `drizzle-kit migrate`. destructive 변경은 단계적(추가 → 백필 → 전환 → 삭제).

## PRD Traceability

- Satisfies:
  - `docs/01-prd/01-auth/01-overview.md` (세션/보안/로그 정책)
  - `docs/01-prd/README.md` (주문/결제/배송/리뷰/문의 정책, 도메인별 정책)
- Supports:
  - `docs/01-prd/00-overview.md` (핵심 도메인 처리)
  - `docs/01-prd/13-event/01-overview.md` (멱등 키 저장)

## References

- Hono Node: <https://hono.dev/docs/getting-started/nodejs>
- Hono OpenAPI: <https://hono.dev/examples/zod-openapi>
- Drizzle ORM: <https://orm.drizzle.team/docs/overview>
- Drizzle migrations: <https://orm.drizzle.team/docs/migrations>
- Redis EXPIRE: <https://redis.io/docs/latest/commands/expire/>
- 내부 설계 명세: `docs/02-architecture/backend/01-backend.md`
