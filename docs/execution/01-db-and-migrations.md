# 01. DB and Migrations — DB 셋업 + 마이그레이션 + 복구

## Prerequisite

- [00-workspace-baseline](./00-workspace-baseline.md) 완료

## Roadmap Companion

- [roadmap/01-db-design-and-migrations](../roadmap/01-db-design-and-migrations.md)

## Harness 참조

- [04-backend](../harness/04-backend.md)

## 검증 체크리스트

### DB 셋업 (Drizzle + PostgreSQL)

- [ ] PostgreSQL 실행 중 (`localhost:5432` 또는 `DATABASE_URL` 대상)
- [ ] `pnpm --filter @fullstack-forge/api db:generate` — 마이그레이션 SQL 생성
- [ ] `pnpm --filter @fullstack-forge/api db:migrate` — 마이그레이션 적용 성공
- [ ] `apps/api/drizzle/` 변경분 git commit

### DB Rollback / 복구 훈련

- [ ] 마이그레이션 적용 전 백업 수행 (`pg_dump`)
- [ ] 변경 SQL에 rollback 절차 문서화
- [ ] 로컬에서 복구 리허설(restore → 앱 헬스체크) 1회 이상 수행
- [ ] destructive 변경은 단계적 마이그레이션으로 분리

## Troubleshooting

### DB 마이그레이션 실패

- DB 연결(`DATABASE_URL`) 확인
- 실패 migration SQL과 적용 이력 테이블 확인
- 백업본으로 restore 후 migration을 작은 단위로 재분할

## Next

- 인증 + 보안 → [02-auth-and-security](./02-auth-and-security.md)
