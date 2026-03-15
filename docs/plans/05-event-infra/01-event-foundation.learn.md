# Event Foundation — 구현 학습 기록

## 1. TypeScript `keyof (Union)` = 교집합 → `never` 함정

### 문제

EVENT_TYPES를 도메인별 nested 구조로 정의하면 EventType 추론이 깨진다:

```typescript
const EVENT_TYPES = {
  order: { ORDER_CREATED: 'OrderCreated', ... },
  payment: { PAYMENT_AUTHORIZED: 'PaymentAuthorized', ... },
} as const

// ❌ never로 추론됨
type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES][keyof (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]]
```

`keyof (A | B)` = `(keyof A) & (keyof B)`. 각 도메인 객체의 키가 서로 다르므로 교집합은 `never`.

### 해결 방법

**방법 1** — Flat 구조 (채택):

```typescript
const EVENT_TYPES = {
  ORDER_CREATED: 'OrderCreated',
  PAYMENT_AUTHORIZED: 'PaymentAuthorized',
} as const

type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]
// → 'OrderCreated' | 'PaymentAuthorized'
```

**방법 2** — Nested + Mapped Type 분배:

```typescript
type EventType = {
  [K in keyof typeof EVENT_TYPES]: (typeof EVENT_TYPES)[K][keyof (typeof EVENT_TYPES)[K]]
}[keyof typeof EVENT_TYPES]
```

각 K별로 개별 indexing 후 union하므로 keyof-union 교집합 문제를 회피한다.

### 교훈

`as const satisfies`를 써도 해결 안 됨. `satisfies`는 값 검증만 하고 추론된 타입은 `as const`와 동일. 문제는 타입 표현식에 있다.

## 2. api-spec package.json 서브패스 export

새 스키마 파일을 만들면 `packages/api-spec/package.json`의 `"exports"` 필드에 수동으로 등록해야 한다:

```json
"./event-schemas": {
  "types": "./src/event-schemas.ts",
  "default": "./src/event-schemas.ts"
}
```

이게 없으면 `import ... from '@fullstack-forge/api-spec/event-schemas'`가 모듈 해석 실패.

plan에 명시되지 않았지만 기존 패턴(`./auth-schemas`, `./cart-schemas`)을 보면 알 수 있다.

## 3. fauxqs init.json 큐 순서

DLQ 큐를 source 큐보다 **먼저** 정의해야 한다:

```json
{ "name": "notifications-dlq", ... },   // ← DLQ 먼저
{ "name": "notifications", "attributes": { "RedrivePolicy": "...notifications-dlq..." } }
```

source 큐의 `RedrivePolicy`가 DLQ ARN을 참조하므로, DLQ가 먼저 존재해야 fauxqs가 올바르게 초기화.

## 4. AWS SDK 클라이언트 패턴

- `@aws-sdk/client-sns`와 `@aws-sdk/client-sqs`는 별도 패키지. S3와 동일한 endpoint override 구조.
- `credentials` 필드에 `accessKeyId`/`secretAccessKey`가 필수. 로컬에서는 `'test'`/`'test'` 사용.
- 프로덕션 전환 시 `process.env.AWS_ENDPOINT_URL`만 제거하면 실제 AWS로 연결됨.

## 5. `z.record` 단일/이중 인자

```typescript
z.record(z.unknown())              // 키 = string (기본)
z.record(z.string(), z.unknown())  // 키 = string (명시적)
```

동일하게 동작. Zod에서 `z.record(valueSchema)`는 `z.record(z.string(), valueSchema)`의 축약형.

## 6. oxlint 린트 지시문

이 프로젝트는 eslint가 아닌 oxlint를 사용한다. console 사용 시:

```typescript
// oxlint-disable-next-line no-console
console.error(...)
```

consumer의 poll loop 안에서 에러를 삼키고 로깅할 때 필요. throw하면 루프가 깨지므로 console.error가 맞다.

## 7. SNS/SQS를 dependencies에, fauxqs는 devDependencies에

```json
"dependencies": {
  "@aws-sdk/client-sns": "...",
  "@aws-sdk/client-sqs": "..."
},
"devDependencies": {
  "fauxqs": "..."
}
```

SNS/SQS 클라이언트는 런타임에 필요. fauxqs는 로컬 에뮬레이터로 개발/테스트 전용.
기존 `@aws-sdk/client-s3`가 devDependencies에 있는 것은 S3가 seed 스크립트(tsx)에서만 쓰이기 때문.
