# Notification Domain API Guide

## 문서 상태

- 본 문서는 **기존 PRD(01~05)에 미포함된 알림 도메인을 신규 정의**하기 위해 작성되었다.

## 범위

- store 사용자 알림 목록 조회
- store 사용자 알림 읽음 표시
- store 사용자 미읽음 카운트 조회
- admin 알림 API는 제공하지 않음 (운영 경보는 observability에서 처리)

## Store API

### API 1) 알림 목록 조회

- **경로**: `GET /notifications`
- **인증**: 로그인 필수 (Bearer token)
- **목적**: 로그인 사용자의 알림 타임라인 제공
- **쿼리 파라미터**:

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `filter` | string (enum) | N | `all` | `all`, `read`, `unread` |
| `cursor` | string | N | — | 커서 기반 페이지네이션 (다음 페이지 시작점) |
| `limit` | integer | N | `20` | 조회 건수 (최대 50) |

- **정렬**: `created_at DESC` (최신 우선, 고정)
- **응답 (200)**:

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "order",
      "title": "주문이 접수되었습니다",
      "body": "주문번호 ABC123 결제 진행 중입니다.",
      "link_target": "/orders/abc123",
      "is_read": false,
      "read_at": null,
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "next_cursor": "eyJ...",
  "has_next": true
}
```

- **오류 응답**:

| 상태 코드 | 조건 | 설명 |
| --- | --- | --- |
| `401 Unauthorized` | 인증 토큰 없음/만료 | 로그인 필요 |
| `400 Bad Request` | 잘못된 filter/limit 값 | 유효하지 않은 파라미터 |

### API 2) 알림 읽음 표시 (단건)

- **경로**: `PATCH /notifications/:id/read`
- **인증**: 로그인 필수 (Bearer token)
- **목적**: 단건 알림의 읽음 상태 전환
- **보안**: 본인 소유 알림만 변경 가능
- **멱등성**: 이미 읽음인 항목에 재요청해도 200 반환, `read_at` 최초 시각 유지
- **응답 (200)**:

```json
{
  "id": "uuid",
  "is_read": true,
  "read_at": "2026-01-15T11:00:00Z"
}
```

- **오류 응답**:

| 상태 코드 | 조건 | 설명 |
| --- | --- | --- |
| `401 Unauthorized` | 인증 토큰 없음/만료 | 로그인 필요 |
| `403 Forbidden` | 타 사용자 알림 접근 | 본인 소유 아님 |
| `404 Not Found` | 존재하지 않는 알림 ID | 삭제됨/접근 불가 |

### API 3) 알림 일괄 읽음 표시

- **경로**: `PATCH /notifications/read-all`
- **인증**: 로그인 필수 (Bearer token)
- **목적**: 현재 사용자의 전체 미읽음 알림을 읽음 처리
- **멱등성**: 미읽음 알림이 없어도 200 반환
- **응답 (200)**:

```json
{
  "updated_count": 15
}
```

- **오류 응답**:

| 상태 코드 | 조건 | 설명 |
| --- | --- | --- |
| `401 Unauthorized` | 인증 토큰 없음/만료 | 로그인 필요 |

### API 4) 미읽음 카운트 조회

- **경로**: `GET /notifications/unread-count`
- **인증**: 로그인 필수 (Bearer token)
- **목적**: 글로벌 네비게이션 배지에 표시할 미읽음 알림 개수 제공
- **응답 (200)**:

```json
{
  "unread_count": 7
}
```

- **오류 응답**:

| 상태 코드 | 조건 | 설명 |
| --- | --- | --- |
| `401 Unauthorized` | 인증 토큰 없음/만료 | 로그인 필요 |

- **비고**: 이 API는 글로벌 네비게이션 배지 갱신용으로 60초 간격 폴링에 사용. 응답이 가벼워야 하므로 카운트만 반환

## 공통 오류 처리 원칙

- 인증 없음: `401 Unauthorized` 반환
- 권한 없음: `403 Forbidden` 반환 (타 사용자 알림 접근 시)
- 존재하지 않음: `404 Not Found` 반환 (삭제/만료된 알림 식별자)
- 서버 오류: `500 Internal Server Error` 반환 (재시도 가능)

## 이벤트 도메인 연계

- 알림 생성은 동기 API 호출이 아니라 이벤트 소비 결과로 발생한다.
- 이벤트 envelope 규격은 `../13-event/01-overview.md`를 따른다.
- fanout/멱등/DLQ 운영 원칙은 `../13-event/01-overview.md`를 따른다.

## 비범위

- 이메일, SMS, push 발송 API
- 템플릿 관리 API
- 외부 알림 게이트웨이 연동 API
- 알림 삭제 API (MVP에서 사용자 삭제 미지원)
