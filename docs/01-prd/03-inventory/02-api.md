# Inventory API Guide

## 범위

재고 조회/조정 API의 경로, 요청/응답 스키마, 에러 응답을 정의한다.

## 인증/인가

- 모든 Admin API는 관리자 권한(`role: admin`) 필수
- 내부 이벤트 트리거 엔드포인트(reserve, release, confirm-deduction)는 내부 서비스 인증(service token) 기반
- Store API는 인증된 고객 세션 필수

## 기본 경로

- Admin Base: `/api/admin/inventory`
- Store Base: `/api/store/inventory`
- 식별자: `product_id` (UUID)

---

## Admin 조회 API

### `GET /api/admin/inventory`

- 목적: 재고 목록 조회
- 쿼리 파라미터:

  | 파라미터 | 타입 | 기본값 | 설명 |
  | --- | --- | --- | --- |
  | `page` | integer | `1` | 페이지 번호 (1-based) |
  | `size` | integer | `20` | 페이지 크기 (최대 100) |
  | `sort` | string | `available:asc` | 정렬 기준 (`available:asc`, `available:desc`, `on_hand:desc`, `product_name:asc`) |
  | `status` | string | - | 필터: `low_stock`, `out_of_stock` |
  | `q` | string | - | 상품명/SKU 검색 |

- 성공 응답 (200):

  ```json
  {
    "items": [
      {
        "product_id": "uuid",
        "product_name": "string",
        "sku": "string",
        "on_hand": 100,
        "reserved": 10,
        "available": 90,
        "status": "normal",
        "version": 5,
        "updated_at": "ISO 8601"
      }
    ],
    "page": 1,
    "size": 20,
    "total_count": 45
  }
  ```

### `GET /api/admin/inventory/{product_id}`

- 목적: 단일 상품 재고 상세 조회 (최근 조정 이력 포함)
- 성공 응답 (200):

  ```json
  {
    "product_id": "uuid",
    "product_name": "string",
    "sku": "string",
    "on_hand": 100,
    "reserved": 10,
    "available": 90,
    "status": "normal",
    "version": 5,
    "created_at": "ISO 8601",
    "updated_at": "ISO 8601",
    "recent_adjustments": [
      {
        "id": "uuid",
        "delta": 50,
        "reason": "입고",
        "adjusted_by": "admin-uuid",
        "created_at": "ISO 8601"
      }
    ]
  }
  ```

---

## Admin 조정 API

### `POST /api/admin/inventory/{product_id}/adjust`

- 목적: 운영자 수동 재고 조정(입고/보정/차감)
- 호출 트리거: 관리자 UI에서 수동 실행
- 멱등성: 클라이언트가 `idempotency_key`를 전달하여 중복 조정 방지
- 요청:

  ```json
  {
    "delta": 50,
    "reason": "정기 입고",
    "idempotency_key": "uuid",
    "version": 5
  }
  ```

  | 필드 | 타입 | 필수 | 제약 |
  | --- | --- | --- | --- |
  | `delta` | integer | Y | 양수=입고, 음수=차감. 0 불가 |
  | `reason` | string | Y | 1~200자 |
  | `idempotency_key` | string (UUID) | Y | 중복 요청 방지 |
  | `version` | integer | Y | 현재 재고 version (낙관적 락) |

- 성공 응답 (200): 조정 후 재고 상태 반환 (상세 조회와 동일 형태)

### `POST /api/admin/inventory/{product_id}/reserve`

- 목적: 주문 생성 단계의 예약 재고 반영
- 호출 트리거: `OrderCreated` 이벤트 수신 시 (내부 서비스 호출)
- 요청:

  ```json
  {
    "quantity": 2,
    "order_id": "uuid"
  }
  ```

  | 필드 | 타입 | 필수 | 제약 |
  | --- | --- | --- | --- |
  | `quantity` | integer | Y | 1 이상. `available` 초과 시 거부 |
  | `order_id` | string (UUID) | Y | 예약 연결 주문 식별자 |

- 성공 응답 (200): 예약 후 재고 상태 반환

### `POST /api/admin/inventory/{product_id}/release`

