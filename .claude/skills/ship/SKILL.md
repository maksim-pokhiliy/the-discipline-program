---
name: ship
description: Full ship flow — branch, commit, push, PR, merge, cleanup, sync
allowed-tools: Bash(git *), Bash(gh *), Bash(sync_branches *), Read, Glob, Grep
disable-model-invocation: true
user-invocable: true
---

Execute the full ship pipeline. All steps are sequential — stop immediately on any failure.

No arguments required. You analyze the changes yourself.

## Pipeline

### 1. Analyze changes

- Run `git status` and `git diff` (staged + unstaged) to understand what changed.
- Read modified files if needed to understand the context.
- From the changes, determine:
  - **Commit message**: conventional commit format (`feat:`, `fix:`, `refactor:`, etc.), lowercase, concise. Exactly describes what changed.
  - **Branch name**: derived from commit message, kebab-case with type prefix, e.g. `feat: add user profile` → `feat/add-user-profile`

### 2. Branch guard

Run `git branch --show-current`. If the current branch is `main`, create and switch to the new branch:

- `git checkout -b {branch-name}`

If already on a non-main branch, stay on it and use its name.

### 3. Commit

- Stage all changes: `git add -A`
- Commit with the generated message. Do NOT add any co-authored-by, generated-by, or similar signatures. The commit message is ONLY the conventional commit text, nothing more.
- Use HEREDOC format for the commit message.

### 4. Push

- `git push -u origin HEAD`

### 5. Pull Request

- Create PR to `main` using `gh pr create --fill --base main`

### 6. Merge

- Merge the PR: `gh pr merge --squash --delete-branch`

### 7. Local sync

- Run `sync_branches main`

### 8. Push to denys

- Run `git push denys main`

## Important

- Stop on ANY error. Do not continue the pipeline if a step fails.
- Do not ask for confirmation between steps — execute the full pipeline automatically.
- No signatures, no co-authored-by, no generated-by — anywhere.
