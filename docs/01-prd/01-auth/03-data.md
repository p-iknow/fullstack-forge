# Auth Domain Data

## 핵심 엔터티

### User

- 계정 상태: `active` / `locked` / `withdrawn`
- 권한 역할: `customer` / `operator` / `admin`
- `password_hash`: bcrypt 해시 저장값
- `email_verified`: 이메일 검증 여부 저장 필드

### Session

> 세션/토큰 상세 정책은 [01-overview.md §3 인증 정책 상세](./01-overview.md#3-인증-정책-상세)를 참조한다.

### OAuthToken

- 지원 provider: `google`, `kakao`
- `state`/`nonce` 생성 후 Redis TTL(5분) 저장
- callback 성공 시 1회성 소비 후 즉시 삭제
- provider 응답 검증 실패 시 계정 생성 금지

## 관계

- User 1:N Session
- User 1:N OAuthToken

## Redis 키 패턴

- session: `session:{session_id}`
- rate-limit: `ratelimit:login:{ip}`
- oauth state: `oauth:state:{provider}:{state}`
- oauth nonce: `oauth:nonce:{provider}:{nonce}`
