# ADR-0004: 이벤트 신뢰성 구조로 SNS → SQS fanout + DLQ + Idempotency 선택

- Status: Accepted (amended 2026-03-15)
- Date: 2026-02-15
- Amended: 2026-03-15
- Decision Makers: Architecture, Backend, Operations

## Context

PRD는 주문 이벤트를 notifications/inventory/dispatch/order로 fanout하고,
중복 처리 방지와 DLQ 복구 운영을 요구한다.
메시지 전달 실패/중복/지연을 운영 가능한 형태로 설계해야 한다.

핵심 제약:

- **at-least-once**: 모든 이벤트가 최소 1회는 전달되어야 한다 (유실 불가).
- **소비자 독립성**: 알림 소비자 장애가 재고 소비자에 영향을 주면 안 된다.
- **로컬 개발 일관성**: 실제 AWS 계정 없이도 동일한 이벤트 흐름을 로컬에서 재현할 수 있어야 한다.
- **운영 복구 경로**: 실패한 메시지에 대한 원인 분석 → 수정 → 재처리 루프가 표준화되어야 한다.

## Decision Drivers

- 생산자/소비자 결합도 최소화
- 소비자 독립 확장 및 장애 격리
- 실패 격리와 재처리 가능성
- at-least-once 환경에서 부작용 방지
- 로컬/CI 환경에서 AWS 에뮬레이터로 완전 재현 (fauxqs)

## Considered Options

### Option 1: SNS → SQS fanout + DLQ + consumer idempotency

AWS 관리형 pub/sub + 큐. 단일 SNS Topic에서 도메인별 SQS 큐로 fanout.
각 소비자가 독립 큐를 소비하고, 실패 시 DLQ로 격리.

### Option 2: Kafka (또는 MSK)

분산 로그 기반 이벤트 스트리밍. Consumer Group으로 파티션 기반 병렬 소비.

### Option 3: EventBridge + SQS

AWS 이벤트 버스. 규칙 기반 라우팅으로 타겟 SQS에 전달.

### Option 4: 동기 API 체인 호출

이벤트 없이 주문 서비스가 알림/재고/배송 서비스를 직접 HTTP 호출.

## Decision

옵션 1을 채택한다.
API는 SNS로 이벤트를 발행하고, 각 도메인 소비자는 SQS 큐를 독립 소비한다.
각 소비자는 `idempotency:{consumer}:{eventId}` 키로 멱등 처리를 강제한다.
DLQ와 redrive 운영 절차를 표준화한다.

## 상세 비교

### SNS+SQS vs Kafka

| 기준             | SNS+SQS                          | Kafka                              |
| ---------------- | -------------------------------- | ---------------------------------- |
| 운영 복잡도      | 낮음 — 관리형, 인프라 설정 최소  | 높음 — 브로커/파티션/리밸런싱 관리 |
| 메시지 순서      | 보장 없음 (Standard Queue)       | 파티션 내 순서 보장                |
| 소비자 격리      | 큐 단위 완전 격리                | Consumer Group 내 파티션 공유      |
| 메시지 보존      | 처리 후 삭제 (pull-and-delete)   | 보존 기간 동안 재소비 가능         |
| DLQ              | 네이티브 지원                    | 직접 구현 필요                     |
| 처리량           | 수만 msg/s (충분)                | 수십만~수백만 msg/s                |
| 로컬 에뮬레이션  | 완전 지원 (fauxqs)               | 미지원 (별도 Docker Kafka 필요)    |
| 비용 (규모 대비) | 요청 기반 과금 — 소규모에서 저렴 | 브로커 상시 운영 비용              |

**Kafka 기각 근거:**

1. **규모 불일치**: 이 프로젝트의 예상 처리량(수백~수천 msg/min)에서 Kafka는 과잉이다. Kafka의 가치는 수십만 msg/s 이상의 스트리밍 시나리오에서 발현된다.
2. **순서 보장 불필요**: PRD의 이벤트 소비자는 모두 멱등 처리를 전제하므로, 메시지 순서에 의존하지 않는다. 주문 상태 전이 순서는 DB의 `version` 컬럼(낙관적 락)으로 보호한다.
3. **운영 복잡도**: Kafka 브로커, ZooKeeper(또는 KRaft), 파티션 리밸런싱, consumer lag 모니터링 등의 운영 부담이 이 프로젝트 규모에서는 비합리적이다.
4. **로컬 에뮬레이션**: SNS+SQS는 fauxqs(TypeScript 네이티브 에뮬레이터)로 로컬/CI에서 실제와 동일한 이벤트 흐름을 재현할 수 있다. Kafka는 별도 Docker Compose 구성이 필요하다.

