---
title: "Source Folder Structure Requirements"
description: "소스 폴더 구조의 설계 요구사항과 학술적 근거를 체계적으로 정리한 참고 문서입니다."
type: reference
tags: [Architecture, BestPractice]
order: 3
---

# 소스 폴더 구조 - 설계 요구사항 및 근거

> 이 문서는 [src-folder-structure.md](./src-folder-structure.md)의 설계 요구사항과 학술적/논리적 근거를 상세히 다룹니다.

이 폴더 구조는 다음 요구사항을 충족하도록 설계되었으며, 각 항목은 소프트웨어 공학 및 인지 과학 연구에 기반합니다.

---

## 1. 직관적 의사결정
> 사람 또는 LLM이 특정 페이지의 폴더 구조를 설계할 때, 화면 구성을 보고 어떤 구조를 가져야 하는지 직관적으로 판단할 수 있어야 한다.

<details>
<summary>📚 학술적/논리적 근거</summary>

### Screaming Architecture (소리치는 아키텍처)
**출처**: [Robert C. Martin - Screaming Architecture (2011)](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)

> "건축 도면을 보았을 때 그것이 주택인지, 도서관인지, 병원인지 즉시 알 수 있어야 한다. 만약 도면을 보고 '이것은 벽돌로 지은 건물입니다'라고만 알 수 있다면, 그 도면은 실패한 것이다."

- 소프트웨어 아키텍처는 **프레임워크가 아닌 시스템의 의도(Use Case)**를 드러내야 함
- 폴더 구조가 `components/`, `hooks/`가 아닌 `features/Cart`, `features/Payment`로 구성될 때 시스템의 비즈니스 목적을 즉시 파악 가능

