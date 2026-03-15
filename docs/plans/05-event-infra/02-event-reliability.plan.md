# Event Infrastructure — Reliability Session

## Context

- **현재 상태**: Session 01 완료 — EventPublisher, ConsumerBase, SNS/SQS 클라이언트, DB 테이블, fauxqs 설정 존재.
- **패턴 레퍼런스**:
  - Redis Client: `apps/api/src/cache/client.ts` (getRedisClient 싱글턴)
  - API Spec Route: `packages/api-spec/src/routes/catalog/products/route.ts` (createRoute 패턴)
  - Backend Handler: `apps/api/src/routes/catalog/handlers.ts` (RouteHandler 패턴)
  - Route Registration: `apps/api/src/routes/catalog/index.ts` (openapi 등록)
  - App Bootstrap: `apps/api/src/app.ts` (app.route 등록)
  - Auth Middleware: `apps/api/src/routes/auth/@shared/http/middleware.ts` (requireAuth)
  - Handler Test: `apps/api/src/routes/auth/login/handler.test.ts` (vi.mock + given/when/then)
  - Consumer Base: `apps/api/src/lib/event-consumer.ts` (Session 01 산출물)
  - Event Schemas: `packages/api-spec/src/event-schemas.ts` (Session 01 산출물)
- **PRD 근거**: `docs/01-prd/13-event/01-overview.md §3-§5`, `02-api.md`, `03-data.md`
- **ADR 근거**: `docs/02-architecture/backend/02-eventing.adr.md` — 멱등성 전략, DLQ 운영 설계

## Scope

**이 세션에서 하는 것**:

- Redis 기반 idempotency guard 구현
- ConsumerBase에 idempotency + retry 파이프라인 통합
- Admin DLQ 관리 API (api-spec route + backend handler)
- DLQ 메시지 조회, 단건/배치 redrive 엔드포인트
- 통합 테스트 (fanout 검증, 중복 처리 방지, DLQ 이동)

**이 세션에서 하지 않는 것**:

- 각 도메인 소비자 비즈니스 로직 (Slice 06+ 에서 구현)
- Admin DLQ UI (별도 admin-ui 세션에서 구현)
- 모니터링/알림 설정 (Slice 15 Observability)

**생성할 파일**:

- `apps/api/src/lib/idempotency-guard.ts`
- `packages/api-spec/src/event-admin-schemas.ts`
- `packages/api-spec/src/routes/events/dlq/route.ts`
- `packages/api-spec/src/routes/events/index.ts`
- `apps/api/src/routes/events/handlers.ts`
- `apps/api/src/routes/events/index.ts`
- `apps/api/src/routes/events/handlers.test.ts`
- `apps/api/src/lib/event-consumer.test.ts`

**수정할 파일**:

- `apps/api/src/lib/event-consumer.ts` (idempotency guard 통합)
- `apps/api/src/app.ts` (event admin route 등록)

## Progressive Tasks

### 1. Idempotency Guard

파일: `apps/api/src/lib/idempotency-guard.ts`

```typescript
import { getRedisClient } from '~/cache/client'

// Redis SET NX EX 패턴으로 멱등 키 관리
// 키 형식: idempotency:{consumer}:{eventId}
// TTL: 7일 (604800초) — PRD §3
```

시그니처:

```typescript
export async function checkIdempotency(params: {
  consumer: string
  eventId: string
}): Promise<{ isDuplicate: boolean }>

export async function markProcessed(params: {
  consumer: string
  eventId: string
}): Promise<void>

export async function clearIdempotencyKey(params: {
  consumer: string
  eventId: string
}): Promise<void>
```

처리 흐름 — ADR `docs/02-architecture/backend/02-eventing.adr.md` 멱등성 구현 전략:

```
1. checkIdempotency(consumer, eventId)
   → Redis GET idempotency:{consumer}:{eventId}
   → 키 존재 → { isDuplicate: true }
   → 키 없음 → { isDuplicate: false }

2. 비즈니스 로직 실행

3. 성공 → markProcessed(consumer, eventId)
   → Redis SET idempotency:{consumer}:{eventId} NX EX 604800
   → ack (메시지 삭제)

4. 실패 → clearIdempotencyKey(consumer, eventId) (재시도 허용)
   → nack (SQS 재전달)
```

### 2. ConsumerBase에 Idempotency 통합

파일 수정: `apps/api/src/lib/event-consumer.ts`

