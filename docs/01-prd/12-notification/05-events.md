# Notification Domain Event Consumption

## 문서 상태

- 본 문서는 **기존 PRD(01~05)에 미포함된 알림 도메인을 신규 정의**하기 위해 작성되었다.
- 알림 도메인은 producer가 아니라 consumer 관점에서 이벤트 처리 정책을 정의한다.

## 소비 위치

- 소스: SNS fanout으로 전달된 `notifications` 큐
- 역할: order/delivery/payment/review/inventory/cart/loyalty/promotion/inquiry 이벤트를 사용자 알림으로 변환
- 기준 아키텍처: `../../02-architecture/backend/04-eventing.adr.md`

## 소비 이벤트 요약 테이블

| 원본 이벤트 | 발행 도메인 | Notification type | title 템플릿 | 대상 | 소스 문서 |
| --- | --- | --- | --- | --- | --- |
| `OrderCreated` | order | `order` | 주문 접수 완료 | 고객 | `../05-order/05-events.md` |
| `OrderStatusChanged` | order | `order` | 주문 상태 업데이트 | 고객 | `../05-order/05-events.md` |
| `OrderCancelled` | order | `order` | 주문 취소 완료 | 고객 | `../05-order/05-events.md` |
| `SubstitutionRequested` | order | `order` | 대체상품 승인 요청 | 고객 | `../05-order/05-events.md` |
| `SubstitutionResolved` | order | `order` | 대체상품 처리 결과 | 고객 | `../05-order/05-events.md` |
| `PaymentCaptured` | payment | `payment` | 결제 완료 | 고객 | `../06-payment/05-events.md` |
| `PaymentFailed` | payment | `payment` | 결제 실패 | 고객 | `../06-payment/05-events.md` |
| `PaymentCancelled` | payment | `payment` | 결제 취소 | 고객 | `../06-payment/05-events.md` |
| `PaymentRefunded` | payment | `payment` | 환불 완료 | 고객 | `../06-payment/05-events.md` |
| `DeliveryCreated` | delivery | `delivery` | 배송 준비 시작 | 고객 | `../07-delivery/05-events.md` |
| `DeliveryDispatched` | delivery | `delivery` | 배차 완료 | 고객 | `../07-delivery/05-events.md` |
| `DeliveryStatusChanged` | delivery | `delivery` | 배송 상태 업데이트 | 고객 | `../07-delivery/05-events.md` |
| `DeliveryDispatchFailed` | delivery | `delivery` | 배차 지연 안내 | 고객 | `../07-delivery/05-events.md` |
| `DeliveryCancelled` | delivery | `delivery` | 배송 취소 | 고객 | `../07-delivery/05-events.md` |
| `ReviewEligible` | review | `review` | 리뷰 작성 가능 | 고객 | `../10-review/05-events.md` |
| `ReviewCreated` | review | `review` | 리뷰 등록 완료 | 고객 | `../10-review/05-events.md` |
| `InventoryLevelChanged` | inventory | `inventory` | 관심 상품 품절/재입고 | 고객 | `../03-inventory/05-events.md` |
| `CartExpired` | cart | `cart` | 장바구니 만료 안내 | 고객 | `../04-cart/05-events.md` |
| `CartConverted` | cart | `cart` | 주문 전환 완료 | 고객 | `../04-cart/05-events.md` |
| `PointsEarned` | loyalty | `loyalty` | 포인트 적립 완료 | 고객 | `../09-loyalty/05-events.md` |
| `PointsRedeemed` | loyalty | `loyalty` | 포인트 사용 완료 | 고객 | `../09-loyalty/05-events.md` |
| `PointsExpired` | loyalty | `loyalty` | 포인트 만료 안내 | 고객 | `../09-loyalty/05-events.md` |
| `PointsAdjusted` | loyalty | `loyalty` | 포인트 조정 안내 | 고객 | `../09-loyalty/05-events.md` |
| `PromotionApplied` | promotion | `promotion` | 할인 적용 안내 | 고객 | `../08-promotion/05-events.md` |
| `InquiryCreated` | inquiry | `inquiry` | 문의 접수 확인 | 고객 | `../11-inquiry/05-events.md` |
| `InquiryReplied` | inquiry | `inquiry` | 문의 답변 등록 | 고객 | `../11-inquiry/05-events.md` |
| `InquiryStatusChanged` | inquiry | `inquiry` | 문의 상태 변경 | 고객 | `../11-inquiry/05-events.md` |
| `InquiryReopened` | inquiry | `inquiry` | 문의 재오픈 알림 | 운영자 | `../11-inquiry/05-events.md` |

> 운영자 대상 경보(저재고 경고, 재고 조정 확인, 배차 실패 운영 경보 등)는 `../14-observability/01-overview.md` 범위에서 처리한다. `InventoryAdjusted`, `InventoryLevelChanged`(운영자 향), `DeliveryDispatchFailed`(운영자 향) 등의 운영 알림은 observability 도메인이 담당한다.

