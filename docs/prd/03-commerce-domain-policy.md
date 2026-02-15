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
- `LoyaltyAccount`
- `PointPolicy`
- `PointLedger`
- `PointRedemption`
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

### 적용 범위

- 쿠폰 1종(정액/정률 택1)
- 카테고리 할인 1종
- 최소주문금액 조건

### 데이터 모델(운영 시뮬레이션 기준)

- `promotions`: 할인 정책 본체(타입/할인값/유효기간/활성상태)
- `coupons`: 코드 기반 프로모션 세부(코드/사용 한도/유효기간)
- `promotion_categories`: 카테고리 할인 대상 범위
- `coupon_redemptions`: 사용자-주문 단위 쿠폰 사용 이력
- `order_promotions`: 최종 주문에 적용된 할인 결과 스냅샷

### 계산 순서

1. 주문 시점에 활성 프로모션 후보 조회(기간/상태 필터)
2. 쿠폰 코드 입력 시 코드 유효성 검증(존재/만료/사용량/사용자별 제한)
3. 카테고리 할인 후보 계산(주문 아이템 카테고리 기반)
4. 최소주문금액 조건 검증
5. 충돌 정책 적용(동시 적용 금지)
6. 사용자에게 가장 유리한 할인 1개 선택
7. 선택 결과를 `order_promotions`로 고정 저장

### 쿠폰 사용 규칙

- 쿠폰 코드는 대소문자 구분 없이 비교하되 저장은 원본 보존
- 동일 주문에는 동일 쿠폰 재적용 불가
- 사용자별 사용 제한(`per_user_limit`) 초과 시 거절
- 전체 사용 제한(`max_uses`) 초과 시 거절
- 만료 쿠폰은 조회는 가능하나 적용 불가
- 주문 취소/결제 실패 시 쿠폰 사용 이력 롤백 정책을 명시적으로 적용

### 충돌 정책

- 쿠폰과 카테고리 할인은 동시 적용 불가(초기)
- 사용자에게 더 유리한 할인 자동 선택
- 동일 할인액이면 쿠폰 우선(사용자 체감 일관성)
- 선택 근거(`best_price_policy`, `coupon_priority_on_tie`)를 `order_promotions.selected_by_rule`에 기록

### 운영/보안 정책

- 무차별 코드 대입 방지: 사용자/IP 단위 rate limit 적용
- 실패 사유 코드 표준화: `coupon_not_found`, `coupon_expired`, `coupon_limit_exceeded`, `promotion_min_order_not_met`
- 감사 로그 기록: 쿠폰 적용 성공/실패, 운영자 수동 비활성화, 정책 변경 이력

### 정합성/동시성 정책

- 사용량 증가는 트랜잭션으로 처리해 초과 발급 방지
- `coupon_redemptions`는 (coupon, user, order) 중복 방지 제약 필요
- 주문 할인 결과는 계산 후 재조회가 아닌 스냅샷 값을 신뢰 원천으로 사용

### 검증 시나리오

- 최소주문금액 미달 시 할인 미적용
- 만료 직전 쿠폰 동시 요청 2건에서 초과 사용 차단
- 쿠폰/카테고리 할인 동시 후보 발생 시 최대 할인 1개만 적용
- 주문 취소 후 쿠폰 재사용 가능 여부가 정책과 일치

## 9a) 적립 포인트 정책

### 정책 범위

- 기본 적립: 결제 확정 주문에 대해 포인트 적립
- 사용: 주문 결제 시 포인트 차감
- 만료: 유효기간 경과 포인트 자동 소멸
- 운영 조정: 운영자 수동 가감(사유 필수)

### 포인트 상태 모델

- `available`: 즉시 사용 가능 포인트
- `pending`: 확정 대기 포인트(배송 완료 전 등)
- `expired`: 만료로 소멸된 포인트

### 적립 규칙

- 적립 시점: 기본은 `paid`, 환불/취소 가능성을 고려해 `pending`으로 적립 후 `delivered` 시 `available` 전환 가능
- 적립 단위: 주문 단위 계산(카테고리/이벤트 정책으로 가중치 가능)
- 최소 주문 금액 미달 시 적립 제외 가능
- 주문 취소/결제 취소 시 적립 rollback

### 사용 규칙

- 최소 사용 포인트 임계치(`min_redeem_points`) 적용
- 보유 포인트를 초과한 사용 요청 차단
- 포인트 사용 금액은 주문 총액을 초과할 수 없음
- 1개 주문의 포인트 사용 이력은 중복 생성 금지

### 유효기간/소멸 규칙

- 포인트 적립 시 `expires_at`를 기록
- 만료 배치가 만료분을 `expire` ledger로 전환
- 만료 이벤트는 사용자 알림(향후 단계)과 연결 가능

### 감사/운영 정책

- ledger에는 `source_type`(`order_payment`, `order_cancel`, `review_reward`, `event_reward`, `admin_adjust`) 기록
- 수동 조정은 운영자 권한(`operator|admin`) + 사유/요청 ID 필수
- 결제/취소/환불과 포인트 ledger의 정합성 점검 배치 운영

### 동시성/정합성 규칙

- 차감/적립은 트랜잭션으로 처리하여 이중 차감 방지
- ledger 포인트 값은 양수만 허용, 방향은 `transaction_type`으로 표현
- 사용자별 잔액(`loyalty_account`)은 ledger 합계와 주기적 대사

### 검증 시나리오

- 동시 결제 2건에서 포인트 이중 차감 방지
- 주문 취소 시 사용 포인트 복원 + 적립 rollback 일관성 확인
- 만료 배치 실행 후 잔액과 ledger 합계 일치
- 운영자 수동 조정 이력 추적 가능

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
