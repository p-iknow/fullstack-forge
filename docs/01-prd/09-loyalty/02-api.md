## 포인트 API 가이드

본 문서는 적립 포인트 도메인의 조회/사용/내역/운영 API 동작 원칙을 정의한다.

### 범위

- 포인트 조회: 사용자 현재 잔액/상태 확인
- 포인트 내역: 적립/사용/만료/조정 이력 조회
- 포인트 사용: 주문 결제 시 포인트 차감 요청
- 포인트 적립: 이벤트 기반 내부 처리 (외부 API 노출 없음)
- 운영 조정: 운영자 수동 가감

### 엔드포인트 요약

#### Store (고객용)

| 메서드 | 경로               | 설명                     | 권한        |
| ------ | ------------------ | ------------------------ | ----------- |
| GET    | `/loyalty/balance` | 본인 포인트 잔액 조회    | 인증 사용자 |
| GET    | `/loyalty/history` | 본인 포인트 내역 조회    | 인증 사용자 |
| POST   | `/loyalty/redeem`  | 주문 결제 시 포인트 사용 | 인증 사용자 |

#### Admin (운영용)

| 메서드 | 경로                             | 설명                    | 권한           |
| ------ | -------------------------------- | ----------------------- | -------------- |
| GET    | `/admin/loyalty/:userId/balance` | 사용자 포인트 잔액 조회 | operator·admin |
| GET    | `/admin/loyalty/:userId/history` | 사용자 포인트 내역 조회 | operator·admin |
| POST   | `/admin/loyalty/:userId/adjust`  | 운영자 포인트 수동 조정 | operator·admin |

### 포인트 적립 — 이벤트 기반 내부 처리

- 포인트 적립은 외부 API로 노출하지 않는다.
- `PaymentCaptured` 이벤트 소비 시 내부 로직으로 `pending` 포인트를 생성한다.
- `DeliveryStatusChanged`(`new_status=delivered`) 이벤트 소비 시 `pending → available` 전환을 수행한다.
- `OrderCancelled` 이벤트 소비 시 `pending` 포인트를 rollback 처리한다.
- 이벤트 소비 상세는 `05-events.md` 소비 이벤트 섹션 참조.

---

### 포인트 조회 API — `GET /loyalty/balance`

- 인증된 사용자 기준으로 본인 `LoyaltyAccount`를 조회한다.
- 응답은 `available`, `pending`, `expired` 상태를 구분해 제공한다.
- 만료 예정 포인트는 유효기간(`expires_at`) 기준으로 함께 확인 가능해야 한다.
- 조회 결과는 ledger 합계와 정합성이 맞아야 한다.

#### 응답 바디

```json
{
  "available_balance": 5200,
  "pending_balance": 300,
  "total_expired": 1000,
  "expiring_soon": {
    "amount": 200,
    "expires_at": "2026-04-15T00:00:00+09:00"
  }
}
```

#### 오류 응답

| HTTP 상태 | 에러 코드      | 설명                |
| --------- | -------------- | ------------------- |
| 401       | `unauthorized` | 인증 토큰 없음/만료 |

---

### 포인트 내역 조회 API — `GET /loyalty/history`

- 인증된 사용자의 포인트 적립/사용/만료/조정 이력을 조회한다.
- 최신순 정렬을 기본으로 한다.

#### 쿼리 파라미터

| 파라미터 | 타입     | 필수 | 설명                                                              |
| -------- | -------- | ---- | ----------------------------------------------------------------- |
| `type`   | `string` | N    | 필터: `earn`, `redeem`, `expire`, `adjust` (복수 가능, 쉼표 구분) |
| `from`   | `string` | N    | 조회 시작일 (ISO 8601)                                            |
| `to`     | `string` | N    | 조회 종료일 (ISO 8601)                                            |
| `cursor` | `string` | N    | 커서 기반 페이지네이션                                            |
| `limit`  | `number` | N    | 페이지당 항목 수 (기본 20, 최대 100)                              |

#### 응답 바디

```json
{
  "items": [
    {
      "id": "led_001",
      "transaction_type": "earn",
      "source_type": "order_payment",
      "amount": 300,
      "balance_after": 5200,
      "order_id": "ord_abc123",
      "description": "주문 적립",
      "created_at": "2026-03-10T15:30:00+09:00",
      "expires_at": "2027-03-10T00:00:00+09:00"
    }
  ],
  "next_cursor": "eyJ...",
  "has_more": true
}
```

#### 오류 응답

| HTTP 상태 | 에러 코드            | 설명                |
| --------- | -------------------- | ------------------- |
| 400       | `invalid_date_range` | 날짜 범위 부적절    |
| 401       | `unauthorized`       | 인증 토큰 없음/만료 |

