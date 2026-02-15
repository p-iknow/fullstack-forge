# DB 관계 기초

relation, FK(외래 키), semantic key를 처음 접하는 사람을 위해,
"용어 정의 -> 왜 필요한가 -> 실무에서 어떻게 같이 쓰는가" 순서로 가장 기초부터 설명한다.

> 기준 환경: PostgreSQL · Drizzle ORM · quick-commerce 도메인 예시

## 문서 순서

| #   | 문서                                                                                           | 핵심 질문                                         |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 01  | [관계형 데이터베이스의 관계란 무엇인가](./01-what-is-relation-in-rdb.md)                       | 테이블 "관계"는 정확히 무엇을 의미하는가?         |
| 02  | [외래 키(FK)는 왜 필요한가](./02-why-foreign-key.md)                                           | FK를 걸면 무엇이 좋아지고, 무엇이 불편해지는가?   |
| 03  | [PK, Surrogate Key, Semantic Key](./03-key-types-basics.md)                                    | 키 종류는 어떻게 다르고 언제 무엇을 써야 하는가?  |
| 04  | [Relation, FK, Semantic Key를 함께 쓰는 방법](./04-how-to-combine-relation-fk-semantic-key.md) | 세 가지를 실제 서비스 설계에서 어떻게 조합하는가? |

## 전제 지식

- HTTP API의 기본 요청/응답 개념
- JavaScript/TypeScript 기본 문법
- "테이블 = 엑셀 시트" 정도의 데이터 모델 감각

## 이 프로젝트의 설정 파일

```text
apps/api/src/db/
├── schema.ts        ← 테이블/관계/FK/제약 정의
├── client.ts        ← DB 연결 구성
└── seed.ts          ← 예시 데이터 투입

apps/api/drizzle/
└── 0000_rich_the_order.sql   ← 생성된 실제 SQL
```

## 연관 문서

- 입문 다음 단계: [db-migrations/](../db-migrations/README.md)
- 백엔드 레시피: [harness/04-backend](../../harness/04-backend.md)
- 실행 체크리스트: [execution/01-db-and-migrations](../../execution/01-db-and-migrations.md)
