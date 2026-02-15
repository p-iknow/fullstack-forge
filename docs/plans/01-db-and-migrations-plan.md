# DB and Migrations Plan

## Scope

Roadmap 01 (DB Design and Migrations) 범위만 다룬다.
PostgreSQL 로컬 부트스트랩 → Drizzle 스키마 → 마이그레이션 루프 → 백업/복구 훈련.

## Gap Analysis

| Item            | Current  | Target                                                                                                                                       |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL      | 미설치   | Docker 컨테이너 (`localhost:5432`)                                                                                                           |
| Drizzle config  | 미존재   | `drizzle.config.ts` + `src/db/client.ts`                                                                                                     |
| Auth 테이블     | 미존재   | users, credentials, oauth_accounts, sessions, audit_logs                                                                                     |
| Commerce 테이블 | 미존재   | products, inventory, orders, order_items, payments, deliveries, substitutions, reviews, review_comments, customer_inquiries, inquiry_replies |
| 마이그레이션    | 미존재   | `apps/api/drizzle/` SQL + 적용 루프                                                                                                          |
| 백업/복구       | 미존재   | pg_dump/pg_restore 템플릿 + 리허설                                                                                                           |
| TypeSpec 계약   | health만 | 도메인 모델 포함 (다음 plan에서 확장)                                                                                                        |

## Branch/PR Strategy

- 이전 plan과 동일: 1 branch = 1 unit, squash merge, `feat/*` 네이밍.
- Unit N은 Unit N-1 머지 후 시작.

```text
Unit 1 → Unit 2 → Unit 3

feat/db-setup
  → feat/db-schema
    → feat/db-seed-and-ops
```

## Unit 1: `feat/db-setup`

### Step Objective

- Implementation goal: PostgreSQL 로컬 컨테이너 실행 + Drizzle ORM 설정 + DB 클라이언트 모듈 생성.
- Learning/operational goal: DB 연결 루프(`env → client → connection`)를 확립하고, 이후 스키마 작업의 기반을 마련한다.

### Prerequisite

- [x] Scaffolding plan (00) 완료. main에 apps/api 골격 존재.
- [x] Docker Desktop 또는 OrbStack 실행 중.

### References

- [harness/04-backend.md](../harness/04-backend.md) — 로컬 부트스트랩, drizzle.config.ts, .env.example
- [execution/01-db-and-migrations.md](../execution/01-db-and-migrations.md) — DB 셋업 체크리스트
- [roadmap/01-db-design-and-migrations.md](../roadmap/01-db-design-and-migrations.md) — Local Environment Increment

### Progressive Tasks

1. `apps/api/.env.example` 확장 (`DATABASE_URL` 포함, harness 기준).
2. `apps/api/drizzle.config.ts` 생성 (harness 04-backend 기준).
3. `apps/api/src/db/client.ts` 생성 — Drizzle PostgreSQL 클라이언트.
4. `apps/api/package.json`에 `drizzle-orm`, `pg`, `drizzle-kit` 의존성 추가 + `db:generate`, `db:migrate`, `db:studio` 스크립트 추가.
5. PostgreSQL Docker 실행 명령을 문서 또는 스크립트로 정리.
6. `pg_isready` 또는 앱 헬스체크로 DB 연결 확인.

### Exit Criteria

- [x] PostgreSQL 컨테이너 실행 중 (`pg_isready -h localhost -p 5432` 성공).
- [x] `apps/api/drizzle.config.ts` 존재하고 `DATABASE_URL`을 참조.
- [x] `apps/api/src/db/client.ts`에서 Drizzle 클라이언트를 export.
- [x] `pnpm --filter @fullstack-forge/api typecheck` 통과.
- [x] `pnpm lint && pnpm format:check` 통과.

### Evidence

- Command logs:
  - `pnpm --filter @fullstack-forge/api db:pg:ready` → `localhost:5432 - accepting connections`
  - `pnpm --filter @fullstack-forge/api typecheck` → 성공
  - `pnpm lint && pnpm format:check` → 성공
- Artifacts: drizzle.config.ts, db/client.ts, .env.example 변경 내역.
- Notes: Redis는 이 단계에서 설정하지 않음 (auth plan에서 추가).

### Output for Next Step

- DB 연결이 검증된 상태. 스키마 정의 즉시 가능.

## Unit 2: `feat/db-schema`

### Step Objective

