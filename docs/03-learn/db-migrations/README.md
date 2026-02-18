# DB 설계와 마이그레이션 심층 분석

이 프로젝트의 PostgreSQL + Drizzle ORM 구성을 프론트엔드 개발자 관점에서 분해하여,
**왜 이 구성이 필요한지**, **2026년 기준으로 어떤 선택인지**, **실제 운영 루프에서 어떻게 검증하는지**를 설명한다.

> 기준 환경: PostgreSQL 16 (Docker) · Drizzle ORM 0.45 · drizzle-kit 0.31 · pnpm workspaces · Nx

## 문서 순서

| #   | 문서                                                                                    | 핵심 질문                                                           |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 01  | [로컬 DB 부트스트랩과 연결 구조](./01-local-bootstrap-and-connection.md)                | 백엔드 입문에서 DB 연결 루프를 가장 먼저 고정해야 하는 이유는?      |
| 02  | [Drizzle 스키마와 도메인 모델링](./02-drizzle-schema-and-domain-modeling.md)            | 스키마 코드가 비즈니스 정책을 어떻게 강제하는가?                    |
| 03  | [마이그레이션 생성·적용 루프](./03-migration-generation-and-apply-loop.md)              | 스키마 변경을 어떻게 SQL 이력으로 안전하게 관리하는가?              |
| 04  | [시드, 백업, 복구 리허설](./04-seed-backup-and-restore-rehearsal.md)                    | DB 변경을 실패해도 복구 가능한 상태로 어떻게 유지하는가?            |
| 05  | [Relations, FK, Semantic Key 운영 전략](./05-relations-fk-and-semantic-key-strategy.md) | Drizzle relation/FK/semantic key를 운영 관점에서 어떻게 분리하는가? |

## 전제 지식

- SQL 기본 문법 (`SELECT`, `INSERT`, `JOIN`)
- 트랜잭션/외래 키/인덱스의 기초 개념
- Docker 컨테이너와 환경 변수 사용 경험

## 이 프로젝트의 설정 파일

```text
apps/api/
├── drizzle.config.ts                    ← drizzle-kit 동작 기준점
├── package.json                         ← db:* 스크립트 엔트리
├── drizzle/
│   ├── 0000_rich_the_order.sql          ← 생성된 마이그레이션 SQL
│   └── meta/_journal.json               ← 마이그레이션 적용 이력 메타
├── scripts/
│   ├── postgres-local.sh                ← 로컬 Postgres 컨테이너 제어
│   └── db-backup-restore.sh             ← dump/restore 리허설 스크립트
└── src/db/
    ├── client.ts                        ← Drizzle + pg Pool 연결
    ├── schema.ts                        ← 도메인 스키마 + relations + constraints
    └── seed.ts                          ← 학습/검증용 시드 데이터
```

## 연관 문서

- 백엔드 레시피: [architecture/backend/01-backend](../../02-architecture/backend/01-backend.md)