### SNS+SQS vs EventBridge

| 기준      | SNS+SQS                           | EventBridge                |
| --------- | --------------------------------- | -------------------------- |
| 라우팅    | 단순 fanout (Topic → 모든 구독자) | 규칙 기반 패턴 매칭        |
| 필터링    | SNS 메시지 속성 필터 (제한적)     | 이벤트 패턴 규칙 (강력)    |
| DLQ       | SQS 네이티브                      | 타겟별 DLQ 설정            |
| 로컬 에뮬 | 완전 지원 (fauxqs)                | 부분 지원 (규칙 엔진 제약) |
| 디버깅    | SQS 메시지 직접 조회 가능         | CloudWatch Logs로만 추적   |

**EventBridge 기각 근거:**

1. **단순 fanout이면 충분**: 현재 4개 소비자(notifications, inventory, dispatch, order)에게 동일 이벤트를 전달하는 단순 fanout 패턴이다. EventBridge의 규칙 기반 라우팅은 불필요한 복잡성이다.
2. **로컬 에뮬레이터 호환성**: EventBridge는 fauxqs 등 경량 에뮬레이터에서 규칙 엔진을 지원하지 않아 로컬 개발 경험이 불완전하다.
3. **디버깅 용이성**: SQS 큐의 메시지를 직접 조회/삭제할 수 있어 문제 추적이 단순하다. EventBridge는 CloudWatch Logs를 통해야 해 간접적이다.

향후 이벤트 타입이 50+로 증가하고 소비자별 선택적 구독이 필요해지면 EventBridge 전환을 재검토한다.

### 동기 API 체인 기각

동기 호출은 구현이 단순하지만 근본적 한계가 있다:

- **결합도**: 주문 서비스가 알림/재고/배송 서비스의 가용성에 직접 의존한다. 알림 서비스 장애 시 주문 생성이 실패한다.
- **지연 누적**: 4개 서비스를 순차 호출하면 각 서비스의 응답 시간이 합산된다.
- **부분 실패 복구**: 3번째 서비스 호출이 실패했을 때 1~2번째의 부작용을 롤백하는 보상 로직이 호출자에게 집중된다.

## Fanout 구조 설계

### 토픽/큐 매핑

```
SNS Topic (fullstack-forge-events)
├── SQS: notifications  → Notifications Worker
├── SQS: inventory      → Inventory Worker
├── SQS: dispatch       → Dispatch Worker
└── SQS: order          → Order Worker
```

**단일 Topic을 선택한 이유:**

- 현재 모든 이벤트 타입(OrderCreated, PaymentCaptured, DeliveryStatusChanged 등)이 4개 소비자 모두에게 관련된다. 소비자가 자신에게 관련 없는 이벤트를 수신하면 멱등 키 확인 후 즉시 ack한다.
- 이벤트 타입별 Topic 분리는 Topic 수 폭증(현재 28개 이벤트 타입)으로 이어져 관리 비용이 급증한다.
- 향후 소비자가 특정 이벤트만 필요할 경우, SNS 메시지 속성 필터(subscription filter policy)로 해결 가능하다.

### 소비자 격리 원칙

각 SQS 큐는 완전히 독립적으로 운영된다:

- **독립 배포**: 각 worker는 독립 프로세스로 배포/스케일링할 수 있다. 초기에는 API 프로세스 내부에서 polling하되, 부하 증가 시 `apps/workers/{domain}`으로 분리한다.
- **독립 장애**: notifications 큐의 DLQ 적체가 inventory 큐 처리에 영향을 주지 않는다.
- **독립 처리 속도**: 알림은 초 단위 SLA, 재고는 밀리초 단위 정합성이 필요하다. 큐 분리로 각 소비자의 처리 특성에 맞게 polling 간격/배치 크기를 조정할 수 있다.

## 멱등성 구현 전략

### 왜 멱등성이 필수인가

