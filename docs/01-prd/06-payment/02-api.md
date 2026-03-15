# Payment API Guide

## 범위

결제 생성/조회/취소/환불 API의 경로, 에러 응답, 인증 요건을 정의한다.

## 기본 경로

### Store (고객)

- `POST /payments` — 결제 시작
- `GET /payments/:id` — 단건 결제 상태 조회
- `POST /payments/:id/cancel` — 결제 취소
- `GET /orders/:id/payment` — 주문 연계 결제 조회

### Admin (운영자)

- `GET /admin/payments` — 결제 목록 조회
- `GET /admin/payments/:id` — 결제 상세 조회
- `POST /admin/payments/:id/refund` — 수동 환불 처리

### PG Webhook

- `POST /webhooks/pg` — PG 결제/환불 결과 수신

## Store API

### POST /payments

- 목적: 주문 결제 시작
- 인증: 필수 (로그인 사용자)
- 권한: 본인 주문만 결제 가능 (`order.user_id == 요청자`)
- 규칙:
  - 최초 상태는 `initiated`
  - 같은 idempotency key 재요청은 중복 결제 없이 동일 처리 결과를 반환
  - 동일 주문에 진행 중인 결제(`initiated`/`authorized`)가 있으면 거절
  - 동일 주문 최대 결제 시도 횟수: **5회** 초과 시 거절
  - 결제 요청 금액과 주문 확정 금액 일치 여부 서버 검증
- 에러 응답:

| HTTP 상태 | 에러 코드               | 설명                          |
| --------- | ----------------------- | ----------------------------- |
| 400       | `invalid_request`       | 필수 필드 누락 또는 형식 오류 |
| 400       | `amount_mismatch`       | 결제 금액과 주문 금액 불일치  |
| 401       | `unauthorized`          | 인증 실패                     |
| 403       | `forbidden`             | 타인 주문 결제 시도           |
| 409       | `payment_in_progress`   | 이미 진행 중인 결제 존재      |
| 409       | `max_attempts_exceeded` | 최대 결제 시도 횟수 초과      |
| 422       | `order_not_payable`     | 결제 불가 주문 상태           |

### GET /payments/:id

- 목적: 단건 결제 상태 조회
- 인증: 필수
- 권한: 본인 결제만 조회 가능
- 규칙: 결제 상태 (`initiated` | `authorized` | `captured` | `failed` | `cancelled` | `refund_requested` | `refunded` | `partially_refunded`) 중 하나를 반환
- 에러 응답:

| HTTP 상태 | 에러 코드      | 설명           |
| --------- | -------------- | -------------- |
| 401       | `unauthorized` | 인증 실패      |
| 403       | `forbidden`    | 타인 결제 조회 |
| 404       | `not_found`    | 결제 미존재    |

### POST /payments/:id/cancel

- 목적: 결제 취소 트리거
- 인증: 필수
- 권한: 본인 결제만 취소 가능
- 규칙:
  - 취소 가능 상태: `initiated`, `authorized` (매출 확정 전)
  - `captured` 이후에는 환불 흐름(`POST /admin/payments/:id/refund` 또는 주문 취소 연쇄)으로 전환
  - 주문 취소 흐름과 정합성을 유지
- 에러 응답:

| HTTP 상태 | 에러 코드         | 설명                           |
| --------- | ----------------- | ------------------------------ |
| 401       | `unauthorized`    | 인증 실패                      |
| 403       | `forbidden`       | 타인 결제 취소 시도            |
| 404       | `not_found`       | 결제 미존재                    |
| 409       | `not_cancellable` | 취소 불가 상태 (captured 이후) |

## Admin API

### GET /admin/payments

- 목적: 결제 목록 조회 (운영)
- 인증: 필수 (Admin 권한)
- 페이지네이션: `cursor` 기반, 기본 `limit=20`
- 필터: `status`, `user_id`, `order_id`, `created_at` 범위
- 정렬: `created_at` 최신순 기본

### GET /admin/payments/:id

- 목적: 결제 상세 조회 (운영)
- 인증: 필수 (Admin 권한)
- 응답: 결제 상태, PG 응답 원본, 상태 전이 이력 포함

### POST /admin/payments/:id/refund

- 목적: 운영자 수동 환불 처리
- 인증: 필수 (Admin 권한)
- 규칙:
  - `captured` 상태에서만 환불 가능
  - 환불 사유 필수
  - 전액/부분 환불 금액 지정
  - 부분 환불 금액은 결제 금액을 초과할 수 없음
- 에러 응답:

| HTTP 상태 | 에러 코드        | 설명                       |
| --------- | ---------------- | -------------------------- |
| 401       | `unauthorized`   | 인증 실패                  |
| 403       | `forbidden`      | Admin 권한 없음            |
| 404       | `not_found`      | 결제 미존재                |
| 409       | `not_refundable` | 환불 불가 상태             |
| 422       | `invalid_amount` | 환불 금액 초과 또는 0 이하 |

## PG Webhook

### POST /webhooks/pg

- 목적: PG 결제/환불 결과 비동기 수신
- 인증: PG 서명 검증 (webhook signature)
- 규칙:
  - PG 서명 검증 실패 시 `401` 반환
  - 수신 결과에 따라 결제 상태 전이 (`initiated → authorized → captured`, `refund_requested → refunded`)
  - 이미 처리된 결과 재수신 시 idempotent 처리 (200 반환, 상태 변경 없음)
- 보안: IP 화이트리스트 + 서명 검증 이중 적용

## idempotency key 규칙

- 모든 결제 생성 요청은 idempotency key를 필수로 포함한다.
- 생성 주체: **클라이언트**가 생성하여 요청 헤더에 포함 (`Idempotency-Key` 헤더)
- 포맷: UUID v4 (예: `550e8400-e29b-41d4-a716-446655440000`)
- 최대 길이: **36자**
- 동일 key의 동시 요청은 단일 결제로 수렴해야 한다.
- idempotency key 보존 기간: **24시간**. 보존 기간 이후 동일 key 재사용 시 신규 결제로 처리한다.
- `failed` 상태의 결제를 재시도할 때는 새로운 idempotency key를 사용해야 한다.

## 실패 및 타임아웃 정책

- 결제 요청 후 **30초** 내 PG 응답이 없으면 타임아웃으로 판정한다.

### 에러 코드 매핑

| 내부 failure_code           | API 응답 코드        | 사용자 안내                                                 |
| --------------------------- | -------------------- | ----------------------------------------------------------- |
| `failed_timeout`            | `payment_timeout`    | 결제 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요. |
| `failed_gateway`            | `payment_gateway`    | 결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.        |
| `failed_insufficient_funds` | `insufficient_funds` | 잔액이 부족합니다. 다른 결제 수단을 이용해주세요.           |
| `failed_refund`             | `refund_failed`      | 환불 처리 중 오류가 발생했습니다. 고객센터에 문의해주세요.  |

- 내부 `failure_code`는 DB에 저장하며, API 응답 시 매핑된 응답 코드를 반환한다.

## 에러 응답 공통 형식

```json
{
  "error": {
    "code": "payment_timeout",
    "message": "결제 처리 시간이 초과되었습니다."
  }
}
```
