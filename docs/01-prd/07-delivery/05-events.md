# Delivery Events

## 범위

배송 도메인에서 발행하는 이벤트의 최소 계약을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 이벤트 목록

### DeliveryCreated

- 발행 시점: 배송 레코드 생성 시
- payload:
  - `delivery_id`: 배송 식별자
  - `order_id`: 연계 주문 식별자
  - `sla_deadline`: SLA 목표 시각
  - `created_at`: 생성 시각
- 멱등성 키: `delivery_id`

### DeliveryDispatched

- 발행 시점: 배차 완료 시 (자동/수동)
- payload:
  - `delivery_id`: 배송 식별자
  - `driver_id`: 배정 기사 식별자
  - `dispatched_at`: 배차 완료 시각
- 멱등성 키: `delivery_id + dispatched_at`

### DeliveryStatusChanged

- 발행 시점: 배송 상태 변경 시
- payload:
  - `delivery_id`: 배송 식별자
  - `old_status`: 이전 상태
  - `new_status`: 변경 후 상태
  - `changed_at`: 변경 시각
- 멱등성 키: `delivery_id + changed_at`

### DeliveryDispatchFailed

- 발행 시점: 배차 실패 시 (자동 재시도 포함)
- payload:
  - `delivery_id`: 배송 식별자
  - `reason`: 실패 사유
  - `failed_at`: 실패 시각
- 멱등성 키: `delivery_id + failed_at`

## 소비자

| 이벤트                   | 소비 도메인  | 용도                    |
| ------------------------ | ------------ | ----------------------- |
| `DeliveryCreated`        | notification | 배송 생성 알림          |
| `DeliveryDispatched`     | notification | 배차 완료 알림          |
| `DeliveryStatusChanged`  | order        | 주문 상태 연동          |
| `DeliveryStatusChanged`  | notification | 배송 진행 알림          |
| `DeliveryDispatchFailed` | notification | 배차 실패 알림 (운영자) |
