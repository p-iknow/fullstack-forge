# 04. 시드, 백업, 복구 리허설

## 핵심 질문

> DB 변경을 실패해도 복구 가능한 상태로 어떻게 유지하는가?

## 한 줄 답

`db:seed`로 검증 가능한 데이터 기준선을 만들고, `db:backup` + `db:restore:rehearsal`을 반복해 복구 절차를 실제로 통과시켜야 "안전한 변경 루프"가 완성된다.

---

## 현재 흐름

```text
1) pnpm --filter @fullstack-forge/api db:seed
   -> users 3명 + products 48개 + inventory 생성

2) pnpm --filter @fullstack-forge/api db:backup
   -> pg_dump -Fc로 dump 파일 생성

3) pnpm --filter @fullstack-forge/api db:restore:rehearsal
   -> DROP DATABASE / CREATE DATABASE
   -> pg_restore --clean --if-exists
   -> /health 호출 성공 확인

4) SQL count 확인
   -> users/products/inventory 건수 검증
```

---

## `db:seed` — "동작 확인 가능한 데이터"를 먼저 만든다

**Problem** — 빈 DB에서는 API/쿼리/리포트 대부분이 정상처럼 보여도, 실제 도메인 시나리오 오류를 드러내지 못한다.

```text
empty DB
-> 목록 API는 200 OK
-> 하지만 정렬/집계/재고 정책 관련 버그는 노출되지 않음
```

**Action** — `apps/api/src/db/seed.ts`에서 고정된 기준 데이터(사용자 3명, 상품 48개, 재고)를 투입한다.

```bash
pnpm --filter @fullstack-forge/api db:seed
```

**Result** — 학습/테스트/데모가 동일한 데이터 기반에서 재현된다. 프론트엔드 개발자가 API 응답을 안정적으로 검증할 수 있다.

---

## `pg_dump -Fc` — 복구 가능한 형태로 백업 보관

**Problem** — 백업이 없으면 마이그레이션 실패 시 데이터를 되돌릴 수 없다. "로컬이라 괜찮다"는 가정이 쌓이면 운영 전환 시 큰 리스크가 된다.

```bash
# no backup
pnpm --filter @fullstack-forge/api db:migrate
# 실패 후 원복 수단 없음
```

**Action** — `apps/api/scripts/db-backup-restore.sh`에서 `pg_dump -Fc`를 기본값으로 사용한다.

```bash
docker exec -i "$CONTAINER_NAME" pg_dump -Fc -U "$DB_USER" "$DB_NAME" >"$BACKUP_FILE"
```

**Result** — 압축 아카이브 형태의 백업 파일을 확보하고, 이후 `pg_restore`로 즉시 복구 연습이 가능하다.

---

## 복구 리허설 + `/health` — 복구 "명령 성공"이 아니라 "서비스 정상"까지 확인

**Problem** — `pg_restore`가 끝났다고 복구가 끝난 것이 아니다. 스키마/연결 문제로 앱이 여전히 비정상일 수 있다.

```bash
# restore만 수행
pg_restore ...
# 앱에서 DB ping 실패 가능
```

**Action** — 복구 스크립트가 DB 재생성 후 restore를 수행하고, 마지막에 `/health`를 호출한다.

```bash
docker exec -i "$CONTAINER_NAME" psql ... "DROP DATABASE IF EXISTS \"$DB_NAME\";"
docker exec -i "$CONTAINER_NAME" psql ... "CREATE DATABASE \"$DB_NAME\" TEMPLATE template0;"
docker exec -i "$CONTAINER_NAME" pg_restore ... --clean --if-exists <"$BACKUP_FILE"
curl -fsS "$APP_HEALTH_URL"
```

**Result** — 복구 절차가 "DB 복원 완료"를 넘어 "애플리케이션 레벨 정상 응답"까지 검증된다. 장애 복구 훈련의 품질이 올라간다.

---

## 이 프로젝트에서의 적용

| 결정                      | 해결하는 문제                                      |
| ------------------------- | -------------------------------------------------- |
| `db:seed` 기준 데이터     | 빈 DB 착시로 인한 검증 누락 방지                   |
| `pg_dump -Fc` 백업 템플릿 | 마이그레이션 실패 시 원복 수단 확보                |
| restore 후 `/health` 검증 | 복구 명령 성공과 실제 서비스 정상 상태의 간극 해소 |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../02-architecture/backend/01-backend.adr.md)

---

## 참고 자료

- [Drizzle ORM — Migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle ORM — drizzle-kit migrate](https://orm.drizzle.team/docs/drizzle-kit-migrate)
- [PostgreSQL — SQL Dump and Restore](https://www.postgresql.org/docs/current/backup-dump.html)
- [PostgreSQL — pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)

---

## 다음 문서

[05. Relations, FK, Semantic Key 운영 전략](./05-relations-fk-and-semantic-key-strategy.md) — Drizzle relation/FK/semantic key를 운영 관점에서 어떻게 분리하는가?