SQS Standard Queue는 at-least-once 전달을 보장한다. 즉, 동일 메시지가 2회 이상 전달될 수 있다.
FIFO Queue는 exactly-once를 지원하지만, **처리량 제한(3,000 msg/s)**과 **메시지 그룹 관리 복잡도**로 기각했다.

### 멱등 키 저장소: Redis

| 기준         | Redis                         | PostgreSQL                  |
| ------------ | ----------------------------- | --------------------------- |
| 쓰기 지연    | ~1ms                          | ~5-10ms                     |
| TTL 만료     | `EXPIRE` 네이티브             | 배치 DELETE 필요            |
| 처리량 영향  | 메인 DB 부하 없음             | 매 이벤트마다 INSERT        |
| 장애 시 영향 | 멱등 키 유실 → 중복 처리 가능 | 트랜잭션 데이터와 동일 장애 |

**Redis 선택 근거:**

- 멱등 키는 **7일 후 자연 소멸**해야 한다. Redis의 `EXPIRE`가 이를 자동 처리한다.
- 매 이벤트 처리 시 `SET NX EX` 한 번으로 중복 확인과 키 등록이 원자적으로 완료된다.
- Redis 장애 시 멱등 키가 유실되어 중복 처리가 발생할 수 있지만, **각 소비자의 비즈니스 로직 자체가 재실행에 안전**하게 설계되므로(예: 재고 차감은 이미 차감된 상태면 무시) 치명적이지 않다.

### 처리 흐름

```
메시지 수신
  → Redis GET idempotency:{consumer}:{eventId}
  → 키 존재하면 → ack (중복, 무시)
  → 키 없으면 → 비즈니스 로직 실행
    → 성공 → Redis SET NX EX 7d → ack
    → 실패 → nack (SQS 재전달)
    → maxReceiveCount 초과 → DLQ 이동
```

## DLQ 운영 설계

### DLQ가 필요한 이유

재시도만으로는 해결할 수 없는 실패 유형이 존재한다:

- **Poison Message**: 잘못된 payload 구조, 존재하지 않는 FK 참조 등 — 재시도해도 동일하게 실패
- **코드 버그**: 소비자 로직의 미처리 edge case — 코드 수정 없이는 해결 불가
- **외부 의존 장기 장애**: 결제 PG 사 장기 장애 — 복구 후 일괄 재처리 필요

이러한 메시지를 DLQ로 격리하지 않으면, 소스 큐에서 무한 재시도하며 다른 정상 메시지의 처리를 지연시킨다.

### 운영 파라미터

| 파라미터               | 값   | 근거                                         |
| ---------------------- | ---- | -------------------------------------------- |
| `VisibilityTimeout`    | 90초 | 처리 시간 30초 × 3배 (안전 마진)             |
| `maxReceiveCount`      | 3    | 3회 실패 시 DLQ 이동 (일시적 장애 대응 충분) |
| Source Queue Retention | 4일  | 주말 포함 운영 대응 시간 확보                |
| DLQ Retention          | 14일 | 원인 분석 + 수정 + 배포 + 재처리 사이클      |

### Redrive 절차

1. **원인 분석**: DLQ 메시지 payload와 소비자 에러 로그 확인
2. **수정 배포**: 코드 버그면 수정 후 배포, 데이터 이슈면 DB 보정
3. **단건 검증**: DLQ에서 1건만 redrive하여 정상 처리 확인
4. **일괄 redrive**: 검증 통과 후 나머지 메시지 일괄 redrive
5. **동일 오류 반복 시 자동 redrive 금지** — 원인 미해결 상태에서 redrive하면 DLQ로 재진입할 뿐이다

## 로컬 개발 환경 (fauxqs)

AWS 계정 없이 SNS+SQS를 로컬에서 완전 재현한다:

- **fauxqs**: TypeScript 네이티브 SNS/SQS/DLQ 에뮬레이터 (`kibertoad/fauxqs`)
- **두 가지 모드**:
  - **Library mode**: 테스트 내부에서 `startFauxqs()` 호출 — 밀리초 시작, message spy 포함
  - **Docker mode**: `infra/fauxqs/docker-compose.yml`로 로컬 개발 환경 기동