- Implementation goal: PRD 도메인 정책의 전체 엔터티를 Drizzle 스키마로 정의하고 초기 마이그레이션을 생성·적용한다.
- Learning/operational goal: 상태 전이 제약, 관계(relations), enum 타입을 Drizzle로 표현하는 방법을 익힌다.

### Prerequisite

- [x] Unit 1 작업 완료(동일 worktree).
- [x] PostgreSQL 로컬 컨테이너 실행 중.

### References

- [prd/03-commerce-domain-policy.md](../prd/03-commerce-domain-policy.md) — 엔터티 목록, 상태 전이 규칙, 재고 정책
- [prd/02-user-flows-and-auth-policy.md](../prd/02-user-flows-and-auth-policy.md) — 계정 상태, 권한 역할
- [harness/04-backend.md](../harness/04-backend.md) — src/db/schema.ts 기준 코드

### Progressive Tasks

1. **Auth 도메인 테이블** 정의 (`src/db/schema.ts` 또는 `src/db/schema/` 분리):
   - `users` (id, email, name, role, status, createdAt)
   - `user_credentials` (userId FK, passwordHash, updatedAt)
   - `user_oauth_accounts` (id, userId FK, provider, providerUserId, email, createdAt)
   - `user_sessions` (id, userId FK, refreshTokenHash, revoked, expiresAt, createdAt)
   - `audit_logs` (id, userId FK nullable, event, ipAddress, userAgent, createdAt)
2. **Commerce 도메인 테이블** 정의:
   - `products` (id, name, description, price, status enum, categoryId, imageUrl, createdAt)
   - `inventory` (productId FK, onHand, reserved, safetyThreshold, version)
   - `orders` (id, userId FK, status enum, totalAmount, createdAt, updatedAt)
   - `order_items` (id, orderId FK, productId FK, quantity, unitPrice, substitutionId nullable)
   - `payments` (id, orderId FK, method, status enum, amount, paidAt)
   - `deliveries` (id, orderId FK, status enum, estimatedAt, deliveredAt)
   - `substitutions` (id, originalProductId FK, substituteProductId FK, orderId FK, status enum)
   - `reviews` (id, userId FK, orderItemId FK unique, rating, content, hidden, createdAt, updatedAt)
   - `review_comments` (id, reviewId FK, userId FK, content, hidden, createdAt)
   - `customer_inquiries` (id, userId FK, category, subject, content, status enum, createdAt, updatedAt)
   - `inquiry_replies` (id, inquiryId FK, userId FK, content, createdAt)
3. **Enum 타입** 정의 (주문/결제/배송/상품/계정/문의 상태).
4. **Relations** 정의 (Drizzle relations API).
5. `pnpm --filter @fullstack-forge/api db:generate` 실행 → 마이그레이션 SQL 생성.
6. `pnpm --filter @fullstack-forge/api db:migrate` 실행 → 마이그레이션 적용.

### Exit Criteria

- [x] 모든 PRD 필수 엔터티가 스키마에 정의됨 (누락 없음).
- [x] 주문 상태 enum이 PRD 전이 규칙을 반영 (`created → paid|cancelled|failed` 등).
- [x] `pnpm --filter @fullstack-forge/api db:generate` 성공.
- [x] `pnpm --filter @fullstack-forge/api db:migrate` 성공 (테이블 생성 확인).
- [x] `pnpm --filter @fullstack-forge/api typecheck` 통과.
- [x] `apps/api/drizzle/` 디렉토리에 마이그레이션 SQL 존재.
- [x] `pnpm lint && pnpm format:check` 통과.

### Evidence

- Command logs:
  - `pnpm --filter @fullstack-forge/api db:generate` → `drizzle/0000_rich_the_order.sql` 생성
  - `pnpm --filter @fullstack-forge/api db:migrate` → `migrations applied successfully`
  - `pnpm --filter @fullstack-forge/api typecheck` → 성공
- Artifacts: schema 파일, 마이그레이션 SQL, ERD 또는 테이블 관계도.
- Notes: 상태 전이 로직은 스키마가 아닌 앱 코드에서 강제 (auth plan 이후).

### Output for Next Step

- 전체 도메인 테이블이 DB에 존재. seed 데이터 투입 가능.
- Auth plan에서 users/sessions 테이블 즉시 사용 가능.

## Unit 3: `feat/db-seed-and-ops`

### Step Objective

- Implementation goal: Seed 데이터 투입 + 백업/복구 훈련 + 마이그레이션 안전 수칙 검증.
- Learning/operational goal: DB 변경 루프의 운영 안전성을 확보한다.

