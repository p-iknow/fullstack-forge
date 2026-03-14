# Delivery Events

## 범위

배송 도메인에서 발행하는 이벤트의 최소 계약을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 토픽/큐 라우팅

- 발행 토픽: 공통 SNS Topic (모든 도메인 이벤트 단일 토픽)
- 소비 큐: `SQS dispatch` (배차 처리), `SQS notifications` (알림), `SQS order` (주문 연동)
- 라우팅은 `eventType` 필드 기반 소비자별 필터링

## 이벤트 목록

### DeliveryCreated

- **발행 시점**: 배송 레코드 생성 시 (`PaymentCaptured` 이벤트 수신 후)
- **payload**:
  - `delivery_id` (UUID): 배송 식별자
  - `order_id` (UUID): 연계 주문 식별자
  - `mode` (string): 배송 모드 (`instant` | `scheduled`)
  - `sla_target_at` (ISO timestamp): SLA 목표 시각
  - `created_at` (ISO timestamp): 생성 시각
- **멱등성 키**: `delivery_id`

### DeliveryDispatched

- **발행 시점**: 배차 완료 시 (자동/수동)
- **payload**:
  - `delivery_id` (UUID): 배송 식별자
  - `driver_id` (UUID): 배정 기사 식별자
  - `dispatched_at` (ISO timestamp): 배차 완료 시각
- **멱등성 키**: `delivery_id + dispatched_at`

### DeliveryStatusChanged

- **발행 시점**: 배송 상태 변경 시 (모든 상태 전이)
- **payload**:
  - `delivery_id` (UUID): 배송 식별자
  - `order_id` (UUID): 연계 주문 식별자
  - `old_status` (string): 이전 상태
  - `new_status` (string): 변경 후 상태
  - `changed_at` (ISO timestamp): 변경 시각
- **멱등성 키**: `delivery_id + changed_at`

### DeliveryDispatchFailed

- **발행 시점**: 배차 실패 시 (자동 재시도 포함)
- **payload**:
  - `delivery_id` (UUID): 배송 식별자
  - `attempt_count` (integer): 현재까지 배차 시도 횟수
  - `reason` (string): 실패 사유 코드
  - `failed_at` (ISO timestamp): 실패 시각
- **실패 사유 코드**: `no_driver_available`, `driver_rejected`, `dispatch_timeout`, `system_error`
- **멱등성 키**: `delivery_id + failed_at`

### DeliveryCancelled

- **발행 시점**: 배송 취소 시 (주문 취소 연쇄 또는 운영자 직접 취소)
- **payload**:
  - `delivery_id` (UUID): 배송 식별자
  - `order_id` (UUID): 연계 주문 식별자
  - `reason` (string): 취소 사유
  - `cancelled_by` (string): 취소 주체 (`system` | `operator`)
  - `cancelled_at` (ISO timestamp): 취소 시각
- **멱등성 키**: `delivery_id + cancelled_at`

## 소비자

| 이벤트                   | 소비 큐         | 소비 도메인  | 용도                            |
| ------------------------ | --------------- | ------------ | ------------------------------- |
| `DeliveryCreated`        | `notifications` | notification | 배송 생성 알림 (고객)           |
| `DeliveryDispatched`     | `notifications` | notification | 배차 완료 알림 (고객)           |
| `DeliveryStatusChanged`  | `order`         | order        | 주문 상태 연동 (delivered→완료) |
| `DeliveryStatusChanged`  | `notifications` | notification | 배송 진행 알림 (고객)           |
| `DeliveryDispatchFailed` | `notifications` | notification | 배차 실패 알림 (운영자)         |
| `DeliveryCancelled`      | `order`         | order        | 주문 배송 취소 상태 반영        |
| `DeliveryCancelled`      | `notifications` | notification | 배송 취소 알림 (고객)           |

## 재시도/DLQ 정책

- 공통 재시도 정책은 `../13-event/01-overview.md §4`를 따른다
- `VisibilityTimeout`: 90초, `maxReceiveCount`: 3
- DLQ 이동 후 운영자가 원인 분석 후 redrive 실행

## 소비 이벤트 (Consumed Events)

delivery 도메인이 다른 도메인에서 수신하여 처리하는 이벤트 목록.

| 소스 도메인 | 이벤트 | 처리 내용 | 소스 문서 |
| --- | --- | --- | --- |
| `payment` | `PaymentCaptured` | Delivery 레코드 생성 + SLA 목표 시각 산정 | [payment/05-events.md](../06-payment/05-events.md) |
| `order` | `OrderCancelled` | 배송 취소 처리 (`pending`/`dispatched` 상태일 때) | [order/05-events.md](../05-order/05-events.md) |

## 이벤트 순서 보장

- 동일 `delivery_id`에 대한 이벤트 순서는 **보장하지 않음**
- 소비자는 `changed_at` 타임스탬프 비교로 순서 역전을 감지하고, 오래된 이벤트는 무시
