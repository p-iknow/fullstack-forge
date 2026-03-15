# Promotion API Guide

## 범위

프로모션 조회·쿠폰 적용·검증 API의 경로와 책임을 정의한다.
이 문서는 경로 가이드와 정책만 다루며 request/response body 스키마는 포함하지 않는다.

## 인증/인가

| 접두사                | 대상 역할       | 인증 방식                 |
| --------------------- | --------------- | ------------------------- |
| `/promotions/*`       | customer        | Bearer token              |
| `/coupons/*`          | customer        | Bearer token              |
| `/orders/:id/*`       | customer (본인) | Bearer token + 소유 검증  |
| `/admin/promotions/*` | operator/admin  | Bearer token + role check |
| `/admin/coupons/*`    | operator/admin  | Bearer token + role check |

---

## Store API

### `GET /promotions/active`

- 목적: 현재 활성 상태인 프로모션 후보 목록 조회
- 인가: customer
- 규칙: 유효기간·활성상태(`status = active`) 필터 기준으로 반환
- 규칙: 만료 프로모션은 목록에서 제외
- 페이지네이션: cursor 기반, `?cursor=&limit=20` (기본 20, 최대 50)
- 정렬: `discount_value` 내림차순 (사용자에게 유리한 순)
- 성공 응답: `200 OK`
- 에러 응답: `401 Unauthorized` — 미인증

### `POST /coupons/validate`

- 목적: 쿠폰 코드의 유효성을 사전 검증(적용 전 확인용)
- 인가: customer
- 규칙: 쿠폰 코드는 대소문자 구분 없이 비교하되 저장은 원본 보존
- 규칙: 만료 쿠폰은 조회는 가능하나 적용 불가
- 규칙: 사용자별 사용 제한(`per_user_limit`) 초과 시 거절
- 규칙: 전체 사용 제한(`max_uses`) 초과 시 거절
- 규칙: 동일 주문에는 동일 쿠폰 재적용 불가
- Rate limit: 사용자당 분당 10회, IP당 분당 30회
- 성공 응답: `200 OK` — 유효성 검증 결과 (valid/invalid + 사유)
- 에러 응답:
  - `401 Unauthorized` — 미인증
  - `429 Too Many Requests` — rate limit 초과 (`Retry-After` 헤더 포함)

### `POST /orders/:id/apply-coupon`

- 목적: 주문에 쿠폰 코드를 적용하여 최종 할인을 확정
- 인가: customer (주문 소유자)
- 멱등성: `Idempotency-Key` 헤더 필수 (권장 형식: `{order_id}:{coupon_code}`)
- 규칙: 주문 시점에 활성 프로모션 후보 조회(기간/상태 필터)
- 규칙: 쿠폰 코드 입력 시 코드 유효성 검증(존재/만료/사용량/사용자별 제한)
- 규칙: 최소주문금액 조건 검증 — **15,000원** 미달 시 거절
- 규칙: 충돌 정책 적용(동시 적용 금지)
- 규칙: 사용자에게 가장 유리한 할인 1개 선택
- 규칙: 최대 할인 상한 적용 후 선택 결과를 `order_promotions`로 고정 저장
- 이벤트 발행: 쿠폰 적용 시 `CouponRedeemed`, 카테고리 할인 적용 시 `PromotionApplied`
- 성공 응답: `200 OK` — 적용된 할인 결과 스냅샷
- 에러 응답:
  - `401 Unauthorized` — 미인증
  - `403 Forbidden` — 타인 주문에 접근
  - `404 Not Found` — 주문 없음
  - `409 Conflict` — 이미 할인이 적용된 주문
  - `422 Unprocessable Entity` — 쿠폰/프로모션 검증 실패 (아래 실패 사유 코드 포함)
  - `429 Too Many Requests` — rate limit 초과

### `DELETE /orders/:id/remove-coupon`

- 목적: 주문에 적용된 쿠폰/할인을 제거
- 인가: customer (주문 소유자)
- 규칙: 결제 완료 전 주문에서만 제거 가능
- 규칙: 쿠폰 사용 카운트 복원
- 규칙: `order_promotions` 레코드를 삭제하지 않고 `removed_at` 기록
- 성공 응답: `200 OK`
- 에러 응답:
  - `401 Unauthorized` — 미인증
  - `403 Forbidden` — 타인 주문에 접근
  - `404 Not Found` — 주문 없음 또는 적용된 할인 없음
  - `409 Conflict` — 이미 결제 완료된 주문

---

## Admin API

### `GET /admin/promotions`

- 목적: 전체 프로모션 목록 조회 (상태 무관)
- 인가: operator, admin
- 페이지네이션: cursor 기반, `?cursor=&limit=20` (기본 20, 최대 100)
- 필터: `?status=active|inactive|expired|draft|deleted`, `?type=fixed_amount|percentage`
- 정렬: `created_at` 내림차순 (기본)
- 성공 응답: `200 OK`

