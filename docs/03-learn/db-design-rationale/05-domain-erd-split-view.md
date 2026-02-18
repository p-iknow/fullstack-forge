# 05. 도메인 분할 ERD

## 핵심 질문

> 현재 스키마를 도메인 단위로 보면 관계 구조가 어떻게 나뉘는가?

## 한 줄 답

Auth, Product, Order, Promotion, Points, Review, Inquiry 도메인으로 ERD를 분할하면 책임 경계와 FK 흐름을 한 번에 이해할 수 있다.

---

## 현재 접근 방식

```text
schema split
- auth.ts
- product.ts
- order.ts
- promotion.ts
- points.ts
- review.ts
- inquiry.ts
- relations.ts
```

---

## Auth / Account ERD

```mermaid
erDiagram
  USERS ||--|| USER_CREDENTIALS : has
  USERS ||--o{ USER_OAUTH_ACCOUNTS : links
  USERS ||--o{ USER_SESSIONS : owns
  USERS ||--o{ AUDIT_LOGS : generates

  USERS {
    uuid id
    text email
    text name
    enum role
    enum status
    timestamptz created_at
  }

  USER_CREDENTIALS {
    uuid user_id
    text password_hash
    timestamptz updated_at
  }

  USER_OAUTH_ACCOUNTS {
    uuid id
    uuid user_id
    enum provider
    text provider_user_id
    text email
    timestamptz created_at
  }

  USER_SESSIONS {
    uuid id
    uuid user_id
    text refresh_token_hash
    boolean revoked
    timestamptz expires_at
    timestamptz created_at
  }

  AUDIT_LOGS {
    uuid id
    uuid user_id
    text event
    text ip_address
    text user_agent
    text request_id
    enum provider
    text result_code
    timestamptz created_at
  }
```

---

## Product / Inventory ERD

```mermaid
erDiagram
  PRODUCTS ||--|| INVENTORY : has_stock

  PRODUCTS {
    uuid id
    text name
    text description
    int price
    enum status
    text category_id
    text image_url
    boolean is_substitutable
    timestamptz created_at
  }

  INVENTORY {
    uuid product_id
    int on_hand
    int reserved
    int safety_threshold
    int version
  }
```

---

## Order / Payment / Delivery / Substitution ERD

```mermaid
erDiagram
  USERS ||--o{ ORDERS : places
  ORDERS ||--o{ ORDER_ITEMS : contains
  PRODUCTS ||--o{ ORDER_ITEMS : item_of
  ORDERS ||--o{ PAYMENTS : paid_by
  ORDERS ||--o{ DELIVERIES : delivered_by
  ORDERS ||--o{ ORDER_PROMOTIONS : discounted_by
  ORDERS ||--o{ SUBSTITUTIONS : has
  PRODUCTS ||--o{ SUBSTITUTIONS : original
  PRODUCTS ||--o{ SUBSTITUTIONS : substitute
  PROMOTIONS ||--o{ ORDER_PROMOTIONS : applied_to

  ORDERS {
    uuid id
    uuid user_id
    enum status
    int total_amount
    timestamptz created_at
    timestamptz updated_at
  }

  ORDER_ITEMS {
    uuid id
    uuid order_id
    uuid product_id
    int quantity
    int unit_price
    uuid substitution_id
  }

  PAYMENTS {
    uuid id
    uuid order_id
    enum method
    enum status
    int amount
    timestamptz paid_at
  }

  DELIVERIES {
    uuid id
    uuid order_id
    enum status
    enum mode
    timestamptz estimated_at
    timestamptz delivered_at
  }

  ORDER_PROMOTIONS {
    uuid id
    uuid order_id
    uuid promotion_id
    uuid coupon_redemption_id
    int discount_amount
  }

  SUBSTITUTIONS {
    uuid id
    uuid original_product_id
    uuid substitute_product_id
    uuid order_id
    enum status
  }
```

---

## Review / Comment ERD

```mermaid
erDiagram
  USERS ||--o{ REVIEWS : writes
  ORDER_ITEMS ||--o| REVIEWS : reviewed_once
  REVIEWS ||--o{ REVIEW_COMMENTS : has
  USERS ||--o{ REVIEW_COMMENTS : comments

  REVIEWS {
    uuid id
    uuid user_id
    uuid order_item_id
    int rating
    text content
    boolean hidden
    timestamptz created_at
    timestamptz updated_at
  }

  REVIEW_COMMENTS {
    uuid id
    uuid review_id
    uuid user_id
    text content
    boolean hidden
    timestamptz created_at
  }
```

