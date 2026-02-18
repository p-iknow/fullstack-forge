# Catalog API Requirements

## 1) 목적

- store/admin의 상품 탐색과 카테고리 탐색에 필요한 조회 API를 정의한다.
- 이 문서는 엔드포인트와 파라미터 범위를 다루며, request/response body 스키마는 포함하지 않는다.

## 2) 엔드포인트

### GET /products

- 목적: 상품 목록 조회
- 사용 화면: store 상품 목록, admin 상품 관리 목록

### GET /products/:id

- 목적: 단일 상품 상세 조회
- 사용 화면: store 상품 상세, admin 상품 상세

### GET /products/search

- 목적: 키워드 기반 상품 검색
- 사용 화면: store 검색 결과, admin 검색

### GET /categories

- 목적: 카테고리 목록 조회
- 사용 화면: store 카테고리 필터, admin 카테고리 필터

## 3) 검색/필터 파라미터 목록

### 공통

- `q`: 검색어
- `category`: 카테고리 식별자 또는 카테고리명
- `status`: `active|low_stock|out_of_stock|discontinued`
- `brand`: 브랜드명

### 목록/검색 전용

- `sort`: 정렬 키워드(예: 최신, 가격, 이름) — 기본값: `최신순`
- `order`: 정렬 방향(asc/desc) — 기본값: `desc`
- `page`: 페이지 번호 — 기본값: `1`
- `page_size`: 페이지 크기 — 기본값: `20`

### 상세 전용

- 경로 파라미터 `id`: 상품 식별자

## 4) 비범위

- 검색 랭킹/추천 알고리즘은 본 범위에 포함하지 않는다.
- 재고 관리 계산 로직은 inventory 도메인에서 정의한다.
