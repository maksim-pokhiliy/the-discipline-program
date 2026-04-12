# The Discipline Program — Handoff System

Migrated from Claude Code memory (2026-04-12). This directory preserves 100% of cross-session context for the BIGTECH-AUDIT in progress.

## How to resume work

1. Read `audit-state.md` — the main handoff entry point (90KB). Contains: full workflow rules, resume instructions, repo structure snapshot, lessons from every commit, rule references, cleanup trigger.
2. Read `shared-audit-rules.md` — 19 shared audit principles (identical copy exists in astro-bot).
3. Read `project-rules.md` — rules specific to this codebase (Next.js 16, monorepo boundaries, MUI, Storybook).
4. Read `docs/BIGTECH-AUDIT.md` in the repo — the living audit worklist with bullet status and commit hashes.
5. Read `CLAUDE.md` in the repo root — project conventions and anti-patterns (35+ rules).

## Files

### Audit System

- [shared-audit-rules.md](shared-audit-rules.md) — 19 universal audit principles (DUPLICATED in astro-bot/.handoff/)
- [audit-state.md](audit-state.md) — Main audit handoff: workflow, current state (Section 1.5.B next), repo structure, lessons learned, rule references, cleanup trigger
- [project-rules.md](project-rules.md) — TDP-specific codebase rules

### Project Context

- [project_db_empty.md](project_db_empty.md) — DB has no real data, can be wiped/recreated freely
- [project_crossfit_data_model_redesign.md](project_crossfit_data_model_redesign.md) — Training data model: typed sections, per-set records, block scoring
- [project_plans_ui_concept.md](project_plans_ui_concept.md) — Coach Plans section: hybrid 3-level drill-down (list → plan → workout)
- [project_rich_text_workouts.md](project_rich_text_workouts.md) — Workout block content: rich text with @-mentions for exercises

## Audit Status (as of 2026-04-12)

- **Section 1:** In progress. 1.5.B done, 1.5.C next. Sections 2-12 not started.
- **Branch:** 3 commits ahead of remote. Pushed.
- **Repo:** `git@github.com:DenysSergeev/The-Discipline-Program-site.git`
