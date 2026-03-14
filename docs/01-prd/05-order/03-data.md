# Order Data

## Order 엔터티

| 필드 | 타입 | 필수 | 제약 조건 | 설명 |
| --- | --- | --- | --- | --- |
| `id` | UUID | Y | PK | 주문 식별자 |
| `user_id` | UUID | Y | FK → User | 주문자 식별자 |
| `cart_id` | UUID | Y | FK → Cart | 원본 장바구니 식별자 |
| `status` | enum | Y | `01-overview.md` 상태 목록 | 주문 상태 |
| `subtotal` | integer | Y | `>= 0`, 단위: 원(KRW) | 아이템 합계 (할인 전) |
| `discount_amount` | integer | Y | `>= 0`, 단위: 원 | 프로모션/쿠폰 할인 금액 |
| `points_used` | integer | Y | `>= 0`, 단위: 원 | 포인트 사용 금액 |
| `total_amount` | integer | Y | `>= 0`, 단위: 원 | 최종 결제 금액 |
| `shipping_address` | text | Y | — | 배송 주소 |
| `recipient_name` | varchar(100) | Y | — | 수령인 이름 |
| `recipient_phone` | varchar(20) | Y | — | 수령인 연락처 |
| `version` | integer | Y | 기본값 1, 전이 시 증가 | 낙관적 락용 버전 |
| `cancelled_reason` | varchar(500) | N | 취소 시 필수 | 취소 사유 |
| `created_at` | timestamp | Y | 생성 시 자동 | 주문 생성 시각 |
| `updated_at` | timestamp | Y | 변경 시 자동 | 마지막 수정 시각 |
| `confirmed_at` | timestamp | N | `confirmed` 전이 시 기록 | 결제 확인 시각 (delivery SLA 기준) |

### 계산 필드

- `total_amount = subtotal - discount_amount - points_used`
- `subtotal = SUM(order_items.line_total)`

### 유니크 제약

- `(cart_id)` WHERE `status NOT IN ('cancelled')` — 동일 장바구니 중복 주문 방지

## OrderItem 엔터티

| 필드 | 타입 | 필수 | 제약 조건 | 설명 |
| --- | --- | --- | --- | --- |
| `order_item_id` | UUID | Y | PK | 주문 아이템 식별자 |
| `order_id` | UUID | Y | FK → Order | 소속 주문 식별자 |
| `sku_id` | UUID | Y | FK → Product | 원본 SKU 식별자 |
| `quantity` | integer | Y | `> 0`, `<= 15` | 주문 수량 |
| `unit_price` | integer | Y | `> 0`, 단위: 원 | 주문 시점 단가 (스냅샷) |
| `line_total` | integer | Y | `>= 0`, 단위: 원 | 아이템 합계 (`quantity * unit_price`) |
| `is_substitutable` | boolean | Y | 기본값 `false` | 대체 허용 여부 |
| `item_status` | enum | Y | 아래 enum 참조 | 아이템 처리 상태 |
| `created_at` | timestamp | Y | 생성 시 자동 | 생성 시각 |
| `updated_at` | timestamp | Y | 변경 시 자동 | 마지막 수정 시각 |

### OrderItem.item_status enum

- `pending`: 처리 대기 (주문 생성 직후)
- `confirmed`: 재고 예약 확인 완료
- `substituted`: 대체상품으로 교체 완료
- `cancelled`: 취소됨 (품절/사용자 거절/타임아웃)
- `fulfilled`: 이행 완료 (배송 확정)

## Substitution 엔터티

| 필드 | 타입 | 필수 | 제약 조건 | 설명 |
| --- | --- | --- | --- | --- |
| `substitution_id` | UUID | Y | PK | 대체 레코드 식별자 |
| `order_item_id` | UUID | Y | FK → OrderItem | 대상 주문 아이템 식별자 |
| `original_sku_id` | UUID | Y | FK → Product | 원본 SKU 식별자 |
| `substitute_sku_id` | UUID | Y | FK → Product | 대체 SKU 식별자 |
| `original_price` | integer | Y | `> 0`, 단위: 원 | 원본 단가 |
| `substitute_price` | integer | Y | `> 0`, 단위: 원 | 대체 단가 |
| `price_diff` | integer | Y | 단위: 원 | 가격 차이 (`substitute_price - original_price`) |
| `reason` | varchar(500) | Y | — | 대체 사유 (부분 품절 등) |
| `approval_state` | enum | Y | 아래 enum 참조 | 사용자 승인 상태 |
| `expires_at` | timestamp | Y | 생성 시 `+10분` | 승인 만료 시각 |
| `resolved_at` | timestamp | N | 승인/거절/타임아웃 시 기록 | 결정 시각 |
| `created_at` | timestamp | Y | 생성 시 자동 | 생성 시각 |

### Substitution.approval_state enum

- `pending_approval`: 승인 대기
- `approved`: 사용자 승인
- `rejected`: 사용자 거절
- `auto_applied`: 가격 120% 이내 자동 적용
- `timeout_cancelled`: 10분 내 응답 없음, 자동 부분 취소

### Substitution 제약

- `is_substitutable=true`인 `OrderItem`에만 연결 가능

## OrderStatusHistory 엔터티

| 필드 | 타입 | 필수 | 제약 조건 | 설명 |
| --- | --- | --- | --- | --- |
| `id` | UUID | Y | PK | 이력 식별자 |
| `order_id` | UUID | Y | FK → Order, INDEX | 주문 식별자 |
| `previous_status` | enum | N | 최초 생성 시 null | 변경 전 상태 |
| `new_status` | enum | Y | — | 변경 후 상태 |
| `changed_by` | UUID | Y | — | 변경 수행자 (user_id 또는 system) |
| `changed_by_role` | enum | Y | `customer`, `operator`, `system` | 변경 수행 주체 역할 |
| `reason` | varchar(500) | N | 취소 시 필수 | 변경 사유 |
| `created_at` | timestamp | Y | 생성 시 자동 | 변경 시각 |

## 주문 상태/전이 단일 기준

- 주문 상태 enum과 상태 전이 규칙은 `01-overview.md`를 단일 기준으로 참조
- 데이터 모델은 `01-overview.md` 기준 상태 체계를 그대로 저장/검증

## DB 레벨 제약

- 불법 전이는 DB 레벨에서 모두 차단 (CHECK 제약 또는 트리거)
- 종료 상태(`delivered`, `cancelled`)에서의 추가 업데이트는 DB 제약으로 거부
- `Substitution`은 `is_substitutable=true`인 `OrderItem`에만 연결 가능
- `total_amount >= 0` 제약
- `quantity > 0` 제약
- 음수 금액 필드 허용 금지 (`subtotal`, `discount_amount`, `points_used`, `total_amount` 모두 `>= 0`)

## 삭제 정책

- 주문 데이터는 **soft delete 하지 않는다**. 취소된 주문도 `cancelled` 상태로 영구 보존.
- 주문 데이터 보존 기간: 법적 요구사항에 따라 최소 5년 (전자상거래법 기준)

## 비범위

- 물리 인덱스 설계는 아키텍처/구현 단계에서 확정
