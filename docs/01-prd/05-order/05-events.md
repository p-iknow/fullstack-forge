# Order Events

## 범위

주문 도메인의 최소 이벤트 타입을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 이벤트 인프라 정책 기준 이벤트 타입

- `OrderCreated`
- `OrderStatusChanged`

## 이벤트별 역할

- `OrderCreated`
  - 주문 생성 완료 시 발행
  - 재고/결제/알림 후속 처리 트리거
  - payload 필드 개요
    - `order_id`: 주문 식별자
    - `user_id`: 주문자 식별자
    - `status`: 생성 직후 상태(`created`)
    - `items`: 주문 아이템 요약(아이템 식별자, 수량, 대체 허용 여부)
    - `created_at`: 주문 생성 시각
- `OrderStatusChanged`
  - 주문 상태 변경 시 발행
  - 상태 기반 배송/환불/운영 모니터링 트리거
  - payload 필드 개요
    - `order_id`: 주문 식별자
    - `previous_status`: 변경 전 주문 상태
    - `current_status`: 변경 후 주문 상태
    - `changed_by`: 전이 수행 주체(customer 또는 operator)
    - `changed_reason`: 전이 사유(사용자 취소, 운영 처리, 부분 취소 등)
    - `changed_at`: 상태 변경 시각

## 운영 규칙

- 이벤트 상세 스키마는 공통 엔벨로프 규격과 버전 정책을 따른다
- 멱등성 키, 재시도, DLQ/redrive 규칙은 [이벤트 인프라 운영 정책](../13-event/01-overview.md)을 따른다
