# 01. DB Design and Migrations

## Step Objective

PRD 도메인 정책을 PostgreSQL + Drizzle 스키마로 고정하고,
마이그레이션/백업/복구까지 포함한 DB 변경 루프를 안정화한다.

## References

- [03-commerce-domain-policy](../prd/03-commerce-domain-policy.md)
- [04-backend](../harness/04-backend.md)
- [execution/01-db-and-migrations](../execution/01-db-and-migrations.md)

## Progressive Tasks

### 1) Core Schema Establishment

- `users`, `user_credentials`, `user_oauth_accounts`, `user_sessions`, `audit_logs`
- `products`, `inventory`, `orders`, `order_items`, `payments`, `deliveries`, `substitutions`, `reviews`, `review_comments`, `customer_inquiries`, `inquiry_replies`
- 주문/결제/배송 상태 enum + 전이 제약 반영

### 2) Migration Discipline

- `db:generate`, `db:migrate` 반복 실행 루프 확립
- destructive 변경 분리(추가 -> 이관 -> 제거)
- 충돌/실패 대응 규칙 문서화

### 3) Backup and Restore Safety

- `pg_dump`, `pg_restore` 템플릿 작성
- restore 전용 테스트 DB 루프 구축
- RTO/RPO 기록 양식 확정

## Local Environment Increment

- PostgreSQL 로컬 컨테이너 1개를 기준 DB로 고정
- `apps/api/.env`의 `DATABASE_URL`을 로컬 DB에 연결
- `db:generate` -> `db:migrate` -> `pg_isready`를 기본 체크 루프로 사용

## Exit Criteria

- PRD 필수 엔터티와 DB 스키마가 누락 없이 매핑됨
- 불법 상태 전이/음수 재고가 DB/앱에서 모두 차단됨
- migration 실패 후 복구가 로컬에서 검증됨

## Evidence

- ERD 또는 테이블 관계도
- migration diff + 적용 로그
- 백업/복구 명령 로그 + smoke test 결과

## Output for Next Step

- 인증/인가(02)에서 사용할 사용자/세션 테이블 준비 완료
- 인프라(03)에서 사용할 DB bootstrap 절차 준비 완료
