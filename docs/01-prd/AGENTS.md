# PRD DOCS KNOWLEDGE BASE

PRD is the authoritative requirements layer. If docs conflict, PRD wins.

## STRUCTURE

```
docs/01-prd/
├── 00-overview.md
└── 01..14-<domain>/
    ├── 01-overview.md
    ├── 02-api.md
    ├── 03-data.md
    ├── 04-ui.md
    └── 05-events.md
```

## WHERE TO LOOK

| Task                       | Location                            | Notes                                          |
| -------------------------- | ----------------------------------- | ---------------------------------------------- |
| Product scope/KPI          | `00-overview.md`                    | first read                                     |
| Stage 통합 로드맵          | `00-overview.md §Stage 로드맵`      | 단계별 진입 기준                               |
| 비즈니스 수치 기본값       | `00-overview.md §5 비기능 요구사항` | SLA, 임계치 등 수치 기준                       |
| 회원가입 흐름              | `01-auth/01-overview.md §2`         | OAuth 시퀀스 다이어그램 포함                   |
| Auth requirements          | `01-auth/01-overview.md`            | login/session/OAuth policy                     |
| 주문 상태 머신             | `05-order/01-overview.md`           | 상태 전이 다이어그램, 취소 시퀀스              |
| Order lifecycle policy     | `05-order/01-overview.md`           | state transitions                              |
| Event reliability policy   | `13-event/01-overview.md`           | SNS→SQS 흐름도, payload 개요, idempotency, DLQ |
| Observability requirements | `14-observability/01-overview.md`   | 관측 아키텍처 다이어그램, KPI/SLA/alerts       |

## CONVENTIONS

- Domain folders share fixed 5-file pattern (`01`..`05`).
- Validate `Entry Criteria` before implementation.
- Completion requires evidence artifacts.

## ANTI-PATTERNS

- Implementing architecture decisions that contradict PRD requirements.
- Skipping evidence and still marking stage complete.
- Treating `README.md` as replacement for domain docs.

## SEE ALSO

- PRD index: `docs/01-prd/README.md`
- Architecture mapping: `docs/02-architecture/AGENTS.md`