## 주요 소비 이벤트 매핑

### Order 이벤트

#### `OrderCreated`

- 알림 목적: 주문 접수 확인
- 메시지 매핑:
  - `type`: `order`
  - `title`: `주문이 접수되었습니다`
  - `body`: `주문번호 {order_id} ({items.length}건) 결제 진행 중입니다.`
  - `link_target`: `/orders/{order_id}`

#### `OrderStatusChanged`

- 알림 목적: 주문 상태 전이 안내 (결제완료, 준비중, 출고완료 등, 취소 제외)
- 메시지 매핑:
  - `type`: `order`
  - `title`: `주문 상태가 변경되었습니다`
  - `body`: `주문번호 {order_id}: {previous_status} → {current_status}`
  - `link_target`: `/orders/{order_id}`

#### `OrderCancelled`

- 알림 목적: 주문 취소(전체/부분) 완료 안내
- 메시지 매핑:
  - `type`: `order`
  - `title`: `주문이 취소되었습니다` (전체) / `일부 상품이 취소되었습니다` (부분)
  - `body`: `주문번호 {order_id} {cancel_type} 취소 완료. 환불 예정 금액: {refund_amount}원, 포인트 복원: {points_to_restore}P`
  - `link_target`: `/orders/{order_id}`
- 소스: `../05-order/05-events.md`

#### `SubstitutionRequested`

- 알림 목적: 대체상품 승인 요청 안내 (가격 120% 초과 시)
- 메시지 매핑:
  - `type`: `order`
  - `title`: `대체 상품 승인이 필요합니다`
  - `body`: `주문번호 {order_id} 품목 대체 요청. 가격 차이: {price_diff}원. 승인 마감: {expires_at}`
  - `link_target`: `/orders/{order_id}/substitution/{substitution_id}`
- 소스: `../05-order/05-events.md`

#### `SubstitutionResolved`

- 알림 목적: 대체상품 처리 결과 안내 (승인/거절/타임아웃)
- 메시지 매핑:
  - `type`: `order`
  - `title`: `대체 상품 처리가 완료되었습니다`
  - `body`: `주문번호 {order_id} 대체 결과: {resolution}`
  - `link_target`: `/orders/{order_id}`
- 소스: `../05-order/05-events.md`

### Payment 이벤트

#### `PaymentCaptured`

- 알림 목적: 결제 완료 안내
- 메시지 매핑:
  - `type`: `payment`
  - `title`: `결제가 완료되었습니다`
  - `body`: `주문번호 {order_id} 결제 금액: {amount}원`
  - `link_target`: `/orders/{order_id}`
- 소스: `../06-payment/05-events.md`

#### `PaymentFailed`

- 알림 목적: 결제 실패 안내
- 메시지 매핑:
  - `type`: `payment`
  - `title`: `결제에 실패했습니다`
  - `body`: `주문번호 {order_id} 결제 실패. 다시 시도해주세요.`
  - `link_target`: `/orders/{order_id}`
- 소스: `../06-payment/05-events.md`

#### `PaymentCancelled`

- 알림 목적: 결제 취소 안내
- 메시지 매핑:
  - `type`: `payment`
  - `title`: `결제가 취소되었습니다`
  - `body`: `주문번호 {order_id} 결제 취소 완료.`
  - `link_target`: `/orders/{order_id}`
- 소스: `../06-payment/05-events.md`

#### `PaymentRefunded`

- 알림 목적: 환불 완료 안내
- 메시지 매핑:
  - `type`: `payment`
  - `title`: `환불이 완료되었습니다`
  - `body`: `주문번호 {order_id} 환불 금액: {refund_amount}원 ({refund_type})`
  - `link_target`: `/orders/{order_id}`
- 소스: `../06-payment/05-events.md`

### Delivery 이벤트

#### `DeliveryCreated`

- 알림 목적: 배송 준비 시작 안내
- 메시지 매핑:
  - `type`: `delivery`
  - `title`: `배송이 준비 중입니다`
  - `body`: `주문번호 {order_id} 배송 준비가 시작되었습니다. 예상 도착: {sla_target_at}`
  - `link_target`: `/orders/{order_id}/delivery`
- 소스: `../07-delivery/05-events.md`

#### `DeliveryDispatched`

- 알림 목적: 배차 완료 안내
- 메시지 매핑:
  - `type`: `delivery`
  - `title`: `배송 기사가 배정되었습니다`
  - `body`: `주문번호 {order_id} 곧 출발합니다.`
  - `link_target`: `/orders/{order_id}/delivery`
- 소스: `../07-delivery/05-events.md`

#### `DeliveryStatusChanged`

