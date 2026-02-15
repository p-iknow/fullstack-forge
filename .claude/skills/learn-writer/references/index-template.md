<!-- Translate all section headers to Korean using the mapping table in SKILL.md. -->

# {TOPIC_TITLE} Deep Dive

Breaks down `{PRIMARY_CONFIG_FILE}` / `{SECONDARY_CONFIG_FILE}` settings option by option, explaining
**why each choice is needed**, **whether it is appropriate as of 2026**, and **what role it plays in this project**.

> Baseline: {VERSION_BASELINE} · pnpm workspaces · Nx · {RUNTIME_TOOLING}

## Document Sequence

<!-- Repeat one row per document. Do NOT hardcode to 5 — match actual doc count. -->

| #    | Document                          | Core Question  |
| ---- | --------------------------------- | -------------- |
| {NN} | [{DOC_TITLE}](./NN-{DOC_SLUG}.md) | {DOC_QUESTION} |
| ...  | ...                               | ...            |

## Prerequisites

- {PREREQUISITE_01}
- {PREREQUISITE_02}
- {PREREQUISITE_03}

## Project Config Files

```text
{PROJECT_FILE_TREE_FOR_TOPIC}
```

## Related Docs

- Config recipe: [harness/{HARNESS_ENTRY}](../../harness/{HARNESS_FILE}.md)
- Full implementation standard: [harness/00-overview](../../harness/00-overview.md)
- Execution checklist: [execution/{EXECUTION_ENTRY}](../../execution/{EXECUTION_FILE}.md)
