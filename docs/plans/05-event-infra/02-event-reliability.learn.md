# Event Reliability — 구현 학습 기록

## 1. Redis SET NX EX — 멱등성 원자적 보장

```typescript
await redis.set(key, '1', { EX: IDEMPOTENCY_TTL, NX: true })
```

- `NX`: 키가 없을 때만 설정 (원자적 check-and-set)
- `EX`: TTL 초 단위 (604800 = 7일)

별도의 `GET` → `SET` 두 단계가 아니라 단일 명령으로 원자성을 보장한다.
다만 `checkIdempotency`는 `GET`으로 읽고, `markProcessed`에서 `SET NX`를 쓰는 2단계 구조.
이는 의도적: 비즈니스 로직 실행 후에야 "처리 완료"를 마킹하므로, 중간에 실패하면 키가 설정되지 않아 재시도가 허용된다.

## 2. Consumer 흐름에서 ack/nack의 의미

```
poll → parse → checkIdempotency
  → duplicate → ack (메시지 삭제 — 이미 처리됨)
  → new → handler 실행
    → 성공 → markProcessed → ack → log(success)
    → 실패 → clearIdempotencyKey → log(failed) (ack 안 함)
```

**핵심: 실패 시 ack를 하지 않는다.**

SQS의 `VisibilityTimeout`(90초) 만료 후 메시지가 다시 보이게 되어 자연스럽게 재시도.
`maxReceiveCount`(3회) 초과 시 SQS가 자동으로 DLQ로 이동시킨다.

이 구조에서는 명시적인 nack API 호출이 없다 — SQS는 "메시지를 삭제하지 않으면 재전달"이 기본 동작.

## 3. `MessageSystemAttributeNames` 명시적 요청 필요

```typescript
new ReceiveMessageCommand({
  QueueUrl: '...',
  MessageSystemAttributeNames: ['ApproximateReceiveCount'],
})
```

SQS `ReceiveMessage`는 기본적으로 시스템 속성을 반환하지 않는다.
`ApproximateReceiveCount`를 받으려면 명시적으로 요청해야 함.
이를 누락하면 `message.Attributes?.ApproximateReceiveCount`가 항상 `undefined`.

## 4. DLQ 메시지 Peek 패턴 — VisibilityTimeout: 0

```typescript
new ReceiveMessageCommand({
  QueueUrl: dlqUrl,
  MaxNumberOfMessages: 10,
  VisibilityTimeout: 0, // ← peek only
})
```

`VisibilityTimeout: 0`이면 메시지를 수신해도 다른 consumer에게 숨기지 않는다.
조회(read-only) 용도. Admin DLQ 조회 API에서 메시지를 잠그지 않고 보여주기 위한 패턴.

주의: 이 메시지의 `ReceiptHandle`로 `DeleteMessage`를 호출하면 삭제는 된다 (visibility와 무관).

## 5. Redrive = Send + Delete (2단계)

SQS에는 "메시지 이동" 단일 API가 없다:

```
1. DLQ에서 ReceiveMessage
2. Source queue로 SendMessage (동일 body/attributes)
3. DLQ에서 DeleteMessage
```

2번과 3번 사이에 실패하면 메시지 중복이 발생할 수 있다.
프로덕션에서는 이 구간의 에러 처리와 idempotency가 중요.

AWS 자체 DLQ Redrive 기능(StartMessageMoveTask)이 있지만, fauxqs는 이를 지원하지 않으므로 수동 구현.

## 6. @hono/zod-openapi POST body 스키마 구조

POST 요청의 body 스키마는 중첩 구조:

```typescript
createRoute({
  method: 'post',
  path: '/dlq/redrive',
  request: {
    body: {
      content: {
        'application/json': {
          schema: redriveRequestSchema,
        },
      },
    },
  },
  // ...
})
```

GET의 `request.query`와 달리, body는 content-type 레벨이 한 단계 더 있다.
handler에서는 `c.req.valid('json')`으로 접근 (query가 아닌 json).

## 7. redriveSingleHandler의 while(true) 스캔 한계

현재 구현은 DLQ에서 배치로 메시지를 받아서 messageId를 매칭:

```typescript
while (true) {
  const batch = await receive(dlqUrl)
  if (batch.length === 0) return 404
  for (const msg of batch) {
    if (msg.MessageId === targetId) { ... }
  }
}
```

SQS는 messageId로 직접 수신하는 API가 없으므로 이 스캔이 불가피.
DLQ에 대량 메시지가 있으면 느릴 수 있다. 프로덕션에서는:

- `VisibilityTimeout: 0`으로 peek하며 스캔
- 또는 event_consumer_log DB에서 DLQ 메시지 목록을 관리

## 8. Consumer 로깅 — eventConsumerLog 테이블

처리 단계마다 로그를 남긴다:

| 시점            | status     | 용도                          |
| --------------- | ---------- | ----------------------------- |
| handler 실행 전 | processing | 처리 시작 추적                |
| handler 성공 후 | success    | 완료 기록, processedAt 기록   |
| handler 실패 후 | failed     | failureCode 기록, 재시도 근거 |

`receiveCount`를 함께 기록하여 SQS의 재전달 횟수를 DB에서 추적 가능.
DLQ 이동 여부는 SQS가 자동 처리하므로 consumer_log에 `dlq` 상태는 별도 로직이 필요 (현재 미구현 — SQS 레벨에서 자동).
