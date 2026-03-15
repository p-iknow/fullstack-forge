---
title: "ADR: Source Folder Structure"
description: "폴더 구조 설계를 위한 의사결정 과정과 기각된 대안을 기록한 ADR 문서입니다."
type: adr
tags: [Architecture]
order: 4
---

# ADR: 소스 폴더 구조 설계 결정 기록

> **ADR (Architecture Decision Record)**: 이 문서는 `src-folder-structure.md`를 설계하면서 거친 의사결정 과정과 기각된 대안들을 기록합니다.

---

## 설계 요구사항

### 정의된 요구사항

| # | 요구사항 | 설명 |
|---|----------|------|
| R1 | **직관적 의사결정** | 화면 구성을 보고 폴더 구조를 직관적으로 판단 가능 |
| R2 | **구조 → 화면 예측** | 폴더 구조만 보고 화면 형태 예측 가능 |
| R3 | **코드 위치 예측** | 수정할 부분의 코드 위치를 구조에서 예측 가능 |
| R4 | **수정 범위 격리** | 수정 영향이 해당 부분에 한정, 응집도 높은 구조 |
| R5 | **자기완결적 구조** | 최소 파일로 전체 맥락 파악 가능 |
| R6 | **유연한 확장성** | 단순~복잡한 다양한 화면 형태 수용 |
| R7 | **명확한 컨벤션** | 용어가 단일 의미로 해석, 모호함 없음 |

### 요구사항 검토

#### ✅ 적절한 요구사항

| 요구사항 | 평가 | 이유 |
|----------|------|------|
| R1 직관적 의사결정 | ✅ 적절 | 폴더 구조의 핵심 목적 |
| R2 구조 → 화면 예측 | ✅ 적절 | "구조가 곧 정보" 철학과 일치 |
| R3 코드 위치 예측 | ✅ 적절 | 유지보수 효율의 핵심 |
| R4 수정 범위 격리 | ✅ 적절 | 사이드 이펙트 방지, 안전한 수정 |
| R5 자기완결적 구조 | ✅ 적절 | LLM 토큰 효율, 맥락 파악 용이 |
| R7 명확한 컨벤션 | ✅ 적절 | 일관성의 기반 |

#### ⚠️ 주의가 필요한 요구사항

| 요구사항 | 평가 | 주의사항 |
|----------|------|----------|
| R6 유연한 확장성 | ⚠️ 트레이드오프 | 유연성↑ = 규칙 복잡도↑. 4가지 폴더 타입으로 제한하여 균형 유지 |

#### 요구사항 간 관계

```
R7 명확한 컨벤션
    ↓ (기반)
R1 직관적 의사결정 ←→ R2 구조 → 화면 예측
    ↓                      ↓
R3 코드 위치 예측      R4 수정 범위 격리
    ↓                      ↓
    └──────→ R5 자기완결적 구조 ←──────┘
                   ↑
            R6 유연한 확장성 (제약 조건)
```

**해석**:
- R7(명확한 컨벤션)이 모든 요구사항의 기반
- R1~R5는 상호 보완적이며, R5(자기완결적 구조)로 수렴
- R6(유연성)은 다른 요구사항과 트레이드오프 관계 → 제한된 유연성 채택

---

## 요구사항의 학술적/논리적 근거

