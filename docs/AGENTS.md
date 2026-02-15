# DOCS KNOWLEDGE BASE

퀵커머스 주문-배송 앱(`fullstack-forge`) 설계·요구사항·실행 문서 41개. 코드 없음 — 순수 문서 저장소.

## STRUCTURE

```
docs/
├── prd/          # 제품 요구사항 (5 docs) — WHAT to build
├── adr/          # 아키텍처 결정 (6 ADRs) — WHY this stack
├── harness/      # 구현 표준 (7 docs) — HOW to build
├── roadmap/      # 학습 경로 (9 docs) — LEARN progressively
├── execution/    # 실행 체크리스트 (9 docs) — VERIFY it works
└── README.md     # 진입점: 3가지 학습 경로 제공
```

## WHERE TO LOOK

| 목적 | 시작 문서 | 흐름 |
|------|-----------|------|
| 전체 그림 파악 | `README.md` | → harness/00 → prd/README |
| 빠른 실행 | `execution/README.md` | → execution/00 순차 |
| 점진 학습 | `roadmap/00-roadmap-overview.md` | → roadmap/01~07 순차 |
| 요구사항 확인 | `prd/README.md` | → prd/01~05 순차 |
| 결정 근거 확인 | `adr/README.md` | → ADR-0000~0005 |
| 스택·설계 기준 | `harness/00-overview.md` | → harness/01~06 순차 |

## NUMBERING SYSTEM

동일 번호 = 동일 주제, 다른 관점:

| 번호 | 주제 | harness | roadmap | execution |
|------|------|---------|---------|-----------|
| 00 | 설계/아키텍처 | ✅ | ✅ | ✅ |
| 01 | DB/마이그레이션 | ✅ | ✅ | ✅ |
| 02 | 인증/보안 | — | ✅ | ✅ |
| 02a | 커머스 도메인 | — | ✅ | ✅ |
| 03 | 인프라/네트워킹 | ✅ | ✅ | ✅ |
| 04 | Docker/런타임 | ✅ | ✅ | ✅ |
| 05 | K8s 배포 | ✅ | ✅ | ✅ |
| 06 | 관측/이벤트 | ✅ | ✅ | ✅ |
| 07 | 운영/레디니스 | — | ✅ | ✅ |

## SUBDIRECTORY ROLES

### prd/ — 제품 요구사항 (WHAT)
- **우선순위 최상**: 요구사항 충돌 시 PRD가 정답
- 01: 비전·범위·KPI → 02: 인증·보안 → 03: 도메인 정책 → 04: 이벤트 신뢰성 → 05: 단계별 전달 계획
- 각 단계에 Entry/Exit Criteria + Evidence 요구

### adr/ — 아키텍처 결정 기록 (WHY)
- 0000: ADR 규칙 → 0001: Frontend → 0002: Backend → 0003: API 계약 → 0004: 이벤트 → 0005: 관측
- 각 ADR은 최소 2개 PRD 참조 필수 (Satisfies vs Supports 구분)
- 구현 절차는 ADR에 넣지 않음 → `prd/05-phased-delivery-plan.md`로

### harness/ — 구현 표준 (HOW)
- 00-overview가 핵심: 전체 스택·설계 원칙·디렉토리 구조·의존성 그래프
- 01~06: 루트 설정 → 패키지 → 프론트 → 백엔드 → 연동 → 품질 도구

### roadmap/ — 학습 경로 (LEARN)
- 8단계 점진 학습, 난이도(★)·소요시간 포함
- 00: 오버뷰 → 01~07: DB → 인증 → 커머스 → 인프라 → Docker → K8s → 관측 → 운영
- 각 단계 Exit Criteria + Evidence 필수

### execution/ — 실행 체크리스트 (VERIFY)
- roadmap과 1:1 대응하되 **검증 관점**
- 00: 워크스페이스 기준선 (갭 점검부터 시작)
- 빠른 시작: `pnpm install → codegen → typecheck → dev`

## CROSS-REFERENCES

```
PRD-01 (범위)    ←── ADR-0002 (백엔드), ADR-0004 (이벤트), ADR-0005 (관측)
PRD-02 (인증)    ←── ADR-0001 (프론트), ADR-0002 (백엔드)
PRD-03 (도메인)  ←── ADR-0002 (백엔드), ADR-0003 (API 계약)
PRD-04 (이벤트)  ←── ADR-0004 (SNS-SQS), ADR-0005 (관측)
PRD-05 (전달)    ←── ADR-0001/0002/0003 (전체 스택)
```

## CONVENTIONS

- 문서 언어: 한국어
- README.md = 각 하위 디렉토리 인덱스
- 번호 접두사: 두 자리 (`00`~`07`), 특수 삽입은 알파벳 (`02a`)
- 실행 문서 완료 = Evidence 필수 (없으면 미완료)
- PRD 문서 = 요구사항의 단일 진실 공급원 (Single Source of Truth)
