# 04. 무결성·운영성·마이그레이션 설계 근거

## 핵심 질문

> 왜 enum/FK/check/마이그레이션 분리 전략을 함께 쓰는가?

## 한 줄 답

정책 위반 데이터는 DB에서 차단하고, 변경 적용 리스크는 generate/migrate 분리와 백업·복구 루프로 운영한다.

---

## 현재 흐름

```text
schema 변경
-> db:generate (DDL 생성/리뷰)
-> db:migrate (실DB 적용)
-> db:seed (검증 데이터)
-> db:backup / db:restore:rehearsal (복구 훈련)
```

---

## enum/FK/check를 함께 쓰는 이유

**Problem** — 앱 코드 검증만으로는 동시성/누락 시 정책 위반 데이터가 저장될 수 있다.

**Action** — 정책별로 DB 제약을 배치했다.

```text
enum: 허용 상태 집합 강제
FK: 부모 없는 참조 차단
check: 수식 불변식 강제 (예: reserved <= on_hand)
unique: 중복 생성 차단 (예: review per order_item)
```

**Result** — 정책 위반이 API를 통과해도 저장 단계에서 차단되어, 운영 중 데이터 정합성 붕괴를 줄인다.

---

## db:generate 와 db:migrate 분리

**Problem** — 생성/적용을 한 단계로 처리하면 실패 원인을 분해하기 어렵고 리뷰 없이 DDL이 적용될 수 있다.

**Action** — 두 단계를 분리해 운영한다.

```text
db:generate
- schema를 SQL 파일로 생성
- 리뷰 가능한 변경 이력 확보

db:migrate
- 생성된 SQL을 실제 DB에 적용
- 적용 단계 실패를 별도로 다룸
```

**Result** — "무엇이 바뀌는지"(DDL)와 "실제로 적용됐는지"(DB 상태)를 분리해 검증할 수 있어 배포 리스크가 낮아진다.

---

## 백업/복구 리허설을 루프에 포함

**Problem** — 마이그레이션이 성공해도 rollback 계획이 없으면 실제 장애 시 복구 시간이 급격히 늘어난다.

**Action** — dump/restore를 정식 절차로 포함했다.

```text
db:backup
-> pg_dump -Fc

db:restore:rehearsal
-> drop/create database
-> pg_restore
-> /health 확인
```

**Result** — "변경 가능" 상태를 넘어 "복구 가능" 상태를 유지하므로 운영 안전성이 확보된다.

---

## relations API를 FK와 분리한 이유

**Problem** — 관계 탐색 모델과 저장 무결성을 같은 책임으로 보면, 조회 편의성과 정합성 통제가 함께 깨질 수 있다.

**Action** — 역할을 분리했다.

```text
relations(...)
- 타입 안전 조회/탐색 모델

references(...)
- 실제 DB FK 제약 생성 대상
```

**Result** — 코드 탐색 일관성과 저장 정합성을 동시에 유지할 수 있다.

---

## 이 프로젝트에서의 적용

| 결정                      | 해결하는 문제                          |
| ------------------------- | -------------------------------------- |
| enum/FK/check/unique 조합 | 정책 위반 데이터 저장                  |
| generate/migrate 분리     | 변경 원인 추적 불가 + 무리한 즉시 적용 |
| 백업/복구 리허설 포함     | 장애 시 복구 절차 미검증 리스크        |
| relations와 FK 역할 분리  | 조회 모델과 저장 무결성 책임 혼동      |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../adr/ADR-0002-backend-stack-hono-drizzle-postgres-redis.md)

---

## 다음 문서

[05. 도메인 분할 ERD](./05-domain-erd-split-view.md) — 현재 스키마를 도메인 단위로 보면 관계 구조가 어떻게 나뉘는가?