기존 `createConsumer`의 poll → parse → handleMessage → ack 흐름을:

```
poll → parse → checkIdempotency
  → duplicate → ack (무시)
  → new → handleMessage
    → 성공 → markProcessed → ack → consumerLog(success)
    → 실패 → clearIdempotencyKey → nack → consumerLog(failed)
    → maxReceiveCount 초과 → SQS가 DLQ로 이동 → consumerLog(dlq)
```

`ApproximateReceiveCount` 메시지 속성을 파싱하여 consumerLog에 receiveCount 기록.

### 3. Admin DLQ API Spec — Zod Schemas

파일: `packages/api-spec/src/event-admin-schemas.ts`

```typescript
import { z } from 'zod'

export const dlqMessageSchema = z.object({
  messageId: z.string(),
  eventId: z.string().uuid(),
  eventType: z.string(),
  traceId: z.string().uuid(),
  consumer: z.string(),
  failureCode: z.string().optional(),
  receiveCount: z.number().int(),
  sentTimestamp: z.string(),
  body: z.record(z.unknown()),
})

export const dlqMessagesResponseSchema = z.object({
  messages: z.array(dlqMessageSchema),
  queueName: z.string(),
  approximateCount: z.number().int(),
})

export const redriveRequestSchema = z.object({
  queueName: z.string(),
})

export const redriveSingleRequestSchema = z.object({
  queueName: z.string(),
  messageId: z.string(),
})

export const redriveResponseSchema = z.object({
  redrivenCount: z.number().int(),
  queueName: z.string(),
})
```

### 4. Admin DLQ API Spec — Route 정의

파일: `packages/api-spec/src/routes/events/dlq/route.ts`

```typescript
import { createRoute } from '@hono/zod-openapi'

// GET  /admin/events/dlq/messages?queue={queueName}
// POST /admin/events/dlq/redrive
// POST /admin/events/dlq/redrive/{messageId}
```

각 route에 request/response 스키마와 에러 코드 명시.

파일: `packages/api-spec/src/routes/events/index.ts`

```typescript
export { getDlqMessagesRoute, redriveAllRoute, redriveSingleRoute } from './dlq/route'
```

### 5. Admin DLQ Backend Handlers

파일: `apps/api/src/routes/events/handlers.ts`
패턴 참조: `apps/api/src/routes/catalog/handlers.ts`

#### getDlqMessagesHandler

```
1. query에서 queueName 파싱
2. QUEUE_URLS에서 DLQ URL 매핑 ({queueName}-dlq)
3. SQS ReceiveMessageCommand (MaxNumberOfMessages: 10, VisibilityTimeout: 0)
   — VisibilityTimeout 0: 조회만, 메시지 잠금 안 함
4. 메시지 body 파싱 → dlqMessageSchema 형태로 변환
5. GetQueueAttributesCommand로 ApproximateNumberOfMessages 조회
6. 응답 반환
```

#### redriveAllHandler

```
1. body에서 queueName 파싱
2. DLQ URL에서 메시지 수신 (배치 루프)
3. 각 메시지를 source queue로 SendMessageCommand
4. source queue 전송 성공 시 DLQ에서 DeleteMessageCommand
5. redrivenCount 반환
```

#### redriveSingleHandler

```
1. params에서 messageId, body에서 queueName 파싱
2. DLQ에서 해당 messageId 메시지 수신
3. source queue로 SendMessageCommand
4. DLQ에서 DeleteMessageCommand
5. 결과 반환
```

### 6. Route 등록

파일: `apps/api/src/routes/events/index.ts`

```typescript
import { createRouter } from '~/lib/create-app'
import { requireAuth } from '~/routes/auth/@shared/http/middleware'
import { getDlqMessagesRoute, redriveAllRoute, redriveSingleRoute }
  from '@fullstack-forge/api-spec/routes/events'
import { getDlqMessagesHandler, redriveAllHandler, redriveSingleHandler }
  from './handlers'

export const eventsIndex = createRouter()
eventsIndex.use('*', requireAuth) // admin 권한 필요 — PRD §5
eventsIndex.openapi(getDlqMessagesRoute, getDlqMessagesHandler)
eventsIndex.openapi(redriveAllRoute, redriveAllHandler)
eventsIndex.openapi(redriveSingleRoute, redriveSingleHandler)
```

파일 수정: `apps/api/src/app.ts`

```typescript
app.route('/admin/events', eventsIndex)
```