- 알림 목적: 배송 상태 변화 안내 (픽업/배송중/완료)
- 메시지 매핑:
  - `type`: `delivery`
  - `title`: `배송 상태가 변경되었습니다`
  - `body`: `주문번호 {order_id}: {old_status} → {new_status}`
  - `link_target`: `/orders/{order_id}/delivery`
- 소스: `../07-delivery/05-events.md`
- 비고: `DeliveryCreated`, `DeliveryDispatched`와 중복 발행될 수 있으므로 `source_event_id` 기반 멱등 처리로 중복 알림 방지

#### `DeliveryDispatchFailed`

- 알림 목적: 배차 지연 안내 (고객 관점)
- 메시지 매핑:
  - `type`: `delivery`
  - `title`: `배송 배정이 지연되고 있습니다`
  - `body`: `주문번호 {order_id} 배송 배정 중입니다. 잠시 기다려주세요.`
  - `link_target`: `/orders/{order_id}/delivery`
- 소스: `../07-delivery/05-events.md`
- 비고: 운영자 향 배차 실패 경고는 `../14-observability/01-overview.md`에서 처리

#### `DeliveryCancelled`

- 알림 목적: 배송 취소 안내
- 메시지 매핑:
  - `type`: `delivery`
  - `title`: `배송이 취소되었습니다`
  - `body`: `주문번호 {order_id} 배송이 취소되었습니다. 사유: {reason}`
  - `link_target`: `/orders/{order_id}`
- 소스: `../07-delivery/05-events.md`

### Review 이벤트

#### `ReviewEligible`

- 알림 목적: 리뷰 작성 가능 시점 안내
- 메시지 매핑:
  - `type`: `review`
  - `title`: `리뷰를 작성해주세요`
  - `body`: `배송 완료된 상품의 리뷰를 남겨주세요.`
  - `link_target`: `/orders/{order_id}/review`

#### `ReviewCreated`

- 알림 목적: 리뷰 등록 완료 피드백
- 메시지 매핑:
  - `type`: `review`
  - `title`: `리뷰가 등록되었습니다`
  - `body`: `소중한 리뷰 감사합니다.`
  - `link_target`: `/reviews/{review_id}`
- 소스: `../10-review/05-events.md`

### Inventory 이벤트

#### `InventoryLevelChanged`

- 알림 목적: 관심 상품 품절/재입고 안내 (고객 관점)
- 메시지 매핑 (품절, `current_level` = `out_of_stock`):
  - `type`: `inventory`
  - `title`: `관심 상품이 품절되었습니다`
  - `body`: `{sku} 상품이 현재 품절 상태입니다.`
  - `link_target`: `/products/{product_id}`
- 메시지 매핑 (재입고, `current_level` = `low_stock` 또는 `normal`, `previous_level` = `out_of_stock`):
  - `type`: `inventory`
  - `title`: `관심 상품이 재입고되었습니다`
  - `body`: `{sku} 상품이 다시 구매 가능합니다.`
  - `link_target`: `/products/{product_id}`
- 소스: `../03-inventory/05-events.md`
- 비고: `current_level` 값에 따라 메시지 분기. 운영자 향 저재고/품절 경고는 `../14-observability/01-overview.md`에서 처리

### Cart 이벤트

#### `CartExpired`

- 알림 목적: 장바구니 만료 안내
- 메시지 매핑:
  - `type`: `cart`
  - `title`: `장바구니가 만료되었습니다`
  - `body`: `장바구니 상품이 만료되었습니다. 새로 담아주세요.`
  - `link_target`: `/cart`
- 소스: `../04-cart/05-events.md`

#### `CartConverted`

- 알림 목적: 주문 전환 완료 안내
- 메시지 매핑:
  - `type`: `cart`
  - `title`: `장바구니가 주문으로 전환되었습니다`
  - `body`: `주문번호 {order_id}로 전환되었습니다.`
  - `link_target`: `/orders/{order_id}`
- 소스: `../04-cart/05-events.md`

### Loyalty 이벤트

#### `PointsEarned`

- 알림 목적: 포인트 적립 확정 안내
- 메시지 매핑:
  - `type`: `loyalty`
  - `title`: `포인트가 적립되었습니다`
  - `body`: `{amount}P 적립 완료. 만료일: {expires_at}`
  - `link_target`: `/mypage/points`
- 소스: `../09-loyalty/05-events.md`

#### `PointsRedeemed`

- 알림 목적: 포인트 사용 완료 안내
- 메시지 매핑:
  - `type`: `loyalty`
  - `title`: `포인트가 사용되었습니다`
  - `body`: `주문번호 {order_id}에 {amount}P 사용 완료.`
  - `link_target`: `/mypage/points`
- 소스: `../09-loyalty/05-events.md`

#### `PointsExpired`