---

### 포인트 사용 API — `POST /loyalty/redeem`

- 주문 결제 흐름에서만 호출한다.
- `min_redeem_points`(1,000원) 미만 사용 요청은 거절한다.
- 보유 `available` 포인트 초과 사용은 거절한다.
- 포인트 사용 금액은 주문 총액을 초과할 수 없다.
- 동일 주문에 대한 포인트 사용 이력은 1건만 허용한다.
- 차감은 주문 결제 트랜잭션과 함께 처리해 이중 차감을 방지한다.

#### 요청 바디

```json
{
  "order_id": "ord_abc123",
  "amount": 2000
}
```

#### 응답 바디 (성공)

```json
{
  "redemption_id": "rdm_001",
  "order_id": "ord_abc123",
  "amount": 2000,
  "remaining_balance": 3200,
  "redeemed_at": "2026-03-14T10:00:00+09:00"
}
```

#### 오류 응답

| HTTP 상태 | 에러 코드              | 설명                                   |
| --------- | ---------------------- | -------------------------------------- |
| 400       | `below_min_redeem`     | 최소 사용 포인트(1,000원) 미달         |
| 400       | `exceeds_order_total`  | 포인트 사용 금액이 주문 총액 초과      |
| 409       | `insufficient_points`  | 보유 available 포인트 부족             |
| 409       | `duplicate_redemption` | 동일 주문에 대한 포인트 사용 이력 존재 |
| 401       | `unauthorized`         | 인증 토큰 없음/만료                    |

---

### 운영 조정 API — `POST /admin/loyalty/:userId/adjust`

- 운영자 권한(`operator|admin`)에서만 호출 가능하다.
- 수동 가감 시 사유와 요청 ID는 필수다.
- 조정 내역은 감사 추적이 가능해야 한다.

#### 요청 바디

```json
{
  "delta": 500,
  "reason": "CS 보상 포인트 지급",
  "request_id": "req_cs_20260314_001"
}
```

- `delta`: 양수=가산, 음수=차감
- `reason`: 조정 사유 (필수, 최소 5자)
- `request_id`: 요청 식별자 (필수, 멱등성 키로 사용)

#### 응답 바디 (성공)

```json
{
  "ledger_id": "led_adj_001",
  "user_id": "usr_001",
  "delta": 500,
  "balance_after": 5700,
  "adjusted_by": "admin_user_001",
  "adjusted_at": "2026-03-14T11:00:00+09:00"
}
```

#### 오류 응답

| HTTP 상태 | 에러 코드             | 설명                            |
| --------- | --------------------- | ------------------------------- |
| 400       | `missing_reason`      | 사유 미입력                     |
| 400       | `missing_request_id`  | 요청 ID 미입력                  |
| 403       | `forbidden`           | 권한 부족 (operator·admin 아님) |
| 409       | `duplicate_request`   | 동일 request_id로 이미 처리됨   |
| 409       | `insufficient_points` | 차감 시 available 잔액 부족     |

---

### Admin 잔액 조회 — `GET /admin/loyalty/:userId/balance`

- `GET /loyalty/balance`와 동일한 응답 구조를 반환한다.
- 운영자 권한(`operator|admin`)으로 임의 사용자의 잔액을 조회할 수 있다.

### Admin 내역 조회 — `GET /admin/loyalty/:userId/history`

- `GET /loyalty/history`와 동일한 쿼리 파라미터·응답 구조를 반환한다.
- 운영자 권한(`operator|admin`)으로 임의 사용자의 내역을 조회할 수 있다.

---

### Rate Limiting

| 엔드포인트                           | 제한             | 비고                |
| ------------------------------------ | ---------------- | ------------------- |
| `POST /loyalty/redeem`               | 사용자당 10회/분 | 결제 흐름 남용 방지 |
| `POST /admin/loyalty/:userId/adjust` | 운영자당 30회/분 | 대량 오조작 방지    |
| `GET /loyalty/balance`               | 사용자당 60회/분 | 일반 조회           |
| `GET /loyalty/history`               | 사용자당 30회/분 | 일반 조회           |

- 제한 초과 시 `429 Too Many Requests` 반환
- rate limit 카운터는 Redis 기반으로 관리

### 공통 오류/정합성 원칙

- 요청 거절 시 정책 기준(최소 사용, 잔액 초과, 중복 사용)을 에러 코드로 명확히 구분한다.
- 포인트 관련 쓰기 작업은 모두 트랜잭션 경계 안에서 처리한다.
- 주문/결제 상태와 포인트 ledger 간 정합성 점검 배치를 운영한다.
- 멱등성: 운영 조정 API는 `request_id`를 멱등성 키로 사용한다.
