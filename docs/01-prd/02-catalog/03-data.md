# Catalog Data Requirements

## 1) Product 엔터티

- `id` — UUID, PK
- `sku` — SKU 식별자 (unique)
- `slug` — URL-safe 식별자 (unique, 상품 상세 URL에 사용)
- `name` — 상품명
- `description` — 상품 설명
- `brand` — 브랜드명
- `category_id` — 소속 카테고리 식별자 (FK → `category.id`)
- `price` — 가격 (KRW)
- `weight` — 중량 (g)
- `is_active` — 판매 가능 여부 (boolean, default true). admin이 상품을 단종/비활성화할 때 `false`로 설정
- `is_substitutable` — 대체 가능 여부 (boolean)
- `display_order` — 카테고리 내 표시 순서 (integer, default 0)
- `tags` — 동적 라벨 목록 (예: `["신상품", "인기", "오늘만할인"]`)
- `thumb_url` — 썸네일 이미지 (1:1)
- `detail_url` — 상세 이미지 (4:3)
- `created_at` — 생성 시각
- `updated_at` — 수정 시각

## 2) Category 엔터티

- `id` — UUID, PK
- `name` — 표시명
- `slug` — URL-safe 식별자 (unique)
- `display_order` — 표시 순서 (integer)
- `is_active` — 활성 여부 (boolean, default true)
- `created_at` — 생성 시각
- `updated_at` — 수정 시각

Category는 독립 테이블로 관리하며, `product.category_id`는 `category.id`를 FK로 참조한다.

## 3) 상품 활성 상태 및 재고 표시

- `is_active`는 admin이 관리하는 판매 의사 플래그다. 단종/비활성화 시 `false`로 설정한다.
- 재고 표시 상태(`in_stock`, `low_stock`, `out_of_stock`)는 저장하지 않으며, 조회 시 inventory의 가용 수량으로 계산한다.
  - `available > safety_threshold(5)` → `in_stock`
  - `available > 0 && available <= safety_threshold(5)` → `low_stock`
  - `available == 0` → `out_of_stock`
- 판매 가능 조건 및 판정 흐름은 `01-overview.md §4`를 참조한다.

## 4) 정책 제약

- 판매 가능 조건은 `01-overview.md §4`의 판정 흐름을 따른다.
- `is_active = false`인 상품은 신규 구매 불가, 주문 이력 조회만 허용한다.
- 재고 수량/예약/가용 계산은 inventory 도메인에서 관리한다.

## 5) 비범위

- 컨럼 타입 정의
- 인덱스 정의
- 검색 랭킹/추천 모델 정의
- 상품 bulk import/export 스키마
