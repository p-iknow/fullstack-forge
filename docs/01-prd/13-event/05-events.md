# Event Domain Events Registry

이 문서는 전체 도메인 이벤트 레지스트리와 엔벨로프 공통 규격의 단일 정의 위치다.

## 1) 엔벨로프 공통 규격

### 필수 envelope 필드

- `eventId` (UUID)
- `eventType` (예: `OrderCreated`, `ReviewCreated`, `InquiryCreated`, `InquiryReplied`)
- `schemaVersion` (예: `v1`)
- `occurredAt` (ISO timestamp)
- `traceId`
- `source`
- `payload`

### 버전 정책

- 호환성 깨지는 변경은 `schemaVersion` 증가 필수
- 소비자는 최소 2개 버전까지 backward compatible 권장

## 2) 이벤트 타입 레지스트리

### 주문

- `OrderCreated`
  - payload 필드: `orderId`, `customerId`, `storeId`, `items`, `totalAmount`, `createdAt`
- `OrderCancelled`
  - payload 필드: `orderId`, `customerId`, `reasonCode`, `cancelledBy`, `cancelledAt`
- `OrderStatusChanged`
  - payload 필드: `orderId`, `fromStatus`, `toStatus`, `changedBy`, `changedAt`

### 결제

- `PaymentAuthorized`
  - payload 필드: `orderId`, `paymentId`, `method`, `authorizedAmount`, `authorizedAt`
- `PaymentCaptured`
  - payload 필드: `orderId`, `paymentId`, `capturedAmount`, `transactionId`, `capturedAt`
- `PaymentFailed`
  - payload 필드: `orderId`, `paymentId`, `failureCode`, `failureReason`, `failedAt`

### 재고

- `InventoryReserved`
  - payload 필드: `orderId`, `reservationId`, `storeId`, `items`, `reservedAt`, `expiresAt`
- `InventoryReleased`
  - payload 필드: `orderId`, `reservationId`, `storeId`, `items`, `releaseReason`, `releasedAt`

### 배송

- `DeliveryCreated`
  - payload 필드: `orderId`, `deliveryId`, `carrier`, `deliveryAddressId`, `createdAt`
- `DeliveryStatusChanged`
  - payload 필드: `orderId`, `deliveryId`, `fromStatus`, `toStatus`, `changedAt`

### 리뷰/댓글

- `ReviewCreated`
  - payload 필드: `reviewId`, `orderId`, `productId`, `authorId`, `rating`, `createdAt`
- `ReviewCommentCreated`
  - payload 필드: `commentId`, `reviewId`, `authorId`, `content`, `createdAt`
- `ReviewHiddenByOperator`
  - payload 필드: `reviewId`, `operatorId`, `reasonCode`, `hiddenAt`

### 고객 문의

- `InquiryCreated`
  - payload 필드: `inquiryId`, `customerId`, `category`, `title`, `createdAt`
- `InquiryReplied`
  - payload 필드: `inquiryId`, `replyId`, `operatorId`, `replyStatus`, `repliedAt`
- `InquiryStatusChanged`
  - payload 필드: `inquiryId`, `fromStatus`, `toStatus`, `changedAt`

### 알림

- `NotificationRequested`
  - payload 필드: `notificationId`, `channel`, `recipientId`, `templateCode`, `requestedAt`
- `NotificationSent`
  - payload 필드: `notificationId`, `channel`, `providerMessageId`, `sentAt`
- `NotificationFailed`
  - payload 필드: `notificationId`, `channel`, `failureCode`, `failureReason`, `failedAt`

## 3) 레지스트리 운영 규칙

- 이 문서는 이벤트 이름, 공통 계약, payload 필드 개요를 정의한다.
- 각 도메인별 payload 타입/제약/예시는 각 도메인 문서에서 관리한다.
- fanout 소비자는 `eventType`과 `schemaVersion`으로 라우팅/역직렬화한다.