- **선언적 초기화**: `infra/fauxqs/init.json`에서 Topic/Queue/Subscription/DLQ 자동 생성
- **환경 변수**: `AWS_ENDPOINT_URL=http://localhost:4566`으로 SDK 엔드포인트 오버라이드

CI 환경에서는 fauxqs library mode를 사용하여 Docker 없이 이벤트 통합 테스트를 실행한다.

### LocalStack에서 fauxqs로 전환한 이유

LocalStack은 2026-03-23부터 Community Edition을 포함한 모든 사용에 인증 토큰(`LOCALSTACK_AUTH_TOKEN`)을 요구한다.
비상업 무료 tier는 유지되지만, 계정 생성/토큰 관리/CI 시크릿 주입 등 운영 부담이 추가된다.

fauxqs를 선택한 근거:

| 기준          | LocalStack             | fauxqs                                  |
| ------------- | ---------------------- | --------------------------------------- |
| 인증          | 필수 (2026-03-23~)     | 불필요                                  |
| 언어          | Python (Docker 필수)   | TypeScript (프로젝트 스택 동일)         |
| SNS+SQS+DLQ   | 완전 지원              | 완전 지원                               |
| Filter Policy | 완전 지원              | 완전 지원                               |
| 테스트 통합   | Docker 필요            | Library mode — Docker 없이 in-process   |
| Message Spy   | 없음                   | `waitForMessage()`, `expectNoMessage()` |
| 시작 속도     | ~10초                  | ~100ms (library), ~2초 (Docker)         |
| 리스크        | 검증된 생태계 (58K ⭐) | 신생 프로젝트 (2026-02 출시)            |

**리스크 대응**: fauxqs는 AWS SDK v3 호환 HTTP 서버이므로, 문제 발생 시 `endpoint` 값만 변경하면 LocalStack이나 실제 AWS로 즉시 전환할 수 있다. 코드 변경 없음.

## Consequences

### Good

- fanout 구조에서 소비자 독립 배포/확장 가능 — 알림 SLA와 재고 정합성을 독립적으로 보장
- 장애가 큐 단위로 격리되어 운영 안정성 향상 — 한 소비자 장애가 전체 시스템에 전파되지 않음
- DLQ 기반 재처리로 명확한 복구 경로 확보 — "메시지가 어디 갔는지 모르는" 상황 방지
- fauxqs로 로컬/CI에서 실제와 동일한 이벤트 흐름 재현 — Docker 없이 library mode 테스트 가능
- Redis 기반 멱등성으로 중복 처리 비용 최소화 — DB 부하 없이 O(1) 중복 검사

### Bad

- at-least-once 특성으로 **모든 소비자에 멱등성 구현이 필수** — 개발 비용 증가
- 운영 복잡도(redrive runbook, DLQ 모니터링, 알림 설정) 증가
- 메시지 순서 보장 없음 — 순서 의존 로직은 DB 수준(version/timestamp)에서 해결해야 함
- Redis 멱등 키 유실 시 중복 처리 가능성 — 소비자 로직이 재실행 안전(re-entrant)하게 설계되어야 함

## 향후 전환 기준

- 이벤트 타입 50+ 이상이고 소비자별 선택적 구독이 필요하면 → EventBridge 전환 검토
- 처리량이 10만 msg/s를 초과하면 → Kafka/MSK 전환 검토
- 순서 보장이 비즈니스 필수 요구가 되면 → SQS FIFO 또는 Kafka 전환 검토

## PRD Traceability

- Satisfies:
  - `docs/01-prd/13-event/01-overview.md` (fanout/idempotency/DLQ/redrive)
- Supports:
  - `docs/01-prd/00-overview.md` (신뢰성 KPI)
  - `docs/01-prd/12-notification/01-overview.md` (알림 소비자 SLA)

## References

- AWS SNS→SQS: <https://docs.aws.amazon.com/sns/latest/dg/sns-sqs-as-subscriber.html>
- AWS SQS DLQ: <https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html>
- AWS SQS FIFO: <https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html>
- fauxqs: <https://github.com/kibertoad/fauxqs>
- LocalStack 유료화 공지: <https://blog.localstack.cloud/localstack-single-image-next-steps/>
- 내부 근거: `docs/02-architecture/base/01-overview.md`, `docs/01-prd/13-event/01-overview.md`
