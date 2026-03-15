# Event Infrastructure — Foundation Session

## Context

- **현재 상태**: 이벤트/메시징 코드 없음 (clean slate). Redis 클라이언트(`apps/api/src/cache/client.ts`)와 S3 클라이언트(`apps/api/src/lib/s3-client.ts`) 패턴이 존재.
- **패턴 레퍼런스**:
  - S3 Client: `apps/api/src/lib/s3-client.ts` (AWS SDK endpoint override 패턴)
  - Zod Schema: `packages/api-spec/src/catalog-schemas.ts` (도메인별 reusable schema)
  - DB Schema: `apps/api/src/db/schema/product.ts` (Drizzle pgTable 패턴)
  - Schema Barrel: `apps/api/src/db/schema/index.ts` (barrel export)
  - Relations: `apps/api/src/db/schema/relations.ts` (테이블 관계 정의)
- **PRD 근거**: `docs/01-prd/13-event/01-overview.md §1-§2`, `05-events.md`
- **ADR 근거**: `docs/02-architecture/backend/02-eventing.adr.md` (SNS→SQS fanout 결정)
- **로컬 에뮬레이터**: fauxqs (LocalStack 대신 채택 — 인증 불필요, TS 네이티브, SNS+SQS+DLQ 지원)

## Scope

**이 세션에서 하는 것**:

- Event envelope Zod 스키마 정의
- Event type registry (타입 + 상수)
- SNS/SQS 클라이언트 모듈 (fauxqs/AWS 엔드포인트 전환)
- EventPublisher 유틸리티 (SNS publish)
- SQS ConsumerBase 프레임워크 (long polling, ack/nack)
- event_outbox, event_consumer_log DB 테이블
- fauxqs Docker Compose + init config
- 의존성 설치 (@aws-sdk/client-sns, @aws-sdk/client-sqs, fauxqs)

**이 세션에서 하지 않는 것**:

- Idempotency guard (Session 02)
- DLQ admin API (Session 02)
- Consumer 재시도 파이프라인 (Session 02)
- 통합 테스트 (Session 02)

**생성할 파일**:

- `packages/api-spec/src/event-schemas.ts`
- `apps/api/src/db/schema/event.ts`
- `apps/api/src/lib/sns-client.ts`
- `apps/api/src/lib/sqs-client.ts`
- `apps/api/src/lib/event-publisher.ts`
- `apps/api/src/lib/event-consumer.ts`
- `infra/fauxqs/docker-compose.yml`
- `infra/fauxqs/init.json`

**수정할 파일**:

- `apps/api/package.json` (의존성 추가)
- `apps/api/src/db/schema/index.ts` (barrel export 추가)
- `apps/api/src/db/schema/relations.ts` (event 관계 추가)

## Progressive Tasks

### 1. 의존성 설치

```bash
pnpm --filter @fullstack-forge/api add @aws-sdk/client-sns @aws-sdk/client-sqs
pnpm --filter @fullstack-forge/api add -D fauxqs
```

### 2. Event Envelope Zod 스키마

파일: `packages/api-spec/src/event-schemas.ts`

```typescript
import { z } from 'zod'

export const eventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(), // 'OrderCreated', 'PaymentCaptured', ...
  schemaVersion: z.string(), // 'v1'
  occurredAt: z.string().datetime(),
  traceId: z.string().uuid(),
  source: z.string(), // 'api'
  payload: z.record(z.unknown()),
})

export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>
```

Event type 상수 정의:

```typescript
export const EVENT_TYPES = {
  // 주문
  ORDER_CREATED: 'OrderCreated',
  ORDER_CANCELLED: 'OrderCancelled',
  ORDER_STATUS_CHANGED: 'OrderStatusChanged',
  // 결제
  PAYMENT_AUTHORIZED: 'PaymentAuthorized',
  PAYMENT_CAPTURED: 'PaymentCaptured',
  PAYMENT_FAILED: 'PaymentFailed',
  PAYMENT_CANCELLED: 'PaymentCancelled',
  PAYMENT_REFUNDED: 'PaymentRefunded',
  // 재고
  INVENTORY_RESERVED: 'InventoryReserved',
  INVENTORY_RELEASED: 'InventoryReleased',
  // 배송
  DELIVERY_CREATED: 'DeliveryCreated',
  DELIVERY_STATUS_CHANGED: 'DeliveryStatusChanged',
  // 리뷰
  REVIEW_CREATED: 'ReviewCreated',
  REVIEW_COMMENT_CREATED: 'ReviewCommentCreated',
  REVIEW_HIDDEN_BY_OPERATOR: 'ReviewHiddenByOperator',
  // 문의
  INQUIRY_CREATED: 'InquiryCreated',
  INQUIRY_REPLIED: 'InquiryReplied',
  INQUIRY_STATUS_CHANGED: 'InquiryStatusChanged',
  // 알림
  NOTIFICATION_REQUESTED: 'NotificationRequested',
  NOTIFICATION_SENT: 'NotificationSent',
  NOTIFICATION_FAILED: 'NotificationFailed',
} as const

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]
```

