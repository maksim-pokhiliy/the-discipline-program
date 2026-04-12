---
name: CrossFit data model redesign
description: Training data model redesigned for CrossFit — typed sections, per-set records, block scoring. Next step: rich text content replacing PrescribedSet.
type: project
---

Data model redesigned in PR #123 (branch `feat/crossfit-data-model-redesign`, not merged).

**What's done:**

- WorkoutBlock → typed section: SectionType, ScoreType, title, notes, timing metadata
- PrescribedSet.sets removed → one record = one physical set
- BlockScore model for section-level scoring
- Seed: 47 CrossFit exercises, factory helpers, Coach Denys Linetskyi content
- Preview UI: exercise grouping, section type display
- vitest env fix
- BlockScore.blockId onDelete: Cascade fix (from code review) — staged but not committed

**What's next (same branch, same PR):**

1. Replace PrescribedSet[] with `content: String` (rich text) on WorkoutBlock
2. Remove PrescribedSet model, contracts, mappers, endpoints, hooks entirely
3. Remove SetLog.prescribedSetId FK (or keep nullable for backward compat)
4. Update seed — workout blocks get rich text content instead of structured sets
5. Update preview UI — render rich text instead of exercise list
6. Update copyWeek/duplicate — copy content field instead of sets
7. Hardcoded strings fix in seed (CLAUDE.md violation from review)
8. Update ROADMAP.md line about "blocks + prescribed sets" → "blocks + rich text"

**Key decision:** Workout content is rich text. Future @-trigger system (Notion-style) for structured data injection — separate feature. Documented in ROADMAP.md.