---

## Inquiry / Reply ERD

```mermaid
erDiagram
  USERS ||--o{ CUSTOMER_INQUIRIES : creates
  CUSTOMER_INQUIRIES ||--o{ INQUIRY_REPLIES : has
  USERS ||--o{ INQUIRY_REPLIES : writes

  CUSTOMER_INQUIRIES {
    uuid id
    uuid user_id
    enum category
    text subject
    text content
    enum status
    timestamptz created_at
    timestamptz updated_at
  }

  INQUIRY_REPLIES {
    uuid id
    uuid inquiry_id
    uuid user_id
    text content
    timestamptz created_at
  }
```

---

## Promotion / Coupon ERD

```mermaid
erDiagram
  PROMOTIONS ||--o{ PROMOTION_CATEGORIES : scopes
  PROMOTIONS ||--o{ COUPONS : issues
  COUPONS ||--o{ COUPON_REDEMPTIONS : redeemed
  USERS ||--o{ COUPON_REDEMPTIONS : uses
  ORDERS ||--o{ COUPON_REDEMPTIONS : consumes
  PROMOTIONS ||--o{ ORDER_PROMOTIONS : selected
  ORDERS ||--o{ ORDER_PROMOTIONS : contains

  PROMOTIONS {
    uuid id
    text name
    enum type
    enum discount_type
    int discount_value
    int min_order_amount
    timestamptz starts_at
    timestamptz ends_at
    enum status
  }

  PROMOTION_CATEGORIES {
    uuid id
    uuid promotion_id
    text category_id
  }

  COUPONS {
    uuid id
    uuid promotion_id
    text code
    int max_uses
    int per_user_limit
    int used_count
    timestamptz expires_at
  }

  COUPON_REDEMPTIONS {
    uuid id
    uuid coupon_id
    uuid user_id
    uuid order_id
    int discount_amount
    timestamptz redeemed_at
  }

  ORDER_PROMOTIONS {
    uuid id
    uuid order_id
    uuid promotion_id
    uuid coupon_redemption_id
    int discount_amount
    text selected_by_rule
  }
```

---

## Points / Loyalty ERD

```mermaid
erDiagram
  USERS ||--|| LOYALTY_ACCOUNTS : owns
  POINT_POLICIES ||--o{ POINT_LEDGERS : governs
  USERS ||--o{ POINT_LEDGERS : records
  ORDERS ||--o{ POINT_LEDGERS : source_order
  USERS ||--o{ POINT_REDEMPTIONS : uses
  ORDERS ||--o| POINT_REDEMPTIONS : redeemed_once

  LOYALTY_ACCOUNTS {
    uuid user_id
    int available_points
    int pending_points
    int lifetime_earned
    int lifetime_redeemed
    timestamptz updated_at
  }

  POINT_POLICIES {
    uuid id
    text name
    enum accrual_type
    int accrual_value
    int min_order_amount
    int max_earn_per_order
    int min_redeem_points
    int point_to_currency_rate
    timestamptz starts_at
    timestamptz ends_at
    enum status
  }

  POINT_LEDGERS {
    uuid id
    uuid user_id
    uuid order_id
    uuid policy_id
    enum transaction_type
    enum source_type
    int points
    enum status
    timestamptz available_at
    timestamptz expires_at
    timestamptz created_at
  }

  POINT_REDEMPTIONS {
    uuid id
    uuid user_id
    uuid order_id
    int points_used
    int discount_amount
    timestamptz created_at
  }
```

---

## 이 프로젝트에서의 적용

| 결정                       | 해결하는 문제                                  |
| -------------------------- | ---------------------------------------------- |
| 도메인별 ERD 분할 제시     | 단일 ERD 과밀로 핵심 경계 파악이 어려운 문제   |
| FK 흐름 가시화             | 어떤 참조가 핵심 트랜잭션 경계인지 모호한 문제 |
| auth/commerce 분리 시각화  | 권한/보안 모델과 주문 도메인 모델 혼동         |
| promotion/coupon 경계 추가 | 할인 정책과 주문 정산 결과 추적 분리           |
| points/loyalty 경계 추가   | 적립/차감/만료 변동 이력과 잔액 관리 분리      |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../02-architecture/backend/01-backend.adr.md)

---

## 이전 문서

[04. 무결성·운영성·마이그레이션 설계 근거](./04-integrity-and-operations-rationale.md) — 왜 enum/FK/check/마이그레이션 분리 전략을 함께 쓰는가?
