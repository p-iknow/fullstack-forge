# ADR-0015: 리뷰 모더레이션은 상태 전이 + 권한 분리 정책으로 운영

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend, Operations

## Context

PRD는 구매 검증 리뷰, `visible/flagged/hidden` 상태 전이, 운영자 모더레이션 권한 분리를 요구한다.
리뷰/댓글 삭제는 감사 가능한 soft-delete를 기본으로 해야 한다.

## Decision Drivers

- 부적절 콘텐츠 대응 속도
- 권한 오남용 방지
- 감사/추적 가능성

## Considered Options

1. 상태 머신 기반 모더레이션 + 운영자 권한 가드
2. 리뷰 하드 삭제 중심 운영
3. 신고만 저장하고 자동 비노출 미적용

## Decision

옵션 1을 채택한다. 리뷰/댓글은 상태 전이 이벤트로 모더레이션하고, 숨김/복원은 `operator|admin` 권한으로 제한한다.
삭제는 기본 soft-delete로 처리해 감사 로그와 함께 보존한다.

## Consequences

- Good:
  - 운영 대응과 사용자 노출 정책이 일관됨
  - 사후 분쟁 대응을 위한 이력 유지 가능
- Bad:
  - 상태 전이/권한 검증 코드 복잡도 증가

## PRD Traceability

- Satisfies:
  - `docs/01-prd/10-review/01-overview.md` (리뷰 상태 머신, 모더레이션)
- Supports:
  - `docs/01-prd/14-observability/01-overview.md` (리뷰 운영 지표)

## References

- `docs/02-architecture/backend/01-backend.md`