### `POST /admin/promotions`

- 목적: 새 프로모션 생성 (초기 상태: `draft`)
- 인가: admin
- 검증 규칙:
  - `type`은 `fixed_amount` 또는 `percentage` 필수
  - `discount_value`는 양수 필수
  - `percentage` 타입: 1~50 범위
  - `starts_at` < `ends_at` 필수
  - `min_order_amount` ≥ 0
- 성공 응답: `201 Created`
- 에러 응답:
  - `401 Unauthorized` — 미인증
  - `403 Forbidden` — 권한 부족
  - `422 Unprocessable Entity` — 검증 실패

### `PATCH /admin/promotions/:id`

- 목적: 프로모션 수정
- 인가: admin
- 규칙: `active` 상태 프로모션의 `discount_value`, `type` 변경 불가 (비활성화 후 수정)
- 규칙: `draft` 상태에서만 모든 필드 수정 가능
- 성공 응답: `200 OK`
- 에러 응답:
  - `403 Forbidden` — 권한 부족
  - `409 Conflict` — active 상태에서 금지 필드 수정 시도
  - `422 Unprocessable Entity` — 검증 실패

### `POST /admin/promotions/:id/activate`

- 목적: 프로모션 활성화 (`draft → active`, `inactive → active`)
- 인가: admin
- 규칙: 유효기간이 현재 시점 이후여야 활성화 가능
- 성공 응답: `200 OK`
- 에러 응답:
  - `409 Conflict` — 불법 상태 전이 (`expired`, `deleted`에서 호출)
  - `422 Unprocessable Entity` — 유효기간 만료

### `POST /admin/promotions/:id/deactivate`

- 목적: 프로모션 비활성화 (`active → inactive`)
- 인가: operator, admin
- 규칙: 진행 중인 주문에 이미 적용된 할인은 스냅샷 기준 유지
- 규칙: 감사 로그에 비활성화 사유 기록
- 성공 응답: `200 OK`
- 에러 응답:
  - `409 Conflict` — active 상태가 아닌 프로모션

### `DELETE /admin/promotions/:id`

- 목적: 프로모션 삭제 (`draft → deleted`)
- 인가: admin
- 규칙: `draft` 상태에서만 삭제 가능. 활성 상태는 비활성화 먼저 필요.
- 규칙: soft delete (deleted 상태 전이, 물리 삭제 아님)
- 성공 응답: `200 OK`
- 에러 응답:
  - `409 Conflict` — draft 상태가 아닌 프로모션

### `POST /admin/coupons`

- 목적: 새 쿠폰 생성
- 인가: admin
- 검증 규칙:
  - `code`: 필수, 4~20자, 영숫자+하이픈
  - `max_uses`: 양수 필수
  - `per_user_limit`: 양수 필수 (기본 1)
  - 연결 프로모션 ID 필수
- 성공 응답: `201 Created`
- 에러 응답:
  - `409 Conflict` — 동일 코드 중복
  - `422 Unprocessable Entity` — 검증 실패

### `PATCH /admin/coupons/:id`

- 목적: 쿠폰 수정 (`max_uses`, `per_user_limit`, 유효기간 등)
- 인가: admin
- 규칙: `code` 변경 불가 (새로 생성 필요)
- 성공 응답: `200 OK`

### `GET /admin/coupons`

- 목적: 쿠폰 목록 조회
- 인가: operator, admin
- 페이지네이션: cursor 기반
- 필터: `?promotion_id=`, `?code=` (부분 검색)
- 성공 응답: `200 OK`

### `GET /admin/coupons/:id/redemptions`

- 목적: 특정 쿠폰의 사용 이력 조회
- 인가: operator, admin
- 페이지네이션: cursor 기반
- 성공 응답: `200 OK`

---

## 실패 사유 코드

| 코드                          | HTTP 상태 | 설명                    |
| ----------------------------- | --------- | ----------------------- |
| `coupon_not_found`            | 422       | 존재하지 않는 쿠폰 코드 |
| `coupon_expired`              | 422       | 만료된 쿠폰             |
| `coupon_limit_exceeded`       | 422       | 전체 사용 한도 초과     |
| `coupon_user_limit_exceeded`  | 422       | 사용자별 사용 한도 초과 |
| `coupon_already_applied`      | 409       | 이미 적용된 쿠폰        |
| `promotion_min_order_not_met` | 422       | 최소주문금액 미달       |
| `promotion_inactive`          | 422       | 비활성 프로모션         |

## 에러 응답 body 형식

```json
{
  "error": {
    "code": "coupon_expired",
    "message": "해당 쿠폰은 만료되었습니다."
  }
}
```

## 운영/보안

- 무차별 코드 대입 방지: 사용자/IP 단위 rate limit 적용
- 감사 로그 기록: 쿠폰 적용 성공/실패, 운영자 수동 비활성화, 정책 변경 이력
