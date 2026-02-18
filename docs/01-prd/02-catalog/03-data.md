# Catalog Data Requirements

## 1) Product 엔터티

- `sku`
- `name`
- `brand`
- `category_id` — 소속 카테고리 식별자
- `price`
- `weight`
- `status`
- `is_substitutable`
- `thumb_url` — 썸네일 이미지 (1:1)
- `detail_url` — 상세 이미지 (4:3)

## 2) Category 엔터티

- `id`
- `name`
- `slug`
- `display_order`
- `is_active`

## 3) Product 상태 enum

- 상태 정의 및 판매 조건은 `01-overview.md §4`를 단일 기준으로 참조한다.

## 4) 정책 제약

- 판매 가능 조건은 `01-overview.md §4`의 판정 흐름을 따른다.
- `discontinued`는 신규 구매 불가, 주문 이력 조회만 허용한다.
- 재고 수량/예약/가용 계산은 inventory 도메인에서 관리한다.

## 5) 비범위

- 컬럼 타입 정의
- 인덱스 정의
- 검색 랭킹/추천 모델 정의
