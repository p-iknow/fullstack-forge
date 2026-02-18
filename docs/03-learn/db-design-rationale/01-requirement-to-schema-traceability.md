# 01. 요구사항-스키마 추적 지도

## 핵심 질문

> 어떤 요구사항이 어떤 테이블/제약으로 연결되는가?

## 한 줄 답

이 프로젝트의 DB 설계는 PRD 정책(인증/주문/재고/리뷰/문의)을 테이블, enum, FK, check constraint로 번역한 결과다.

---

## 현재 접근 방식

요구사항 문서에서 도메인 정책을 정의하고, 스키마에서 이를 구조/제약으로 반영한다.

```text
Requirement source
- docs/01-prd/01-auth/01-overview.md
- docs/01-prd/README.md (도메인별 정책은 각 도메인 디렉토리 참조)

Design source
- apps/api/src/db/schema/auth.ts
- apps/api/src/db/schema/product.ts
- apps/api/src/db/schema/order.ts
- apps/api/src/db/schema/review.ts
- apps/api/src/db/schema/inquiry.ts
- apps/api/src/db/schema/relations.ts
```

---

## 인증/계정 정책 -> auth 테이블군

**Problem** — 인증 요구사항(계정 상태, 역할, OAuth, 세션 회전, 감사 로그)을 단일 users 테이블로만 다루면 보안/감사 정책을 세분화하기 어렵다.

**Action** — auth를 역할별 테이블로 분리했다.

```text
users
user_credentials
user_oauth_accounts
user_sessions
audit_logs
```

**Result** — `docs/01-prd/01-auth/01-overview.md`의 계정 상태/권한/감사 요구를 저장소 레벨에서 분리 관리할 수 있다.

---

## 커머스 정책 -> order/product/review/inquiry 테이블군

**Problem** — 주문/재고/리뷰/문의를 한 테이블군에 섞으면 상태 전이, 구매 검증, 운영 처리 경계가 불명확해진다.

**Action** — 커머스 코어를 도메인별로 분해했다.

```text
product domain: products, inventory
order domain: orders, order_items, payments, deliveries, substitutions
review domain: reviews, review_comments
inquiry domain: customer_inquiries, inquiry_replies
```

**Result** — 커머스 도메인 정책의 엔터티/상태/권한 정책을 도메인 경계 기준으로 유지보수 가능하게 만들었다.

---

## 정책 문장 -> DB 제약 번역

**Problem** — 요구사항 문장을 코드에서만 검증하면 경합/누락 시 데이터 오염 가능성이 남는다.

**Action** — 주요 정책을 DB 제약으로 번역했다.

```text
status 집합 -> pgEnum(...)
참조 무결성 -> .references(...) (FK)
재고 불변식 -> check(reserved <= on_hand)
리뷰 중복 방지 -> unique(order_item_id)
```

**Result** — 정책 위반 데이터가 저장 단계에서 조기 차단되어, 운영 안정성이 높아진다.

---

## 이 프로젝트에서의 적용

| 결정                          | 해결하는 문제                                    |
| ----------------------------- | ------------------------------------------------ |
| PRD 기준 도메인별 테이블 분리 | 요구사항-구현 추적 불가능 문제                   |
| enum/FK/check/unique 번역     | 정책 문장이 런타임에서만 검증되는 취약점         |
| auth/commerce 경계 분리       | 보안 정책과 주문 정책이 뒤섞이는 유지보수 리스크 |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../02-architecture/backend/01-backend.adr.md)

---

## 다음 문서

[02. 인증·계정 테이블 설계 근거](./02-auth-and-account-table-rationale.md) — auth/account 영역 테이블은 어떤 보안·권한 요구를 만족하기 위해 이런 구조인가?
