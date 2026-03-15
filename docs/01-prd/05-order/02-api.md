# Order API Guide

## 범위

주문 생성/조회/목록/상태 전이/대체 승인 API의 경로, 요청 검증, 에러 응답, 접근 제어를 정의한다.

## 기본 경로

- Store: `/orders`
- Admin: `/admin/orders`

## 핵심 API

### POST /orders

- 목적: 장바구니 기준 주문 생성
- 규칙:
  - 생성 직후 기본 상태는 `created`
  - 부분 품절 발생 시 `01-overview.md`의 대체상품 정책 적용
  - 동일 장바구니에 대한 중복 주문 생성 차단 (idempotency key: `cart_id`)
- 요청 검증:
  - `cart_id` 필수, 유효한 `active` 상태 장바구니
  - 장바구니 아이템 1개 이상
  - `shipping_address` 필수
  - `recipient_name`, `recipient_phone` 필수
  - `coupon_code` 선택 (프로모션 적용 시)
  - `points_to_use` 선택 (포인트 사용 시, 최소 1,000원)
- 에러 응답:

  | HTTP Status | 에러 코드                | 상황                                               |
  | ----------- | ------------------------ | -------------------------------------------------- |
  | 400         | `invalid_cart`           | 장바구니가 유효하지 않음 (만료/전환 완료/비어있음) |
  | 404         | `cart_not_found`         | 장바구니 미존재                                    |
  | 409         | `duplicate_order`        | 동일 장바구니에 이미 활성 주문 존재                |
  | 422         | `all_items_out_of_stock` | 모든 아이템 재고 부족                              |
  | 422         | `insufficient_points`    | 포인트 잔액 부족                                   |
  | 422         | `min_order_not_met`      | 최소주문금액(15,000원) 미달                        |

### GET /orders

- 목적: 주문 목록 조회
- Store: 본인 주문만 조회 (`user_id` 자동 필터)
- Admin: 전체 주문 조회 (`GET /admin/orders`)
- 페이지네이션: cursor 기반 (`cursor`, `limit` 파라미터, 기본 `limit=20`, 최대 `limit=100`)
- 필터:
  - `status`: 주문 상태 필터 (복수 선택 가능)
  - `from_date`, `to_date`: 주문 생성 날짜 범위
- 정렬: `created_at` 내림차순 (기본값)
- 에러 응답:

  | HTTP Status | 에러 코드        | 상황                                 |
  | ----------- | ---------------- | ------------------------------------ |
  | 400         | `invalid_params` | 필터/페이지네이션 파라미터 형식 오류 |

### GET /orders/:id

- 목적: 단건 주문 조회
- 규칙:
  - 주문 상태, 아이템 상태, 대체 처리 결과, 금액 상세를 일관되게 반환
  - Store: 본인 주문만 조회 가능 (소유자 검증)
  - Admin: 모든 주문 조회 가능 (`GET /admin/orders/:id`)
- 에러 응답:

  | HTTP Status | 에러 코드         | 상황                          |
  | ----------- | ----------------- | ----------------------------- |
  | 403         | `forbidden`       | 타인의 주문 조회 시도 (Store) |
  | 404         | `order_not_found` | 주문 미존재                   |

### PATCH /orders/:id/status

- 목적: 주문 상태 전이
- 규칙:
  - 전이 가능한 다음 상태만 허용
  - 상태 정의와 정규 전이 규칙은 `01-overview.md`를 단일 기준으로 참조
- 요청 검증:
  - `status` 필수 (변경 대상 상태)
  - `reason` 필수 (취소 전이 시)
  - `version` 필수 (낙관적 락용)
- 에러 응답:

  | HTTP Status | 에러 코드            | 상황                            |
  | ----------- | -------------------- | ------------------------------- |
  | 403         | `forbidden`          | 권한 없는 전이 시도             |
  | 404         | `order_not_found`    | 주문 미존재                     |
  | 409         | `conflict`           | 낙관적 락 충돌 (동시 전이 시도) |
  | 422         | `invalid_transition` | 허용되지 않은 상태 전이         |
  | 422         | `terminal_state`     | 종료 상태에서 추가 전이 시도    |

### POST /orders/:id/substitutions/:substitution_id/approve

- 목적: 대체상품 승인
- 규칙:
  - `approval_state`가 `pending_approval`일 때만 허용
  - 승인 시 대체 적용, 주문 금액 재산정
- 에러 응답:

  | HTTP Status | 에러 코드                | 상황                           |
  | ----------- | ------------------------ | ------------------------------ |
  | 404         | `substitution_not_found` | 대체 레코드 미존재             |
  | 409         | `already_resolved`       | 이미 승인/거절/타임아웃 처리됨 |
  | 410         | `approval_timeout`       | 승인 제한 시간(10분) 초과      |

### POST /orders/:id/substitutions/:substitution_id/reject

- 목적: 대체상품 거절
- 규칙:
  - `approval_state`가 `pending_approval`일 때만 허용
  - 거절 시 해당 아이템 부분 취소 처리
- 에러 응답: approve와 동일

## 차단 정책

- 허용되지 않은 전이 요청은 API 레벨에서 즉시 차단 (422 반환)
- 종료 상태(`delivered`, `cancelled`) 이후 추가 전이는 차단 (422 반환)
- 낙관적 락 충돌 시 409 Conflict 반환

## RBAC 범위

| 역할     | 허용 API                                                                                              | 허용 전이                                                 |
| -------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| customer | `POST /orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status` (취소만), 대체 승인/거절 | `created` → `cancelled`                                   |
| operator | `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status`                        | `01-overview.md` 기준 모든 허용 전이 (customer 취소 제외) |

- customer는 자신의 주문에만 접근 가능 (소유자 검증 필수)
- operator 세부 역할 분리는 MVP에서 단일 `operator` 역할로 운영

## Idempotency 정책

- `POST /orders`: `cart_id`를 idempotency key로 사용 (동일 장바구니 중복 주문 차단)
- `PATCH /orders/:id/status`: 낙관적 락(`version`)으로 중복 전이 방지
- 대체 승인/거절: `approval_state` 상태 체크로 중복 처리 방지

## 연계 규칙

- 주문 취소 전이는 `OrderCancelled` 이벤트 발행으로 후속 처리를 트리거하되, 상세 정책은 각 도메인 문서를 참조
- 주문 생성 시 프로모션 적용은 `../08-promotion/01-overview.md` 계산 순서를 따른다
