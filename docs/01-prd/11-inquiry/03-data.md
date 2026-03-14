# Inquiry Data

## CustomerInquiry 엔터티

| 필드 | 타입 | 필수 | 제약조건 | 설명 |
| --- | --- | --- | --- | --- |
| `id` | UUID | Y | PK | 문의 식별자 |
| `customer_id` | UUID | Y | FK → User | 문의 작성 고객 식별자 |
| `order_id` | UUID | N | FK → Order | 관련 주문 식별자. 주문과 무관한 문의(account, other 등)는 null |
| `category` | enum | Y | `order\|payment\|delivery\|product\|account\|other` | 문의 카테고리 |
| `title` | string | Y | 최대 **200자** | 문의 제목 |
| `content` | string | Y | 최대 **5,000자** | 문의 본문 |
| `status` | enum | Y | `open\|in_progress\|resolved\|closed`, 기본값 `open` | 문의 상태 |
| `reopen_count` | integer | Y | 기본값 `0`, 최대 `3` | 재오픈 횟수 |
| `assigned_operator_id` | UUID | N | FK → User | 담당 운영자 식별자 |
| `created_at` | timestamp | Y | 생성 시 자동 설정 | 문의 생성 시각 |
| `updated_at` | timestamp | Y | 변경 시 자동 갱신 | 문의 수정 시각 |
| `last_replied_at` | timestamp | N | 운영자 답변 시 갱신 | 최근 답변 시각 |
| `version` | integer | Y | 기본값 `1`, 낙관적 락용 | 동시성 제어 버전 |

### 유니크 제약 및 인덱스

- `idx_inquiry_customer_id`: `customer_id` — 고객별 문의 목록 조회
- `idx_inquiry_status`: `status` — 상태별 필터 조회
- `idx_inquiry_order_id`: `order_id` — 주문별 문의 조회
- `idx_inquiry_created_at`: `created_at DESC` — 최신순 정렬

## InquiryReply 엔터티

| 필드 | 타입 | 필수 | 제약조건 | 설명 |
| --- | --- | --- | --- | --- |
| `id` | UUID | Y | PK | 답변 식별자 |
| `inquiry_id` | UUID | Y | FK → CustomerInquiry | 대상 문의 식별자 |
| `author_role` | enum | Y | `operator\|admin\|customer` | 답변 작성 권한. 재오픈 시 고객 추가 질문도 reply로 기록 |
| `author_id` | UUID | Y | FK → User | 답변 작성자 식별자 |
| `content` | string | Y | 최대 **10,000자** (운영자), 최대 **5,000자** (고객 재오픈) | 답변/추가 질문 본문 |
| `is_internal` | boolean | Y | 기본값 `false` | 내부 메모 여부. `true`이면 고객에게 비공개 |
| `created_at` | timestamp | Y | 생성 시 자동 설정 | 답변 생성 시각 |

### 유니크 제약 및 인덱스

- `idx_reply_inquiry_id`: `inquiry_id` — 문의별 답변 목록 조회

## 상태 전이 규칙

- 기본 전이: `open -> in_progress -> resolved -> closed`
- 재오픈 전이: `resolved -> open` (고객 추가 질문 시, `reopen_count` < 3인 경우만)
- `closed`는 최종 상태이며, 재오픈 불가
- 답변/상태 변경 권한: `operator|admin`

## `last_replied_at` 갱신 규칙

- 운영자(`operator|admin`)가 `POST /inquiries/{id}/replies`로 답변을 등록할 때마다 현재 시각으로 갱신한다.
- 고객의 재오픈 추가 질문으로는 갱신되지 않는다.

## 접근 제약

- 고객은 자신의 문의만 조회 가능
- `is_internal=true`인 답변은 `operator|admin`만 조회 가능

## 동시성 제어

- 상태 전이 시 `version` 필드를 이용한 낙관적 락(optimistic lock) 적용
- 전이 요청 시 현재 `status` + `version` 일치 조건으로 충돌 감지
- 충돌 시 `409 Conflict` 반환, 재시도는 클라이언트 판단

## 삭제 및 데이터 보관 정책

- 문의/답변 삭제는 **soft delete** 적용 (`deleted_at` timestamp)
- 고객은 자신의 문의를 삭제 요청할 수 있으나 운영 답변 이력은 보존
- 데이터 보존 기간: **3년** (고객 지원 이력 추적 및 감사 목적)
- 보존 기간 경과 후 개인정보 비식별화 처리 (content 마스킹, customer_id 해시 치환)
