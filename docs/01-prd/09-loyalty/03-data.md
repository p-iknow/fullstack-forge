## 포인트 데이터 모델 가이드

본 문서는 적립 포인트 도메인의 핵심 엔터티와 관계, 트랜잭션 제약을 정의한다.

### 핵심 엔터티

#### LoyaltyAccount

사용자별 포인트 잔액 스냅샷을 관리한다. 잔액 값은 `PointLedger` 합계와 주기적으로 대사한다.

| 필드                | 타입        | 필수 | 제약                    | 비고                         |
| ------------------- | ----------- | ---- | ----------------------- | ---------------------------- |
| `id`                | `UUID`      | Y    | PK                      |                              |
| `user_id`           | `UUID`      | Y    | FK → User, UNIQUE       | 사용자당 1계정               |
| `available_balance` | `integer`   | Y    | >= 0, default 0         | 즉시 사용 가능 포인트        |
| `pending_balance`   | `integer`   | Y    | >= 0, default 0         | 확정 대기 포인트             |
| `total_earned`      | `integer`   | Y    | >= 0, default 0         | 누적 적립 합계               |
| `total_redeemed`    | `integer`   | Y    | >= 0, default 0         | 누적 사용 합계               |
| `total_expired`     | `integer`   | Y    | >= 0, default 0         | 누적 만료 합계               |
| `created_at`        | `timestamp` | Y    | default now()           |                              |
| `updated_at`        | `timestamp` | Y    | auto-update on mutation |                              |
| `deleted_at`        | `timestamp` | N    | nullable, default null  | soft delete (사용자 탈퇴 시) |

**인덱스**: `UNIQUE(user_id)`

#### PointPolicy

적립/사용/만료/운영 조정 정책 기준을 관리한다. MVP에서는 단일 글로벌 정책 레코드를 사용한다.

| 필드                | 타입        | 필수 | 제약                           | 비고                     |
| ------------------- | ----------- | ---- | ------------------------------ | ------------------------ |
| `id`                | `UUID`      | Y    | PK                             |                          |
| `earn_rate`         | `decimal`   | Y    | > 0, default 0.01              | 적립률 (1% = 0.01)       |
| `min_order_amount`  | `integer`   | Y    | >= 0, default 5000             | 최소 적립 주문 금액 (원) |
| `min_redeem_points` | `integer`   | Y    | >= 0, default 1000             | 최소 사용 포인트 (원)    |
| `expiry_months`     | `integer`   | Y    | > 0, default 12                | 유효기간 (개월)          |
| `earn_timing`       | `enum`      | Y    | `deferred`, default `deferred` | MVP: deferred only       |
| `is_active`         | `boolean`   | Y    | default true                   | 정책 활성 여부           |
| `created_at`        | `timestamp` | Y    | default now()                  |                          |
| `updated_at`        | `timestamp` | Y    | auto-update on mutation        |                          |

#### PointLedger

포인트 증감의 단일 감사 원장. 모든 포인트 변동은 이 테이블에 기록한다.

| 필드               | 타입        | 필수 | 제약                                          | 비고                       |
| ------------------ | ----------- | ---- | --------------------------------------------- | -------------------------- |
| `id`               | `UUID`      | Y    | PK                                            |                            |
| `account_id`       | `UUID`      | Y    | FK → LoyaltyAccount                           |                            |
| `transaction_type` | `enum`      | Y    | `earn`, `redeem`, `expire`, `adjust`          | 포인트 변동 방향           |
| `source_type`      | `enum`      | Y    | 아래 enum 참조                                | 변동 원인                  |
| `amount`           | `integer`   | Y    | > 0                                           | 항상 양수, 방향은 type으로 |
| `status`           | `enum`      | Y    | `pending`, `available`, `redeemed`, `expired` | 포인트 상태                |
| `order_id`         | `UUID`      | N    | FK → Order (nullable)                         | 연관 주문 (적립/사용 시)   |
| `request_id`       | `string`    | N    | nullable                                      | 운영 조정 시 요청 식별자   |
| `reason`           | `string`    | N    | nullable, max 500자                           | 운영 조정 사유             |
| `adjusted_by`      | `UUID`      | N    | FK → User (nullable)                          | 운영 조정 시 운영자        |
| `expires_at`       | `timestamp` | N    | nullable                                      | 적립 포인트 만료 시각      |
| `created_at`       | `timestamp` | Y    | default now()                                 | 생성 시각 = 변동 시각      |

**인덱스**:

- `IDX(account_id, created_at DESC)` — 사용자별 내역 조회
- `IDX(status, expires_at)` — 만료 배치 조회
- `IDX(order_id)` — 주문별 포인트 조회

#### PointRedemption

주문 단위 포인트 사용 이력. 동일 주문의 중복 사용을 방지하는 제약의 기준이 된다.

