## 포인트 데이터 모델 가이드

본 문서는 적립 포인트 도메인의 핵심 엔터티와 관계, 트랜잭션 제약을 정의한다.

### 핵심 엔터티

#### LoyaltyAccount

- 사용자별 포인트 잔액 스냅샷을 관리한다.
- `available`, `pending`, `expired` 상태별 집계를 가진다.
- 잔액 값은 PointLedger 합계와 주기적으로 대사한다.

#### PointPolicy

- 적립/사용/만료/운영 조정 정책 기준을 관리한다.
- 최소 사용 포인트 임계치(`min_redeem_points`)를 포함한다.
- 적립 시점(`paid` 즉시, 또는 `pending` 후 전환)과 만료 기준을 관리한다.

#### PointLedger

- 포인트 증감의 단일 감사 원장을 관리한다.
- 포인트 값은 양수만 허용하고, 방향은 `transaction_type`으로 구분한다.
- 각 레코드는 `source_type`과 연관 주문/요청 식별자를 가진다.
- 만료 처리 시 `expire` ledger 기록을 남긴다.

#### PointRedemption

- 주문 단위 포인트 사용 이력을 관리한다.
- 동일 주문의 중복 사용 이력 생성은 금지한다.
- 주문 취소/결제 취소 시 복원 및 rollback 추적 기준이 된다.

### source_type enum

- `order_payment`
- `order_cancel`
- `review_reward`
- `event_reward`
- `admin_adjust`

### 상태 모델

- `pending`: 확정 대기 포인트
- `available`: 즉시 사용 가능 포인트
- `redeemed`: 주문 결제에 사용 완료된 포인트
- `expired`: 만료 소멸 포인트

### 정책 기본값

| 항목                | 값                 | 비고                   |
| ------------------- | ------------------ | ---------------------- |
| 기본 적립률         | 결제금액의 1%      | 원 미만 절사           |
| 최소 적립 주문 금액 | 5,000원            | 미만 주문 적립 제외    |
| 최소 사용 포인트    | 1,000원            | `min_redeem_points`    |
| 포인트 유효기간     | 적립일 기준 12개월 | `expires_at` 자동 설정 |

### 트랜잭션 제약

- 포인트 차감/적립은 주문 결제 흐름과 동일 트랜잭션 경계에서 처리한다.
- 동시 결제 요청에서도 이중 차감이 발생하지 않아야 한다.
- 주문 취소 시 사용 포인트 복원과 적립 rollback은 원자적으로 처리한다.
- 만료 배치 후 LoyaltyAccount 잔액과 PointLedger 합계가 일치해야 한다.

### 감사/운영 제약

- 운영자 수동 조정은 `operator|admin` 권한과 사유/요청 ID를 필수로 기록한다.
- 결제/취소/환불과 PointLedger 정합성 점검 배치를 운영한다.
