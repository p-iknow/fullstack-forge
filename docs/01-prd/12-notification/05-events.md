# Notification Domain Event Consumption

## 문서 상태

- 본 문서는 **기존 PRD(01~05)에 미포함된 알림 도메인을 신규 정의**하기 위해 작성되었다.
- 알림 도메인은 producer가 아니라 consumer 관점에서 이벤트 처리 정책을 정의한다.

## 소비 위치

- 소스: SNS fanout으로 전달된 `notifications` 큐
- 역할: order/delivery/review 이벤트를 사용자 알림으로 변환
- 기준 아키텍처: `../../02-architecture/backend/04-eventing.adr.md`

## 주요 소비 이벤트 매핑

- `OrderCreated`
  - 알림 목적: 주문 접수 확인
  - 사용자 메시지: 주문이 정상 접수되었음을 안내
- `OrderStatusChanged`
  - 알림 목적: 주문 상태 전이 안내(결제완료, 취소, 완료 등)
  - 사용자 메시지: 현재 주문 진행 단계 업데이트
- `DeliveryStatusChanged`
  - 알림 목적: 배송 상태 변화 안내(준비중, 배송중, 완료)
  - 사용자 메시지: 배송 진행 상황 업데이트
- `ReviewEligible`
  - 알림 목적: 리뷰 작성 가능 시점 안내
  - 사용자 메시지: 리뷰 작성 유도
- `ReviewCreated`
  - 알림 목적: 리뷰 등록 완료 피드백
  - 사용자 메시지: 작성 완료 확인 및 후속 혜택 안내(있는 경우)

## 처리 규칙

- envelope 규격 준수: `../13-event/01-overview.md`
- 멱등 처리: 동일 `eventId` 재수신 시 중복 알림 생성 금지
- 순서 허용 오차: 완전 순서 보장보다 사용자에게 최신 상태를 정확히 보여주는 것을 우선
- 실패 처리: 재시도 후 한계 초과 시 DLQ 이동, 운영 절차에 따라 redrive

## 운영 연계

- 신뢰성 정책 원문: `../13-event/01-overview.md`
- 관측 지표(소비 지연, DLQ 적체)는 notification 도메인 UI가 아닌 observability에서 확인

## 비범위

- 이벤트 producer 계약 상세 정의
- 채널별(push/email/SMS) 발송 이벤트 파생 규칙 상세
