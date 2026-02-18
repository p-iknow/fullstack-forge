# Order API Guide

## 범위

주문 생성/조회/상태 전이 API의 경로와 책임을 정의한다.
이 문서는 경로 가이드와 정책만 다루며 request/response body 스키마는 포함하지 않는다.

## 기본 경로

- Store: `/orders`
- Admin 상태 전이: `/orders/:id/status`

## 핵심 API

- `POST /orders`
  - 목적: 장바구니 기준 주문 생성
  - 규칙: 생성 직후 기본 상태는 `created`
  - 규칙: 부분 품절 발생 시 PRD §5/§6 대체상품 정책 적용
- `GET /orders/:id`
  - 목적: 단건 주문 조회
  - 규칙: 주문 상태, 아이템 상태, 대체 처리 결과를 일관되게 반환
- `PATCH /orders/:id/status`
  - 목적: 주문 상태 전이
  - 규칙: 전이 가능한 다음 상태만 허용
  - 규칙: 상태 정의와 정규 전이 규칙은 `01-overview.md`를 단일 기준으로 참조

## 차단 정책

- 허용되지 않은 전이 요청은 API 레벨에서 즉시 차단
- 종료 상태(`delivered`, `cancelled`) 이후 추가 전이는 차단
- 사용자 권한과 운영자 권한의 상태 전이 범위는 RBAC 정책으로 분리

## RBAC 범위

- customer는 `created -> cancelled` 전이만 수행 가능
- operator는 나머지 모든 허용 전이(`01-overview.md` 기준) 수행 가능

## 연계 규칙

- 주문 취소 전이는 재고 복원/결제 환불/포인트 롤백/배송 취소/알림 발송 흐름과 연결하되, 상세 정책은 각 도메인 문서를 참조
