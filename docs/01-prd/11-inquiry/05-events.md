# Inquiry Events

## 범위

고객 문의 도메인의 최소 이벤트 타입을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 이벤트 인프라 정책 기준 이벤트 타입

- `InquiryCreated`
- `InquiryReplied`
- `InquiryStatusChanged`
- `InquiryReopened`

## 이벤트별 역할

- `InquiryCreated`
  - 문의 생성 완료 시 발행
  - 운영 inbox 분류/할당 후속 처리 트리거
- `InquiryReplied`
  - 운영자 답변 등록 시 발행
  - 고객 알림 및 최근 답변 시각 갱신 트리거
- `InquiryStatusChanged`
  - 문의 상태 변경 시 발행 (재오픈 `resolved -> open` 전이 포함)
  - 운영 SLA 추적/감사 로그 후속 처리 트리거
- `InquiryReopened`
  - `resolved -> open` 재오픈 전이 시 발행
  - 운영자 재할당 및 SLA 타이머 재시작 트리거

## 운영 규칙

- 멱등성 키, 재시도, DLQ/redrive 규칙은 [이벤트 인프라 운영 정책](../13-event/01-overview.md)을 따른다