### Prerequisite

- [x] Unit 2 작업 완료(동일 worktree).
- [x] 마이그레이션이 적용된 PostgreSQL 실행 중.

### References

- [roadmap/01-db-design-and-migrations.md](../roadmap/01-db-design-and-migrations.md) — Backup and Restore Safety
- [execution/01-db-and-migrations.md](../execution/01-db-and-migrations.md) — DB Rollback / 복구 훈련 체크리스트
- [prd/03-commerce-domain-policy.md](../prd/03-commerce-domain-policy.md) — SKU 40~60개 seed 기준

### Progressive Tasks

1. **Seed 스크립트** 생성 (`apps/api/src/db/seed.ts` 또는 `scripts/seed.ts`):
   - 사용자 3명 (customer, operator, admin 각 1명).
   - 상품 40~60 SKU + 재고 데이터.
   - `package.json`에 `db:seed` 스크립트 추가.
2. **백업/복구 템플릿** 작성:
   - `pg_dump` 명령 템플릿.
   - `pg_restore` 명령 + 복구 후 앱 헬스체크 루프.
3. **복구 리허설** 1회 수행:
   - 마이그레이션 적용 후 `pg_dump`.
   - DB 초기화 후 `pg_restore`.
   - 앱 `/health` 정상 응답 확인.
4. **마이그레이션 안전 수칙 검증**:
   - destructive 변경(컬럼 삭제 등) 시뮬레이션 → 단계적 마이그레이션 확인.

### Exit Criteria

- [x] `pnpm --filter @fullstack-forge/api db:seed` 실행 → 데이터 투입 성공.
- [x] 상품 40개 이상 + 사용자 3명 + 재고 데이터 확인 (SQL 쿼리).
- [x] `pg_dump` → DB 초기화 → `pg_restore` → `/health` 정상 응답.
- [x] `pnpm typecheck && pnpm build && pnpm test` 통과.

### Evidence

- Command logs:
  - `pnpm --filter @fullstack-forge/api db:seed` → `Seeded users=3, products=48`
- `pnpm --filter @fullstack-forge/api db:backup` → `backup created: ./backups/fullstack_forge_commerce_dev_latest.dump`
  - `pnpm --filter @fullstack-forge/api db:restore:rehearsal` → `restore rehearsal succeeded and health check passed`
- `docker exec -i fullstack-forge-postgres psql ...` → users 3 / products 48 / inventory 48 확인
- Artifacts: seed 스크립트, 백업/복구 명령 템플릿.
- Notes: RTO/RPO 기록 (로컬 기준), destructive 변경 분리 규칙 확인.

### Output for Next Step

- DB에 테스트 가능한 데이터가 존재.
- Auth plan에서 로그인 테스트에 사용할 사용자 계정 준비 완료.
- 백업/복구 절차가 문서화되어 이후 마이그레이션에 안전하게 적용 가능.

## Stage Gate (Final)

### Entry Criteria

- [x] Unit 범위와 참조 문서 확정.
- [x] Unit 의존 순서 합의.

### Exit Criteria

- [x] 3개 Unit 모두 Exit Criteria 충족.
- [x] 모든 Unit Evidence 기록됨.
- [x] Auth plan 진입에 필요한 리스크 문서화.

### Evidence

- Unit별 커맨드 결과 요약.
- 최종 아티팩트 체크리스트 (schema, migration SQL, seed, 백업 템플릿).
- Auth plan 진입 시 알려진 리스크 (예: OAuth provider 키 미확보, Redis 미설정 등).

### Auth Plan 진입 리스크 (현재 상태)

- OAuth provider 키 미확보 (`GOOGLE_*`, `KAKAO_*` 값 미설정).
- Redis 컨테이너/연결은 아직 미구성 (`REDIS_URL`만 .env.example에 선언).
- 상태 전이 강제 로직은 스키마 enum까지만 적용, API 계층 전이 검증은 Auth/Commerce 단계에서 구현 필요.

## Notes

- 이 plan은 Roadmap 01 (DB Design and Migrations)만 다룬다.
- Auth (Roadmap 02)는 별도 plan (`02-auth-plan.md`)으로 분리한다.
- Commerce core (Roadmap 02a)도 별도 plan으로 분리한다.
- Redis 설정은 Auth plan의 OAuth/session 단계에서 추가한다.
- 상태 전이 강제 로직은 스키마가 아닌 앱 코드에서 구현하며, Commerce core plan에서 다룬다.
