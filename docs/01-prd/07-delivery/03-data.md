# Delivery Data

## Delivery 엔터티

| 필드                             | 타입        | 필수 | 설명                                       |
| -------------------------------- | ----------- | ---- | ------------------------------------------ |
| `delivery_id`                    | UUID        | ✅   | 배송 식별자 (PK)                           |
| `order_id`                       | UUID        | ✅   | 연계 주문 식별자 (FK → Order)              |
| `mode`                           | enum        | ✅   | 배송 모드 (`instant`, `scheduled`)         |
| `status`                         | enum        | ✅   | 배송 상태 (DeliveryStatus)                 |
| `dispatch_state`                 | enum        | ✅   | 배차 상태 (DispatchState)                  |
| `sla_target_at`                  | timestamp   | ✅   | SLA 목표 시각                              |
| `sla_window_minutes`             | integer     | ✅   | SLA 허용 범위 (분 단위, 예: `15` = ±15분)  |
| `dispatch_attempt_count`         | integer     | ✅   | 배차 시도 횟수 (기본값: 0)                 |
| `driver_id`                      | UUID        | ❌   | 배정된 기사 식별자 (배차 전 null)          |
| `operator_intervention_required` | boolean     | ✅   | 운영자 개입 필요 여부 (기본값: false)      |
| `cancelled_reason`               | string(500) | ❌   | 취소 사유 (취소 시에만)                    |
| `version`                        | integer     | ✅   | 낙관적 잠금 버전 (기본값: 1)               |
| `created_at`                     | timestamp   | ✅   | 생성 시각                                  |
| `updated_at`                     | timestamp   | ✅   | 최종 수정 시각                             |

## DeliveryStatus enum

| 값           | 설명                 | 종료 상태               |
| ------------ | -------------------- | ----------------------- |
| `pending`    | 배송 생성, 배차 대기 | ❌                      |
| `dispatched` | 배차 완료            | ❌                      |
| `in_transit` | 배송 중 (픽업 완료)  | ❌                      |
| `delivered`  | 배송 완료            | ✅                      |
| `failed`     | 배송 실패            | ❌ (재배차/취소 가능)   |
| `cancelled`  | 배송 취소            | ✅                      |

## DispatchState enum

| 값                | 설명                                |
| ----------------- | ----------------------------------- |
| `unassigned`      | 미배차 (초기)                       |
| `assigned`        | 기사 배정 완료                      |
| `rejected`        | 기사 거절 (재배차 대기)             |
| `manual_required` | 2회 연속 실패, 운영자 개입 필요     |
| `completed`       | 배차 프로세스 완료 (기사 수락/픽업) |

## 상태 무결성 규칙

- `dispatch_attempt_count`는 배차 시도마다 1 증가
- 기사 거절 1회(`rejected`): `unassigned`로 전이, 자동 재배차
- 2회 연속 거절: `manual_required`로 전이, `operator_intervention_required = true`
- 운영자 수동 배차 완료 후 `completed`로 전이, `operator_intervention_required = false`
- 종료 상태(`delivered`, `cancelled`) 이후 `dispatch_state`, `status` 갱신은 차단
- `failed` 상태는 비종료 — 운영자 개입으로 `pending` 복귀 또는 `cancelled` 전이 가능
- 상태 갱신 시 `version` 값 비교로 낙관적 잠금 적용 (불일치 시 `409 Conflict`)

## 삭제 정책

- Delivery 레코드는 **soft delete 하지 않음** — 종료 상태(`delivered`, `cancelled`)로 관리
- 감사 추적은 `DeliveryStatusChanged` 이벤트 로그로 보존