- 목적: 주문 취소/결제 실패에 따른 예약 복원
- 호출 트리거: `OrderStatusChanged` 이벤트 수신 시 (current_status=`cancelled`)
- 요청:

  ```json
  {
    "quantity": 2,
    "order_id": "uuid"
  }
  ```

  | 필드 | 타입 | 필수 | 제약 |
  | --- | --- | --- | --- |
  | `quantity` | integer | Y | 1 이상. 기존 예약 수량 초과 시 거부 |
  | `order_id` | string (UUID) | Y | 해제 대상 주문 식별자 |

- 성공 응답 (200): 해제 후 재고 상태 반환

### `POST /api/admin/inventory/{product_id}/confirm-deduction`

- 목적: 배송 확정 시 `on_hand` 확정 차감
- 호출 트리거: `DeliveryStatusChanged` 이벤트 수신 시 (new_status=`delivered`)
- 요청:

  ```json
  {
    "quantity": 2,
    "order_id": "uuid"
  }
  ```

  | 필드 | 타입 | 필수 | 제약 |
  | --- | --- | --- | --- |
  | `quantity` | integer | Y | 1 이상 |
  | `order_id` | string (UUID) | Y | 차감 대상 주문 식별자 |

- 성공 응답 (200): 차감 후 재고 상태 반환

---

## Store 조회 API

### `GET /api/store/inventory/{product_id}/availability`

- 목적: 고객 화면에서 상품의 재고 가용 상태를 확인
- 인가: 인증된 고객 세션
- 성공 응답 (200):

  ```json
  {
    "product_id": "uuid",
    "stock_display": "in_stock",
    "available": 90
  }
  ```

  - `stock_display`: `in_stock` | `low_stock` | `out_of_stock` (계산 기준은 [01-overview.md § 안전재고 임계치](./01-overview.md#안전재고-임계치) 참조)
  - `available`은 정확한 수량이 아닌 가용 여부 표시 목적. 구현 시 정확한 수량 노출 여부는 비즈니스 판단에 따름.

> **참고**: catalog 도메인의 상품 목록 API에서 `stock_display`를 계산하여 함께 반환하는 것이 기본 패턴이다. 이 단독 엔드포인트는 장바구니/주문 전환 시점의 실시간 재확인용으로 제공한다.

---

## 공통 에러 응답

모든 에러 응답은 아래 형식을 따른다:

```json
{
  "error": {
    "code": "INVENTORY_INSUFFICIENT",
    "message": "가용 재고가 부족합니다.",
    "details": {}
  }
}
```

### 에러 코드 목록

| HTTP Status | 에러 코드 | 발생 조건 | 해당 엔드포인트 |
| --- | --- | --- | --- |
| 400 | `INVALID_REQUEST` | 필수 필드 누락, 형식 오류, delta=0 | 전체 |
| 400 | `INVENTORY_INSUFFICIENT` | `quantity > available` (예약 불가) | reserve |
| 400 | `NEGATIVE_RESULT` | 조정 결과 `on_hand < 0` 또는 `available < 0` | adjust |
| 400 | `EXCEEDS_MAX_ON_HAND` | 조정 결과 `on_hand > 999,999` | adjust |
| 400 | `RELEASE_EXCEEDS_RESERVED` | 해제 수량이 기존 예약 수량 초과 | release |
| 403 | `FORBIDDEN` | 권한 부족 | 전체 |
| 404 | `PRODUCT_NOT_FOUND` | 존재하지 않는 `product_id` | 전체 |
| 409 | `VERSION_CONFLICT` | 낙관적 락 version 불일치 | adjust |
| 409 | `DUPLICATE_REQUEST` | 동일 `idempotency_key` 재요청 | adjust |
| 429 | `RATE_LIMITED` | 요청 빈도 초과 | 전체 (admin) |

---

## 운영 규칙

- 동일 SKU 동시 조정 요청은 버전 기반 충돌 감지 또는 DB 락으로 직렬화 ([01-overview.md § 동시성 규칙](./01-overview.md#동시성-규칙-정책-원문) 참조)
- version 충돌(409) 시 클라이언트는 최신 데이터를 재조회한 후 재시도
- 내부 이벤트 트리거 엔드포인트는 이벤트 소비자(worker)만 호출하며, admin UI에서 직접 호출하지 않는다
