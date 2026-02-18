# Inventory API Guide

## 범위

재고 조회/조정 API의 경로와 책임을 정의한다.
이 문서는 경로 가이드만 다루며 request/response body 스키마는 포함하지 않는다.

## 기본 경로

- Base: `/api/admin/inventory`
- 식별자: `product_id`

## 조회 API

- `GET /api/admin/inventory`
  - 목적: 재고 목록 조회
  - 필터: 상품, 저재고 상태, 품절 상태
- `GET /api/admin/inventory/{product_id}`
  - 목적: 단일 상품 재고 상세 조회

## 조정 API

- `POST /api/admin/inventory/{product_id}/adjust`
  - 목적: 운영자 수동 재고 조정(입고/보정/차감)
  - 규칙: 조정 전후 음수 재고 불가
  - 호출 트리거: 관리자 UI에서 수동 실행
- `POST /api/admin/inventory/{product_id}/reserve`
  - 목적: 주문 생성 단계의 예약 재고 반영
  - 호출 트리거: `OrderCreated` 이벤트 수신 시
- `POST /api/admin/inventory/{product_id}/release`
  - 목적: 결제 실패/취소/장바구니 만료에 따른 예약 복원
  - 호출 트리거: `OrderCancelled` 이벤트 수신 시
- `POST /api/admin/inventory/{product_id}/confirm-deduction`
  - 목적: 배송 확정 시 `on_hand` 확정 차감
  - 호출 트리거: `DeliveryCompleted` 이벤트 수신 시

## 운영 규칙

- 동일 SKU 동시 조정 요청은 버전 기반 충돌 감지 또는 DB 락으로 직렬화
- 경로 설계는 관리자 도메인 기준으로 시작하며, 스토어 읽기 API는 별도 문서에서 확장
