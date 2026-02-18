# 03. 주문·재고·결제·배송 테이블 설계 근거

## 핵심 질문

> 커머스 코어 테이블은 어떤 운영/정합성 요구를 만족하기 위해 이런 구조인가?

## 한 줄 답

주문 상태 전이, 재고 음수 방지, 결제·배송 후속처리, 리뷰 구매검증, 문의 운영 흐름을 각각 테이블 경계와 제약으로 분해해 구현했다.

---

## 현재 접근 방식

```text
product.ts
- products, inventory

order.ts
- orders, order_items, payments, deliveries, substitutions

promotion.ts
- promotions, promotion_categories, coupons, coupon_redemptions, order_promotions

points.ts
- loyalty_accounts, point_policies, point_ledgers, point_redemptions

review.ts
- reviews, review_comments

inquiry.ts
- customer_inquiries, inquiry_replies
```

---

## products + inventory 분리

**Problem** — 상품 메타와 재고 수량을 같은 테이블에 두면 카탈로그 변경과 재고 동시성 처리가 서로 영향을 준다.

**Action** — 카탈로그와 재고를 분리했다.

```text
products: 상품 정보 + 판매 상태(active|low_stock|out_of_stock|discontinued)
inventory: on_hand, reserved, safety_threshold, version
```

**Result** — 커머스 도메인 정책(상품 상태 정책과 재고 동시성 정책)을 독립적으로 조정할 수 있다.

---

## orders + order_items + payments + deliveries 조합

**Problem** — 주문 라이프사이클(생성-결제-피킹-포장-배송)을 한 테이블로 몰아넣으면 이벤트/후속처리 경계가 흐려진다.

**Action** — 주문 본체와 하위 행위를 분리했다.

```text
orders: 상태 머신 중심 엔터티
order_items: SKU/수량/단가 스냅샷
payments: 결제 상태 이력
deliveries: 배송 상태/예상/완료 시각
```

**Result** — 결제/배송 실패를 주문 본체와 분리해 다룰 수 있어 운영 복구와 상태 추적이 쉬워진다.

---

## promotions + coupons + order_promotions 조합

**Problem** — 할인 정책을 주문 계산 코드에만 두면, 사후 정산/CS에서 "왜 이 할인금액이 나왔는가"를 재현하기 어렵다.

**Action** — 프로모션 정책과 적용 결과를 분리 저장했다.

```text
promotions: 할인 정책 본체(타입, 값, 기간, 최소주문금액)
coupons: 코드/사용한도/사용량
promotion_categories: 카테고리 할인 범위
coupon_redemptions: 사용자-주문 쿠폰 사용 이력
order_promotions: 주문에 최종 반영된 할인 스냅샷
```

**Result** — 쿠폰/카테고리 할인 충돌 정책과 최종 선택 결과를 데이터로 설명할 수 있어, 운영 시뮬레이션(재현/정산/CS)이 쉬워진다.

---

## loyalty_accounts + point_ledgers + point_redemptions 조합

**Problem** — 적립/차감/만료를 계정 잔액 숫자만 갱신하는 방식으로 처리하면, "왜 잔액이 이렇게 변했는가"를 사후 재현하기 어렵다.

**Action** — 잔액 요약과 거래 원장을 분리 저장했다.

```text
loyalty_accounts: 사용자 현재/대기/누적 포인트 스냅샷
point_policies: 적립/사용 정책(비율, 최소사용, 환산율)
point_ledgers: 적립/차감/만료/조정 거래 원장
point_redemptions: 주문 단위 포인트 사용 결과
```

**Result** — 주문 취소 복원, 만료 배치, 운영자 수동 조정까지 거래 단위로 추적할 수 있어 정산/CS 대응이 쉬워진다.

---

## substitutions 별도 모델

**Problem** — 부분 품절 대응을 order_items만으로 표현하면 원상품/대체상품 관계와 승인 상태를 명확히 남기기 어렵다.

**Action** — 대체를 별도 테이블로 모델링했다.

```text
substitutions
- original_product_id FK
- substitute_product_id FK
- order_id FK
- status
```

**Result** — 커머스 도메인 정책의 대체 정책(허용 SKU, 가격 차이 승인)을 데이터 모델로 확장 가능한 구조가 된다.

---

## reviews(order_item_id unique) + review_comments

**Problem** — 리뷰를 user+product 기준으로만 두면 "실구매 검증"과 "주문 아이템당 1회" 정책을 정확히 강제하기 어렵다.

**Action** — 리뷰를 `order_item_id`와 직접 연결하고 unique 제약을 뒀다.

```text
reviews.order_item_id UNIQUE
reviews.user_id FK
review_comments.review_id FK
```

**Result** — 구매 검증 정책과 중복 리뷰 방지 정책을 저장소 모델에 직접 반영할 수 있다.

---

## inquiries + replies 모델

**Problem** — 문의 상태 전이와 답변 히스토리를 한 행으로 관리하면 운영자 처리 이력 추적이 어렵다.

**Action** — 문의 본문과 답변을 분리했다.

```text
customer_inquiries: category, subject, content, status
inquiry_replies: inquiry_id, user_id, content, created_at
```

**Result** — `open -> in_progress -> resolved -> closed` 흐름과 다회 답변 히스토리를 함께 운영할 수 있다.

---

## 이 프로젝트에서의 적용

| 결정                                | 해결하는 문제                                |
| ----------------------------------- | -------------------------------------------- |
| products/inventory 분리             | 카탈로그 변경과 재고 동시성 로직 결합 리스크 |
| orders + payments + deliveries 분리 | 주문 상태와 결제/배송 후속상태 혼합 문제     |
| promotions/coupons 결과 스냅샷화    | 할인 계산 근거 추적 불가 및 정산 재현 어려움 |
| points 원장 + 잔액 분리             | 포인트 변동 사유 추적 불가/이중 차감 리스크  |
| substitutions 별도 모델             | 부분 품절/대체 승인 규칙 표현 불가 문제      |
| reviews.order_item_id unique        | 실구매 검증/중복 리뷰 방지 정책 구현 난이도  |
| inquiries/replies 분리              | 문의 상태 전이와 답변 이력 추적 누락         |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../02-architecture/backend/01-backend.adr.md)

---

## 다음 문서

[04. 무결성·운영성·마이그레이션 설계 근거](./04-integrity-and-operations-rationale.md) — 왜 enum/FK/check/마이그레이션 분리 전략을 함께 쓰는가?
