# 02. User Flows and Auth Policy

## 1) 인증 범위

- 이메일 로그인/로그아웃
- Google OAuth
- Kakao OAuth
- 세션 유지/만료/재발급

## 2) 핵심 사용자 흐름

### 고객 로그인(이메일)

1. `POST /auth/login`
2. 자격 검증 성공 시 세션 발급
3. `GET /auth/me`로 세션 확인

### 고객 로그인(소셜)

1. `GET /auth/oauth/{provider}/start`
2. provider authorize 페이지 redirect
3. callback 수신: `GET /auth/oauth/{provider}/callback`
4. state/nonce 검증 후 세션 발급

### 로그아웃

1. `POST /auth/logout`
2. 서버 세션 무효화
3. 쿠키 삭제/만료

### 고객 리뷰 작성/댓글

1. `GET /products/{id}`에서 리뷰 목록/요약 조회
2. 배송 완료 주문의 구매자만 `POST /reviews` 작성 허용
3. 리뷰 작성자/운영자만 `POST /reviews/{reviewId}/comments` 허용
4. 부적절 콘텐츠는 운영자가 숨김 처리 후 사유 기록

### 고객 문의 생성/답변

1. 고객: `POST /inquiries`로 문의 생성
2. 운영자: `PATCH /inquiries/{id}`로 상태 전이(`open -> in_progress -> resolved`)
3. 운영자: `POST /inquiries/{id}/replies`로 답변
4. 고객: `GET /inquiries/{id}`에서 답변/상태 조회

## 3) 인증 정책 상세

### 세션/토큰

- Access session TTL: 15분
- Refresh session TTL: 14일
- Refresh rotation: 매 재발급 시 refresh token 교체
- Reuse detection: 기존 refresh 재사용 탐지 시 세션 강제 폐기

### 쿠키 정책

- `HttpOnly=true`
- `SameSite=Lax` (기본)
- `Secure=true` (prod 필수, local 개발환경은 예외 허용)
- 쿠키 이름 예시:
  - `qc_access`
  - `qc_refresh`

### OAuth 정책

- 지원 provider: `google`, `kakao`
- `state`/`nonce` 생성 후 Redis TTL(5분) 저장
- callback 성공 시 1회성 소비 후 즉시 삭제
- provider 응답 검증 실패 시 계정 생성 금지
- redirect allowlist 외 경로 금지(Open Redirect 방지)

## 4) 계정/권한 정책

### 계정 상태

- `active`
- `locked` (브루트포스/보안 이벤트)
- `withdrawn` (탈퇴)

### 권한 역할

- `customer`: store 접근
- `operator`: admin 접근
- `admin`: 운영/정책 변경

### 권한 검증

- `admin` 화면/API는 `operator|admin`만 허용
- 고객 세션으로 admin API 호출 시 403
- 리뷰 작성은 구매 검증된 `customer`만 허용
- 리뷰 댓글은 `customer|operator|admin` 허용 (삭제/숨김은 `operator|admin`)
- 문의 답변/상태 변경은 `operator|admin`만 허용

## 5) 로그인/로그아웃 보안 정책

### Rate Limit

- `POST /auth/login`: 5 req / 15 min / IP
- `GET /auth/oauth/*/start`: 20 req / 15 min / IP
- `POST /auth/logout`: 30 req / 15 min / user
- `POST /reviews`: 10 req / 15 min / user
- `POST /reviews/*/comments`: 20 req / 15 min / user
- `POST /inquiries`: 5 req / 15 min / user
- `POST /inquiries/*/replies`: 30 req / 15 min / operator

### 실패 정책

- 로그인 실패 5회 연속 시 15분 잠금
- 잠금 해제 후 실패 카운터 초기화
- OAuth provider 실패는 재시도 1회 후 실패 반환

### 감사 로그(Audit)

필수 기록 이벤트:

- `login_success`
- `login_failed`
- `oauth_start`
- `oauth_callback_success`
- `oauth_callback_failed`
- `logout`
- `session_revoked`
- `review_created`
- `review_comment_created`
- `review_hidden_by_operator`
- `inquiry_created`
- `inquiry_replied`
- `inquiry_status_changed`

로그 필드:

- `user_id`(없으면 null)
- `ip`
- `user_agent`
- `request_id`
- `provider`(oauth only)
- `result_code`

## 6) 에러 정책

### 공통 에러 코드

- `auth_invalid_credentials`
- `auth_account_locked`
- `auth_session_expired`
- `oauth_invalid_state`
- `oauth_exchange_failed`
- `oauth_provider_unavailable`
- `review_not_purchase_verified`
- `review_already_exists`
- `inquiry_not_found`
- `inquiry_reply_forbidden`

### 응답 규칙

- 메시지는 사용자 친화적이되 내부 사유 노출 금지
- 동일 실패 케이스는 항상 동일 코드 반환

## 7) UX 정책

- 로그인 화면은 3가지 진입점 명확 노출: Email / Google / Kakao
- OAuth callback 중 로딩 상태 표시
- 세션 만료 시 자동 로그인 페이지 이동 + 안내 토스트
- 로그인 실패 사유는 보안 범위 내 일반화된 문구 사용
- 리뷰 영역은 실구매 여부 배지(예: `verified_purchase`) 표시
- 문의 상세 화면에 상태(`open/in_progress/resolved`)와 최근 답변 시간 표시

## 8) 검증 기준 (완료 조건)

- 이메일 로그인/로그아웃 시나리오 성공
- Google/Kakao OAuth 시작/콜백 성공
- state/nonce 변조 시 차단
- refresh reuse 탐지 시 세션 폐기
- admin 권한 없는 사용자 접근 차단
- 비구매자의 리뷰 작성 시도 차단
- 고객 문의 생성 후 운영자 답변/상태 전이 흐름 검증
