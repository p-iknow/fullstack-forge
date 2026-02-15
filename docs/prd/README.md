# PRD Index — Quick Commerce (store/admin)

이 디렉토리는 퀵커머스 제품 요구사항(PRD)의 단일 기준이다.
구현/학습/검증은 아래 문서 순서로 진행한다.

## 문서 맵

1. [01-product-scope](./01-product-scope.md)
   - 제품 비전, 타겟, 범위, KPI, 비기능 요구사항
2. [02-user-flows-and-auth-policy](./02-user-flows-and-auth-policy.md)
   - 로그인/로그아웃/OAuth/세션/보안/에러 정책
3. [03-commerce-domain-policy](./03-commerce-domain-policy.md)
   - 상품/재고/장바구니/주문/결제/배송/프로모션/리뷰/문의 정책
4. [04-event-reliability-and-ops-policy](./04-event-reliability-and-ops-policy.md)
   - SNS-SQS fanout, idempotency, DLQ/redrive, 운영 정책
5. [05-phased-delivery-plan](./05-phased-delivery-plan.md)
   - 단계별 구현/학습 계획, 진입/완료 기준, 산출물 템플릿

## 사용 규칙

- 요구사항 충돌 시 PRD 문서를 우선한다.
- 구현 전에 해당 단계의 `Entry Criteria`를 확인한다.
- 단계 완료 시 `Evidence`를 남기지 않으면 완료로 인정하지 않는다.

## 연관 문서

- 아키텍처: `docs/harness/00-overview.md`
- ADR: `docs/adr/README.md`
- 실행 체크: `docs/execution/README.md`
- 점진 로드맵: `docs/roadmap/00-roadmap-overview.md`
