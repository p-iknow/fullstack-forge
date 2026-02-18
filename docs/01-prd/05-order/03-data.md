# Order Data

## Order 엔터티

- `id`: 주문 식별자
- `user_id`: 주문자 식별자
- `status`: 주문 상태
- `items`: 주문 아이템 집합
- `created_at`: 주문 생성 시각

## OrderItem 엔터티

- `order_item_id`: 주문 아이템 식별자
- `order_id`: 소속 주문 식별자
- `sku_id`: 원본 SKU 식별자
- `quantity`: 주문 수량
- `is_substitutable`: 대체 허용 여부
- `item_status`: 아이템 처리 상태

## Substitution 엔터티

- `substitution_id`: 대체 레코드 식별자
- `order_item_id`: 대상 주문 아이템 식별자
- `original_sku_id`: 원본 SKU 식별자
- `substitute_sku_id`: 대체 SKU 식별자
- `reason`: 대체 사유(부분 품절 등)
- `approval_state`: 사용자 승인 상태

### Substitution.approval_state enum

- `pending_approval`
- `approved`
- `rejected`
- `auto_applied`
- `timeout_cancelled`

## 주문 상태/전이 단일 기준

- 주문 상태 enum과 상태 전이 규칙은 `01-overview.md`를 단일 기준으로 참조
- 데이터 모델은 `01-overview.md` 기준 상태 체계를 그대로 저장/검증

## DB 레벨 제약

- 불법 전이는 DB 레벨에서 모두 차단
- 종료 상태에서의 추가 업데이트는 DB 제약으로 거부
- `Substitution`은 `is_substitutable=true`인 `OrderItem`에만 연결 가능

## 비범위

- 컬럼 타입/인덱스 정의는 본 문서 범위에서 제외
