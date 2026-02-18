# Payment API Guide

## 범위

결제 생성/조회/취소 API의 경로와 책임을 정의한다.
이 문서는 경로 가이드와 정책만 다루며 request/response body 스키마는 포함하지 않는다.

## 기본 경로

- Store: `/payments`
- Store 단건 조회: `/payments/:id`
- 주문 연계 조회: `/orders/:id/payment`

## 핵심 API

- `POST /payments`
  - 목적: 주문 결제 시작
  - 규칙: 최초 상태는 `initiated`
  - 규칙: 같은 idempotency key 재요청은 중복 결제 없이 동일 처리 결과를 반환
- `GET /payments/:id`
  - 목적: 단건 결제 상태 조회
  - 규칙: `initiated|authorized|captured|failed|cancelled` 상태 중 하나를 반환
- `POST /payments/:id/cancel`
  - 목적: 결제 취소/환불 트리거
  - 규칙: 주문 취소 흐름과 정합성을 유지하며 취소 가능 상태에서만 처리

## idempotency key 규칙

- 모든 결제 생성 요청은 idempotency key를 필수로 포함한다.
- idempotency key는 사용자/주문/요청 의도를 식별 가능한 단위로 생성한다.
- 동일 key의 동시 요청은 단일 결제로 수렴해야 한다.
- idempotency key 보존 기간: **24시간**. 보존 기간 이후 동일 key 재사용 시 신규 결제로 처리한다.

## 실패 및 타임아웃 정책

- 결제 요청 후 **30초** 내 PG 응답이 없으면 타임아웃으로 판정한다.
- 타임아웃 시 응답 코드: `payment_timeout` — 클라이언트는 이 코드로 타임아웃 분기를 처리한다.
- 내부 실패 코드(`failure_code`)는 `failed_timeout`으로 기록한다.
- 실패 코드는 사용자 안내 메시지와 운영자 원인 분석에 동일하게 사용한다.
