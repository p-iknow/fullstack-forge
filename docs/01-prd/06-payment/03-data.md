# Payment Data

## Payment 엔터티

| 필드               | 타입           | 필수 | 설명                              |
| ------------------ | -------------- | ---- | --------------------------------- |
| `payment_id`       | UUID (string)  | ✅    | 결제 식별자 (PK)                  |
| `order_id`         | UUID (string)  | ✅    | 연결된 주문 식별자 (FK, UNIQUE)   |
| `user_id`          | UUID (string)  | ✅    | 결제 요청 사용자 식별자 (FK)      |
| `status`           | enum           | ✅    | 결제 상태                         |
| `payment_method`   | enum           | ✅    | 결제 수단                         |
| `amount`           | integer        | ✅    | 결제 요청 금액 (KRW, 원 단위)     |
| `refund_amount`    | integer        | ❌    | 환불 금액 (환불 시에만 설정)      |
| `currency`         | string (3자)   | ✅    | 통화 코드 (고정: `KRW`)          |
| `idempotency_key`  | string (36자)  | ✅    | 중복 결제 방지 키 (UUID v4, UNIQUE) |
| `failure_code`     | enum           | ❌    | 실패 코드 (실패 시에만 설정)      |
| `pg_transaction_id`| string         | ❌    | PG 거래 식별자                    |
| `refund_reason`    | string (500자) | ❌    | 환불 사유                         |
| `created_at`       | timestamp      | ✅    | 결제 생성 시각                    |
| `updated_at`       | timestamp      | ✅    | 결제 갱신 시각                    |
| `captured_at`      | timestamp      | ❌    | 매출 확정 시각                    |
| `refunded_at`      | timestamp      | ❌    | 환불 완료 시각                    |
| `version`          | integer        | ✅    | 낙관적 잠금용 버전 (기본값: 1)    |

## 결제 상태 enum

- `initiated`
- `authorized`
- `captured`
- `failed`
- `cancelled`
- `refund_requested`
- `refunded`
- `partially_refunded`

## failure_code enum

- `failed_timeout`: PG 응답 타임아웃 (30초 초과)
- `failed_gateway`: PG 통신 오류 또는 게이트웨이 거절
- `failed_insufficient_funds`: 결제 수단 잔액 부족
- `failed_refund`: PG 환불 처리 실패

## payment_method enum

- `card`: 신용/체크 카드 (MVP)
- `bank_transfer`: 계좌이체 (확장)
- `kakao_pay`: 카카오페이 (확장)
- `naver_pay`: 네이버페이 (확장)

## 상태 무결성 규칙

- 결제 상태는 정의된 enum 외 값을 허용하지 않는다.
- 종료 상태: `failed`, `cancelled`, `captured`, `refunded`, `partially_refunded`
  - `captured`는 환불 요청이 없으면 종료 상태로 유지
- 상태 전이 규칙 및 상태 머신은 `01-overview.md` 참조.
- 상태 전이 시 `version` 필드를 사용한 낙관적 잠금으로 동시 갱신 충돌을 감지한다.

## idempotency 제약

- 결제 생성 요청 단위에서 idempotency key는 필수다.
- 동일 사용자/동일 주문/동일 idempotency key 조합은 하나의 결제 결과로 수렴한다.
- 이미 완료된 결제와 동일 key 재요청은 신규 결제를 만들지 않는다.
- `idempotency_key`에 UNIQUE 제약을 적용한다.

## 연관 무결성

- MVP 단계에서 `order_id`는 order 도메인 단일 주문과 **1:1** 관계만 허용한다.
- `order_id`에 UNIQUE 제약을 적용하여 1:1 관계를 DB 레벨에서 보장한다.
- 주문 취소 처리 시 결제 취소/환불 연결 규칙을 따라 상태 정합성을 유지한다.

## 데이터 보존 정책

- 결제 레코드: 소프트 삭제 없음, 물리 삭제 금지 (금융 감사 요건)
- 보존 기간: **5년** (전자상거래법 기준)
- idempotency key 캐시: **24시간** 보존 후 만료

## 비범위

- PG별 상세 필드 매핑은 구현 단계에서 정의한다.