PRD 근거: `docs/01-prd/13-event/05-events.md §2` — 28개 이벤트 타입 전체.
PRD 근거: `docs/01-prd/13-event/01-overview.md §2` — envelope 필수 필드 7개.

### 3. SNS 클라이언트

파일: `apps/api/src/lib/sns-client.ts`
패턴 참조: `apps/api/src/lib/s3-client.ts` (endpoint override)

```typescript
import { SNSClient } from '@aws-sdk/client-sns'

const ENDPOINT = process.env.AWS_ENDPOINT_URL ?? 'http://127.0.0.1:4566'
const REGION = process.env.AWS_REGION ?? 'us-east-1'

export const sns = new SNSClient({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  },
})

export const EVENT_TOPIC_ARN =
  process.env.EVENT_TOPIC_ARN ?? `arn:aws:sns:${REGION}:000000000000:fullstack-forge-events`
```

### 4. SQS 클라이언트

파일: `apps/api/src/lib/sqs-client.ts`

```typescript
import { SQSClient } from '@aws-sdk/client-sqs'

const ENDPOINT = process.env.AWS_ENDPOINT_URL ?? 'http://127.0.0.1:4566'
const REGION = process.env.AWS_REGION ?? 'us-east-1'

export const sqs = new SQSClient({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  },
})

export const QUEUE_URLS = {
  notifications:
    process.env.SQS_NOTIFICATIONS_URL ??
    `http://sqs.${REGION}.localhost:4566/000000000000/notifications`,
  inventory:
    process.env.SQS_INVENTORY_URL ?? `http://sqs.${REGION}.localhost:4566/000000000000/inventory`,
  dispatch:
    process.env.SQS_DISPATCH_URL ?? `http://sqs.${REGION}.localhost:4566/000000000000/dispatch`,
  order: process.env.SQS_ORDER_URL ?? `http://sqs.${REGION}.localhost:4566/000000000000/order`,
} as const

export type QueueName = keyof typeof QUEUE_URLS
```

### 5. EventPublisher

파일: `apps/api/src/lib/event-publisher.ts`

```typescript
import { PublishCommand } from '@aws-sdk/client-sns'
import { sns, EVENT_TOPIC_ARN } from './sns-client'
import type { EventType } from '@fullstack-forge/api-spec/event-schemas'

