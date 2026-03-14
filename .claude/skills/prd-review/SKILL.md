---
name: prd-review
description: Review PRD documents from a domain expert perspective to identify gaps, contradictions, and areas needing more detail. Use when reviewing PRD completeness, checking cross-domain consistency, auditing requirements depth, or validating e-commerce domain coverage. Supports any PRD domain folder following the 5-file structure (overview, api, data, ui, events).
---

# PRD Review

Review PRD documents through 3 lenses: **Completeness**, **Consistency**, **Depth**.

## Execution Flow

1. Read ALL files in target domain folder (`01-overview.md` through `05-events.md`)
2. Read `00-overview.md` for global KPIs, business defaults, and domain relationships
3. Read adjacent domain overviews (prev/next numbered domains + any referenced in "related domains")
4. Analyze through 3 lenses below
5. Output findings in the structured format

## Lens 1: Completeness

Check each file against its expected coverage. See [references/checklist.md](references/checklist.md) for the full per-file-type checklist.

**Critical gaps to catch:**
- Missing failure/error scenarios (what happens when X fails?)
- Missing edge cases (zero quantity, max limits, concurrent access)
- Missing non-functional requirements (performance, security, scalability)
- Missing operational scenarios (monitoring, alerting, recovery)
- Undefined behavior at state boundaries (what triggers transition? who owns it?)

## Lens 2: Consistency

**Cross-document checks:**
- Numeric values match between domain doc and `00-overview.md` business defaults
- Same concept uses same terminology across all 5 files
- Event names in `05-events.md` match API trigger descriptions in `02-api.md`
- Data fields in `03-data.md` cover all fields referenced in `02-api.md` and `04-ui.md`
- State names in lifecycle diagrams match status values in data model

**Cross-domain checks:**
- Events published here have consumers defined in other domains (and vice versa)
- Shared policies (e.g., safety threshold) reference a single source of truth
- Domain boundary responsibilities are clear (no overlap, no gap)
- Related domain sections are bidirectional (if A references B, B should reference A)

## Lens 3: Depth

Rate each requirement on the **implementability scale**:

| Level | Description | Action |
|-------|-------------|--------|
| Spec-ready | Has concrete values, rules, constraints | None needed |
| Needs clarification | Direction is clear but missing specifics | Flag with suggested questions |
| Too abstract | Vague statement, not implementable | Flag as critical gap |

**Common depth issues in e-commerce PRDs:**
- "Handle errors appropriately" → Which errors? What response? Retry?
- "Notify the user" → Which channel? What content? When?
- "Validate input" → Which fields? What rules? What error messages?
- Lifecycle diagram exists but transition guards are undefined
- API listed but no error response codes or edge case behavior

## Output Format

Structure findings as follows (Korean output):

```markdown
# PRD Review: {domain-name}

## 🔴 누락 (Missing) — 구현 시 반드시 정의 필요

### [{severity: Critical|Major}] {finding title}
- **파일**: {which file}
- **문제**: {what's missing}
- **영향**: {what breaks without this}
- **제안**: {specific question or recommendation}

## 🟡 모순 (Contradiction) — 문서 간 불일치

### {finding title}
- **충돌 위치**: {file A} vs {file B / other domain}
- **내용**: {what contradicts}
- **제안**: {which should be the source of truth}

## 🟢 깊이 부족 (Needs Detail) — 방향은 맞으나 구체화 필요

### {finding title}
- **파일**: {which file}
- **현재 수준**: {what's written}
- **필요 수준**: {what's needed to implement}
- **제안 질문**: {specific questions to resolve}

## 💡 개선 제안 — 품질 향상 기회

### {finding title}
- **제안**: {improvement}
- **근거**: {why this matters}

## 📊 요약

| 카테고리 | Critical | Major | Minor |
|----------|----------|-------|-------|
| 누락     |          |       |       |
| 모순     |          |       |       |
| 깊이부족 |          |       |       |
```

## References

- [references/checklist.md](references/checklist.md) — Per-file-type completeness checklist for e-commerce PRDs
