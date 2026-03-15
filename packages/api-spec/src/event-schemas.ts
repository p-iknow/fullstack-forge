import { z } from 'zod'

export const eventEnvelopeSchema = z.object({
  eventId: z.uuid(),
  eventType: z.string(),
  schemaVersion: z.string(),
  occurredAt: z.string().datetime(),
  traceId: z.uuid(),
  source: z.string(),
  payload: z.record(z.string(), z.unknown()),
})

export const EVENT_TYPES = {
  // 주문
  ORDER_CREATED: 'OrderCreated',
  ORDER_CANCELLED: 'OrderCancelled',
  ORDER_STATUS_CHANGED: 'OrderStatusChanged',
  // 결제
  PAYMENT_AUTHORIZED: 'PaymentAuthorized',
  PAYMENT_CAPTURED: 'PaymentCaptured',
  PAYMENT_FAILED: 'PaymentFailed',
  PAYMENT_CANCELLED: 'PaymentCancelled',
  PAYMENT_REFUNDED: 'PaymentRefunded',
  // 재고
  INVENTORY_RESERVED: 'InventoryReserved',
  INVENTORY_RELEASED: 'InventoryReleased',
  // 배송
  DELIVERY_CREATED: 'DeliveryCreated',
  DELIVERY_STATUS_CHANGED: 'DeliveryStatusChanged',
  // 리뷰
  REVIEW_CREATED: 'ReviewCreated',
  REVIEW_COMMENT_CREATED: 'ReviewCommentCreated',
  REVIEW_HIDDEN_BY_OPERATOR: 'ReviewHiddenByOperator',
  // 문의
  INQUIRY_CREATED: 'InquiryCreated',
  INQUIRY_REPLIED: 'InquiryReplied',
  INQUIRY_STATUS_CHANGED: 'InquiryStatusChanged',
  // 알림
  NOTIFICATION_REQUESTED: 'NotificationRequested',
  NOTIFICATION_SENT: 'NotificationSent',
  NOTIFICATION_FAILED: 'NotificationFailed',
} as const

export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>
export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]
