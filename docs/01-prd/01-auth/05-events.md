# Auth Domain Events

## 감사 이벤트 (auth)

필수 기록 이벤트:

- `login_success`
- `register_success`
- `login_failed`
- `oauth_start`
- `oauth_callback_success`
- `oauth_callback_failed`
- `password_reset_request`
- `password_reset_confirm`
- `logout`
- `session_revoked`

## 로그 필드

- `user_id`(없으면 null)
- `ip`
- `user_agent`
- `request_id`
- `provider`(oauth only)
- `result_code`

## 이벤트 엔벨로프

- 이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 참조한다.
