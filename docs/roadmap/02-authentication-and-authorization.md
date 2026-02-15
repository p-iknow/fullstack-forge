# 02. Authentication and Authorization

## Step Objective

Email + Google + Kakao 인증과 세션 수명주기, OAuth 보안(state/nonce), RBAC 인가 정책을
운영 가능한 수준으로 완성한다.

## Prerequisite

- [01-db-design-and-migrations](./01-db-design-and-migrations.md)

## References

- [02-user-flows-and-auth-policy](../prd/02-user-flows-and-auth-policy.md)
- [04-backend](../harness/04-backend.md)
- [05-integration](../harness/05-integration.md)

## Progressive Tasks

### 1) Authentication Foundation

- `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Access/Refresh TTL 정책 적용
- 감사 로그(`login_success`, `login_failed`, `logout`, `session_revoked`)

### 2) OAuth Hardening

- `GET /auth/oauth/:provider/start|callback` (`google`, `kakao`)
- `state`/`nonce` 생성 + Redis TTL 저장 + 1회성 소비
- redirect allowlist와 provider 실패 응답 표준화

### 3) Authorization (RBAC)

- 역할: `customer`, `operator`, `admin`
- admin API 접근 제어: `operator|admin`
- redrive/강제 전이 작업은 `admin`만 수행

## Local Environment Increment

- 로컬 Redis를 세션/state/nonce 저장소로 고정
- `.env`에 OAuth provider 키를 채우고 callback URL을 로컬 주소로 맞춤
- 로컬에서 Email 로그인 -> OAuth start/callback -> `GET /auth/me`를 연속 검증

## Exit Criteria

- Email/OAuth 로그인 플로우 정상 동작
- state 변조/재사용 토큰/권한 위반 시나리오 차단
- rate limit + 쿠키 정책(`HttpOnly`, `SameSite`, `Secure(prod)`) 검증 완료

## Evidence

- 인증 시퀀스 다이어그램
- 성공/실패/403 테스트 로그
- 보안 체크리스트 검증 결과

## Output for Next Step

- 운영 단계(07)에서 재사용할 RBAC 기준 확정
- 신뢰성/운영 단계(06, 07)에 필요한 인증/권한 기반 마련
