# Payment Data

## Payment 엔터티

- `payment_id`: 결제 식별자
- `order_id`: 연결된 주문 식별자
- `user_id`: 결제 요청 사용자 식별자
- `status`: 결제 상태
- `idempotency_key`: 중복 결제 방지 키
- `failure_code`: 실패 코드
- `created_at`: 결제 생성 시각
- `updated_at`: 결제 갱신 시각

## 결제 상태 enum

- `initiated`
- `authorized`
- `captured`
- `failed`
- `cancelled`

## failure_code enum

- `failed_timeout`: PG 응답 타임아웃 (30초 초과)
- `failed_gateway`: PG 통신 오류 또는 게이트웨이 거절
- `failed_insufficient_funds`: 결제 수단 잔액 부족

## 상태 무결성 규칙

- 결제 상태는 정의된 enum 외 값을 허용하지 않는다.
- 종료 상태는 `failed`, `cancelled`, `captured`로 관리한다.
- 상태 전이 규칙 및 상태 머신은 `01-overview.md` 참조.

## idempotency 제약

- 결제 생성 요청 단위에서 idempotency key는 필수다.
- 동일 사용자/동일 주문/동일 idempotency key 조합은 하나의 결제 결과로 수렴한다.
- 이미 완료된 결제와 동일 key 재요청은 신규 결제를 만들지 않는다.

## 연관 무결성

- MVP 단계에서 `order_id`는 order 도메인 단일 주문과 **1:1** 관계만 허용한다.
- 주문 취소 처리 시 결제 취소/환불 연결 규칙을 따라 상태 정합성을 유지한다.

## 비범위

- 컬럼 타입/인덱스 정의는 본 문서 범위에서 제외한다.