### 인지 부하 이론 (Cognitive Load Theory)
**출처**: [Sweller, J. (1988). "Cognitive load during problem solving"](https://www.sciencedirect.com/science/article/abs/pii/0364021388900237)

| 부하 유형 | 설명 | 아키텍처와의 관계 |
|-----------|------|-------------------|
| **본질적 부하** (Intrinsic) | 문제 자체의 난이도 | 줄일 수 없음, 집중해야 할 영역 |
| **외재적 부하** (Extraneous) | 정보 제시 방식에서 발생 | **폴더 탐색, 파일 찾기 = 외재적 부하** |
| **본유적 부하** (Germane) | 학습과 스키마 형성 | 도메인 이해에 쓰이는 긍정적 부하 |

서비스 중심 구조는 **외재적 부하를 최소화**하여 개발자의 한정된 인지 자원을 본질적 문제 해결에 집중시킵니다.

</details>

---

## 2. 구조 → 화면 예측
> 이미 구성된 폴더 구조만 보고도 해당 페이지가 어떤 화면으로 그려질지 예측 가능해야 한다.

<details>
<summary>📚 학술적/논리적 근거</summary>

### 인지적 차원 프레임워크 (Cognitive Dimensions of Notations)
**출처**: [Green, T.R.G. & Petre, M. (1996). "Usability Analysis of Visual Programming Environments"](https://en.wikipedia.org/wiki/Cognitive_dimensions_of_notations)

**역할 표현성 (Role-Expressiveness)**:
> "표기법(폴더 구조)의 구성 요소가 자신의 역할을 명확히 드러낼 때 시스템 이해도가 높아진다."

- **Hidden Dependencies**: 폴더 간 의존성이 명확히 보이는가?
- **Viscosity**: 변경에 대한 저항이 얼마나 큰가?
- **Role-Expressiveness**: 폴더명만으로 역할을 알 수 있는가?

`page.sub/header/`, `page.views/tab-a/` 같은 구조는 **화면 계층 구조를 직접 반영**하여 구조 → 화면 예측을 가능하게 합니다.

</details>

---

## 3. 코드 위치 예측
> 화면의 특정 부분을 수정해야 할 때, 폴더 구조를 통해 해당 로직과 코드가 어디에 위치하는지 쉽게 예측할 수 있어야 한다.

<details>
<summary>📚 학술적/논리적 근거</summary>

### 정보 채집 이론 (Information Foraging Theory)
**출처**: [Pirolli, P. & Card, S. (1999). "Information foraging"](https://en.wikipedia.org/wiki/Information_foraging)

**Information Scent (정보의 향기)**:
> "동물이 먹이의 냄새를 따라 이동하듯, 인간은 정보 환경의 단서(폴더명, 파일명)를 따라 탐색한다."

- 폴더명이 **기능(Feature)**을 명확히 나타내면, 개발자는 "이 안에 내가 찾는 코드가 있다"는 **강력한 확신**을 갖고 탐색
- Nielsen Norman Group: "정보 채집은 HCI 연구에서 지난 10년간 등장한 가장 중요한 개념"

### 코드 코로케이션 (Code Colocation)
**출처**: [Kent C. Dodds - Colocation](https://kentcdodds.com/blog/colocation)

> "Place code as close to where it's relevant as possible." (코드를 관련된 곳에 최대한 가까이 배치하라)
>
> "Things that change together should be located as close as reasonable." — Dan Abramov

</details>

---

## 4. 수정 범위 격리
> 화면의 특정 부분을 수정할 때 영향 범위가 해당 부분에 한정되어야 하고, 관련 정보는 해당 코드 주변에서 응집도 있게 파악할 수 있어야 한다.

<details>
<summary>📚 학술적/논리적 근거</summary>

### 공통 폐쇄 원칙 (Common Closure Principle)
**출처**: [Robert C. Martin - Clean Architecture](https://wiki.solidbook.io/common-closure-principle-(ccp)-ff800b8d83df4b2290081fef30d304fc/)

> "The classes in a component should be closed together against the same kinds of changes."
> (컴포넌트 내의 클래스들은 같은 종류의 변경에 대해 함께 닫혀야 한다)

- **SRP(단일 책임 원칙)의 컴포넌트 레벨 확장**
- 함께 변경되는 코드를 함께 묶으면, 변경 시 **하나의 컴포넌트만 수정**하면 됨

### 수직적 슬라이스 아키텍처 (Vertical Slice Architecture)
**출처**: [Jimmy Bogard - Vertical Slice Architecture (2018)](https://www.jimmybogard.com/vertical-slice-architecture/)

> "계층(Layer) 간 경계를 허물고, 기능 단위의 수직적 통합을 지향한다."

```
기존 계층형: 변경 요청 → components/ → hooks/ → api/ → types/ (4개 폴더 수정)
수직적 슬라이스: 변경 요청 → features/payment/ 폴더 내에서만 수정
```

### 기능 분할 설계 (Feature-Sliced Design)
**출처**: [Feature-Sliced Design 공식 문서](https://feature-sliced.design/)

| 단계 | 개념 | 설명 |
|------|------|------|
| **Layer** | 수평적 책임 분리 | app, pages, widgets, features, entities, shared |
| **Slice** | 비즈니스 도메인별 분할 | user, post, cart, payment |
| **Segment** | 기술적 역할별 분할 | ui, model, api, lib |

</details>

---

## 5. 자기완결적 구조
> LLM이 화면이나 특정 부분에 대한 정보를 파악할 때, 최소한의 파일만 읽고도 전체 맥락을 이해할 수 있는 자기완결적 구조여야 한다.

<details>
<summary>📚 학술적/논리적 근거</summary>

### LLM의 "Lost in the Middle" 현상
**출처**: [Liu, N. F. et al. (2023). "Lost in the Middle: How Language Models Use Long Contexts"](https://arxiv.org/abs/2307.03172)

> "LLM은 컨텍스트의 시작과 끝에 있는 정보는 잘 활용하지만, **중간에 있는 정보는 놓치는 경향**이 있다."

- GPT-3.5-Turbo의 경우, 중간 위치 정보에서 **성능이 20% 이상 하락**
- 코드가 **기능별로 모여 있으면** LLM이 해당 폴더를 **하나의 의미 있는 청크**로 인식

### RAG (검색 증강 생성) 최적화
**출처**: [Lewis, P. et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"](https://arxiv.org/abs/2005.11401)

- 기능별로 코드가 모여 있으면 → **"결제 기능 수정해줘"** 요청에 필요한 모든 파일(UI, 로직, 타입, API)을 **한 번에 확보**
- 계층형 구조에서는 여러 폴더를 탐색해야 하며, **관련 없는 파일을 가져오거나 핵심 파일을 놓칠** 확률 증가

</details>

---

## 6. 유연한 확장성
> 단순한 단일 페이지부터 복잡한 멀티뷰 페이지까지, 다양한 화면 형태를 유연하게 수용할 수 있는 구조여야 한다.

<details>
<summary>📚 학술적/논리적 근거</summary>

### 프랙탈 아키텍처 (Fractal Architecture)

> "작은 구조가 전체 구조와 유사한 형태로 반복되는 구조"

```
src/                          # 앱 전체
├── features/cart/            # 기능 (앱의 축소판)
│   └── cart-item/            # 컴포넌트 (기능의 축소판)
│       ├── cart-item.tsx
│       ├── cart-item.helper.ts
│       └── cart-item.ui/
```

- 애플리케이션이 아무리 커져도 **일관된 패턴 유지**
- 개발자는 규모(Scope)와 상관없이 **동일한 멘탈 모델** 적용 가능

</details>

---

## 7. 명확한 컨벤션
> 각 폴더/파일 컨벤션이 모호하지 않고 명확해야 한다. 용어가 다의적으로 해석될 여지 없이 단일한 의미로 정의되어야 한다.

<details>
<summary>📚 학술적/논리적 근거</summary>

### 점도 (Viscosity) 감소
**출처**: [Cognitive Dimensions of Notations](https://en.wikipedia.org/wiki/Cognitive_dimensions_of_notations)

> "시스템이 변경에 저항하는 정도"

- 규칙이 모호하면 → **"이 코드를 어디에 둘까?"** 고민 시간 증가
- 명확한 규칙이 있으면 → **결정 비용 0**, 누구나 동일한 구조 생성

### AHA Programming (성급한 추상화 방지)
**출처**: [Kent C. Dodds - AHA Programming](https://kentcdodds.com/blog/aha-programming)

> "Avoid Hasty Abstractions" (성급한 추상화를 피하라)
>
> "Prefer duplication over the wrong abstraction." — Sandi Metz

**3의 법칙 (Rule of Three)**: 두 번까지는 중복 허용, **세 번째 중복될 때** 비로소 공통 모듈로 추출

</details>

---

## 📚 참고 문헌 요약

| 분류 | 출처 | 링크 |
|------|------|------|
| Architecture | Robert C. Martin - Screaming Architecture | [Clean Coder Blog](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html) |
| Architecture | Jimmy Bogard - Vertical Slice Architecture | [jimmybogard.com](https://www.jimmybogard.com/vertical-slice-architecture/) |
| Architecture | Feature-Sliced Design | [feature-sliced.design](https://feature-sliced.design/) |
| Architecture | Kent C. Dodds - AHA Programming | [kentcdodds.com](https://kentcdodds.com/blog/aha-programming) |
| Architecture | Kent C. Dodds - Colocation | [kentcdodds.com](https://kentcdodds.com/blog/colocation) |
| Cognitive | Sweller - Cognitive Load Theory | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/0364021388900237) |
| Cognitive | Green & Petre - Cognitive Dimensions | [Wikipedia](https://en.wikipedia.org/wiki/Cognitive_dimensions_of_notations) |
| Cognitive | Pirolli & Card - Information Foraging | [Wikipedia](https://en.wikipedia.org/wiki/Information_foraging) |
| AI/LLM | Liu et al. - Lost in the Middle | [arXiv](https://arxiv.org/abs/2307.03172) |
| AI/LLM | Lewis et al. - RAG | [arXiv](https://arxiv.org/abs/2005.11401) |
