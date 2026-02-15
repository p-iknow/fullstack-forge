# 02a. Commerce Core Implementation

## Step Objective

퀵커머스 핵심 도메인(카탈로그/주문/리뷰/문의)의 API와 프론트엔드를 구현하여
end-to-end 비즈니스 플로우를 동작 가능한 수준으로 완성한다.

## Prerequisite

- [02-authentication-and-authorization](./02-authentication-and-authorization.md)

## References

- [03-commerce-domain-policy](../prd/03-commerce-domain-policy.md)
- [02-user-flows-and-auth-policy](../prd/02-user-flows-and-auth-policy.md)
- [04-backend](../harness/04-backend.md)
- [05-integration](../harness/05-integration.md)
- [03-frontend](../harness/03-frontend.md)
- [02-packages (api-spec)](../harness/02-packages.md)

## Progressive Tasks

### 1) 카탈로그 + 재고 기반 구축

- `products`, `inventory` 스키마 → migration 적용
- `GET /products`, `GET /products/:id` API 구현
- seed 데이터 준비 (40~60 SKU, 카테고리 6개)
- 상품 상태(`active|low_stock|out_of_stock|discontinued`) 노출 정책 적용
- store 화면: 상품 목록/상세

### 2) 주문 플로우 구현

- `orders`, `order_items`, `payments`, `deliveries` 스키마 → migration 적용
- `POST /orders`, `GET /orders/:id` API 구현
- 주문 상태 전이 규칙 적용 및 불법 전이 차단 (`created → paid → picking → packed → out_for_delivery → delivered`)
- 재고 차감(reserved/available) 로직 + 동시성 제어
- `OrderCreated` 이벤트 publish (SNS topic 연동은 03에서 검증)
- store 화면: 주문 생성/상태 조회

### 3) 리뷰/댓글 구현

- `reviews`, `review_comments` 스키마 → migration 적용
- `POST /reviews`, `PATCH /reviews/:id`, `POST /reviews/:id/comments` API 구현
- 구매 검증(`delivered` 상태 주문의 구매자만 리뷰 작성 허용)
- 사용자당 `order_item` 기준 중복 리뷰 차단
- TypeSpec 계약 확장 + codegen 반영
- store 화면: 상품 상세 내 리뷰 목록/작성/댓글

### 4) 고객 문의 구현

- `customer_inquiries`, `inquiry_replies` 스키마 → migration 적용
- `POST /inquiries`, `GET /inquiries/:id`, `POST /inquiries/:id/replies` API 구현
- 문의 카테고리(`order|payment|delivery|product|account|other`)와 상태 전이 적용
- 고객 본인 문의만 조회 가능 정책 적용
- TypeSpec 계약 확장 + codegen 반영
- store 화면: 문의 생성/상세 조회

### 5) 테스트 기반 구축

- 도메인 로직 단위 테스트 (상태 전이 규칙, 재고 차감, 구매 검증)
- API 라우트 통합 테스트 (Hono `app.request` 패턴)
- 프론트엔드 컴포넌트 테스트 (주문 폼, 리뷰 작성 폼)
- 테스트 커버리지 기준선 확인

## Local Environment Increment

- seed 스크립트(`db:seed`)를 추가해 로컬에서 반복 테스트 가능하게 구성
- 로컬에서 상품 조회 → 주문 생성 → 리뷰 작성 → 문의 생성을 한 세션으로 연속 실행
- API spec 변경 → codegen → typecheck → 프론트/백 타입 에러 해소 루프를 반복

## Exit Criteria

- 주문 생성/조회 + 상태 전이 성공 (불법 전이 차단 포함)
- 비구매자 리뷰 작성 차단 + 구매자 리뷰/댓글 성공
- 고객 문의 생성/조회 + 답변 흐름 성공
- 재고 음수 허용 안 됨 검증
- TypeSpec 계약과 실제 API 응답의 타입 일치 검증 (`pnpm typecheck`)
- 도메인 단위 테스트 통과

## Evidence

- 주문 상태 전이 테스트 결과
- 구매 검증 리뷰 권한 테스트 로그
- 재고 동시성 테스트 결과
- TypeSpec → codegen → typecheck 통과 로그
- 프론트엔드 주요 화면 스크린샷 (상품 목록, 주문 상태, 리뷰 영역, 문의 상세)

## Output for Next Step

- 인프라(03)에서 사용할 도메인 API 엔드포인트 준비 완료
- 이벤트(06에서 검증)에서 사용할 `OrderCreated` publish 경로 준비 완료
- 운영(07)에서 사용할 admin 운영 대상 도메인 플로우 준비 완료
