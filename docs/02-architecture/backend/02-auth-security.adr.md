# ADR-0006: 인증 보안 구조로 JWT Access + Opaque Refresh Rotation 선택

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend, Security

## Context

PRD는 이메일/OAuth 로그인, 세션 재발급, refresh reuse detection, OAuth state/nonce 검증을 요구한다.
토큰 탈취와 Open Redirect를 방지하면서 store/admin 권한 분리를 유지해야 한다.

## Decision Drivers

- 짧은 수명 access token과 서버 제어형 refresh token 병행
- OAuth callback 위변조 방지
- 운영 감사 로그와 보안 이벤트 추적성

## Considered Options

1. JWT access + opaque refresh rotation + Redis nonce/state
2. 장수명 JWT 단일 토큰
3. 서버 세션 ID 단일 방식

## Decision

옵션 1을 채택한다. Access token은 15분 JWT, refresh token은 서버 저장 hash 검증 방식으로 회전한다.
OAuth state/nonce는 Redis TTL(5분)로 단회성 검증 후 즉시 폐기한다.

## Consequences

- Good:
  - 재사용 탐지 기반 세션 폐기로 보안성 향상
  - OAuth 위변조와 redirect 오남용 위험 감소
- Bad:
  - 토큰 회전/폐기 저장소 운영 복잡도 증가

## PRD Traceability

- Satisfies:
  - `docs/01-prd/01-auth/01-overview.md` (세션/토큰, OAuth state/nonce, refresh reuse)
- Supports:
  - `docs/01-prd/00-overview.md` (보안 기본값, OAuth 정책)
  - `docs/01-prd/14-observability/01-overview.md` (감사/추적 로그 연계)

## References

- `docs/02-architecture/backend/01-backend.md`
- `docs/02-architecture/backend/01-backend.adr.md`