- 알림 목적: 포인트 만료 안내
- 메시지 매핑:
  - `type`: `loyalty`
  - `title`: `포인트가 만료되었습니다`
  - `body`: `{amount}P가 유효기간 경과로 소멸되었습니다.`
  - `link_target`: `/mypage/points`
- 소스: `../09-loyalty/05-events.md`

#### `PointsAdjusted`

- 알림 목적: 운영자 포인트 조정 안내 (고객에게 결과 알림)
- 메시지 매핑:
  - `type`: `loyalty`
  - `title`: `포인트가 조정되었습니다`
  - `body`: `{delta}P 조정. 사유: {reason}`
  - `link_target`: `/mypage/points`
- 소스: `../09-loyalty/05-events.md`

### Promotion 이벤트

#### `PromotionApplied`

- 알림 목적: 카테고리 할인 적용 안내
- 메시지 매핑:
  - `type`: `promotion`
  - `title`: `할인이 적용되었습니다`
  - `body`: `주문에 {discount_amount}원 할인이 적용되었습니다.`
  - `link_target`: `/orders/{order_id}`
- 소스: `../08-promotion/05-events.md`

### Inquiry 이벤트

#### `InquiryCreated`

- 알림 목적: 문의 접수 확인 안내
- 메시지 매핑:
  - `type`: `inquiry`
  - `title`: `문의가 접수되었습니다`
  - `body`: `"{title}" 문의가 정상 접수되었습니다. 24시간 이내 답변 예정입니다.`
  - `link_target`: `/inquiries/{inquiryId}`
- 소스: `../11-inquiry/05-events.md`

#### `InquiryReplied`

- 알림 목적: 운영자 답변 등록 안내
- 메시지 매핑:
  - `type`: `inquiry`
  - `title`: `문의에 답변이 등록되었습니다`
  - `body`: `문의에 운영자 답변이 추가되었습니다.`
  - `link_target`: `/inquiries/{inquiryId}`
- 소스: `../11-inquiry/05-events.md`
- 비고: `is_internal=true`인 내부 메모 답변은 이벤트 미발행이므로 알림도 미생성

#### `InquiryStatusChanged`

- 알림 목적: 문의 상태 변경 안내 (resolved, closed 시)
- 메시지 매핑:
  - `type`: `inquiry`
  - `title`: `문의 상태가 변경되었습니다`
  - `body`: `문의 상태: {previousStatus} → {newStatus}`
  - `link_target`: `/inquiries/{inquiryId}`
- 소스: `../11-inquiry/05-events.md`
- 비고: 일반 상태 전이(`open → in_progress → resolved → closed`)에만 발행. 재오픈 전이는 `InquiryReopened`가 전담

#### `InquiryReopened`

- 알림 목적: 문의 재오픈 알림 (담당 운영자 대상)
- 메시지 매핑:
  - `type`: `inquiry`
  - `title`: `문의가 재오픈되었습니다`
  - `body`: `고객 추가 질문으로 문의가 재오픈되었습니다 (재오픈 {reopenCount}회). 재응답이 필요합니다.`
  - `link_target`: `/admin/inquiries/{inquiryId}`
- 소스: `../11-inquiry/05-events.md`
- 비고: 이 이벤트는 예외적으로 **운영자 대상** 알림이다. admin 앱에서 노출하며, notification 도메인이 admin 알림을 생성하는 유일한 케이스이다

## 처리 규칙

- envelope 규격 준수: `../13-event/01-overview.md`
- 멱등 처리: 동일 `eventId` 재수신 시 중복 알림 생성 금지 (`source_event_id` 유니크 제약으로 보장)
- 순서 허용 오차: 완전 순서 보장보다 사용자에게 최신 상태를 정확히 보여주는 것을 우선
- 실패 처리: 재시도 후 한계 초과 시 DLQ 이동, 운영 절차에 따라 redrive

## 메시지 템플릿 정책

- 메시지는 서버 측 하드코딩 템플릿 기반 (MVP)
- `{placeholder}` 자리에 이벤트 payload 값을 바인딩
- 다국어: MVP에서는 한국어(KR) 단일 지원
- 확장 시 템플릿 엔진/관리 API로 분리 가능

## 운영 연계

- 신뢰성 정책 원문: `../13-event/01-overview.md`
- 관측 지표(소비 지연, DLQ 적체)는 notification 도메인 UI가 아닌 observability에서 확인
- 운영자 향 경보(저재고, 재고 조정, 배차 실패 등)는 observability 도메인에서 별도 처리

## 비범위

- 이벤트 producer 계약 상세 정의
- 채널별(push/email/SMS) 발송 이벤트 파생 규칙 상세
- 운영자 대상 운영 경보 (observability 도메인 범위)
  - 예외: `InquiryReopened`는 운영자 알림으로 notification 도메인에서 처리