### 7. 통합 테스트 — Consumer Pipeline

파일: `apps/api/src/lib/event-consumer.test.ts`

fauxqs library mode 사용:

```typescript
import { startFauxqs } from 'fauxqs'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// given — fauxqs 서버 시작, topic + queue + subscription 생성
// when — SNS publish → consumer 처리
// then — 메시지 소비 확인, idempotency 검증

// Test cases:
// 1. fanout: SNS publish → 4개 queue 모두 수신
// 2. idempotency: 동일 eventId 2회 전달 → side-effect 1회만
// 3. DLQ: handler 3회 연속 실패 → DLQ 이동
// 4. ack: 처리 성공 시 메시지 삭제 확인
```

fauxqs message spy 활용:

```typescript
const msg = await server.spy.waitForMessage(
  { service: 'sqs', queueName: 'notifications', status: 'published' }
)
```

### 8. 통합 테스트 — Admin DLQ Handlers

파일: `apps/api/src/routes/events/handlers.test.ts`
패턴 참조: `apps/api/src/routes/auth/login/handler.test.ts`

```typescript
// Test cases:
// 1. GET /admin/events/dlq/messages — DLQ 메시지 조회
// 2. POST /admin/events/dlq/redrive — 배치 redrive 실행
// 3. POST /admin/events/dlq/redrive/{messageId} — 단건 redrive
// 4. 권한 없는 요청 → 401
```

## Data Contract

### Endpoints

| Method | Path | Request | 성공 | 에러 코드 |
| --- | --- | --- | --- | --- |
| GET | /admin/events/dlq/messages | query: queueName | 200 dlqMessagesResponseSchema | 400, 401, 404 |
| POST | /admin/events/dlq/redrive | body: redriveRequestSchema | 200 redriveResponseSchema | 400, 401, 404 |
| POST | /admin/events/dlq/redrive/{messageId} | body: redriveSingleRequestSchema | 200 redriveResponseSchema | 400, 401, 404 |

### Error Codes

| code | 의미 | HTTP |
| --- | --- | --- |
| `invalid_queue_name` | 존재하지 않는 큐 이름 | 400 |
| `unauthorized` | 인증 실패 | 401 |
| `queue_not_found` | DLQ가 존재하지 않음 | 404 |
| `message_not_found` | 지정한 messageId가 DLQ에 없음 | 404 |
| `redrive_failed` | source queue 전송 실패 | 500 |

### Business Rules

| 규칙 | 값 | 검증 시점 | PRD 근거 |
| --- | --- | --- | --- |
| Idempotency TTL | 7일 (604800초) | 모든 이벤트 처리 시 | `01-overview.md §3` |
| Idempotency 키 형식 | `idempotency:{consumer}:{eventId}` | 모든 이벤트 처리 시 | `01-overview.md §3` |
| maxReceiveCount | 3 | SQS RedrivePolicy | `01-overview.md §4` |
| VisibilityTimeout | 90초 | SQS 큐 설정 | `01-overview.md §4` |
| DLQ Retention | 14일 | DLQ 큐 설정 | `01-overview.md §4` |
| Source Queue Retention | 4일 | Source 큐 설정 | `01-overview.md §4` |
| Redrive 권한 | admin only | Admin API 호출 시 | `01-overview.md §4`, `02-api.md` |
| 동일 오류 반복 시 | 자동 redrive 금지 | Redrive 실행 전 | `01-overview.md §4` |

## Verification

```bash
pnpm nx run @fullstack-forge/api-spec:codegen
pnpm nx run @fullstack-forge/api:typecheck
pnpm nx run @fullstack-forge/api:test
```

## Exit Criteria

- [ ] Idempotency guard — Redis SET NX EX 패턴, TTL 7일
- [ ] ConsumerBase — idempotency + retry + consumerLog 통합
- [ ] Admin DLQ API spec — 3개 엔드포인트 (조회, 배치 redrive, 단건 redrive)
- [ ] Admin DLQ handlers — 구현 + app.ts 등록
- [ ] 통합 테스트: fanout 검증 (1 publish → 4 queue 수신)
- [ ] 통합 테스트: idempotency (동일 eventId side-effect 0)
- [ ] 통합 테스트: DLQ 이동 (3회 실패 → DLQ)
- [ ] 통합 테스트: Admin DLQ API (조회 + redrive)
- [ ] typecheck + test 통과
