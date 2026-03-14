# Delivery API

## 범위

배송 상태 조회, 배차, 취소 API의 경로/책임/차단/검증 규칙을 정의한다.

## 기본 경로

- Store 배송 조회: `/deliveries`
- Admin 배차/관리: `/admin/deliveries`

## Store API

### `GET /deliveries/:id`

- **목적**: 단건 배송 상태 조회
- **권한**: 주문 소유 사용자만 접근 가능
- **응답 핵심 필드**: `delivery_id`, `order_id`, `mode`, `status`, `dispatch_state`, `sla_target_at`, `sla_remaining_minutes`, `driver_id`
- **에러 응답**:
  - `404 Not Found` — 배송 레코드 없음
  - `403 Forbidden` — 타 사용자 배송 접근 시도

### `GET /deliveries?orderId=:orderId`

- **목적**: 주문 기준 배송 조회
- **권한**: 주문 소유 사용자만 접근 가능
- **규칙**: 주문의 배송 레코드가 없으면 `404 Not Found`
- **에러 응답**:
  - `404 Not Found` — 해당 주문의 배송 레코드 없음
  - `403 Forbidden` — 타 사용자 주문 접근 시도

## Admin API

### `GET /admin/deliveries`

- **목적**: 배송 목록 조회 (필터/정렬/페이지네이션)
- **권한**: 운영자 권한 사용자만 접근 가능
- **필터 파라미터**:
  - `status` — 배송 상태 (복수 선택 가능)
  - `dispatch_state` — 배차 상태
  - `sla_risk` — SLA 위반 위험 (`at_risk`: 잔여 10분 이하, `violated`: SLA 초과)
  - `mode` — 배송 모드 (`instant`, `scheduled`)
- **정렬**: 기본 `sla_target_at ASC` (SLA 임박순)
- **페이지네이션**: `cursor` 기반
- **에러 응답**:
  - `403 Forbidden` — 권한 없음

### `POST /admin/deliveries/:id/dispatch`

- **목적**: 운영자 수동 배차 실행
- **권한**: 운영자 권한 사용자만 접근 가능
- **요청 필드**: `driver_id` (필수)
- **선행 조건**: `dispatch_state`가 `unassigned` 또는 `manual_required`일 때만 수행 가능
- **멱등성**: `Idempotency-Key` 헤더 필수
- **에러 응답**:
  - `404 Not Found` — 배송 레코드 없음
  - `409 Conflict` — 배차 불가 상태 (이미 배차됨, 종료 상태 등)
  - `422 Unprocessable Entity` — `driver_id` 누락 또는 유효하지 않은 기사
  - `403 Forbidden` — 권한 없음

### `POST /admin/deliveries/:id/redispatch`

- **목적**: 운영자 수동 재배차 실행
- **권한**: 운영자 권한 사용자만 접근 가능
- **요청 필드**: `driver_id` (선택 — 미지정 시 자동 배정)
- **선행 조건**: `dispatch_state`가 `manual_required`일 때만 수행 가능
- **멱등성**: `Idempotency-Key` 헤더 필수
- **에러 응답**:
  - `404 Not Found` — 배송 레코드 없음
  - `409 Conflict` — 재배차 불가 상태
  - `403 Forbidden` — 권한 없음

### `POST /admin/deliveries/:id/cancel`

- **목적**: 운영자 배송 취소
- **권한**: 운영자 권한 사용자만 접근 가능
- **요청 필드**: `reason` (필수, 취소 사유)
- **선행 조건**: `status`가 `pending`, `dispatched`, `failed`일 때만 수행 가능. `in_transit`, `delivered`에서는 차단.
- **멱등성**: `Idempotency-Key` 헤더 필수
- **에러 응답**:
  - `404 Not Found` — 배송 레코드 없음
  - `409 Conflict` — 취소 불가 상태 (`in_transit`, `delivered`)
  - `422 Unprocessable Entity` — `reason` 누락
  - `403 Forbidden` — 권한 없음

## 공통 규칙

- Store 조회 API는 주문 소유 사용자만 접근 가능 (`403 Forbidden`)
- Admin API는 운영자 권한 사용자만 접근 가능 (`403 Forbidden`)
- 종료 상태(`delivered`, `cancelled`)에서는 배차/재배차/취소 요청을 차단 (`409 Conflict`)
- 쓰기 API는 `Idempotency-Key` 헤더 필수 (`400 Bad Request` if missing)
