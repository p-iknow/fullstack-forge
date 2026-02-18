# Inventory Data

## Inventory 엔터티

- `product_id`: 상품 식별자
- `on_hand`: 총 재고
- `reserved`: 주문 예약 재고
- `version`: 낙관적 락 버전

## 파생 값

- `available = on_hand - reserved`
- `available`은 저장 컬럼이 아닌 계산 값으로 취급한다.

## 상태 전이 규칙

- 주문 생성: `reserved` 증가
- 주문 취소/결제 실패: `reserved` 감소(복원)
- 배송 확정: `reserved` 감소와 함께 `on_hand` 차감 확정

## 동시성 제어

> 동시성 정책의 원문은 [01-overview.md § 동시성 규칙](./01-overview.md#동시성-규칙-정책-원문)을 참조한다.
> 이 섹션은 데이터 모델 관점의 적용 요약만 기술한다.

- `version` 컬럼을 낙관적 락 키로 사용
- 고경합 SKU 판별 시 row lock 전환 (기준: 동일 SKU 3건/초 초과)

## 무결성 규칙

- 모든 전이 후 `on_hand >= 0`
- 모든 전이 후 `reserved >= 0`
- 모든 전이 후 `available >= 0`

## 비범위

- 컬럼 타입/인덱스 정의는 본 문서 범위에서 제외
- 다중 창고 재고 모델은 MVP 범위에서 제외
