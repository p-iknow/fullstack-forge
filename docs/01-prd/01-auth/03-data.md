# Auth Domain Data

## 핵심 엔터티

### User

- 계정 상태: `active` / `locked` / `withdrawn`
- 권한 역할: `customer` / `operator` / `admin`
- `password_hash`: bcrypt 해시 저장값
- `email_verified`: 이메일 검증 여부 저장 필드

> User 테이블은 auth surface 간에 공유한다. 역할(role) 필드로 surface 접근 가능 여부를 결정한다.
> 이는 Vendure(공유 User → 별도 Administrator/Customer), Medusa(공유 auth module + actor_type)와 동일한 접근이다.

### Session

> 세션/토큰 상세 정책은 [01-overview.md §3 인증 정책 상세](./01-overview.md#3-인증-정책-상세)를 참조한다.

- `auth_surface`: 세션이 발급된 surface (`store` | `admin`)

> 세션 레코드에 `auth_surface` 필드를 포함하여 어느 surface에서 발급된 세션인지 식별한다.
> 이를 통해 store 세션으로 admin API 호출 시 surface 불일치를 탐지하고 거부할 수 있다.

### OAuthToken (store surface 전용)

- 지원 provider: `google`, `kakao`
- `state`/`nonce` 생성 후 Redis TTL(5분) 저장
- callback 성공 시 1회성 소비 후 즉시 삭제
- provider 응답 검증 실패 시 계정 생성 금지

## 관계

- User 1:N Session
- User 1:N OAuthToken (store surface의 customer만 해당)

## 쿠키 네임스페이스

| Surface | Access 쿠키       | Refresh 쿠키       |
| ------- | ----------------- | ------------------ |
| store   | `qc_access`       | `qc_refresh`       |
| admin   | `qc_admin_access` | `qc_admin_refresh` |

## Redis 키 패턴

### Store surface

- session: `session:{session_id}`
- rate-limit: `ratelimit:login:{ip}`
- oauth state: `oauth:state:{provider}:{state}`
- oauth nonce: `oauth:nonce:{provider}:{nonce}`

### Admin surface

- session: `session:admin:{session_id}`
- rate-limit: `ratelimit:admin:login:{ip}`

> Redis 키를 surface별로 분리하여 store와 admin의 rate-limit 카운터가 서로 간섭하지 않도록 한다.
> 고객 brute-force 공격이 admin rate-limit에 영향을 주지 않는다.
