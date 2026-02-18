# Cart Events

## 범위

장바구니 도메인의 최소 이벤트 타입을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 이벤트 타입

- `CartExpired`
- `CartConverted`

## 이벤트별 역할

- `CartExpired`
  - 장바구니 만료 시 발행 (TTL 7일 초과)
  - reserved 재고 해제 및 사용자 알림 트리거
  - 소비자: `notification`
  - payload 필드 개요
    - `cart_id`: 장바구니 식별자
    - `user_id`: 장바구니 소유자 식별자
    - `expired_at`: 만료 처리 시각
- `CartConverted`
  - 주문 전환 시 발행
  - 주문 도메인의 후속 처리 트리거
  - 소비자: `order`
  - payload 필드 개요
    - `cart_id`: 장바구니 식별자
    - `order_id`: 전환된 주문 식별자
    - `user_id`: 장바구니 소유자 식별자
    - `converted_at`: 전환 처리 시각

## 운영 규칙

- 이벤트 상세 스키마는 공통 엔벨로프 규격과 버전 정책을 따른다
- 멱등성 키, 재시도, DLQ/redrive 규칙은 [이벤트 인프라 운영 정책](../13-event/01-overview.md)을 따른다