| 필드          | 타입        | 필수 | 제약                  | 비고                   |
| ------------- | ----------- | ---- | --------------------- | ---------------------- |
| `id`          | `UUID`      | Y    | PK                    |                        |
| `account_id`  | `UUID`      | Y    | FK → LoyaltyAccount   |                        |
| `order_id`    | `UUID`      | Y    | FK → Order            |                        |
| `ledger_id`   | `UUID`      | Y    | FK → PointLedger      | 원장 항목 참조         |
| `amount`      | `integer`   | Y    | > 0                   | 사용 포인트            |
| `status`      | `enum`      | Y    | `applied`, `restored` | 복원 시 상태 변경      |
| `restored_at` | `timestamp` | N    | nullable              | 주문 취소 시 복원 시각 |
| `created_at`  | `timestamp` | Y    | default now()         |                        |

**인덱스**:

- `UNIQUE(account_id, order_id)` — 동일 주문 중복 사용 방지

### source_type enum

| 값              | 설명                        |
| --------------- | --------------------------- |
| `order_payment` | 주문 결제 확정 적립         |
| `order_cancel`  | 주문 취소/부분취소 rollback |
| `review_reward` | 리뷰 작성 보상 (향후)       |
| `event_reward`  | 이벤트/캠페인 보상 (향후)   |
| `admin_adjust`  | 운영자 수동 가감            |

### transaction_type enum

| 값       | 설명             | ledger amount 의미 |
| -------- | ---------------- | ------------------ |
| `earn`   | 포인트 적립      | 적립 포인트 (양수) |
| `redeem` | 포인트 사용      | 사용 포인트 (양수) |
| `expire` | 포인트 만료 소멸 | 소멸 포인트 (양수) |
| `adjust` | 운영자 수동 조정 | 가감량 (양수)      |

> `amount`는 항상 양수. 적립/차감 방향은 `transaction_type`으로 구분한다.

### 엔터티 관계

```
User 1──1 LoyaltyAccount 1──* PointLedger
                          1──* PointRedemption
Order *──* PointLedger (order_id FK)
Order *──1 PointRedemption (order_id FK, UNIQUE per account)
PointLedger 1──1 PointRedemption (ledger_id FK)
```

### 정책 기본값

| 항목                | 값                 | 비고                   |
| ------------------- | ------------------ | ---------------------- |
| 기본 적립률         | 결제금액의 1%      | 원 미만 절사           |
| 최소 적립 주문 금액 | 5,000원            | 미만 주문 적립 제외    |
| 최소 사용 포인트    | 1,000원            | `min_redeem_points`    |
| 포인트 유효기간     | 적립일 기준 12개월 | `expires_at` 자동 설정 |

### 삭제 정책

- **PointLedger**: hard delete 금지. 감사 원장으로서 영구 보존.
- **PointRedemption**: hard delete 금지. 주문 취소 시 `status = restored`로 변경.
- **LoyaltyAccount**: soft delete 허용 (사용자 탈퇴 시). `deleted_at` 필드 추가.
- **PointPolicy**: hard delete 금지. `is_active = false`로 비활성화.

### 데이터 보관 정책

| 엔터티          | 보관 기간   | 비고                |
| --------------- | ----------- | ------------------- |
| PointLedger     | 영구 보존   | 감사 원장           |
| PointRedemption | 영구 보존   | 결제 증빙           |
| LoyaltyAccount  | 탈퇴 후 5년 | 개인정보보호법 기준 |
| PointPolicy     | 영구 보존   | 정책 변경 이력      |

### 트랜잭션 제약

- 포인트 차감/적립은 주문 결제 흐름과 동일 트랜잭션 경계에서 처리한다.
- 동시 결제 요청에서도 이중 차감이 발생하지 않아야 한다.
- 주문 취소 시 사용 포인트 복원과 적립 rollback은 원자적으로 처리한다.
- 만료 배치 후 `LoyaltyAccount` 잔액과 `PointLedger` 합계가 일치해야 한다.

### 감사/운영 제약

- 운영자 수동 조정은 `operator|admin` 권한과 사유/요청 ID를 필수로 기록한다.
- 결제/취소/환불과 `PointLedger` 정합성 점검 배치를 운영한다.

### 스키마 마이그레이션 고려사항

- `PointPolicy` 필드 추가 시 기존 레코드에 대한 기본값 전략 필수 (NOT NULL 컬럼은 default 지정 후 마이그레이션)
- `PointLedger`는 append-only 특성으로 기존 레코드 변경 없이 신규 컬럼 추가 가능 (nullable 선호)
- `source_type`, `transaction_type` enum 확장 시 하위 호환성 유지: 기존 값 제거 금지, 신규 값 추가만 허용
- 인덱스 변경은 무중단 적용(concurrent index creation) 필수
