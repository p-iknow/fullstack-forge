# 02a. Commerce Core — 도메인 API + 프론트엔드 + 테스트

## Prerequisite

- [02-auth-and-security](./02-auth-and-security.md) 완료

## Roadmap Companion

- [roadmap/02a-commerce-core-implementation](../roadmap/02a-commerce-core-implementation.md)

## Harness 참조

- [04-backend](../harness/04-backend.md)
- [05-integration](../harness/05-integration.md)
- [03-frontend](../harness/03-frontend.md)
- [02-packages](../harness/02-packages.md)

## 검증 체크리스트

### TypeSpec 계약 확장

- [ ] 주문/리뷰/문의 모델이 TypeSpec에 정의됨
- [ ] `pnpm --filter @fullstack-forge/api-spec codegen` 성공
- [ ] `openapi.yaml`에 `/orders`, `/reviews`, `/inquiries` 경로 포함
- [ ] `pnpm typecheck` 통과

### 카탈로그 + 재고

- [ ] `products`, `inventory` 테이블 migration 적용
- [ ] seed 데이터 투입 (40~60 SKU)
- [ ] `curl http://localhost:8080/products` → 상품 목록 응답
- [ ] `curl http://localhost:8080/products/<id>` → 상품 상세 + 재고 상태 응답
- [ ] `out_of_stock` 상품은 주문 불가 확인

### 주문 플로우

- [ ] `curl -X POST http://localhost:8080/orders` → 주문 생성 201
- [ ] `curl http://localhost:8080/orders/<id>` → 주문 상태 조회
- [ ] 주문 생성 시 재고 `reserved` 증가 확인
- [ ] 불법 상태 전이 시도 시 400/409 응답 (예: `created → delivered` 직접 전이)
- [ ] 음수 재고 시도 시 차단 확인

### 리뷰/댓글

- [ ] `curl -X POST http://localhost:8080/reviews` (인증된 구매자) → 리뷰 생성 201
- [ ] 비구매자(`delivered` 아닌 주문)의 리뷰 작성 시 403
- [ ] 동일 `order_item`에 중복 리뷰 시 409
- [ ] `curl -X POST http://localhost:8080/reviews/<id>/comments` → 댓글 생성 201
- [ ] `curl -X PATCH http://localhost:8080/reviews/<id>` → 리뷰 수정 200

### 고객 문의

- [ ] `curl -X POST http://localhost:8080/inquiries` → 문의 생성 201
- [ ] `curl http://localhost:8080/inquiries/<id>` → 본인 문의 조회
- [ ] 타인 문의 조회 시도 시 403
- [ ] `curl -X POST http://localhost:8080/inquiries/<id>/replies` (operator) → 답변 201
- [ ] 문의 상태 전이(`open → in_progress → resolved`) 확인

### 프론트엔드 화면

- [ ] store에서 상품 목록 → 상세 → 주문 생성 플로우 동작
- [ ] store에서 리뷰 목록 조회 + 작성(구매자) 동작
- [ ] store에서 문의 생성 + 조회 동작
- [ ] TanStack Query 캐시 동작 확인 (동일 데이터 재요청 시 캐시 hit)

### 테스트

- [ ] 도메인 로직 단위 테스트 통과 (`pnpm --filter @fullstack-forge/api test`)
- [ ] 프론트엔드 컴포넌트 테스트 통과 (`pnpm --filter @fullstack-forge/store test`)
- [ ] `pnpm test` 전체 통과

## Troubleshooting

### 주문 생성 시 재고 관련 에러

- `inventory` 테이블에 seed 데이터가 있는지 확인
- `available = on_hand - reserved`가 0 이하이면 주문 불가
- 동시성 테스트에서 실패하면 락 전략(optimistic/pessimistic) 적용 확인

### TypeSpec 변경 후 타입 불일치

```bash
pnpm --filter @fullstack-forge/api-spec codegen
npx nx reset
pnpm typecheck
```

### 리뷰 권한 검증 실패

- 요청에 인증 쿠키/토큰이 포함되어 있는지 확인
- 해당 사용자가 `delivered` 상태 주문의 구매자인지 DB 확인
- `order_items` 테이블에서 `user_id`와 `product_id` 매칭 확인

### 프론트엔드에서 API 호출 실패

- Vite proxy 설정 확인 (`/api/*` → `localhost:8080`)
- 백엔드 서버 실행 중인지 확인 (`pnpm --filter @fullstack-forge/api dev`)
- 브라우저 개발자 도구 Network 탭에서 실제 요청 URL과 응답 확인

## Next

- 인프라 + 네트워킹 → [03-infra-and-networking](./03-infra-and-networking.md)
