# Auth Domain Events

## 감사 이벤트 (auth)

### 공통 이벤트 (store + admin surface)

- `login_success`
- `login_failed`
- `password_reset_request`
- `password_reset_confirm`
- `logout`
- `session_revoked`

### Store surface 전용 이벤트

- `register_success`
- `oauth_start`
- `oauth_callback_success`
- `oauth_callback_failed`

### Admin surface 전용 이벤트

- `admin_login_role_rejected` (`customer` 역할로 admin 로그인 시도)

## 로그 필드

- `user_id`(없으면 null)
- `auth_surface` (`store` | `admin`)
- `ip`
- `user_agent`
- `request_id`
- `provider`(oauth only, store surface)
- `result_code`

> `auth_surface` 필드를 통해 동일 이벤트 타입(예: `login_success`)이더라도
> store 고객 로그인과 admin 운영자 로그인을 구분하여 추적할 수 있다.

## 이벤트 엔벨로프

- 이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 참조한다.
