# Inquiry API Guide

## 범위

문의 생성/조회/답변/상태 전이 API의 경로와 책임을 정의한다.
이 문서는 경로 가이드와 정책만 다루며 request/response body 스키마는 포함하지 않는다.

## 엔드포인트 목록

| 메서드  | 경로                      | 역할                  | 권한            |
| ------- | ------------------------- | --------------------- | --------------- |
| `POST`  | `/inquiries`              | 문의 생성             | customer        |
| `GET`   | `/inquiries`              | 내 문의 목록 조회     | customer        |
| `GET`   | `/inquiries/{id}`         | 문의 상세 조회        | customer (본인) |
| `GET`   | `/admin/inquiries`        | 전체 문의 목록 조회   | operator, admin |
| `GET`   | `/admin/inquiries/{id}`   | 문의 상세 조회 (운영) | operator, admin |
| `PATCH` | `/inquiries/{id}`         | 상태 전이             | operator, admin |
| `POST`  | `/inquiries/{id}/replies` | 답변 등록             | operator, admin |
| `POST`  | `/inquiries/{id}/reopen`  | 재오픈 (추가 질문)    | customer (본인) |

## 문의 흐름 (PRD §2 원문)

1. 고객: `POST /inquiries`로 문의 생성
2. 운영자: `PATCH /inquiries/{id}`로 상태 전이(`open -> in_progress -> resolved`)
3. 운영자: `POST /inquiries/{id}/replies`로 답변
4. 고객: `GET /inquiries/{id}`에서 답변/상태 조회

## Rate Limit (PRD §5 원문)

- `POST /inquiries`: 5 req / 15 min / user
- `POST /inquiries/*/replies`: 30 req / 15 min / operator

## 에러 코드 (PRD §6 원문)

- `inquiry_not_found`
- `inquiry_reply_forbidden`

## 재오픈 전이 규칙

- `POST /inquiries/{id}/reopen`: `resolved` 상태인 문의에 대해 고객이 추가 질문을 등록하면 `open`으로 전이한다.
- `closed` 상태에서는 `409 Conflict`를 반환하며, 새 문의 생성을 안내한다.
- 재오픈 시 `InquiryStatusChanged` 이벤트가 발행된다.

## 권한 및 차단 정책

- 고객은 자신의 문의에 대해서만 `GET /inquiries/{id}` 조회 가능
- 답변/상태 변경 권한은 `operator|admin`
- 상태 전이는 `open -> in_progress -> resolved -> closed`를 기본으로 함
- `resolved -> open` 재오픈은 고객 본인만 가능
