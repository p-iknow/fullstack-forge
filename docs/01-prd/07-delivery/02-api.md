# Delivery API Guide

## 범위

배송 상태 조회와 배차 API의 경로/책임/차단 규칙을 정의한다.
이 문서는 경로 가이드와 정책만 다루며 request/response body 스키마는 포함하지 않는다.

## 기본 경로

- Store 배송 조회: `/deliveries`
- Admin 배차/재배차: `/admin/deliveries`

## 핵심 API

- `GET /deliveries/:id`
  - 목적: 단건 배송 상태 조회
  - 규칙: 주문과 연결된 최신 배송 상태, 배차 상태, SLA 위험 여부를 일관되게 표시
- `GET /deliveries?orderId=:orderId`
  - 목적: 주문 기준 배송 조회
  - 규칙: 주문의 배송 레코드가 없으면 도메인 정책에 맞는 오류로 차단
- `POST /admin/deliveries/:id/dispatch`
  - 목적: 운영자 수동 배차 실행
  - 규칙: 미배차 또는 재배차 허용 상태에서만 수행
- `POST /admin/deliveries/:id/redispatch`
  - 목적: 운영자 수동 재배차 실행
  - 규칙: 자동 재시도 이후 실패 상태에서만 수행

## 배차 정책 연동

- 배차 실패 1회는 자동 재시도 흐름으로 연결
- 2회 연속 실패 이후 요청은 운영자 개입 경로로만 허용
- 운영자 배차 수행 가능 기준은 Stage 6 Exit Criteria를 따른다

## 권한/차단 규칙

- Store 조회 API는 주문 소유 사용자만 접근 가능
- Admin 배차 API는 운영자 권한 사용자만 접근 가능
- 종료 상태(배송 완료/취소)에서는 신규 배차 요청을 차단

## 상태 코드 참고

- 배송 레코드 없음: `404 Not Found`
- 종료 상태에서 배차 시도: `409 Conflict`
- 권한 없음: `403 Forbidden`