// 1. EventEnvelope 빌드 (eventId, traceId 자동 생성)
// 2. SNS PublishCommand 실행
//    - Message: JSON.stringify(envelope)
//    - MessageAttributes: { eventType: { DataType: 'String', StringValue } }
// 3. 에러 시 로깅 후 throw (caller가 처리)
```

시그니처:

```typescript
export async function publishEvent(params: {
  eventType: EventType
  payload: Record<string, unknown>
  traceId?: string
  source?: string
}): Promise<{ eventId: string; messageId: string }>
```

### 6. SQS ConsumerBase

파일: `apps/api/src/lib/event-consumer.ts`

```typescript
import { ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs'
import { sqs } from './sqs-client'
import type { EventEnvelope } from '@fullstack-forge/api-spec/event-schemas'

// 추상 클래스 / 팩토리:
// 1. poll() — ReceiveMessageCommand with WaitTimeSeconds: 20, MaxNumberOfMessages: 10
// 2. handleMessage(envelope) — 서브클래스가 구현할 추상 메서드
// 3. ack(receiptHandle) — DeleteMessageCommand
// 4. start() — while loop로 poll → parse → handleMessage → ack
// 5. stop() — graceful shutdown flag
```

시그니처:

```typescript
export type MessageHandler = (envelope: EventEnvelope) => Promise<void>

export function createConsumer(params: {
  queueUrl: string
  consumerName: string
  handler: MessageHandler
}): { start: () => Promise<void>; stop: () => void }
```

핵심 파라미터 — PRD 근거: `docs/01-prd/13-event/01-overview.md §4`:

- `WaitTimeSeconds`: 20 (long polling)
- `MaxNumberOfMessages`: 10 (배치)
- `VisibilityTimeout`: 90초 (처리시간 30초 × 3배)

### 7. Event DB 테이블

파일: `apps/api/src/db/schema/event.ts`
패턴 참조: `apps/api/src/db/schema/product.ts`

```typescript
import { pgTable, uuid, text, timestamp, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core'

export const eventStatusEnum = pgEnum('event_status', ['pending', 'published', 'failed'])
export const consumerStatusEnum = pgEnum('consumer_status', ['processing', 'success', 'failed', 'dlq'])

export const eventOutbox = pgTable('event_outbox', { ... })
export const eventConsumerLog = pgTable('event_consumer_log', { ... })
```

### 8. 스키마 등록

파일 수정: `apps/api/src/db/schema/index.ts` — `export * from './event'` 추가
파일 수정: `apps/api/src/db/schema/relations.ts` — eventOutbox, eventConsumerLog 관계 정의

### 9. fauxqs Docker Compose + Init Config

파일: `infra/fauxqs/docker-compose.yml`

```yaml
services:
  fauxqs:
    image: kibertoad/fauxqs:2.3.1
    ports:
      - '127.0.0.1:4566:4566'
    environment:
      - FAUXQS_INIT=/app/init.json
      - FAUXQS_LOGGER=true
    volumes:
      - ./init.json:/app/init.json:ro
```

파일: `infra/fauxqs/init.json`

```json
{
  "queues": [
    { "name": "notifications-dlq", "attributes": { "MessageRetentionPeriod": "1209600" } },
    { "name": "inventory-dlq", "attributes": { "MessageRetentionPeriod": "1209600" } },
    { "name": "dispatch-dlq", "attributes": { "MessageRetentionPeriod": "1209600" } },
    { "name": "order-dlq", "attributes": { "MessageRetentionPeriod": "1209600" } },
    {
      "name": "notifications",
      "attributes": {
        "VisibilityTimeout": "90",
        "MessageRetentionPeriod": "345600",
        "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:000000000000:notifications-dlq\",\"maxReceiveCount\":\"3\"}"
      }
    }
    // inventory, dispatch, order — 동일 패턴
  ],
  "topics": [{ "name": "fullstack-forge-events" }],
  "subscriptions": [
    { "topic": "fullstack-forge-events", "queue": "notifications" },
    { "topic": "fullstack-forge-events", "queue": "inventory" },
    { "topic": "fullstack-forge-events", "queue": "dispatch" },
    { "topic": "fullstack-forge-events", "queue": "order" }
  ]
}
```

PRD 근거: `docs/01-prd/13-event/01-overview.md §1` — 4개 큐 fanout.
PRD 근거: `docs/01-prd/13-event/01-overview.md §4` — VisibilityTimeout 90s, maxReceiveCount 3, source 4일, DLQ 14일.

## Data Contract

### DB Columns — event_outbox

| 컬럼          | 타입         | 제약                        | 설명                     |
| ------------- | ------------ | --------------------------- | ------------------------ |
| id            | uuid         | PK, defaultRandom           | 레코드 ID                |
| eventId       | uuid         | NOT NULL, unique            | 이벤트 고유 ID           |
| eventType     | text         | NOT NULL                    | 'OrderCreated' 등        |
| schemaVersion | text         | NOT NULL, default 'v1'      | 스키마 버전              |
| occurredAt    | timestamptz  | NOT NULL                    | 이벤트 발생 시각         |
| traceId       | uuid         | NOT NULL                    | 분산 추적 ID             |
| source        | text         | NOT NULL, default 'api'     | 발행 서비스              |
| payload       | jsonb        | NOT NULL                    | 이벤트 페이로드          |
| status        | event_status | NOT NULL, default 'pending' | pending/published/failed |
| publishedAt   | timestamptz  |                             | SNS 발행 시각            |
| createdAt     | timestamptz  | NOT NULL, defaultNow        | 레코드 생성 시각         |

### DB Columns — event_consumer_log

| 컬럼         | 타입            | 제약                 | 설명                                        |
| ------------ | --------------- | -------------------- | ------------------------------------------- |
| id           | uuid            | PK, defaultRandom    | 레코드 ID                                   |
| eventId      | uuid            | NOT NULL             | 처리한 이벤트 ID                            |
| consumer     | text            | NOT NULL             | 소비자 이름 (notifications, inventory, ...) |
| status       | consumer_status | NOT NULL             | processing/success/failed/dlq               |
| failureCode  | text            |                      | 실패 코드                                   |
| receiveCount | integer         | NOT NULL, default 0  | 수신 횟수                                   |
| processedAt  | timestamptz     |                      | 처리 완료 시각                              |
| createdAt    | timestamptz     | NOT NULL, defaultNow | 레코드 생성 시각                            |

## Verification

```bash
pnpm nx run @fullstack-forge/api-spec:codegen
pnpm nx run @fullstack-forge/api:typecheck
docker compose -f infra/fauxqs/docker-compose.yml up -d
curl -s http://localhost:4566/health || echo "fauxqs started"
docker compose -f infra/fauxqs/docker-compose.yml down
```

## Exit Criteria

- [ ] @aws-sdk/client-sns, @aws-sdk/client-sqs 설치 완료
- [ ] EventEnvelope Zod 스키마 + EVENT_TYPES 상수 정의
- [ ] SNS/SQS 클라이언트 모듈 생성 (endpoint override 패턴)
- [ ] EventPublisher — SNS publish + envelope 빌드
- [ ] ConsumerBase — long polling + ack/nack 프레임워크
- [ ] event_outbox, event_consumer_log 테이블 정의
- [ ] fauxqs docker-compose + init.json — Topic 1개 + Queue 4개 + DLQ 4개 + Subscription 4개
- [ ] typecheck 통과
