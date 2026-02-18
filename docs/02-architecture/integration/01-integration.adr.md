# ADR-0003: API 계약 기준을 @fullstack-forge/api-spec로 관리 (생성 원천: @hono/zod-openapi)

- Status: Accepted
- Date: 2026-02-15
- Decision Makers: Architecture, Backend, Frontend

## Context

PRD 범위는 인증/주문/리뷰/문의/운영 API를 포함한다.
Store/Admin/API가 동시에 진화하는 구조에서 계약 불일치를 줄이기 위한 단일 API 계약 기준이 필요하다.
팀 결정에 따라 TypeSpec SSOT 정책을 중단하고,
`@fullstack-forge/api-spec` 패키지를 계약 기준(SSOT)으로 고정하는 code-first 흐름으로 전환한다.

## Decision Drivers

- 계약 변경의 가시성
- 프론트/백 동시 개발 시 타입 안정성
- 산출물(OpenAPI) 기반 도구 연동
- 단계별 검증에서 계약 드리프트 방지

## Considered Options

1. TypeSpec -> OpenAPI (기존)
2. OpenAPI 수동 작성
3. `@hono/zod-openapi` 기반 code-first 생성 (신규)

## Decision

API 계약 기준은 `@fullstack-forge/api-spec`로 채택한다.
계약 변경은 Hono 라우트의 request/response schema 변경을 선행하고,
`pnpm --filter @fullstack-forge/api-spec codegen`으로 OpenAPI/타입 산출물을 동기화한다.

## Consequences

- Good:
  - 라우트 구현과 계약(schema)이 동일 위치에 있어 변경 추적이 단순함
  - 런타임 검증(zod)과 문서(OpenAPI) 기준을 일치시켜 드리프트 위험 감소
  - OpenAPI 기반 문서/테스트/도구 연동 용이
- Bad:
  - route 파일의 스키마 정의가 비대해질 수 있어 feature 경계 관리 필요
  - generated 산출물 관리 규칙이 필요

## PRD Traceability

- Satisfies:
  - `docs/01-prd/README.md` (단계별 codegen/typecheck 근거)
- Supports:
  - `docs/01-prd/01-auth/01-overview.md` (인증 API 계약)
  - `docs/01-prd/README.md` (커머스 API 계약, 도메인별 정책)
  - `docs/01-prd/13-event/01-overview.md` (이벤트 연계 API 계약)

## References

- Hono OpenAPI example: <https://hono.dev/examples/zod-openapi>
- Hono validation guide: <https://hono.dev/docs/guides/validation>
- OpenAPI spec: <https://spec.openapis.org/oas/latest.html>
- 내부 근거: `docs/02-architecture/base/01-overview.md`, `docs/02-architecture/base/03-packages.md`, `docs/02-architecture/integration/01-integration.md`
