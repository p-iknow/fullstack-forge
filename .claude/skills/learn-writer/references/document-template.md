<!-- Translate all section headers to Korean using the mapping table in SKILL.md. -->

# {NN}. {DOCUMENT_TITLE}

## Core Question

> {CORE_QUESTION}

## One-Line Answer

{ONE_LINE_ANSWER}

---

<!-- Context section: choose ONE based on the document's decision-unit mode. -->

<!-- MODE: Option (config key/flag) -->

## Current Config

```{CONFIG_LANG}
{CURRENT_CONFIGURATION_SNIPPET}
```

<!-- MODE: Pattern (design pattern/composition) — replace Current Config with: -->
<!-- ## Current Approach -->
<!-- {DESCRIPTION_WITH_CODE_POINTERS_AND_FILE_PATHS} -->

<!-- MODE: Workflow (multi-step process) — replace Current Config with: -->
<!-- ## Current Flow -->
<!-- {STEP_DIAGRAM_OR_SEQUENCE} -->

<!-- If config/setting does not exist yet: -->
<!-- > Current Config: N/A (not yet implemented). {PLANNED_STATE_WITH_ADR_OR_HARNESS_REFERENCE} -->

---

<!-- PAR block: repeat per decision unit. Each block is self-contained and cohesive. -->
<!-- Code examples are encouraged but optional — config-only or conceptual blocks are acceptable. -->
<!-- The Caveat section is OPTIONAL — include only when a real trade-off or gotcha exists. Omit entirely otherwise. -->

## `{DECISION_NAME}` — {SHORT_DESCRIPTION}

**Problem** — {WHAT_GOES_WRONG_WITHOUT_THIS}

```{CODE_LANG}
// without {DECISION_NAME}
{PROBLEM_CODE_EXAMPLE}
```

**Action** — {WHAT_THIS_DOES_AND_WHY_CHOSEN}

```{CODE_LANG}
// with {DECISION_NAME}
{SOLUTION_CODE_EXAMPLE}
```

**Result** — {CONCRETE_OUTCOME_AND_CURRENT_ASSESSMENT}

> **Caveat**: {TRADE_OFF_OR_GOTCHA}

---

<!-- End of PAR blocks -->

## Application in This Project

| Decision        | Problem Solved         |
| --------------- | ---------------------- |
| `{DECISION_01}` | {PROBLEM_IT_SOLVES_01} |
| `{DECISION_02}` | {PROBLEM_IT_SOLVES_02} |

---

<!-- ADR traceability: link to the owning ADR(s) when applicable. Omit if no ADR exists for this topic. -->

> **Source Decision**: [{ADR_ID}: {ADR_TITLE}](../../adr/{ADR_FILE}.md)

---

## Next Document

[{NEXT_NN}. {NEXT_DOCUMENT_TITLE}](./{NEXT_FILE_NAME}.md) — {NEXT_CORE_QUESTION}
