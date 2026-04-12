---
name: Rich text workouts with @-mentions
description: Workout block content is rich text, structured data injected via @-trigger (Notion-style) — exercises, percentages, formats
type: project
---

Workout block content redesigned as rich text instead of PrescribedSet records.

**Why:** CrossFit programming formats are too diverse for structured records (EMOM alternating, chippers, ladders, death by, etc.). Rich text gives coaches full freedom — they write exactly what the athlete sees.

**Current decision (2026-03-14):** Replace PrescribedSet[] with `content: String` (rich text) on WorkoutBlock. Keep sectionType/scoreType/title/timing as structured metadata. PrescribedSet model to be removed.

**Future feature: @-trigger system (Notion-style)**
Coach types `@` in the rich text editor → context menu appears with options:

- **@Exercise** — pick from exercise library, creates a linked reference (enables usage stats, exercise video links)
- **@Percentage** — calculates from each athlete's 1RM (e.g., `@75% Back Squat` → shows personalized weight per athlete)
- **@Format** — insert EMOM/AMRAP/For Time template with timing metadata

This preserves rich text freedom while enabling:

- Exercise usage analytics ("how many times did athlete squat this month")
- Auto-calculated percentages per athlete
- Structured logging against linked exercises
- Volume tracking

**How to apply:** Current PR (#123) moves to rich text. @-mentions is a separate future feature — don't mix concerns. When building the workout editor, use a rich text editor (like TipTap) that supports custom nodes/marks for future @-mention extensibility.
