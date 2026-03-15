# Inquiry API Guide

## 범위

문의 생성/조회/답변/상태 전이 API의 경로와 책임을 정의한다.
이 문서는 경로 가이드와 정책만 다루며 request/response body 스키마는 포함하지 않는다.

## 엔드포인트 목록

| 메서드  | 경로                           | 역할                  | 권한            |
| ------- | ------------------------------ | --------------------- | --------------- |
| `POST`  | `/inquiries`                   | 문의 생성             | customer        |
| `GET`   | `/inquiries`                   | 내 문의 목록 조회     | customer        |
| `GET`   | `/inquiries/{id}`              | 문의 상세 조회        | customer (본인) |
| `GET`   | `/admin/inquiries`             | 전체 문의 목록 조회   | operator, admin |
| `GET`   | `/admin/inquiries/{id}`        | 문의 상세 조회 (운영) | operator, admin |
| `PATCH` | `/inquiries/{id}`              | 상태 전이             | operator, admin |
| `POST`  | `/inquiries/{id}/replies`      | 답변 등록             | operator, admin |
| `POST`  | `/inquiries/{id}/reopen`       | 재오픈 (추가 질문)    | customer (본인) |
| `PATCH` | `/admin/inquiries/{id}/assign` | 담당자 할당           | operator, admin |

## 문의 흐름 (PRD §2 원문)

1. 고객: `POST /inquiries`로 문의 생성
2. 운영자: `PATCH /admin/inquiries/{id}/assign`으로 담당자 할당
3. 운영자: `PATCH /inquiries/{id}`로 상태 전이(`open -> in_progress`)
4. 운영자: `POST /inquiries/{id}/replies`로 답변
5. 운영자: `PATCH /inquiries/{id}`로 상태 전이(`in_progress -> resolved`)
6. 고객: `GET /inquiries/{id}`에서 답변/상태 조회

## 목록 조회 파라미터

### `GET /inquiries` (고객용)

| 파라미터 | 타입    | 필수 | 설명                                              |
| -------- | ------- | ---- | ------------------------------------------------- |
| `status` | string  | N    | 상태 필터 (`open\|in_progress\|resolved\|closed`) |
| `cursor` | string  | N    | 페이지네이션 커서 (이전 응답의 `nextCursor`)      |
| `limit`  | integer | N    | 한 페이지당 항목 수 (기본 20, 최대 50)            |
| `sort`   | string  | N    | 정렬 기준 (기본 `created_at:desc`)                |

### `GET /admin/inquiries` (운영용)

| 파라미터      | 타입    | 필수 | 설명                                                                |
| ------------- | ------- | ---- | ------------------------------------------------------------------- |
| `status`      | string  | N    | 상태 필터 (`open\|in_progress\|resolved\|closed`)                   |
| `category`    | string  | N    | 카테고리 필터 (`order\|payment\|delivery\|product\|account\|other`) |
| `assigned_to` | UUID    | N    | 담당 운영자 필터                                                    |
| `sla_status`  | string  | N    | SLA 상태 필터 (`normal\|warning\|violated`)                         |
| `keyword`     | string  | N    | 제목/본문 키워드 검색                                               |
| `order_id`    | UUID    | N    | 관련 주문 ID 필터                                                   |
| `cursor`      | string  | N    | 페이지네이션 커서                                                   |
| `limit`       | integer | N    | 한 페이지당 항목 수 (기본 20, 최대 100)                             |
| `sort`        | string  | N    | 정렬 기준 (기본 `created_at:desc`)                                  |

## Rate Limit (PRD §5 원문)

- `POST /inquiries`: 5 req / 15 min / user
- `POST /inquiries/*/replies`: 30 req / 15 min / operator

## 멱등성 정책

- `POST /inquiries`: 클라이언트가 `Idempotency-Key` 헤더를 전송하여 중복 생성 방지. 키 형식 `idempotency:inquiry-create:{key}`, TTL 24시간.
- `POST /inquiries/{id}/replies`: `Idempotency-Key` 헤더로 중복 답변 방지. 키 형식 `idempotency:inquiry-reply:{key}`, TTL 24시간.
- `POST /inquiries/{id}/reopen`: `Idempotency-Key` 헤더로 중복 재오픈 방지. TTL 24시간.
- 이미 처리된 키로 요청 시 이전 응답을 그대로 반환한다.

## 에러 코드

| 코드                            | HTTP 상태 | 설명                                     |
| ------------------------------- | --------- | ---------------------------------------- |
| `inquiry_not_found`             | 404       | 문의를 찾을 수 없음                      |
| `inquiry_forbidden`             | 403       | 본인 문의가 아니거나 권한 없음           |
| `inquiry_invalid_transition`    | 409       | 허용되지 않은 상태 전이                  |
| `inquiry_already_closed`        | 409       | closed 상태에서 재오픈 시도              |
| `inquiry_reopen_limit_exceeded` | 409       | 재오픈 횟수 초과 (최대 3회)              |
| `inquiry_content_too_long`      | 422       | 문의/답변 본문 길이 초과                 |
| `inquiry_title_too_long`        | 422       | 문의 제목 길이 초과 (200자)              |
| `inquiry_version_conflict`      | 409       | 낙관적 락 충돌 (다른 운영자가 먼저 변경) |
| `inquiry_rate_limit_exceeded`   | 429       | Rate limit 초과                          |
| `inquiry_reply_forbidden`       | 403       | 답변 권한 없음 (담당자 아닌 운영자)      |

## 재오픈 전이 규칙

- `POST /inquiries/{id}/reopen`: `resolved` 상태이고 `reopen_count < 3`인 문의에 대해 고객이 추가 질문을 등록하면 `open`으로 전이한다.
- `closed` 상태에서는 `409 Conflict` (`inquiry_already_closed`)를 반환하며, 새 문의 생성을 안내한다.
- 재오픈 횟수 초과 시 `409 Conflict` (`inquiry_reopen_limit_exceeded`)를 반환한다.
- 재오픈 시 `InquiryReopened` 이벤트가 발행된다.

## 권한 및 차단 정책

- 고객은 자신의 문의에 대해서만 `GET /inquiries/{id}` 조회 가능
- 답변/상태 변경 권한은 `operator|admin`
- 상태 전이는 `open -> in_progress -> resolved -> closed`를 기본으로 함
- `resolved -> open` 재오픈은 고객 본인만 가능
- `is_internal=true` 답변은 고객 API 응답에서 제외
