# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-15 | **Commit:** 1921386 | **Branch:** config/init-claude

## OVERVIEW

`local-fullstack-harness` — 퀵커머스 주문-배송 앱(`fullstack-forge`)을 구현하기 위한 **문서-우선 설계 저장소 + AI 스킬 프레임워크**. 현재 애플리케이션 코드 없음. 문서(41개 md)와 Claude 스킬/커맨드로 구성.

## STRUCTURE

```
./
├── docs/                   # 설계·요구사항·실행 문서 (41 files, 5 subdirs)
│   ├── prd/                #   제품 요구사항 (WHAT)
│   ├── adr/                #   아키텍처 결정 기록 (WHY)
│   ├── harness/            #   구현 표준·스택 (HOW)
│   ├── roadmap/            #   단계별 학습 경로 (LEARN)
│   └── execution/          #   실행 체크리스트 (VERIFY)
├── .claude/
│   ├── commands/           #   git 워크플로 (branch, commit, pr)
│   └── skills/             #   AI 스킬 카탈로그 (3 skills + AGENTS.md)
└── .sisyphus/              # 예약 (비어있음)
```

## WHERE TO LOOK

| Task                         | Location                                          | Notes                                 |
| ---------------------------- | ------------------------------------------------- | ------------------------------------- |
| 프로젝트 비전·범위 이해      | `docs/prd/01-product-scope.md`                    | KPI, MVP 범위, 비기능 요구사항        |
| 아키텍처·스택 파악           | `docs/harness/00-overview.md`                     | 스택 테이블, 설계 원칙, 디렉토리 구조 |
| 기술 결정 근거 확인          | `docs/adr/ADR-0001~0005`                          | PRD 추적성 포함                       |
| 구현 순서 확인               | `docs/execution/README.md`                        | 00→07 순차 진행                       |
| 학습 로드맵 진행             | `docs/roadmap/00-roadmap-overview.md`             | 8단계, 난이도·소요시간 포함           |
| 도메인 정책 (주문·리뷰·문의) | `docs/prd/03-commerce-domain-policy.md`           | 상태 머신, 재고 정책                  |
| 인증·보안 정책               | `docs/prd/02-user-flows-and-auth-policy.md`       | OAuth, 세션, RBAC                     |
| 이벤트 신뢰성 정책           | `docs/prd/04-event-reliability-and-ops-policy.md` | SNS-SQS, 멱등성, DLQ                  |
| AI 스킬 생성·수정            | `.claude/skills/meta-skill/SKILL.md`              | 7-phase 워크플로                      |
| 문서 프론트매터 추가         | `.claude/skills/doc-frontmatter/SKILL.md`         | YAML 스키마 검증 포함                 |
| 프롬프트 작성                | `.claude/skills/meta-prompt-engineer/SKILL.md`    | 기법·템플릿·안티패턴                  |
| git 브랜치 생성              | `.claude/commands/branch.md`                      | `type/kebab-case` 포맷                |
| git 커밋                     | `.claude/commands/commit.md`                      | `type(scope): description` 포맷       |
| PR 생성                      | `.claude/commands/pr.md`                          | 항상 `--draft`                        |

## PLANNED TECH STACK (미구현)

| Layer         | Tech                                    |
| ------------- | --------------------------------------- |
| API 명세      | TypeSpec → OpenAPI 3.1                  |
| 프론트엔드    | TanStack Start + React 19 + Tailwind v4 |
| UI            | Base UI + shadcn (CVA)                  |
| 백엔드        | Hono + Drizzle ORM + PostgreSQL + Redis |
| 이벤트        | SNS → SQS fanout (LocalStack)           |
| 모니터링      | Prometheus + Grafana                    |
| 배포          | Docker + Kubernetes (minikube)          |
| 태스크 러너   | Nx (pure, 플러그인 없음)                |
| 패키지 매니저 | pnpm (workspaces, catalog)              |
| 린트/포맷     | oxlint + oxfmt                          |
| 테스트        | vitest (workspace mode)                 |

## CONVENTIONS

### 문서 번호 체계

- `00` 설계/아키텍처 → `01` 기초 → `02` 패키지 → `03` 프론트 → `04` 백엔드 → `05` 연동 → `06` 품질 → `07` 운영
- `02a` = 커머스 도메인 (특수 삽입)
- harness/roadmap/execution 동일 번호 = 같은 주제의 다른 관점

### Git 워크플로

- **Branch**: `type/kebab-case` (max 50자). Types: feat, fix, chore, docs, refactor, test, style
- **Commit**: `type(scope): description`. 같은 목적 = 같은 커밋 (파일 수 무관)
- **PR**: 항상 `--draft`. Body: `## Summary` + `## Test` 섹션

### 스킬 구조

```
skill-name/
├── SKILL.md          # 필수: frontmatter + instructions
├── workflows/        # 선택: 절차
├── references/       # 선택: 참조 문서
├── scripts/          # 선택: 검증/생성 스크립트
└── assets/           # 선택: 템플릿
```

- 이름: kebab-case, max 64자, 디렉토리명과 일치
- description: 자연어 산문 1-3문장 (구조화된 라벨 금지)
- SKILL.md 500줄 초과 시 references/로 분리

## ANTI-PATTERNS

| 금지                            | 이유                                 |
| ------------------------------- | ------------------------------------ |
| 파일 단위로 커밋 분리           | 목적 단위로 묶어야 함                |
| 푸시된 커밋 amend               | 히스토리 깨짐                        |
| `--no-verify` 훅 스킵           | 품질 게이트 우회                     |
| .env/credentials 커밋           | 보안 위반                            |
| 스킬 description에 XML 태그     | 인젝션 위험                          |
| 스킬 폴더에 README.md           | SKILL.md 또는 references/ 사용       |
| SKILL.md 500줄 초과             | 컨텍스트 블로트                      |
| `api` → `base-ui` 의존          | 백엔드에 UI 유입 차단 (Sheriff 강제) |
| `shared`/`api-spec` → 외부 의존 | 순수 유틸/명세 유지                  |

## DOCUMENT FLOW

```
PRD (WHAT) → ADR (WHY) → Harness (HOW) → Roadmap (LEARN) → Execution (VERIFY)
```

- 요구사항 충돌 시 **PRD 우선**
- 각 ADR은 최소 2개 PRD 문서 참조 필수
- 단계 완료 시 Evidence 없으면 완료 불인정

## COMMANDS

```bash
# 빠른 시작 (구현 시작 후)
pnpm install
pnpm --filter @fullstack-forge/api-spec codegen
pnpm typecheck
pnpm --filter @fullstack-forge/api dev
pnpm --filter @fullstack-forge/store dev

# 통합 검증
pnpm exec nx run-many -t codegen && pnpm check && pnpm build && pnpm test
```

## NOTES

- 현재 **문서만 존재** — 애플리케이션 코드, 빌드 설정 없음 (greenfield)
- 구현 시작 시 `docs/execution/00-workspace-baseline.md`의 Step 0 갭 점검부터
- 문서는 한국어, 스킬/커맨드는 영어
- `.claude/skills/AGENTS.md`에 스킬 카탈로그 별도 관리
- `docs/AGENTS.md`에 문서 구조 상세 가이드 별도 관리
