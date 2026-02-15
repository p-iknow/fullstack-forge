# ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택

- Status: Accepted
- Date: 2026-02-15
- Decision Makers: Architecture, Backend

## Context

PRD는 인증/세션/권한, 주문 상태 무결성, 리뷰/문의 정책 집행을 요구한다.
이를 위해 경량 HTTP 계층, 타입 안전한 DB 접근, 트랜잭션 무결성, TTL 기반 보조 상태 저장이 필요하다.

## Decision Drivers

- 도메인 정책을 코드/스키마 수준에서 강제
- 세션/레이트리밋/멱등 키 저장을 위한 빠른 KV 계층
- Node 런타임에서 단순하고 확장 가능한 API 구조
- SQL 가시성과 팀 마이그레이션 관리 가능성

## Considered Options

1. Hono + Drizzle + PostgreSQL + Redis
2. NestJS + TypeORM + PostgreSQL + Redis
3. Fastify + Prisma + PostgreSQL + Redis

## Decision

옵션 1을 채택한다.
Hono로 API 경계를 단순화하고, Drizzle로 타입 안전한 스키마/쿼리/마이그레이션을 관리한다.
PostgreSQL은 정합성 데이터의 기준 저장소, Redis는 세션/레이트리밋/멱등 보조 저장소로 사용한다.

## Consequences

- Good:
  - 도메인 모델과 SQL 가시성을 동시에 확보
  - 경량 프레임워크로 러닝커브/오버헤드 감소
  - Redis TTL로 보안/신뢰성 정책 구현이 단순해짐
- Bad:
  - 마이그레이션 충돌 정책을 팀 규칙으로 강제해야 함
  - 프레임워크가 가벼운 만큼 아키텍처 규율을 직접 세워야 함

## PRD Traceability

- Satisfies:
  - `docs/prd/02-user-flows-and-auth-policy.md` (세션/보안/로그 정책)
  - `docs/prd/03-commerce-domain-policy.md` (주문/결제/배송/리뷰/문의 정책)
- Supports:
  - `docs/prd/01-product-scope.md` (핵심 도메인 처리)
  - `docs/prd/04-event-reliability-and-ops-policy.md` (멱등 키 저장)

## References

- Hono Node: <https://hono.dev/docs/getting-started/nodejs>
- Drizzle migrations: <https://orm.drizzle.team/docs/migrations>
- Redis EXPIRE: <https://redis.io/docs/latest/commands/expire/>
- 내부 근거: `docs/harness/00-overview.md`, `docs/harness/04-backend.md`
