# 03. 이메일 로그인 검증 순서와 방어선

## 핵심 질문

> 이메일 로그인에서 rate-limit, lockout, 비밀번호 검증은 어떤 순서로 적용되는가?

## 한 줄 답

로그인은 `입력 검증 → IP rate-limit → 계정 조회 → lockout 확인 → 비밀번호 검증` 순서로 수행되어 brute-force를 다층으로 차단한다.

---

## 현재 흐름

```mermaid
sequenceDiagram
  participant C as Client
  participant A as POST /auth/login
  participant RL as rate-limit.ts
  participant DB as users+credentials
  participant L as account-lockout.ts
  participant P as verifyPassword

  C->>A: email, password
  A->>RL: IP 기준 rate-limit
  RL-->>A: pass/429
  A->>DB: 사용자 조회
  DB-->>A: user+credential / not_found
  A->>L: 잠금 상태 확인
  L-->>A: locked/active
  A->>P: 비밀번호 검증
  alt 성공
    A->>L: 실패 카운트 초기화
    A-->>C: 200 + session cookie
  else 실패
    A->>L: 실패 카운트 증가
    A-->>C: 401 또는 403
  end
```

상세 분기(Flowchart):

```mermaid
flowchart TD
  A[POST /auth/login] --> V{입력값 유효?}
  V -- 아니오 --> E400[400 validation_error]
  V -- 예 --> RL{IP rate-limit 통과?}
  RL -- 아니오 --> E429[429 auth_rate_limited]
  RL -- 예 --> Q[users + credentials 조회]
  Q --> U{사용자 존재?}
  U -- 아니오 --> E401A[401 auth_invalid_credentials]
  U -- 예 --> L{계정 잠금 상태?}
  L -- 예 --> E403[403 auth_account_locked]
  L -- 아니오 --> P{비밀번호 일치?}
  P -- 아니오 --> INC[실패 카운트 증가]
  INC --> E401B[401 auth_invalid_credentials]
  P -- 예 --> RESET[실패 카운트 초기화]
  RESET --> OK[200 + session cookie]
```

---

## 다층 방어선 — 네트워크/계정 기준 동시 적용

**Problem** — 단일 방어선(예: 비밀번호 실패만 체크)으로는 공격 패턴이 바뀌면 우회 가능성이 커진다.

**Action** — `rate-limit.ts`와 `account-lockout.ts`를 결합해 IP 단위와 계정 단위 제한을 동시에 적용한다.

**Result** — 공격 표면을 초기/중간 단계에서 동시에 축소한다. ✅ PRD 인증 보안 정책과 일치.

---

## 이 프로젝트에서의 적용

| 결정                      | 해결하는 문제                      |
| ------------------------- | ---------------------------------- |
| rate-limit + lockout 결합 | 무차별 대입 및 credential stuffing |

---

> **근거 문서**: [prd/01-auth/overview](../../01-prd/01-auth/01-overview.md)

---

## 다음 문서

[04. Refresh Rotation과 재사용 탐지](./04-refresh-rotation-reuse-detection.md) — 세션 연장 시 기존 refresh 토큰은 어떻게 처리되는가?
