# Catalog API Requirements

## 1) 목적

- store/admin의 상품 탐색과 카테고리 탐색에 필요한 조회 API 및 admin 상품/카테고리 관리에 필요한 쓰기 API를 정의한다.
- 이 문서는 엔드포인트와 파라미터 범위를 다루며, request/response body 스키마는 포함하지 않는다.

## 2) 엔드포인트

### GET /products

- 목적: 상품 목록 조회 (카테고리/상태/브랜드 필터 기반 탐색)
- 사용 화면: store 상품 목록, admin 상품 관리 목록
- `GET /products/search`와의 구분: 이 엔드포인트는 구조화된 필터(`category`, `status`, `brand`)로 목록을 탐색하며, 검색어(`q`)는 사용하지 않는다.

### GET /products/:id

- 목적: 단일 상품 상세 조회
- 사용 화면: store 상품 상세, admin 상품 상세

### GET /products/search

- 목적: 키워드 기반 상품 검색 (자유 텍스트 `q` 파라미터 필수)
- 사용 화면: store 검색 결과, admin 검색
- `GET /products`와의 구분: 이 엔드포인트는 검색어(`q`)를 필수로 받으며, 추가 필터(`category`, `status`, `brand`)를 선택적으로 조합할 수 있다.

### GET /categories

- 목적: 카테고리 목록 조회
- 사용 화면: store 카테고리 필터, admin 카테고리 필터

### POST /admin/products

- 목적: 신규 상품 등록
- 사용 화면: admin 상품 등록 폼
- 생성 시 inventory 레코드 자동 생성 (onHand=0, reserved=0)

### PATCH /admin/products/:id

- 목적: 상품 정보 수정 (이름, slug, 설명, 가격, 카테고리, 대체 가능 여부, 표시 순서, 태그)
- 사용 화면: admin 상품 수정 폼

### PATCH /admin/products/:id/active

- 목적: 상품 활성/비활성 전환 (`is_active` 토글)
- 사용 화면: admin 상품 목록 활성 상태 변경 액션

### DELETE /admin/products/:id

- 목적: 상품 삭제
- 사용 화면: admin 상품 목록 삭제 액션
- 삭제 정책: **hard delete** (DB 레코드 완전 삭제)
- 삭제 전 검증:
  - 주문 이력(`orderItems`)이 있는 상품은 삭제 불가 (409 Conflict) → 대안으로 비활성화(`is_active = false`) 안내
  - 활성 장바구니에 담겨있는 상품은 삭제 불가 (409 Conflict)
- 삭제 성공 시 `ProductDeleted` 이벤트 발행 (`05-events.md §5` 참조)

### POST /admin/products/:id/images

- 목적: 상품 이미지 업로드 (thumbnail + detail)
- 사용 화면: admin 상품 등록/수정 폼 이미지 업로드 영역
- 허용 포맷: JPEG, PNG, WebP
- 최대 파일 크기: 파일당 5MB
- 업로드 규칙:
  - `thumb`와 `detail` 두 필드 모두 multipart form data로 전송
  - 두 이미지 모두 필수는 아님 — 개별 업로드 가능 (한쪽만 전송 시 해당 이미지만 교체)
  - 기존 이미지가 있을 경우 새 파일로 **교체**되며, 이전 파일은 MinIO에서 삭제
  - 이미지 없이 상품 생성 후 별도 업로드 가능 (이미지 미등록 상품은 카테고리 공통 placeholder 노출)
- 처리: sharp로 리사이즈 (thumb 400×400, detail 800×600) 후 WebP 변환, MinIO 업로드

### POST /admin/categories

- 목적: 카테고리 생성
- 사용 화면: admin 카테고리 관리

### PATCH /admin/categories/:id

- 목적: 카테고리 수정 (이름, slug, 표시 순서, 활성 여부)
- 사용 화면: admin 카테고리 관리

### DELETE /admin/categories/:id

- 목적: 카테고리 삭제
- 사용 화면: admin 카테고리 관리
- 해당 카테고리에 상품이 존재하면 삭제 불가 (409 Conflict)

## 3) 검색/필터 파라미터 목록

### 필터 전용 (GET /products)

- `category`: 카테고리 식별자 또는 카테고리명
- `is_active`: `true|false` (활성 상태 필터)
- `stock_display`: `in_stock|low_stock|out_of_stock` (재고 표시 상태 필터, 조회 시 계산)
- `brand`: 브랜드명

### 검색 전용 (GET /products/search)

- `q`: 검색어 (**필수**)
- `category`: 카테고리 식별자 또는 카테고리명 (선택)
- `is_active`: `true|false` (선택)
- `stock_display`: `in_stock|low_stock|out_of_stock` (선택, 재고 표시 상태 필터)
- `brand`: 브랜드명 (선택)

### 목록/검색 공통

- `sort`: 정렬 키워드(예: 최신, 가격, 이름) — 기본값: `최신순`
- `order`: 정렬 방향(asc/desc) — 기본값: `desc`
- `page`: 페이지 번호 — 기본값: `1`
- `page_size`: 페이지 크기 — 기본값: `20`

### 상세 전용

- 경로 파라미터 `id`: 상품 식별자

### 상품 쓰기 전용

- request body: `name`, `slug`, `description`, `price`, `categoryId`, `isSubstitutable`, `isActive`, `displayOrder`, `tags`
- 이미지: multipart form data (`thumb`, `detail` 필드)

## 4) 비범위

- 검색 랭킹/추천 알고리즘은 본 범위에 포함하지 않는다.
- 재고 관리 계산 로직은 inventory 도메인에서 정의한다.
- 상품 bulk import/export는 포함하지 않는다.
- admin 인증/인가(RBAC)는 auth 도메인에서 정의한다.
