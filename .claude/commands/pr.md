---
description: Create or update a draft PR with Summary and Test sections
allowed-tools: Bash, Read, Write, Question
argument-hint: "[--update | -u] [#PR_NUMBER]"
---

# Draft PR Command

Create a new draft PR or update an existing PR's description.

## Arguments

$ARGUMENTS

- **--update, -u** (optional): Update mode - modify existing PR
- **#PR_NUMBER** (optional): Specific PR to update (with -u flag)

## Mode Selection

| Command | Mode | Action |
|---------|------|--------|
| `/pr` | CREATE | Create new draft PR |
| `/pr -u` | UPDATE | Update current branch's PR |
| `/pr -u #123` | UPDATE | Update specific PR #123 |

## Instructions

### CREATE Mode (`/pr`)

#### Step 1: Validate Git State

```bash
git status --porcelain
git branch --show-current
```

**Fail if:**
- Uncommitted changes exist → "Commit changes first"
- On main/master → "Create a feature branch first"

#### Step 2: Analyze Commits

```bash
git log --oneline main..HEAD
git diff main...HEAD --stat
```

Read each commit's full message to understand purpose and scope.

#### Step 3: Compose Body

Generate Summary and Test table **from commit history** — do NOT ask the user.

- **Goal**: 이 PR이 해결하는 문제 또는 달성하려는 목적. 커밋 메시지와 브랜치명에서 추론.
- **Implementation**: 구체적 구현 내용. 커밋별 변경사항을 bullet point로 정리.
- **Test table**: Infer Before (problem/gap) and After (solution) from commit context.

```markdown
## Summary

### Goal
[why — inferred from commits and branch name]

### Implementation
[what — bullet points from each commit]

## Test
| Before / Requirements | After / Implementation |
| --------------------- | ---------------------- |
| [inferred gap]        | [what commits deliver] |
```

Note: "UI 테스트 이미지는 PR 생성 후 직접 추가하세요."

#### Step 4: Generate Title & Create

```bash
# Push if no upstream
git push -u origin $(git branch --show-current)

# Create draft PR
gh pr create --draft --title "$TITLE" --body "$BODY"
```

---

### UPDATE Mode (`/pr -u`)

#### Step 1: Find PR

```bash
# If PR number provided
gh pr view $PR_NUMBER --json number,title,url

# Else, find current branch's PR
gh pr view --json number,title,url
```

#### Step 2: Analyze Commits

Same as CREATE mode.

#### Step 3: Update PR

```bash
gh pr edit $PR_NUMBER --body "$BODY"
```

---

## Output

### CREATE Success
```
✅ Draft PR created: https://github.com/user/repo/pull/123

Next steps:
1. Add test screenshots if needed
2. Mark as "Ready for review" when complete
```

### UPDATE Success
```
✅ PR #123 updated: https://github.com/user/repo/pull/123
```

### Failure
```
❌ Cannot create/update PR: [reason]
   [suggested action]
```

## Safety

| Check | Action |
|-------|--------|
| CREATE: Always `--draft` | Never create ready-for-review PR |
| UPDATE: Confirm before edit | Show preview of new body |
