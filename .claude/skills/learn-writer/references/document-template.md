# {NN}. {DOCUMENT_TITLE}

## 핵심 질문

> {CORE_QUESTION}

## 한 줄 답

{ONE_LINE_ANSWER}

---

## 현재 설정

```{CONFIG_LANG}
{CURRENT_CONFIGURATION_SNIPPET}
```

---

<!-- PAR block: repeat per option/decision. Each block is self-contained and cohesive. -->
<!-- The Caveat section is OPTIONAL — include only when a real trade-off or gotcha exists. -->

## `{OPTION_NAME}` — {SHORT_DESCRIPTION}

**Problem** — {WHAT_GOES_WRONG_WITHOUT_THIS}

```{CODE_LANG}
// without {OPTION_NAME}
{PROBLEM_CODE_EXAMPLE}
```

**Action** — {WHAT_THIS_OPTION_DOES_AND_WHY_CHOSEN}

```{CODE_LANG}
// with {OPTION_NAME}
{SOLUTION_CODE_EXAMPLE}
```

**Result** — {CONCRETE_OUTCOME_AND_CURRENT_ASSESSMENT}

> **Caveat**: {TRADE_OFF_OR_EDGE_CASE_OR_INTERACTION_WITH_OTHER_OPTIONS}

---

<!-- End of PAR blocks -->

## 이 프로젝트에서의 적용

| 옵션 | 해결하는 문제 |
|------|-------------|
| `{OPTION_01}` | {PROBLEM_IT_SOLVES_01} |
| `{OPTION_02}` | {PROBLEM_IT_SOLVES_02} |

---

## 다음 문서

[{NEXT_NN}. {NEXT_DOCUMENT_TITLE}](./{NEXT_FILE_NAME}.md) — {NEXT_CORE_QUESTION}
