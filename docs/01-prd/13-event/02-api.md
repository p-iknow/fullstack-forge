# Event Domain API Stub

이 도메인은 request/response API 중심이 아니라 메시징 중심으로 운영한다.

## 원칙

- event 도메인은 API가 아닌 메시징 기반으로 처리한다.
- Producer는 `api`이며 Broker는 `SNS`를 사용한다.
- Queues는 `SQS` fanout(`notifications`, `inventory`, `dispatch`)을 사용한다.

## 운영 API 가이드(redrive 한정)

- 목적: DLQ 메시지 재처리 운영 루프를 수행한다.
- 권한: redrive 실행자는 `admin` 권한 필요.
- 절차: redrive 전 원인 분석 필수, 동일 오류 코드 반복 시 자동 redrive 금지.
- 기본값: `VisibilityTimeout` 90초, `maxReceiveCount` 3, source retention 4일, DLQ retention 14일을 기준으로 운영한다.

## Admin 운영 엔드포인트(가이드 수준)

- `GET /admin/events/dlq/messages` — DLQ 메시지 목록/상태 조회
- `POST /admin/events/dlq/redrive` — redrive 실행
- `POST /admin/events/dlq/redrive/{messageId}` — 단건 redrive 실행

## 비목표

- 도메인 이벤트 생성/전파를 동기 API 체인으로 대체하지 않는다.
- request/response body 스키마를 이 문서에 정의하지 않는다.

## 연계 기준

- 이벤트 타입과 payload 필드 목록의 단일 기준은 `05-events.md`를 따른다.
- 운영 API 응답은 최소 `eventId`, `eventType`, `traceId`, `consumer`, `failureCode`를 포함해 추적성을 보장한다.
