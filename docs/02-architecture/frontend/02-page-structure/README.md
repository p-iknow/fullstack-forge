---
title: "Page Folder Structure"
description: "TanStack Router 기반 페이지 컴포넌트 구조와 소스 폴더 설계 문서 인덱스."
type: index
tags: [Architecture, React, TanStackRouter]
order: 2
---

# Page Folder Structure

TanStack Router 환경에서의 페이지 폴더 구조와 컴포넌트 설계 패턴을 다루는 가이드입니다.
Store 앱(`apps/store`)의 실제 구조를 기준으로 설명합니다.

## 문서 목록

### [Source Folder Structure](./src-folder-structure.md) (메인 문서)

TanStack 기반 서비스별 응집도 중심 폴더 구조 설계

**주요 내용:**
- **Route → Screen Bridge**: TanStack Router thin wrapper + pages/ 분리 패턴
- **파일 분리 기준**: 500줄 기준 (LLM 토큰 최적화)
- **파일 vs 폴더 결정 규칙**: `.sub`, `.helper`, `.ui` 1개→파일, 2개+→폴더
- **Store 앱 실제 구조**: cart, home, auth, catalog 도메인 예시
- **@shared 모델**: 3-tier 공유 계층

**핵심 개념:** 구조가 곧 정보. Route는 thin wrapper, Page 컴포넌트가 비즈니스 로직 보유.

### [Page Component Structure](./page-component-structure.md)

페이지 컴포넌트만 보고도 해당 페이지의 **전체 구조와 동작을 한눈에 파악**할 수 있도록 설계하는 방법

**주요 내용:**
- 코드가 곧 테크스펙이 되는 페이지 구조 설계
- Store 앱 실제 패턴 (cart-page, product-detail-page)
- ErrorBoundary + SuspenseQuery 선언적 데이터 흐름
- 복잡한 페이지의 적절한 분할 전략

**핵심 철학:** 페이지 컴포넌트 자체가 테크스펙 역할을 해야 합니다.

### 의사결정 기록 (ADR)

| 문서 | 설명 |
|------|------|
| [ADR: Source Folder Structure](./src-folder-structure.adr.md) | 폴더 구조 설계 결정 과정과 기각된 대안 |
| [Design Requirements](./src-folder-structure.requirement.md) | 설계 요구사항의 학술적/논리적 근거 |

## Quick Reference

### 파일 vs 폴더 결정 규칙

| 추출 항목 수 | 형태 | 예시 |
|-------------|------|------|
| **1개** | **파일** | `*.sub.tsx`, `*.helper.ts`, `*.ui.tsx` |
| **2개+** | **폴더** | `*.sub/`, `*.helper/`, `*.ui/` |

### Route → Page 패턴

```tsx
// src/routes/login.tsx — thin wrapper (3줄)
export const Route = createFileRoute('/login')({
  component: LoginPage,     // → pages/auth/login/login-page.tsx
})
```

### 분리 기준 (500줄)

| 줄 수 | 판단 |
|-------|------|
| ≤ 500줄 | 단일 파일 유지 |
| 500–700줄 | 분리 고려 |
| 700줄+ | 분리 권장 |