> 📖 **각 요구사항의 상세한 학술적/논리적 근거는 [소스 폴더 구조 문서](./src-folder-structure.md#-설계-요구사항-및-근거)를 참고하세요.**
>
> 메인 문서에는 다음 내용이 포함되어 있습니다:
> - Screaming Architecture (소리치는 아키텍처)
> - Cognitive Load Theory (인지 부하 이론)
> - Information Foraging Theory (정보 채집 이론)
> - Common Closure Principle (공통 폐쇄 원칙)
> - Vertical Slice Architecture (수직적 슬라이스 아키텍처)
> - Feature-Sliced Design (기능 분할 설계)
> - LLM의 "Lost in the Middle" 현상
> - RAG (검색 증강 생성) 최적화
> - Fractal Architecture (프랙탈 아키텍처)
> - AHA Programming (성급한 추상화 방지)

---

## 📚 참고 문헌 (References)

### Architecture & Principles

| # | 출처 | 링크 |
|---|------|------|
| 1 | Martin, R. C. (2011). "Screaming Architecture" | [Clean Coder Blog](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html) |
| 2 | Bogard, J. (2018). "Vertical Slice Architecture" | [Jimmy Bogard's Blog](https://www.jimmybogard.com/vertical-slice-architecture/) |
| 3 | Feature-Sliced Design. "Architectural methodology for frontend projects" | [feature-sliced.design](https://feature-sliced.design/) |
| 4 | Martin, R. C. "Common Closure Principle (CCP)" | [Solid Book Wiki](https://wiki.solidbook.io/common-closure-principle-(ccp)-ff800b8d83df4b2290081fef30d304fc/) |
| 5 | Dodds, K. C. "AHA Programming" | [kentcdodds.com](https://kentcdodds.com/blog/aha-programming) |
| 6 | Dodds, K. C. "Colocation" | [kentcdodds.com](https://kentcdodds.com/blog/colocation) |
| 7 | Comeau, J. W. "Delightful React File/Directory Structure" | [joshwcomeau.com](https://www.joshwcomeau.com/react/file-structure/) |

### Cognitive Science & Psychology

| # | 출처 | 링크 |
|---|------|------|
| 8 | Sweller, J. (1988). "Cognitive Load Theory" | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/0364021388900237) |
| 9 | Green, T. R. G. & Petre, M. (1996). "Cognitive Dimensions of Notations" | [Wikipedia](https://en.wikipedia.org/wiki/Cognitive_dimensions_of_notations) |
| 10 | Pirolli, P. & Card, S. (1999). "Information Foraging Theory" | [Wikipedia](https://en.wikipedia.org/wiki/Information_foraging) |

### AI & LLM

| # | 출처 | 링크 |
|---|------|------|
| 11 | Liu, N. F. et al. (2023). "Lost in the Middle: How Language Models Use Long Contexts" | [arXiv](https://arxiv.org/abs/2307.03172) |
| 12 | Lewis, P. et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" | [arXiv](https://arxiv.org/abs/2005.11401) |

---

## 목차
1. [기능/기술 유형별 폴더 분류(hooks, models, constants)를 채택하지 않은 이유](#1-기능기술-유형별-폴더-분류hooks-models-constants를-채택하지-않은-이유)
2. [view + sub 동시 사용 구조 정리](#2-view--sub-동시-사용-구조-정리)
3. [calc/action 분리 vs helper 통합](#3-calcaction-분리-vs-helper-통합)
4. [기존 아키텍처 방법론(FSD 등) 검토](#4-기존-아키텍처-방법론fsd-등-검토)
5. [네이밍 통일](#5-네이밍-통일)
6. [폴더 구조 단순화](#6-폴더-구조-단순화)
7. [helper vs utils 통합](#7-helper-vs-utils-통합)
8. [단수형 vs 복수형 네이밍](#8-단수형-vs-복수형-네이밍)
9. [Barrel Export 제거](#9-barrel-export-제거)
10. [파일 vs 폴더 유연성](#10-파일-vs-폴더-유연성)
11. [스타일 파일 분리 여부](#11-스타일-파일-분리-여부)
12. [상수 파일 분리 여부](#12-상수-파일-분리-여부)
13. [Hooks 파일 분리 여부](#13-hooks-파일-분리-여부)
14. [파일명에 전체 경로 포함 여부](#14-파일명에-전체-경로-포함-여부)
15. [Types 파일 필수화 여부](#15-types-파일-필수화-여부)
16. [페이지 파일명에 맥락 포함 여부](#16-페이지-파일명에-맥락-포함-여부)

---

## 1. 기능/기술 유형별 폴더 분류(hooks, models, constants)를 채택하지 않은 이유

### 결정
`hooks/`, `models/`, `constants/`, `utils/`, `components/` 등 **기능/기술 유형별 폴더 분류 방식을 채택하지 않음**, 대신 **페이지/뷰 기반 응집도 중심 구조** 채택

### 배경

웹 프로젝트의 경우 각 페이지별로 각각의 다른 도메인을 가지고 있어서, page와 페이지를 구성하는 재료(component, api, util)가 높은 응집도를 가지고 있습니다.

**폴더 구조 설계의 목적:**
- 폴더를 보고 해당 페이지의 구조를 한눈에 파악
- 페이지의 특정 영역에 이상이 생겼을 때 해당 폴더 안에서 비즈니스 로직, 스타일을 한번에 파악

**Trade-off 인식:**
- 아래와 같은 폴더구조는 꽤나 깊은 depth를 가지게 됩니다
- 하지만 의미없이 늘어진 flat한 구조보다는, **구조 자체가 의미를 가지고 정보를 제공**하도록 설계하는 것이 유지보수에 더 도움이 된다고 판단했습니다

### 고려된 대안

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| 기능/기술 유형별 분류 (`hooks/`, `models/`, `constants/`) | 파일 타입별 그룹화, 익숙한 패턴 | 응집도 저하, 관련 코드 흩어짐, 수정 범위 예측 어려움 | ❌ 기각 |
| **페이지/뷰 기반 응집도 중심 구조** | 높은 응집도, 수정 영향 범위 격리, 코드 위치 예측 가능 | 폴더 depth 증가 | ✅ 채택 |

### 기각된 구조

```typescript
// ❌ 기각된 구조: 기능/기술 유형별 분류
src/
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Card.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useHeader.ts
│   └── useCard.ts
├── models/
│   ├── user.ts
│   └── card.ts
├── constants/
│   ├── api.ts
│   └── config.ts
├── utils/
│   ├── format.ts
│   └── validation.ts
└── pages/
    └── home/
        └── home-page.tsx

// 문제점:
// 1. Header 수정 시: components/Header.tsx + hooks/useHeader.ts + models/... 여러 폴더 탐색 필요
// 2. "이 hook이 어디서 쓰이지?" 역추적 어려움
// 3. 페이지 삭제 시: 관련 코드가 어디에 흩어져 있는지 파악 어려움
// 4. 설계 요구사항 R3(코드 위치 예측), R4(수정 범위 격리), R5(자기완결적 구조) 위배
```

### 채택된 구조

```typescript
// ✅ 채택된 구조: 페이지/뷰 기반 응집도 중심
src/
└── home/
    ├── home-page.tsx
    ├── home-page.helper.ts      // hooks, utils, constants 모두 포함
    └── home-page.sub/
        ├── header/
        │   ├── header.tsx
        │   └── header.helper.ts  // header 관련 로직만
        └── card/
            ├── card.tsx
            └── card.helper.ts    // card 관련 로직만

// 장점:
// 1. Header 수정 시: home-page.sub/header/ 폴더만 보면 됨
// 2. 관련 코드가 한 곳에 응집
// 3. 페이지 삭제 시: 해당 폴더만 삭제
// 4. 설계 요구사항 R1~R7 모두 충족
```

### 기각 이유

#### 1. 설계 요구사항 미충족

| 요구사항 | 기능/기술 유형별 분류 | 페이지/뷰 기반 구조 |
|----------|----------------------|-------------------|
| R1 직관적 의사결정 | ❌ 파일 위치 결정에 고민 필요 | ✅ 관련 폴더에 바로 추가 |
| R2 구조 → 화면 예측 | ❌ 폴더 구조가 화면과 무관 | ✅ 폴더가 화면 구조 반영 |
| R3 코드 위치 예측 | ❌ 여러 폴더 탐색 필요 | ✅ 해당 폴더 내에서 찾음 |
| R4 수정 범위 격리 | ❌ 수정 영향 범위 파악 어려움 | ✅ 폴더 단위로 격리 |
| R5 자기완결적 구조 | ❌ 최소 3-4개 폴더 참조 필요 | ✅ 한 폴더에서 맥락 파악 |
| R7 명확한 컨벤션 | ❌ "이건 hook? util?" 판단 필요 | ✅ "로직은 helper"로 단순화 |

#### 2. 응집도 저하 문제

```typescript
// 기능/기술 유형별 분류에서 Header 컴포넌트 수정 시:
// 1. components/Header.tsx 열기
// 2. hooks/useHeader.ts 찾기
// 3. constants/headerConfig.ts 찾기
// 4. utils/headerFormat.ts 찾기
// → 4개 폴더를 오가며 작업

// 페이지/뷰 기반 구조에서 Header 수정 시:
// 1. header/ 폴더 열기
// 2. header.tsx, header.helper.ts 수정
// → 1개 폴더 내에서 완결
```

#### 3. 파일 배치 시 고민 유발

기능/기술 유형별 분류는 파일을 만들 때마다 "어디에 둘지" 고민이 발생:
- "이건 hook인가? util인가?"
- "이 상수는 constants에 넣을까? 컴포넌트 파일에 둘까?"
- "이 타입은 models에? types에?"

**원칙**: 이런 고민을 하지 않고, 규칙에 맞게 파일 생성 및 관리가 되도록 규칙을 설정

#### 4. LLM/자동화 도구와의 호환성

- 기능/기술 유형별 분류는 관련 코드가 흩어져 있어 LLM이 맥락 파악에 더 많은 토큰 소비
- 페이지/뷰 기반 구조는 한 폴더 내에서 전체 맥락 파악 가능 → 효율적인 코드 생성

### 원칙

| 원칙 | 설명 |
|------|------|
| **코드 응집도 달성** | 원칙의 목적. 아래 컨벤션은 이를 달성하기 위한 수단이며, 목적을 달성할 수 있다면 수단은 변경될 수 있음 |
| **API는 domains 폴더에** | api는 여러 페이지에서 공동으로 사용하는 경우가 많아 `domains` 폴더 하위에 도메인별로 구분 |
| **300줄 기준 파일 분리** | 한 파일에 적을 수 있는 작은 분량의 코드는 별도 파일로 분리하지 않음 |
| **view 기준 응집** | 한 페이지를 구성하는 응집도의 단위를 `view`로 설정하고, view를 기준으로 styled(스타일), helper(로직)를 정리 |

### 참고 레퍼런스

| # | 출처 | 설명 |
|---|------|------|
| 1 | [Atomic Design Pattern의 Best Practice 여정기](https://yozm.wishket.com/magazine/detail/1531/) | Atomic Design의 한계와 실용적 접근 |
| 2 | [React folder structure best practice](https://www.robinwieruch.de/react-folder-structure/) | 기능 기반 구조의 장점 |
| 3 | [Evolution of a React folder structure and why to group by features right away](https://profy.dev/article/react-folder-structure) | 기능별 그룹화의 진화 과정 |
| 4 | [Colocating React component files: the tools you need](https://medium.com/trabe/colocating-react-component-files-the-tools-you-need-c377a61382d3) | Colocation 전략 |
| 5 | [Delightful React File/Directory Structure](https://www.joshwcomeau.com/react/file-structure/) | Josh Comeau의 실용적 폴더 구조 |

### 근거 요약

| 문제 | 해결 |
|------|------|
| **응집도 저하** | 관련 코드를 한 폴더에 모아 응집도 극대화 |
| **코드 위치 예측 어려움** | 화면 구조 = 폴더 구조로 직관적 예측 |
| **수정 범위 파악 어려움** | 폴더 단위 격리로 영향 범위 명확화 |
| **파일 배치 고민** | "로직은 helper"로 판단 비용 제거 |
| **LLM 맥락 파악 비효율** | 자기완결적 폴더로 토큰 효율 최적화 |

---

## 2. view + sub 동시 사용 구조 정리

### 배경: 팀 내 발생한 혼란

기존 코드베이스에서 `views`, `view`, `page`, `sub`가 혼재되어 사용되면서 팀 구성원들 사이에 모호함이 발생했습니다.

**실제 발생한 질문들:**
- "기존의 `views`, `view`, `page`의 컨벤션이 있는지?"
- "기준을 만들어야하는지?"
- "이 정도 레벨에서는 개발자의 자유에 맡기면 좋을지?"

### 문제가 된 기존 구조들

```typescript
// ❓ 패턴 1: page → 메인 section(page 레벨) → 내부 section
// 탭과 같이 상태관리가 필요한 경우 사용
feature/_index/
├── feature-page.tsx      // page 컴포넌트
├── feature-view.tsx      // view 컴포넌트 (중간 레이어?)
└── views/                // 내부 views 폴더
    └── ...

// ❓ 패턴 2: page → 내부 section (default)
page/
├── page.tsx
└── sub/                  // 바로 sub 사용
    └── ...

// 문제: 언제 view를 쓰고, 언제 sub를 쓰는지 기준이 불명확
// "이건 view에 넣어? sub에 넣어?" 매번 판단 필요
```

### 결정

`view` + `sub` 동시 사용 구조를 정리하고, 명확한 사용 기준 수립

| 폴더 | 용도 | 사용 시점 |
|------|------|----------|
| `*.views/` | **화면 전환**이 있는 멀티뷰 페이지 | 탭, 스텝, 조건부 화면 등 |
| `*.sub/` | 단일 화면 내 **하위 컴포넌트** | 일반적인 컴포넌트 분리 |

### 기각된 구조: view와 sub의 혼용

```typescript
// ❌ 기각: view와 sub가 동일 레벨에서 혼용
page/
├── page.tsx
├── page.view.tsx         // "view"가 뭐지?
├── page.sub/             // sub와 view의 차이는?
│   └── header/
└── views/                // 또 views 폴더?
    └── tab-a/

// 문제점:
// 1. view vs sub 구분 기준 불명확
// 2. 같은 의미를 다른 이름으로 사용
// 3. 신규 개발자/LLM이 패턴 파악 어려움
```

### 채택된 구조: 명확한 역할 분리

```typescript
// ✅ 케이스 1: 단일 화면 (멀티뷰 없음)
simple-page/
├── simple-page.tsx
└── simple-page.sub/          // 하위 컴포넌트는 sub에
    ├── header/
    └── content/

// ✅ 케이스 2: 멀티뷰 화면 (탭, 스텝 등)
tabbed-page/
├── tabbed-page.tsx           // 탭 상태 관리
└── tabbed-page.views/        // 각 탭 화면
    ├── overview/
    │   ├── overview.tsx
    │   └── overview.sub/     // 각 view 내부의 sub
    └── details/
        ├── details.tsx
        └── details.sub/
```

### 기각 이유

#### 1. 용어의 중복과 모호함
- `view`와 `sub` 모두 "하위 컴포넌트"를 의미할 수 있음
- 명확한 구분 기준 없이 혼용되면 일관성 저하
- **"이건 view야, sub야?"** 판단이 매번 필요

#### 2. 팀 내 실제 혼란 발생
- 여러 팀 구성원이 동일한 모호함을 느낌
- PR 리뷰에서 "왜 여기는 view이고 저기는 sub인지" 질문 발생
- 컨벤션 문서만으로는 명확한 방향 제시 부족

#### 3. 자율에 맡기면 발생하는 문제
| 옵션 | 결과 |
|------|------|
| 개발자 자율 | 사람마다 다른 구조 → 일관성 붕괴 |
| 명확한 기준 | 판단 비용 0, 누구나 동일한 구조 생성 |

#### 4. LLM 코드 생성의 일관성
- 기준이 모호하면 LLM도 일관된 코드 생성 불가
- 명확한 규칙이 있어야 자동화 품질 향상

### 적용 가이드

| 상황 | 사용할 폴더 | 예시 |
|------|-------------|------|
| 화면 전환이 있는 경우 | `*.views/` | 탭 네비게이션, 스텝 위자드, 조건부 화면 |
| 단순 컴포넌트 분리 | `*.sub/` | 헤더, 푸터, 섹션, 카드 등 |
| view 내부 컴포넌트 | `view-name.sub/` | 특정 탭 화면 내의 하위 컴포넌트 |

### 판단 플로우차트

```
화면이 여러 개로 전환되는가?
    │
    ├─ YES → *.views/ 사용
    │         └─ 각 화면은 views/ 내부에 폴더로
    │
    └─ NO → *.sub/ 사용
              └─ 하위 컴포넌트는 sub/ 내부에 폴더로
```

### 마이그레이션 가이드

기존 코드에서 `view`와 `sub`가 혼용된 경우:

```typescript
// Before: 혼용 구조
page/
├── page.tsx
├── page.view.tsx        // ❌ 불명확
└── page.sub/

// After: 정리된 구조 (단일 화면인 경우)
page/
├── page.tsx
└── page.sub/
    └── (기존 view 내용을 sub로 이동)

// After: 정리된 구조 (멀티뷰인 경우)
page/
├── page.tsx
└── page.views/
    └── (기존 view 내용을 views로 이동)
```

### 근거 요약

| 문제 | 해결 |
|------|------|
| **용어 모호함** | `views` = 화면 전환, `sub` = 하위 컴포넌트로 명확히 구분 |
| **팀 내 혼란** | 명확한 판단 플로우차트 제공 |
| **일관성 저하** | 자율 대신 명시적 규칙으로 통일 |
| **LLM 코드 생성** | 규칙 기반으로 일관된 구조 생성 가능 |

---

## 3. calc/action 분리 vs helper 통합

### 결정
`*.calc.ts` / `*.action.ts` 분리 패턴을 채택하지 않음, `*.helper.ts`에 통합

### 배경: Functional Programming의 calc/action 개념

| 개념 | 설명 | 특징 |
|------|------|------|
| **Calculation (calc)** | 순수 함수, 입력 → 출력만 존재 | Side effect 없음, 테스트 용이 |
| **Action** | 부수 효과를 수반하는 함수 | API 호출, 상태 변경, DOM 조작 등 |

이 패턴의 **원래 의도**:
- Action에서 순수한 계산 로직(calc)을 분리하여 테스트 작성을 최대화
- Side effect가 없는 calc 함수는 단위 테스트가 쉬움
- Action은 통합 테스트로, calc는 단위 테스트로 분리하여 테스트 커버리지 확보

### 고려된 대안

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| `*.calc.ts` + `*.action.ts` 분리 | 순수 함수 분리로 테스트 용이 (이론상) | 응집도 저하, 학습 곡선, 실제 효과 미미 | ❌ 기각 |
| **`*.helper.ts` 통합** | 단순함, 관련 로직 한 곳에 | - | ✅ 채택 |

### 기각된 구조와 실제 문제 사례

```typescript
// ❌ 기각된 구조: calc/action 분리
daily-mission/
├── daily-mission.calc.ts     // 순수 계산 로직
├── daily-mission.action.ts   // API 호출, side effect
└── daily-mission-page.tsx

// 기존 코드에서 발생한 문제:
feature/
├── calc/
│   └── calculateProgress.ts
├── action/
│   ├── fetchData.ts
│   └── calculateProgress.ts   // ❌ 응집도 문제로 action 내부에 calc 중복
└── feature.tsx
```

```typescript
// ✅ 채택된 구조: helper 통합
daily-mission/
├── daily-mission.helper.ts   // 순수 함수, hooks, API 호출 모두 포함
└── daily-mission-page.tsx
```

### 기각 이유

#### 1. 학습 곡선 문제
- `calc`와 `action` 개념은 함수형 프로그래밍(FP)에서 유래
- FP를 모르는 개발자는 "왜 이렇게 나눠져 있는지" 이해하기 어려움
- `helper`는 보편적 용어로, 추가 설명 없이도 "도움 함수"라는 의미 전달

> 📌 Josh Comeau의 [React 파일 구조 아티클](https://www.joshwcomeau.com/react/file-structure/)에서도 `helpers`를 범용적 이름으로 권장

#### 2. 응집도 저하
- `calc`와 `action` 폴더가 물리적으로 분리되면 **관련 로직이 흩어짐**
- 실제 사례: 기존 코드에서 "응집도 문제로 `action` 내부에 `calc` 로직을 넣어두는" 혼란 발생
- 의도와 달리 **테스트 코드 작성 증가 효과도 미미**했음

#### 3. 의도와 현실의 괴리
| 의도 | 현실 |
|------|------|
| calc 분리로 테스트 작성 최대화 | 테스트 작성량 증가 효과 미미 |
| 순수 함수 명확히 식별 | 경계가 모호하여 혼란 야기 |
| 응집도 유지 | 오히려 응집도 저하됨 |

#### 4. LLM 코드 생성과 리팩토링 시 깨지기 쉬움
- `calc` vs `action` 분류 판단이 필요하여 **코드 생성 시 일관성 유지 어려움**
- 리팩토링 시 "이건 calc로 옮겨야 하나? 그대로 action에 둬야 하나?" 고민 발생
- `helper` 통합 시: **"로직은 다 helper"로 판단 비용 0**
- 본 폴더 구조 원칙의 핵심인 **"폴더/파일명 결정 시 고민하지 않기"**에 위배됨

#### 5. 자기완결적 응집도 (R5 요구사항) 미충족
- LLM이 코드 맥락을 파악할 때 `calc`와 `action` 두 파일을 모두 읽어야 함
- `helper` 통합 시 **한 파일에서 전체 로직 흐름 파악 가능**
- 토큰 효율성 저하 및 컨텍스트 분산 문제

### 기존 코드와의 관계

> ⚠️ 기존 코드베이스에 `*.calc.ts`, `*.action.ts` 파일이 존재할 수 있습니다.
> 이는 본 컨벤션 정립 이전에 작성된 레거시 코드이며, 신규 코드에서는 `*.helper.ts` 통합 방식을 따릅니다.

### 근거 요약
| 문제 | 설명 |
|------|------|
| **학습 곡선** | FP 개념(calc/action)을 모르면 이해 불가, `helper`는 보편적 |
| **응집도 저하** | 관련 로직이 두 파일로 흩어짐, 실제 사례에서 혼란 발생 |
| **테스트 효과 미미** | 의도한 "테스트 작성 최대화" 달성 안 됨 |
| **코드 생성 불안정** | LLM이 calc/action 분류 판단에 일관성 없음 |
| **리팩토링 취약** | 코드 변경 시 분류 재판단 필요, 쉽게 깨짐 |
| **자기완결성 저해** | 한 기능 파악에 두 파일 필요, R5 요구사항 위배 |

---

## 4. 기존 아키텍처 방법론(FSD 등) 검토

### 결정
[Feature-Sliced Design(FSD)](https://feature-sliced.design/docs/reference/layers) 등 기존 아키텍처 방법론을 채택하지 않고, 프로젝트 환경에 맞는 단순화된 자체 구조 설계

### 검토된 방법론

| 방법론 | 특징 | 검토 결과 |
|--------|------|----------|
| **Feature-Sliced Design (FSD)** | 7계층 구조 (app/processes/pages/widgets/features/entities/shared) | ❌ 기각 |
| **Atomic Design** | 5단계 구조 (atoms/molecules/organisms/templates/pages) | ❌ 기각 |
| **자체 설계** | 4가지 폴더 타입 (views/sub/helper/ui) | ✅ 채택 |

### FSD를 채택하지 않은 이유

#### 1. 레이어 깊이(Depth) 문제
```
FSD 7계층 구조:
app → processes → pages → widgets → features → entities → shared
```

- FSD는 7개 레이어로 코드를 분류하는 깊은 구조
- 각 레이어 간의 경계를 이해하고 올바르게 분류하는 데 높은 학습 비용 발생
- **"이 코드는 widget인가? feature인가? entity인가?"** 매번 판단 필요

#### 2. 페이지 독립형 프로젝트 특성과의 불일치

| FSD가 전제하는 구조 | 페이지 독립형 프로젝트 특성 |
|---------------------|------------------------|
| 기능(feature) 간 공유/재사용 많음 | **페이지별 독립성이 높음** |
| 전통적인 SPA 구조 | 각 화면이 독립적으로 동작 |
| 점진적 기능 확장 | 화면 단위로 빠르게 개발/배포 |
| 공통 엔티티 레이어 필수 | 페이지마다 다른 데이터 구조 |

**이 구조가 적합한 프로젝트 특징:**
- 여러 서비스/앱이 독립적으로 동작
- 각 페이지/화면별 기획이 독립적
- 페이지 간 코드 공유보다 **페이지 내 응집도**가 더 중요
- 빠른 기능 출시와 독립 배포가 핵심

#### 3. LLM 코드 생성 시 직관성 문제
```typescript
// FSD 구조에서 LLM이 판단해야 하는 것들:
// "이 컴포넌트는 widget? feature? entity?"
// "이 로직은 features/loan/model? entities/user/model?"
// "공유 로직은 shared/lib? shared/api?"

// 자체 구조에서 LLM이 판단해야 하는 것:
// "하위 컴포넌트 → sub"
// "로직 → helper"
// "UI 전용 → ui"
// → 판단 비용 최소화
```

- FSD의 레이어 개념을 코드 생성 시 직관적으로 매핑하기 어려움
- 복잡한 규칙은 LLM의 일관된 코드 생성을 방해
- 단순한 규칙일수록 자동화 품질 향상

#### 4. 야크털 깎기 vs 실용주의

| 접근 | 설명 |
|------|------|
| **야크털 깎기** | 완벽한 아키텍처 방법론 학습 → 팀 전체 교육 → 문서화 → 적용 |
| **실용주의** | 프로젝트 환경에 맞는 단순한 규칙 → 즉시 적용 가능 |

- FSD 도입은 "잘 만들어진 라이브러리를 가져다 쓰는 것"이 아님
- 오히려 **팀 전체가 새로운 패러다임을 학습해야 하는 비용** 발생
- 우리 환경에 맞지 않는 부분에서 예외 처리와 혼란 야기 가능성

### FSD의 장점과 한계

#### 인정하는 장점
- 표준화된 방법론으로 외부 문서/리소스 풍부
- 대규모 SPA에서 기능 간 의존성 관리에 효과적
- 신규 입사자가 FSD 경험이 있다면 온보딩 빠름

#### 우리 환경에서의 한계
- 페이지별 독립성이 높은 구조에서는 레이어 분리의 실익 적음
- 7계층 구조가 오히려 **불필요한 복잡도** 추가
- LLM 코드 생성과 자동화에 적합하지 않음

### 자체 설계의 이점

```typescript
// 단순한 4가지 폴더 타입만 기억
page/
├── page.tsx
├── page.views/    // 멀티뷰 (화면 전환)
├── page.sub/      // 하위 컴포넌트
├── page.helper/   // 모든 로직
└── page.ui/       // Presentational
```

| 이점 | 설명 |
|------|------|
| **학습 비용 최소화** | 4가지 폴더 타입만 이해하면 됨 |
| **직관적 판단** | 화면 구조 → 폴더 구조 직접 매핑 |
| **LLM 친화적** | 단순한 규칙으로 일관된 코드 생성 |
| **환경 최적화** | 페이지 독립성이 높은 프로젝트에 적합 |

### 향후 고려사항

> 📌 FSD의 일부 용어나 개념을 부분적으로 차용하는 것은 검토 가능합니다.
> 다만 전체 방법론을 그대로 도입하는 것은 프로젝트 환경에 맞지 않다고 판단했습니다.
> 이 부분은 팀에서 추가 논의 예정입니다.

### 근거 요약

| 기각 이유 | 설명 |
|-----------|------|
| **레이어 깊이** | 7계층 구조의 높은 학습 비용과 분류 판단 부담 |
| **제품 특성 불일치** | 페이지별 독립성이 높은 프로젝트에서는 FSD 전제와 맞지 않음 |
| **LLM 직관성** | 복잡한 레이어 매핑은 코드 생성 시 일관성 저하 |
| **실용주의** | 단순한 자체 구조가 즉시 적용 가능하고 유지보수 용이 |

---

## 5. 네이밍 통일

### 5.1 하위 컴포넌트 폴더: `sub`

#### 결정
하위 컴포넌트 폴더명을 `sub`로 통일

#### 고려된 대안들

| 후보 | 장점 | 단점 | 결정 |
|------|------|------|------|
| `view` | 직관적 | "화면 전환"과 혼동 | ❌ 기각 |
| `section` | 영역 구분 명확 | UI 레이아웃 분리를 강제하는 느낌 | ❌ 기각 |
| `components` | React 생태계 친숙 | 모호함 (모든 것이 컴포넌트) | ❌ 기각 |
| **`sub`** | 짧고 명확, "하위"라는 의미 전달 | 약간 기술적 | ✅ 채택 |

#### 근거
- `view`는 `*.views/` (멀티뷰 페이지)와 혼동 가능
- `section` 기각 이유:
  - 하위 컴포넌트가 "섹션"이 아닌 경우 의미가 어색함
  - 예: 복잡한 로직이 포함된 버튼 컴포넌트를 `section/submit-button/`에 두면 직관적이지 않음
  - "section"이라는 이름이 UI 레이아웃 기준 분리를 강제하는 느낌을 줌
  - 실제로는 로직 복잡도 기준으로 분리하는 것이 목적
- `sub`는 "subordinate/sub-component"의 명확한 축약, 용도에 구애받지 않음

### 5.2 Presentational 컴포넌트 폴더: `ui`

#### 결정
Presentational(Dumb) 컴포넌트 폴더명을 `ui`로 통일

#### 고려된 대안들

| 후보 | 장점 | 단점 | 결정 |
|------|------|------|------|
| `styled` | 스타일 관련임을 명시 | LLM 혼동, 길이, dumb 의미 전달 실패 | ❌ 기각 |
| `components` | React 친숙 | `*.sub/`와 중복, 모호함 | ❌ 기각 |
| **`ui`** | 짧고 명확, "표시용"이라는 의미 | - | ✅ 채택 |

#### 근거
- `styled` 기각 이유:
  - **LLM 혼동**: `*.styled/` 폴더를 보면 LLM이 styled-components 라이브러리를 사용해야 한다고 착각함
  - **길이**: `styled`는 6글자, `ui`는 2글자
  - **중복**: `components`와 의미적으로 중복됨
  - **의미 전달 실패**: "dumb/presentational 컴포넌트"라는 의도가 `styled`라는 이름에서 드러나지 않음
- `components` 기각 이유:
  - `*.sub/`도 컴포넌트인데 또 `components`를 쓰면 혼란
  - "이건 sub에 넣어? components에 넣어?" 판단 필요
- `ui`는 "User Interface = 화면에 보이는 것"으로 Presentational 의미 명확

---

## 6. 폴더 구조 단순화

### 결정
4가지 핵심 폴더만 사용: `views/`, `sub/`, `helper/`, `ui/`

### 기각된 구조들

```typescript
// ❌ 기각: Atomic Design 기반
page/
├── atoms/
├── molecules/
├── organisms/
└── templates/

// 기각 이유: 
// - 경계가 모호함 (molecule vs organism 구분 논쟁)
// - LLM이 일관된 판단하기 어려움
// - 실제 프로젝트에서 over-engineering 경향
```

```typescript
// ❌ 기각: 기능별 세분화
page/
├── components/
├── hooks/
├── utils/
├── constants/
├── types/
├── styles/
└── api/

// 기각 이유:
// - 폴더가 너무 많아 탐색 어려움
// - 작은 페이지에도 동일한 구조 강제
// - 응집도 저하 (관련 코드가 흩어짐)
```

### 채택된 구조
```typescript
// ✅ 채택: 역할 기반 최소 구조
page/
├── page.tsx
├── page.sub/       // 모든 하위 컴포넌트
│   └── header/
│       ├── header.tsx
│       ├── header.helper.ts  // 로직
│       └── header.ui.tsx     // Presentational
└── page.views/     // 멀티뷰 (드문 케이스)
```

### 근거
- 4가지만 기억하면 됨 → 의사결정 비용 최소화
- 각 폴더의 역할이 명확히 구분됨
- 필요할 때만 폴더 생성 (강제 아님)

---

## 7. helper vs utils 통합

### 결정
`utils/` 폴더 제거, 모든 로직을 `helper/`에 통합

### 고려된 대안

| 구조 | 장점 | 단점 |
|------|------|------|
| `helper/` + `utils/` 분리 | 도메인 로직과 범용 유틸 구분 | 경계 모호, 어디에 둘지 고민 필요 |
| **`helper/` 통합** | 단순함, 고민 없음 | 파일이 많아질 수 있음 |

### 기각 이유
```typescript
// ❌ 분리 시 발생하는 문제
// "formatCurrency"는 helper? utils?
// "calculateLoanInterest"는 helper? utils?
// → 매번 판단 필요, 일관성 저하

// ✅ 통합 시 장점
// 모든 로직 → helper에 넣으면 끝
// 판단 비용 0
```

### 근거
- "이건 도메인 로직이야, 범용 유틸이야" 논쟁 제거
- LLM도 판단 없이 일관되게 `helper`에 배치 가능

---

## 8. 단수형 vs 복수형 네이밍

### 결정
모든 폴더에 단수형 사용 (`helper/`, `ui/`, `sub/`)

### 고려된 대안

| 방식 | 예시 | 장점 | 단점 |
|------|------|------|------|
| 위치별 구분 | `@shared/helpers/`, `*.helper/` | 의미적 구분 | 혼란, 기억 필요 |
| **모두 단수** | `helper/` everywhere | 단순, 일관성 | - |
| 모두 복수 | `helpers/` everywhere | 영어 문법적 | 파일명과 불일치 (`*.helper.ts`) |

### 변경 과정
1. 초기: `helpers/` (복수) 사용
2. 중간: `@shared/helpers/` + `*.helper/` 혼용 시도
3. 최종: 모두 `helper/` (단수)로 통일

### 근거
- 파일명 `*.helper.ts`와 폴더명 `*.helper/`의 일관성
- "이게 복수였나 단수였나" 고민 제거
- 타이핑 1글자 절약 (사소하지만)

---

## 9. Barrel Export 제거

### 결정
`index.ts` 사용 금지, 상대경로로 직접 import

### 기각된 방식
```typescript
// ❌ Barrel Export 방식
// header.helper/index.ts
export { calculateProgress } from './calculateProgress';
export { formatData } from './formatData';

// 사용처
import { calculateProgress } from './header.helper';
```

### 채택된 방식
```typescript
// ✅ 직접 Import 방식
import { calculateProgress } from './header.helper/calculateProgress';
```

### 근거
| 문제 | 설명 |
|------|------|
| **Tree-shaking 방해** | 번들러가 사용하지 않는 export도 포함시킬 수 있음 |
| **순환 참조 위험** | index.ts 간 상호 참조 시 런타임 에러 |
| **파일 추적 어려움** | "이 함수가 실제로 어디 있지?" 추적 비용 |
| **IDE 자동완성 혼란** | 같은 심볼이 여러 경로로 제안됨 |

---

## 10. 파일 vs 폴더 유연성

### 결정
내용물 개수에 따라 파일/폴더 선택
- 1개 → 단일 파일 (`*.helper.ts`)
- 2개+ → 폴더 (`*.helper/`)

### 기각된 대안

```typescript
// ❌ 기각: 항상 폴더 강제
header/
├── header.tsx
├── header.helper/
│   └── calculateProgress.ts  // 1개뿐인데 폴더...
└── header.ui/
    └── title.tsx             // 1개뿐인데 폴더...

// 문제: 불필요한 depth, 파일 탐색 번거로움
```

```typescript
// ❌ 기각: 항상 파일 강제
header/
├── header.tsx
├── header.helper.ts  // 10개 함수가 한 파일에...
└── header.ui.tsx     // 5개 컴포넌트가 한 파일에...

// 문제: 파일이 비대해짐, 300줄 기준 위반
```

### 근거
- 상황에 따른 유연한 선택
- 단일 파일일 땐 flat하게, 복잡할 땐 폴더로
- 실용주의적 접근

---

## 최종 설계 원칙 요약

| 원칙 | 설명 |
|------|------|
| **단순함 우선** | 4가지 폴더 타입으로 충분 |
| **일관성** | 단수형, 직접 import, kebab-case |
| **유연성** | 1개면 파일, 2개+면 폴더 |
| **명시적 한계** | 300줄, 중첩 금지, 즉시 승격 |

---

## 11. 스타일 파일 분리 여부

### 결정
`*.styled.ts` 별도 파일 생성하지 않음, `*.ui.tsx`에 통합

### 고려된 대안

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| `*.styled.ts` 분리 | 스타일만 따로 관리 | UI 수정 시 두 파일 오가야 함 | ❌ 기각 |
| **`*.ui.tsx`에 통합** | 컴포넌트와 스타일 한 파일에서 파악 | - | ✅ 채택 |

### 기각된 구조
```typescript
// ❌ 기각된 구조
header/
├── header.tsx
├── header.helper.ts
└── header.styled.ts    // 스타일만 분리

// ✅ 채택된 구조
header/
├── header.tsx
├── header.helper.ts
└── header.ui.tsx       // 스타일 + Presentational 컴포넌트 함께
```

### 근거
- 스타일은 해당 UI 컴포넌트와 강하게 결합됨
- 스타일만 따로 분리하면 UI 수정 시 두 파일을 오가야 함
- `*.ui.tsx`에 스타일을 함께 두면 "이 컴포넌트는 이렇게 생겼다"를 한 파일에서 파악 가능

> 📌 `styled` vs `ui` 네이밍 결정은 [5.2 Presentational 컴포넌트 폴더](#52-presentational-컴포넌트-폴더-ui) 참고

---

## 12. 상수 파일 분리 여부

### 결정
`*.constants.ts` 별도 파일 생성하지 않음, `*.helper.ts`에 통합

### 고려된 대안

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| `*.constants.ts` 분리 | 상수만 따로 관리 | 추상적 네이밍, 응집도 저하 | ❌ 기각 |
| **`*.helper.ts`에 통합** | 관련 함수와 상수가 함께 위치 | - | ✅ 채택 |

### 기각된 구조
```typescript
// ❌ 기각된 구조
header/
├── header.tsx
├── header.helper.ts
└── header.constants.ts  // 상수만 분리

// ✅ 채택된 구조
header/
├── header.tsx
└── header.helper.ts     // 상수도 여기에 포함
```

### 근거
- `constants`라는 이름이 너무 추상적 ("무슨 상수?")
- 상수는 대부분 helper 함수와 함께 사용됨 (예: `MAX_RETRY_COUNT`와 `retry` 함수)
- 파일 하나 더 만들 정도로 상수가 많다면, 그건 helper 폴더로 분리할 시점
- 상수명 자체가 목적을 설명해야 함 (`PROGRESS_ANIMATION_MS` 등)

---

## 13. Hooks 파일 분리 여부

### 결정
`*.hooks.ts` 별도 파일 생성하지 않음, `*.helper.ts`에 통합

### 고려된 대안

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| `*.hooks.ts` 분리 | React hooks만 따로 관리 | 함수 vs hook 판단 필요 | ❌ 기각 |
| **`*.helper.ts`에 통합** | "로직은 다 helper"로 단순화 | - | ✅ 채택 |

### 기각된 구조
```typescript
// ❌ 기각된 구조
header/
├── header.tsx
├── header.helper.ts
└── header.hooks.ts      // hooks만 분리

// ✅ 채택된 구조
header/
├── header.tsx
└── header.helper.ts     // hooks도 여기에 포함
```

### 근거
- React hooks는 결국 "로직을 추상화한 함수"
- `useHeaderData`, `calculateProgress`, `formatTitle` 모두 같은 성격의 헬퍼
- hooks만 따로 분리하면 "이건 hook이니까 저기, 이건 함수니까 여기" 판단 필요
- `helper`에 통합하면 "로직은 다 helper"로 단순화

---

## 14. 파일명에 전체 경로 포함 여부

### 결정
파일명은 간소화, 폴더 구조로 맥락 제공

### 고려된 대안

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| 전체 경로 포함 | 파일명만으로 맥락 파악 | 40자+ 길이, IDE 탭 잘림 | ❌ 기각 |
| **간소화 + 폴더 구조** | 짧고 탐색 용이 | 파일명만으론 맥락 부족 | ✅ 채택 |

### 기각된 구조
```typescript
// ❌ 기각된 구조
intro-page.sub/
├── loan-application-intro-page-header.tsx
├── loan-application-intro-page-content.tsx
└── loan-application-intro-page-footer.tsx

// ✅ 채택된 구조
intro-page.sub/
├── header/
│   └── header.tsx
├── content/
│   └── content.tsx
└── footer/
    └── footer.tsx
```

### 근거
- 파일명이 과도하게 길어짐 (40자+)
- 폴더 경로가 이미 맥락을 제공함
- IDE 탭에서 파일명이 잘림
- 단, **컴포넌트 이름**에는 맥락 포함 필수: `export const LoanApplicationIntroHeader = ...`

---

## 15. Types 파일 필수화 여부

### 결정
`*.types.ts` 필수화하지 않음, 공유 타입 있을 때만 선택적 생성

### 고려된 대안

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| `*.types.ts` 필수 | 일관된 구조 | 불필요한 파일 생성 | ❌ 기각 |
| **선택적 생성** | 필요할 때만 파일 추가 | - | ✅ 채택 |

### 기각된 구조
```typescript
// ❌ 기각된 구조: 항상 types 파일 생성
header/
├── header.tsx
├── header.helper.ts
└── header.types.ts      // 무조건 생성

// ✅ 채택된 구조: 필요할 때만 생성
header/
├── header.tsx
└── header.helper.ts
// types.ts는 여러 sub가 공유하는 타입이 있을 때만 추가
```

### 근거
- 대부분의 타입은 해당 파일 내에서만 사용됨
- 파일 상단에 `type Props = { ... }` 정의로 충분
- `*.types.ts`는 페이지/뷰 레벨에서 여러 sub가 공유할 때만 생성
- API 응답 타입은 공유 API 레이어(`shared/api/`)에서 관리

---

## 최종 설계 원칙 요약

| 원칙 | 설명 |
|------|------|
| **단순함 우선** | 4가지 폴더 타입으로 충분 |
| **일관성** | 단수형, 직접 import, kebab-case |
| **유연성** | 1개면 파일, 2개+면 폴더 |
| **명시적 한계** | 300줄, 중첩 금지, 즉시 승격 |
| **통합 우선** | helper에 hooks/상수 통합, ui에 스타일 통합 |

---

## 16. 페이지 파일명에 맥락 포함 여부

### 결정
페이지 파일명에 **폴더명을 prefix로 포함**: `{folder}-page.tsx`

중복 발생 시 파일명이 고유해지도록 부모 폴더 등 추가 맥락을 포함하되, 구체적인 방법은 개발자 판단에 맡김. 필요시 검증 스크립트를 통해 중복을 사전 감지.

### 배경: 팀 내 발생한 질문

**실제 발생한 질문:**
- "page 앞에 이름을 넣을 것이냐 말 것이냐에 대한 얘기도 있으면 좋겠습니다"
- "문서 전체의 내용으로는 page 앞에만 맥락이 들어가는 게 암묵적으로 규칙되어 있는 듯해서 질문드립니다"

### 코드베이스 현황 분석

일반적인 프로젝트에서 다음과 같은 패턴이 관찰됩니다:

- **prefix가 없는 파일명** (`page.tsx`)은 프로젝트 전반에서 다수 중복 발생
- **prefix가 있는 파일명** (`{name}-page.tsx`)은 중복이 거의 없음
- `login`, `index`, `detail`, `result` 같은 **generic 폴더명**은 여러 도메인에 걸쳐 다수 존재

**핵심 발견: prefix가 있는 파일은 중복이 없고, prefix가 없는 파일만 중복 발생**

#### 개발자들이 사용하는 실제 패턴

실제 프로젝트에서 개발자들이 **이미 자연스럽게 맥락을 포함**하는 경우가 많음:

| 상황 | 파일명 패턴 | 예시 |
|------|-------------|------|
| 폴더명이 고유한 경우 | 폴더명 그대로 | `intro/intro-page.tsx` |
| 폴더명이 generic한 경우 | 부모 폴더 조합 | `loan/result/loan-result-page.tsx` |
| 경로가 깊은 경우 | 경로 일부 조합 | `loan/kcb/terms/loan-kcb-terms-page.tsx` |

**발견된 암묵적 규칙:**
- 폴더명이 고유하면 → 폴더명만 사용
- 폴더명이 generic(`index`, `result`, `list` 등)이면 → 부모 또는 경로 조합 사용

### 고려된 대안

| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| `page.tsx` (prefix 없음) | 짧음, 프레임워크 기본 스타일 | 파일 단독 참조 시 맥락 없음, 다수 중복 | ❌ 기각 |
| `{folder}-page.tsx` (단순 규칙) | 단순함, 대부분 고유 | generic 이름 중복 가능 | ✅ **기본 채택** |
| `{parent}-{folder}-page.tsx` (항상) | 완전히 고유 | 항상 길어짐, depth 문제 | ❌ 기각 |
| Generic Name List + Hybrid | 필요한 곳만 길어짐 | List 관리 필요, 규칙 복잡 | ⚠️ 검토 후 기각 |

### Generic Name List 방식을 채택하지 않은 이유

초기에는 "Generic 이름만 부모 포함" 규칙을 검토했으나, 다음 문제로 기각:

| 문제 | 설명 |
|------|------|
| **List가 자의적** | 누가 "generic"을 정의하나? `bridge`는? `settings`는? |
| **매번 판단 필요** | 파일 생성 시마다 "이 이름이 generic인가?" 체크 필요 |
| **일관성 저하** | 개발자마다 다르게 판단할 가능성 |
| **현실과 불일치** | 실제 코드에서는 개발자들이 상황에 맞게 유연하게 판단 중 |

### 최종 결정: 단순 규칙 + 필요시 검증 스크립트

#### 기본 규칙

```typescript
// 기본: 폴더명 + page
{folder}-page.tsx

// 예시
intro/intro-page.tsx
login/login-page.tsx
prequalification/prequalification-page.tsx
```

#### 중복 발생 시

파일명이 코드베이스 내에서 고유해지도록 **개발자가 판단하여** 부모 폴더 등 맥락 추가:

```typescript
// 중복 발생 시 → 맥락 추가 (개발자 판단)
loan/refinancing/intro/refinancing-intro-page.tsx
insurance/claim/intro/claim-intro-page.tsx
```

#### 검증 스크립트 (향후 필요시 구현)

복잡한 규칙 대신, **PR 리뷰 시 자동 검증 스크립트**로 중복을 감지하는 방안 검토:

```
[PR 생성 시 스크립트 실행]
       ↓
   ┌───────────────────────────────────────┐
   │ ⚠️ Warning: Duplicate page filename   │
   │                                        │
   │ Found: intro-page.tsx                  │
   │ Already exists in:                     │
   │   - loan/refinancing/intro/            │
   │   - insurance/claim/intro/             │
   │                                        │
   │ Suggestion: Add parent folder prefix   │
   └───────────────────────────────────────┘
```

**스크립트 구현은 현재 보류**, 중복 문제가 실제로 빈번해지면 도입 검토.

### 기각 이유: `page.tsx` (prefix 없음)

#### 1. 파일 단독 참조 상황에서의 문제

| 상황 | `page.tsx` | `intro-page.tsx` |
|------|-----------|------------------|
| **IDE 탭** | 탭 5개 모두 `page.tsx` → 구분 불가 | 각 페이지명으로 즉시 구분 |
| **파일 검색** | `page.tsx` 결과 수십 개 → 어느 페이지? | `intro-page` 검색 → 즉시 특정 |
| **에러 스택트레이스** | `at page.tsx:42` → 어느 페이지? | `at intro-page.tsx:42` → 명확 |
| **PR 코멘트** | "page.tsx 23번 줄" → 맥락 필요 | "intro-page.tsx 23번 줄" → 즉시 이해 |
| **Git blame** | `page.tsx` 변경 이력 → 혼란 | 파일명으로 히스토리 추적 용이 |

#### 2. LLM/AI 도구와의 호환성

```typescript
// ❌ page.tsx: LLM이 경로 전체를 파싱해야 맥락 파악
// 파일: src/loan/refinancing/intro/page.tsx
// LLM: "이 파일이 무슨 페이지인지 알려면 경로를 분석해야 함"

// ✅ intro-page.tsx: 파일명만으로 맥락 획득
// 파일: src/loan/refinancing/intro/intro-page.tsx
// LLM: "intro-page니까 intro 페이지구나"
```

**관련 이슈:**
- GitHub Copilot: 중복 파일명 혼동 이슈 보고됨 (GitHub Issue #4460)
- Cursor: `@Files` 참조 시 경로 미리보기로 구분 필요

#### 3. 업계 사례 및 연구

| 출처 | 내용 |
|------|------|
| **Brad Frost (Atomic Design 저자)** | `index.js` 패턴은 "many index tabs"로 "visual clarity 감소" |
| **AI-Native Development Patterns** | "AI-readable naming은 descriptive, specific names 권장" |
| **Next.js 커뮤니티** | GitHub Discussions에서 `page.tsx` 혼동 문제 빈번히 제기 |
| **Stack Overflow** | "if all pages are named page.tsx it's gonna be a pain" |

### 근거 요약

| 문제 | 해결 |
|------|------|
| **파일 단독 참조 시 맥락 부족** | 폴더명을 prefix로 포함하여 파일명만으로 식별 가능 |
| **IDE 탭/검색 혼란** | 고유한 파일명으로 즉시 구분 |
| **LLM 맥락 파악 비효율** | 파일명에 맥락 포함으로 토큰 효율 최적화 |
| **Generic 이름 중복** | 중복 시 개발자 판단으로 맥락 추가, 필요시 검증 스크립트로 사전 감지 |
| **규칙 복잡도** | Generic List 대신 단순 규칙 + 검증 스크립트 방식 채택 |

### 향후 검토 사항

- [ ] 중복 파일명이 실제로 문제가 되는 빈도 모니터링
- [ ] 문제 빈발 시 PR 검증 스크립트 구현 검토
- [ ] 기존 `page.tsx` 패턴의 점진적 마이그레이션 검토

---

*이 ADR은 폴더 구조 설계 과정에서의 의사결정을 기록하며, 향후 구조 변경 시 참고 자료로 활용됩니다.*
