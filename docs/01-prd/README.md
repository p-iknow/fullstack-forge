# PRD Index — Quick Commerce (store/admin)

이 디렉토리는 퀵커머스 제품 요구사항(PRD)의 단일 기준이다.
구현/학습/검증은 아래 문서 순서로 진행한다.

## 문서 맵

1. [00-overview](./00-overview.md)
   - 제품 개요, 범위, KPI, 도메인 모델, 비기능, 우선순위, Stage 운영 기준
2. [도메인 인덱스 (14)](#도메인-인덱스-14)
   - 인증부터 관측까지 도메인별 요구사항을 순서대로 탐색
3. [01-auth/01-overview](./01-auth/01-overview.md)
   - 로그인/로그아웃/OAuth/세션/보안 정책, 회원가입 흐름, OAuth 시퀀스 다이어그램
4. [05-order/01-overview](./05-order/01-overview.md)
   - 주문 상태 머신 다이어그램, 전이 규칙, 취소 시퀀스, 부분 실패 정책
5. [13-event/01-overview](./13-event/01-overview.md)
   - SNS→SQS fanout 흐름도, payload 개요, 멱등성, DLQ/redrive 운영 정책
6. [14-observability/01-overview](./14-observability/01-overview.md)
   - 관측 아키텍처 다이어그램, KPI 단일 소스화, SLA/알림 임계치

## 도메인 인덱스 (14)

- [01-auth](./01-auth/01-overview.md) — 회원가입 흐름, OAuth 시퀀스 다이어그램
- [02-catalog](./02-catalog/01-overview.md) — 카테고리 slug 확정, 판매 조건 flowchart
- [03-inventory](./03-inventory/01-overview.md) — 안전재고 임계치(5개), 라이프사이클 다이어그램
- [04-cart](./04-cart/01-overview.md) — 라이프사이클 다이어그램, 주문 전환 흐름
- [05-order](./05-order/01-overview.md) — 상태 머신 다이어그램, 취소 시퀀스
- [06-payment](./06-payment/01-overview.md) — 상태 머신, 30초 타임아웃 확정
- [07-delivery](./07-delivery/01-overview.md) — 상태 머신, SLA 계산
- [08-promotion](./08-promotion/01-overview.md) — 계산 흐름도, 15,000원 최소주문금액
- [09-loyalty](./09-loyalty/01-overview.md) — 포인트 라이프사이클, 1% 적립률 확정
- [10-review](./10-review/01-overview.md) — 상태 머신, 길이 제한
- [11-inquiry](./11-inquiry/01-overview.md) — 상태 머신, 재오픈 정책
- [12-notification](./12-notification/01-overview.md) — 깨진 참조 수정 완료
- [13-event](./13-event/01-overview.md) — SNS→SQS 흐름도, payload 개요
- [14-observability](./14-observability/01-overview.md) — 관측 아키텍처 다이어그램, KPI 단일 소스화

## 사용 규칙

- 요구사항 충돌 시 PRD 문서를 우선한다.
- 구현 전에 해당 단계의 `Entry Criteria`를 확인한다.
- 단계 완료 시 `Evidence`를 남기지 않으면 완료로 인정하지 않는다.

## 연관 문서

- 아키텍처: `docs/02-architecture/base/01-overview.md`
- ADR: `docs/02-architecture/README.md`
- 실행 체크: `docs/02-architecture/README.md`
