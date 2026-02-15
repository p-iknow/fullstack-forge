# 02. Auth and Security — 인증 검증 + 보안 기본선

## Prerequisite

- [01-db-and-migrations](./01-db-and-migrations.md) 완료

## Roadmap Companion

- [roadmap/02-authentication-and-authorization](../roadmap/02-authentication-and-authorization.md)

## Harness 참조

- [04-backend](../harness/04-backend.md)
- [05-integration](../harness/05-integration.md)

## 검증 체크리스트

### 인증 엔드포인트

- [ ] `curl -X POST http://localhost:8080/auth/signup` → 201
- [ ] `curl -X POST http://localhost:8080/auth/login` → access token 응답
- [ ] `curl http://localhost:8080/auth/me` → 현재 사용자 응답
- [ ] `http://localhost:8080/auth/oauth/google/start` 접근 시 Google authorize redirect 확인
- [ ] `http://localhost:8080/auth/oauth/kakao/start` 접근 시 Kakao authorize redirect 확인

### 프론트엔드 로그인 UI

- [ ] 로그인 화면에 Email/Google/Kakao 로그인 옵션 노출 확인

### Security Baseline

- [ ] 로그인 endpoint rate limit 적용 확인 (`429` + `Retry-After` + `RateLimit-*`)
- [ ] OAuth start endpoint rate limit 적용 확인 (`GET /auth/oauth/:provider/start`)
- [ ] 세션/토큰 쿠키 정책 확인 (`HttpOnly`, `SameSite`, `Secure(prod)`)
- [ ] OAuth state/nonce 검증 로직 적용 확인 (Redis TTL + 1회성 소비)
- [ ] refresh token rotation 정책 문서/구현 반영 여부 확인
- [ ] 비밀값이 `.env.example` 외 파일에 하드코딩되지 않았는지 점검

## Troubleshooting

### OAuth callback 실패

- `.env`의 `GOOGLE_CLIENT_ID`, `KAKAO_CLIENT_ID` 값이 실제 발급값인지 확인
- callback URL이 provider 콘솔에 등록된 URL과 정확히 일치하는지 확인
- Redis가 실행 중인지 확인 (state/nonce TTL 저장 필요)

### rate limit 미동작

- Redis 연결 확인 (`redis-cli PING`)
- rate limit 미들웨어가 해당 라우트에 적용되었는지 확인
- key TTL 확인: `redis-cli TTL ratelimit:login:<ip>`

### 쿠키가 브라우저에 저장되지 않음

- `Set-Cookie` 응답 헤더 확인 (브라우저 개발자 도구 Network 탭)
- `SameSite=Lax`일 때 cross-origin 요청이면 쿠키 미전송 → proxy 경유 확인
- HTTPS가 아닌데 `Secure=true`면 쿠키 무시됨 (로컬에서는 false 허용)

### refresh token rotation 검증 방법

```bash
# 1. 로그인 → refresh token 획득
# 2. refresh 호출 → 새 토큰 발급 + 기존 토큰 revoke 확인
# 3. revoke된 토큰으로 재요청 → 401 + 세션 family 전체 revoke 확인
```

## Next

- 도메인 API + 프론트엔드 → [02a-commerce-core](./02a-commerce-core.md)
