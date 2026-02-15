# 03. Commerce Domain Policy

## 1) 도메인 모델

핵심 엔터티:

- `Product`
- `Inventory`
- `Cart`
- `Order`
- `OrderItem`
- `Payment`
- `Delivery`
- `Promotion`
- `Substitution`
- `Review`
- `ReviewComment`
- `CustomerInquiry`
- `InquiryReply`

## 2) 상품 정책

- 상품 상태:
  - `active`
  - `low_stock`
  - `out_of_stock`
  - `discontinued`
- 판매 가능 조건:
  - `active|low_stock`
  - 재고 수량 > 0
- `discontinued`는 신규 구매 불가, 주문 이력 조회만 허용

## 3) 재고 정책

### 재고 수량 규칙

- `on_hand`: 총 재고
- `reserved`: 주문 예약 재고
- `available`: `on_hand - reserved`
- 안전재고 임계치 미만이면 `low_stock`

### 재고 차감 타이밍

- 주문 생성 시 `reserved` 증가
- 결제 실패/주문 취소 시 `reserved` 복원
- 배송 확정 시 `on_hand` 확정 차감

### 동시성 규칙

- 동일 SKU 동시 주문은 낙관적 락(version) 또는 DB row lock 적용
- 음수 재고 허용 금지

## 4) 장바구니 정책

- 수량 제한: 아이템당 최대 15
- 장바구니 TTL: 7일 비활성 시 자동 만료
- 만료 시 reserved 재고는 즉시 해제

## 5) 주문 정책

### 주문 상태

- `created`
- `paid`
- `picking`
- `packed`
- `out_for_delivery`
- `delivered`
- `cancelled`
- `failed`

### 상태 전이 규칙

- `created -> paid|cancelled|failed`
- `paid -> picking`
- `picking -> packed|cancelled`
- `packed -> out_for_delivery`
- `out_for_delivery -> delivered|failed`
- `delivered`는 종료 상태

불법 전이는 API 레벨과 DB 레벨에서 모두 차단.

### 부분 실패/부분 품절

- 일부 아이템 품절 시:
  - 대체 허용 SKU면 대체 제안
  - 대체 미허용이면 부분 취소 처리
- 주문 전체 취소 여부는 사용자 선택 정책을 따른다.

## 6) 대체상품 정책

- `is_substitutable=true`인 SKU만 대체 가능
- 대체 우선순위: 동일 카테고리 -> 유사 가격대 -> 동일 브랜드
- 가격 차이 정책:
  - 대체 상품이 더 비싸면 사용자 승인 필요
  - 더 저렴하면 자동 적용 가능

## 7) 결제 정책

### 상태

- `initiated`
- `authorized`
- `captured`
- `failed`
- `cancelled`

### 규칙

- 중복 결제 방지를 위한 idempotency key 필수
- 타임아웃 시 `failed_timeout` 코드로 종료
- 주문 취소 시 결제 취소/환불 정책 연결

## 8) 배송 정책

- 배송 모드:
  - `instant` (즉시)
  - `scheduled` (예약)
- SLA:
  - instant: 30분 목표
  - scheduled: 슬롯 기준 +/- 15분 허용

### 재배차 정책

- 배차 실패 1회: 자동 재시도
- 2회 연속 실패: 운영자 개입 필요(알림)

## 9) 프로모션 정책

MVP 포함:

- 쿠폰 1종(정액/정률 택1)
- 카테고리 할인 1종
- 최소주문금액 조건

### 충돌 정책

- 쿠폰과 카테고리 할인은 동시 적용 불가(초기)
- 사용자에게 더 유리한 할인 자동 선택

## 10) 리뷰/댓글 정책

### 리뷰 작성 정책

- 리뷰 작성 가능 조건:
  - 주문 상태 `delivered`
  - 리뷰 대상 SKU를 실제 구매한 사용자
- 사용자당 `order_item` 기준 리뷰 1개(수정은 허용, 중복 생성 금지)
- 평점 범위: `1..5`
- 리뷰 상태: `visible|hidden|flagged`

### 리뷰 댓글 정책

- 댓글 작성 권한: `customer|operator|admin`
- 숨김/삭제 권한: `operator|admin`
- 댓글 삭제는 soft delete를 기본으로 하고 감사 로그를 남김

## 11) 고객 문의 정책

### 문의 기본 정책

- 문의 카테고리: `order|payment|delivery|product|account|other`
- 문의 상태: `open|in_progress|resolved|closed`
- 고객은 자신의 문의만 조회 가능

### 응답 정책

- 1차 응답 목표: 24시간 이내
- 답변/상태 변경 권한: `operator|admin`
- 상태 전이는 `open -> in_progress -> resolved -> closed`를 기본으로 함

## 12) admin 운영 정책

- 주문 상태 전이 수행 권한: `operator|admin`
- 강제 상태 수정은 감사 로그 남김
- redrive 실행은 `admin`만 허용
- 리뷰 숨김/문의 상태 변경 사유를 운영 로그에 기록

## 13) 완료 조건

- 주문 생성/결제/배송 전이 시나리오 정상
- 부분 품절/대체 시나리오 정상
- 리뷰/댓글 작성 및 운영자 숨김 처리 흐름 정상
- 고객 문의 생성/운영자 답변/상태 전이 흐름 정상
- 불법 상태 전이/권한 위반 차단 검증 통과
