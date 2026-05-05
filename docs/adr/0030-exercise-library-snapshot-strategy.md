# 0030. Exercise library snapshot strategy — hybrid FK + immutable JSON

> **[SUPERSEDED]** by ADR-0037 on 2026-05-03 — the `ExerciseLibraryItem` model was deleted and every FK to it (`ExerciseEntry.exerciseId`, `ExerciseLog.exerciseId`, `Benchmark.exerciseId`, `PersonalRecord.exerciseId`, `SetLog.prescribed.exerciseId`) was dropped along with the authoring surface. The hybrid FK + immutable JSON pattern has nothing left to apply to. `ExerciseLog.exerciseSnapshot` JSON column is preserved as the only displayable identity athlete logs retain, but it is now disconnected from any library (snapshot-without-FK; the analytics use case the hybrid was built to serve is gone with the library). Re-implementation will need to revisit the snapshot vs FK trade-off from scratch.

- **Status:** Accepted
- **Date:** 2026-04-26
- **Tags:** `lms`, `data-modeling`, `analytics`

> Status flipped from Proposed to Accepted: the hybrid FK + immutable JSON strategy has landed and is load-bearing in code.

## Context

`ExerciseLibraryItem` is a mutable record. Coaches rename ("DB Snatch" → "Single-arm DB Snatch"), retire (`deletedAt`), and version (`supersedesId`) library items as the canonical movement vocabulary evolves. The library is small (~500 SYSTEM rows, perhaps a few hundred per coach) but old entries point into it — `ExerciseEntry` rows in old plans, `ExerciseLog` rows in old sessions, `Benchmark` rows tied to specific 1RM targets, `PersonalRecord` rows keyed on `(userId, exerciseId, kind)`.

The question is what `ExerciseEntry.exercise` should resolve to in the UI of an old plan when the underlying library item has been renamed, retired, or replaced.

Three positions are coherent.

- **Reference only** (`ExerciseEntry.exerciseId` FK, no embedded data). UI reads through the FK and shows the current name. Analytics is clean: `GROUP BY exerciseId`. But a rename retroactively rewrites every historical entry, which is wrong — the coach prescribed "DB Snatch", that is what they prescribed, the rename does not erase that history. A delete (`deletedAt`) breaks the UI entirely unless every read joins through soft-delete-aware code.
- **Snapshot only** (no FK, embed the exercise inside the entry as JSON). UI is bulletproof — the entry carries the name and metadata it was created with. But analytics dies: `SUM(actual.load) GROUP BY exerciseId` has no `exerciseId`, only the snapshot's name string, which is not stable across coaches who use slightly different spellings.
- **Hybrid.** Both. The FK for analytics, the snapshot for UI display.

We pick the hybrid. The cost is duplication; the benefit is that the two failure modes (rewriting history vs losing analytics) both close.

## Decision

`ExerciseEntry`, `ExerciseLog`, and `SetLog.prescribed` each carry both:

1. An FK column referencing `ExerciseLibraryItem.id`. The FK survives soft-delete (we do not cascade on `deletedAt`).
2. An immutable JSON snapshot column (`exerciseSnapshot` on entries/logs; embedded inside `prescribed` for set-level prescriptions).

The snapshot is captured at the moment of write and never mutated afterward. The shape contains `id`, `name`, `primaryMovement`, `modality`, `primaryBodyParts`, `defaultMetrics`, `demoVideoUrl`, and any other fields that affect rendering. UI components read from the snapshot. Analytics queries read through the FK.

When a library item is renamed:

- Existing entries continue to display the old name (snapshot is frozen).
- New entries created against the same `exerciseId` capture the new name in their snapshot.
- Analytics queries continue to roll up entries under the same `exerciseId` regardless of name evolution.

When a library item is soft-deleted:

- Existing entries continue to display the deleted item's snapshot.
- The library no longer offers it for new entries.
- Analytics still aggregates historical data under the dead `exerciseId`; coaches inspecting history see the dead item's name from the snapshot.

When a hard rename is required (i.e., the new entity is conceptually different — the old item was wrong, not just renamed), a coach creates a fresh `ExerciseLibraryItem` with `supersedesId` pointing at the old one. Old entries keep their FK to the original; new entries use the new ID. The two are linked for reporting purposes via `supersedesId` traversal but treated as distinct exercises by default.

The snapshot column lives on `ExerciseEntry` (plan side) and `ExerciseLog` (session side). It is not stored on `BlockSession` or `WorkoutSession` since those do not carry exercises directly.

## Consequences

**Positive:**

- UI is immortal. Renames and deletes never blow up old views.
- Analytics is clean. `SUM(actual.load) GROUP BY exerciseId` is a one-shot Prisma query with no string-matching gymnastics.
- Soft-delete in the library is safe — historical FKs hold, the UI reads the snapshot.
- Hard renames have a sanctioned path (`supersedesId`) that does not corrupt history.

**Negative:**

- Roughly 200 bytes per entry of duplicated JSON. For a full 52-week plan (~47k `ExerciseEntry` rows; see design doc §11.1) this is ~9 MB per plan. Acceptable.
- Two writes to keep in sync at insert/update time. We pay this cost via a thin mapper helper that constructs the snapshot from the library item lookup; no downstream caller composes the snapshot manually.
- Snapshot drift if the library item's display fields change in a way the coach does want to propagate retroactively. We accept this — propagation is a deliberate action (re-edit the entry), not a passive consequence of editing the library.

**Neutral:**

- The snapshot shape is owned by `packages/contracts/src/entities/lms/_domain/exercise-snapshot.schema.ts`. Adding a field to the snapshot is a contract change, validated by zod at write time and at read time.
- Storage compression in Postgres (TOAST) handles the JSON volume well; no custom compression needed.

## Alternatives considered

**Reference only.** Discussed above. Rejected: rewrites history; soft-delete breaks the UI; coach trust in the editor erodes the first time a renamed exercise surprises them mid-review.

**Snapshot only.** Discussed above. Rejected: kills analytics. Tonnage by movement, PR per exercise, library search "all entries using this exercise" all become string-matching problems.

**Versioned library items (every edit creates a new immutable row, FK points to the version).** Cleaner in theory: history is exact, no snapshot duplication. Rejected: ergonomically punishing — every minor edit (typo fix, demo URL update) creates a new version; the library grows by an order of magnitude; query patterns get complicated (latest version per "logical" item). The snapshot strategy gives us the same outcome with less ceremony.

**Reference + denormalized name only (single `nameSnapshot` column, not full snapshot).** Cheap, but partial. UI uses more than just the name (movement pattern, modality, demo video). Either we snapshot the full shape or we re-fetch on read; partial snapshot is the worst of both. Rejected.

## References

- `docs/design/workout-redesign.md` §3.3 (entity definitions), §6.7 (benchmark resolution flow).
- ADR-0009 — soft-delete extension (the FK survives soft-delete by design).
- ADR-0027 — structural rewrite that introduces these entries.
- ADR-0034 — three CRUD libraries (snapshot strategy applies to all three, but exercises are the dominant consumer).
