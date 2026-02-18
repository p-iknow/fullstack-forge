## 포인트 이벤트 정의

본 문서는 적립 포인트 도메인에서 발행하는 이벤트 계약을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

### 이벤트 목록

| 이벤트           | 발행 시점           | 주요 소비자  |
| ---------------- | ------------------- | ------------ |
| `PointsEarned`   | 포인트 적립 시      | notification |
| `PointsRedeemed` | 포인트 사용 시      | order        |
| `PointsExpired`  | 포인트 만료 시      | notification |
| `PointsAdjusted` | 운영자 수동 조정 시 | notification |

### PointsEarned

- **발행 시점**: 주문 결제 확정 후 포인트가 적립(pending → available 전환 포함)될 때
- **소비자**: notification — 적립 알림 발송
- **페이로드**:
  - `user_id`: 대상 사용자 식별자
  - `amount`: 적립 포인트(양수)
  - `order_id`: 연관 주문 식별자
  - `earned_at`: 적립 시각(ISO 8601)
  - `expires_at`: 만료 예정 시각(ISO 8601, 적립일 + 12개월)

### PointsRedeemed

- **발행 시점**: 주문 결제에서 포인트가 차감될 때
- **소비자**: order — 주문 결제 금액 갱신 반영
- **페이로드**:
  - `user_id`: 대상 사용자 식별자
  - `amount`: 사용 포인트(양수)
  - `order_id`: 연관 주문 식별자
  - `redeemed_at`: 사용 시각(ISO 8601)

### PointsExpired

- **발행 시점**: 만료 배치가 유효기간 경과 포인트를 소멸 처리할 때
- **소비자**: notification — 만료 안내 알림 발송
- **페이로드**:
  - `user_id`: 대상 사용자 식별자
  - `amount`: 만료 포인트(양수)
  - `expired_at`: 만료 처리 시각(ISO 8601)

### PointsAdjusted

- **발행 시점**: 운영자가 포인트를 수동 가감할 때
- **소비자**: notification — 조정 내역 알림 발송
- **페이로드**:
  - `user_id`: 대상 사용자 식별자
  - `delta`: 조정량(양수=가산, 음수=차감)
  - `reason`: 조정 사유(필수)
  - `adjusted_by`: 조정 운영자 식별자

### 정리 원칙

- 이벤트 상세 스키마는 구현 단계에서 TypeSpec/Zod 계약으로 확정한다.
- 확정 전까지는 동기 API/트랜잭션 정합성 정책을 단일 기준으로 운영한다.
