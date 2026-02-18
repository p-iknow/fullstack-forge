# Delivery Data

## Delivery 엔터티

- `delivery_id`: 배송 식별자
- `order_id`: 연계 주문 식별자
- `mode`: 배송 모드
- `status`: 배송 상태
- `sla_target_at`: SLA 목표 시각
- `sla_window`: SLA 허용 범위 (분 단위 정수, 예: `15` = ±15분)
- `dispatch_attempt_count`: 배차 시도 횟수
- `dispatch_state`: 배차 상태
- `operator_intervention_required`: 운영자 개입 필요 여부

## DeliveryStatus enum

- `pending_dispatch`
- `dispatched`
- `out_for_delivery`
- `delivered`
- `failed`
- `cancelled`

## DispatchState enum

- `ready`
- `auto_retry`
- `manual_required`
- `completed`

## 상태 무결성 규칙

- 배차 실패 1회는 `auto_retry`로 전이 가능
- 2회 연속 실패는 `manual_required`로 전이
- 운영자 개입 완료 후 `completed` 또는 재시도 상태로 전이
- 종료 상태(`delivered`, `cancelled`) 이후 배차 상태 갱신은 차단

## 비범위

- 컬럼 타입/인덱스 정의는 본 문서 범위에서 제외
