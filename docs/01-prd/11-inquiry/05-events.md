# Inquiry Events

## 범위

고객 문의 도메인의 이벤트 타입, 페이로드, 소비자, 멱등성 키를 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 이벤트 라우팅

- 발행 대상: SNS Topic (공통)
- 소비 큐: `notifications` (고객 알림), `order` (SLA 추적/감사 로그)

## 이벤트 목록

### `InquiryCreated`

- **트리거**: `POST /inquiries` 성공 후 발행
- **멱등성 키**: `idempotency:inquiry-created:{eventId}`
- **소비자**:
  - `notifications` → 고객에게 문의 접수 확인 알림
  - `order` → 운영 inbox 분류, SLA 타이머 시작
- **페이로드**:

| 필드         | 타입          | 설명                           |
| ------------ | ------------- | ------------------------------ |
| `inquiryId`  | UUID          | 문의 식별자                    |
| `customerId` | UUID          | 문의 작성 고객                 |
| `orderId`    | UUID \| null  | 관련 주문 식별자 (없으면 null) |
| `category`   | string        | 문의 카테고리                  |
| `title`      | string        | 문의 제목                      |
| `createdAt`  | ISO timestamp | 문의 생성 시각                 |

### `InquiryReplied`

- **트리거**: `POST /inquiries/{id}/replies` 성공 후 발행 (운영자 답변, `is_internal=false`인 경우만)
- **멱등성 키**: `idempotency:inquiry-replied:{eventId}`
- **소비자**:
  - `notifications` → 고객에게 답변 등록 알림
  - `order` → `last_replied_at` 기반 SLA 측정 기록
- **페이로드**:

| 필드         | 타입          | 설명                                 |
| ------------ | ------------- | ------------------------------------ |
| `inquiryId`  | UUID          | 대상 문의 식별자                     |
| `replyId`    | UUID          | 답변 식별자                          |
| `customerId` | UUID          | 문의 작성 고객 (알림 대상)           |
| `authorRole` | string        | 답변 작성자 역할 (`operator\|admin`) |
| `authorId`   | UUID          | 답변 작성자 식별자                   |
| `repliedAt`  | ISO timestamp | 답변 생성 시각                       |

### `InquiryStatusChanged`

- **트리거**: `PATCH /inquiries/{id}` 성공 후 발행. 일반 상태 전이(`open -> in_progress -> resolved -> closed`)에만 발행. 재오픈 전이(`resolved -> open`)에는 발행하지 않음 — `InquiryReopened`가 전담.
- **멱등성 키**: `idempotency:inquiry-status-changed:{eventId}`
- **소비자**:
  - `notifications` → 고객에게 상태 변경 알림 (resolved, closed 시)
  - `order` → 감사 로그 기록
- **페이로드**:

| 필드             | 타입          | 설명             |
| ---------------- | ------------- | ---------------- |
| `inquiryId`      | UUID          | 문의 식별자      |
| `customerId`     | UUID          | 문의 작성 고객   |
| `previousStatus` | string        | 변경 전 상태     |
| `newStatus`      | string        | 변경 후 상태     |
| `changedBy`      | UUID          | 상태 변경 수행자 |
| `changedAt`      | ISO timestamp | 상태 변경 시각   |

### `InquiryReopened`

- **트리거**: `POST /inquiries/{id}/reopen` 성공 후 발행. `resolved -> open` 재오픈 전이 전담.
- **멱등성 키**: `idempotency:inquiry-reopened:{eventId}`
- **소비자**:
  - `notifications` → 담당 운영자에게 재오픈 알림
  - `order` → SLA 타이머 재시작, 감사 로그 기록
- **페이로드**:

| 필드              | 타입          | 설명                    |
| ----------------- | ------------- | ----------------------- |
| `inquiryId`       | UUID          | 문의 식별자             |
| `customerId`      | UUID          | 재오픈 요청 고객        |
| `reopenCount`     | integer       | 현재까지 재오픈 횟수    |
| `previousReplyId` | UUID          | 직전 운영자 답변 식별자 |
| `reopenedAt`      | ISO timestamp | 재오픈 시각             |

## 이벤트 발행 규칙

- 재오픈 전이 시 `InquiryReopened`만 발행. `InquiryStatusChanged`는 발행하지 않음 (중복 방지).
- `is_internal=true`인 내부 메모 답변은 `InquiryReplied` 이벤트를 발행하지 않음.

## 운영 규칙

- 멱등성 키 TTL, 재시도, DLQ/redrive 규칙은 [이벤트 인프라 운영 정책](../13-event/01-overview.md)을 따른다.
- 이벤트 순서 보장: 동일 `inquiryId`에 대해 순서가 보장되지 않으므로, 소비자는 `occurredAt` 기준으로 최신 상태를 판단한다.
- 스키마 변경 시 `schemaVersion`을 증가시키고, 소비자는 최소 2개 버전까지 backward compatible을 유지한다.
