# 02. 인증·계정 테이블 설계 근거

## 핵심 질문

> auth/account 영역 테이블은 어떤 보안·권한 요구를 만족하기 위해 이런 구조인가?

## 한 줄 답

계정 식별, 자격 증명, OAuth 연동, 세션 수명주기, 감사 추적을 분리해 PRD의 인증·보안 요구를 각 테이블 책임으로 나눴다.

---

## 현재 접근 방식

```text
auth.ts
- users: 계정 식별 + role/status
- user_credentials: password_hash
- user_oauth_accounts: provider 계정 연결
- user_sessions: refresh 토큰 메타 + revoke/expiry
- audit_logs: 보안 이벤트 추적
```

---

## users + user_credentials 분리

**Problem** — 계정 프로필과 비밀번호 해시를 한 테이블에 섞으면 보안 정책(접근 범위, 회전, 마스킹)을 세분화하기 어렵다.

**Action** — `users`와 `user_credentials`를 분리하고 FK로 연결했다.

```text
users(id, email, name, role, status, created_at)
user_credentials(user_id, password_hash, updated_at)
```

**Result** — `docs/prd/02-user-flows-and-auth-policy.md`의 계정 상태/권한 요구와 비밀번호 보안 요구를 책임별로 분리해 운영할 수 있다.

---

## user_oauth_accounts 별도 테이블

**Problem** — 소셜 로그인(provider별 식별자)은 일반 이메일 로그인과 식별 체계가 다르다. users에 직접 섞으면 계정 연결 규칙이 복잡해진다.

**Action** — provider, providerUserId를 별도 테이블로 분리했다.

```text
user_oauth_accounts
- user_id FK
- provider (google|kakao)
- provider_user_id
- unique(provider, provider_user_id)
```

**Result** — OAuth 계정 연결/충돌 처리 규칙을 명확히 모델링할 수 있고, 다중 로그인 채널을 안정적으로 운영할 수 있다.

---

## user_sessions 테이블로 회전/폐기 모델링

**Problem** — 세션을 stateless 토큰만으로 운영하면 refresh rotation/reuse detection 같은 보안 정책을 강제하기 어렵다.

**Action** — 세션 메타를 DB에 저장했다.

```text
user_sessions
- refresh_token_hash
- revoked boolean
- expires_at
```

**Result** — `docs/prd/02-user-flows-and-auth-policy.md`의 refresh rotation, reuse detection, 만료 정책을 서버 저장소 기준으로 구현할 수 있다.

---

## audit_logs 분리

**Problem** — 인증 실패/성공, OAuth 콜백 실패, 세션 폐기 같은 보안 이벤트를 앱 로그만으로 추적하면 감사 용도로 불충분하다.

**Action** — `audit_logs`를 별도 테이블로 두고 `user_id nullable` 구조를 채택했다.

```text
audit_logs
- user_id nullable
- event
- ip_address
- user_agent
- request_id
- provider
- result_code
```

**Result** — 사용자 미확정 이벤트(login_failed 등)까지 포함해 감사 추적이 가능하며, 운영/보안 분석 근거가 남는다.

---

## 이 프로젝트에서의 적용

| 결정                          | 해결하는 문제                                        |
| ----------------------------- | ---------------------------------------------------- |
| users-credentials 분리        | 계정 정책과 자격 증명 관리 혼합으로 인한 보안 리스크 |
| oauth_accounts 별도 모델      | 소셜 로그인 식별 체계 충돌                           |
| sessions 저장 + revoke/expiry | refresh 토큰 회전/재사용 탐지 구현 어려움            |
| audit_logs 독립 저장          | 인증/보안 이벤트 감사 불가능 문제                    |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../adr/ADR-0002-backend-stack-hono-drizzle-postgres-redis.md)

---

## 다음 문서

[03. 주문·재고·결제·배송 테이블 설계 근거](./03-commerce-core-table-rationale.md) — 커머스 코어 테이블은 어떤 운영/정합성 요구를 만족하기 위해 이런 구조인가?
