# ADR-0001: Frontend Stack으로 TanStack Start 선택

- Status: Accepted
- Date: 2026-02-15
- Decision Makers: Architecture, Frontend

## Context

PRD는 store/admin 앱에서 빠른 화면 개발, 데이터 동기화, 라우팅 일관성을 요구한다.
동시에 API 계약 기반으로 타입 안전한 클라이언트 연동이 필요하다.

## Decision Drivers

- Store/Admin 이중 앱 구조에서 라우팅/데이터 패턴 통일
- API 연동 시 타입 안정성과 개발 속도
- Vite 기반 개발 경험과 빌드 속도
- Suspense 기반 서버 상태 관리 일관성

## Considered Options

1. TanStack Start + React 19
2. Next.js
3. Remix

## Decision

TanStack Start + React 19를 기본 선택으로 채택한다.
단, RC 특성 리스크를 고려해 버전 고정과 fallback 경로(Next.js/Remix 전환 기준)를 함께 기록한다.

## Consequences

- Good:
  - Router/Query 생태계 통합으로 패턴 일관성 확보
  - Vite 기반으로 빠른 개발 루프 확보
- Bad:
  - RC 단계로 인한 버전 변동 리스크 존재
  - 장기 안정성 이슈 발생 시 프레임워크 전환 비용 존재

## PRD Traceability

- Satisfies:
  - `docs/prd/01-product-scope.md` (store/admin 경험 제공)
  - `docs/prd/05-phased-delivery-plan.md` (단계별 구현 속도/검증)
- Supports:
  - `docs/prd/02-user-flows-and-auth-policy.md` (인증 UX 플로우)
  - `docs/prd/03-commerce-domain-policy.md` (주문/리뷰/문의 UI 흐름)

## References

- TanStack Start overview: <https://tanstack.com/start/latest/docs/framework/react/overview>
- 내부 근거: `docs/harness/00-overview.md`, `docs/harness/03-frontend.md`, `docs/harness/05-integration.md`
