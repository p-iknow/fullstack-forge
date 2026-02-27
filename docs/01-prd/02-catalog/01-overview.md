# Catalog Domain Overview

## §1 범위

- 이 문서는 catalog 도메인의 요구사항을 기존 PRD 원문 기준으로 묶어 관리한다.
- 조회(store/admin 상품 탐색) 및 admin 쓰기(상품/카테고리 CRUD, 이미지 업로드)를 포함한다.
- 재고 수량 계산/예약/가용 재고 규칙은 inventory 도메인에서 정의한다.

## §2 카테고리/SKU 정책

- 카테고리 (6종):

  | 표시명      | slug               |
  | ----------- | ------------------ |
  | 상온 간편식 | `convenience-food` |
  | 음료        | `beverage`         |
  | 위생용품    | `hygiene`          |
  | 세탁/청소   | `laundry-cleaning` |
  | 반려소모품  | `pet-supplies`     |
  | 셀프케어    | `self-care`        |

- SKU 정책:
  - SKU 수: 40~60
  - SKU 속성: `sku`, `name`, `brand`, `price`, `weight`, `status`, `is_substitutable`
  - 가격 단위: KRW(원)
  - 중량 단위: g(그램)
  - 상태: `active | low_stock | out_of_stock | discontinued`

## §3 이미지/목업 정책

- SKU당 이미지 2장:
  - `thumb_url` (1:1)
  - `detail_url` (4:3)
- 파일명 규칙:
  - `sku-{id}-thumb.webp`
  - `sku-{id}-detail.webp`
- 초기 구현:
  - 카테고리 공통 placeholder + 텍스트 배지 허용
- admin 업로드:
  - JPEG/PNG/WebP 허용, 최대 5MB
  - sharp로 리사이즈 (thumb 400×400, detail 800×600) 후 WebP 변환
  - MinIO(S3 호환) 버킷에 저장

## §4 상품 상태/판매조건

- 상품 상태:
  - `active`
  - `low_stock`
  - `out_of_stock`
  - `discontinued`
- 판매 가능 조건:
  - `active | low_stock`
  - 재고 수량 > 0
- `discontinued`는 신규 구매 불가, 주문 이력 조회만 허용

### 판매 가능 여부 판정 흐름

```mermaid
flowchart TD
    A[상품 판매 요청] --> B{상품 상태 확인}
    B -->|active / low_stock| C{카테고리 활성 여부}
    B -->|out_of_stock / discontinued| F[판매 불가]
    C -->|is_active = true| D{재고 수량 > 0}
    C -->|is_active = false| F
    D -->|예| E[판매 가능]
    D -->|아니오| F
```

## §5 Stage 게이트 (카탈로그 부분)

### Stage 2 Exit Criteria (조회 기능)

- SKU 데이터 seed 완료
- store에서 상품 탐색/장바구니 동작
- out_of_stock 노출 정책 적용

### Admin CRUD Exit Criteria (쓰기 기능)

- admin에서 상품 생성/수정/삭제 가능
- admin에서 상품 이미지 업로드 가능 (thumb + detail)
- admin에서 상품 상태 변경 가능
- admin에서 카테고리 CRUD 가능
- 기존 store 카탈로그 조회 기능에 영향 없음

### Evidence

- SKU 정책표
- 이미지 naming 규칙 적용 스냅샷
- admin CRUD 기능 동작 검증
