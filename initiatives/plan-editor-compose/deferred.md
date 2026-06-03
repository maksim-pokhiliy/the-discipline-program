# plan-editor-compose — deferred

Carry-forwards: findings/obligations not yet scheduled, with where they land and open/closed status. **Promote here at every gate** — a WARNING that lives only in a gitignored `.feature-dev/qa.md` is not durable; it must be here with a disposition or it gets lost (exactly what bit us before this file existed).

**Status:** `OPEN` (live obligation) · `SCHEDULED` (assigned to a step) · `CLOSED` (done — kept for the trail) · `DROPPED` (decided not to do).

| ID          | One-liner                                                                   | Disposition                                                                                                                               | Status                                                                         |
| ----------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| QA-001      | Cross-write ladder collision → whole-week read 500s, unrecoverable          | Write-time subtree guard (400) on schema-row create/update + schema update-of-composition; flip the pinned read-500 test                  | SCHEDULED → 10.4 **S1** (HARD BLOCKER, before S2 exposes ladder authoring)     |
| QA-003      | Corrupt `composition` column → misleading 400 (not 500) on week read        | Wrap the week read in `handlePrismaError` (mirror `day/admin.ts:132`) → 500 DbCorruption                                                  | SCHEDULED → 10.4 S1 (fold; same read path + test we touch)                     |
| QA-002      | Read assembly has no per-block isolation — one bad node 500s the whole week | The S1 write-guard closes the reachable cause; residual = DB-level corruption only. Per-block try/catch is a separate resilience step     | DEFERRED (re-point the `week/admin.test.ts:791` sibling test in S1 regardless) |
| QA-004      | `arrangement` superset/parallel refs validated for format, not existence    | Add a tx-time existence + same-scope check (mirror `schema/admin.ts:303-312` `foreignIds`) WHEN the arrangement axis is authored/rendered | SCHEDULED → 10.4 S2 (lands with parallel/superset authoring; tied to D-10.4-3) |
| QA-untilrec | `until_recovery` sham `value:1` not pinned to the qualifier                 | A `restSpecSchema.superRefine` pinning `value:1` — but that touches the FROZEN composition contract (Gate-A escalation)                   | DEFERRED (dedicated contract step; not blocking the sweep)                     |
| QA-006      | `composition.present` coverage cell `required:5` is brittle                 | Subsumed by the S3 seed/gate redesign — per-axis composition coverage cells replace the brittle single cell                               | SCHEDULED → 10.4 S3 (by construction)                                          |
| QA-005      | Seeded WED interval composition `count:3` vs 6-interval node                | Fixed inline in 10.3 (`30da9577`)                                                                                                         | CLOSED                                                                         |

## Detail on the live ones

### QA-001 (HARD BLOCKER — 10.4 S1)

The ladder-collision invariant is enforced ONLY at read today (`assertComposeTreeValid` in `compose-projection.mapper.ts`, throws 500). The sibling `schema-row/admin.ts` create is unguarded, the seed ships an ATOMIC `repetition:ladder` container (`BLOCK_LADDER_DESC_WK1_MON`), so a coach POSTing an `INNER_LADDER_MARKER` row to it bricks the whole week on the next read. Design: a 400-throwing sibling of `assertComposeTreeValid` (reuse the pure `projectSchemaWithBody`, `safeParse`, throw `BadRequestError`) hooked into schema-row create (inside the existing tx, post-insert re-fetch + project) + schema-row update + schema update-of-composition (pre-write construct-and-validate). Flip `week/admin.test.ts:766-789` from read-500 to write-400. Full design in `10-4-recon.md` §WRITE-GUARD.

### QA-004 (10.4 S2, with parallel/superset)

Inert today (nothing reads the arrangement refs). Becomes live the moment S2 authors `arrangement:parallel/superset` (refs `childSchemaId`/`rowIds`/`pairedWithRowId`) or the seed emits them. Mirror the reorder `foreignIds` scope-check. Tied to D-10.4-3: if S2 defers parallel/superset, QA-004 defers with it.

## Closed history

- **QA-005** — seed WED interval `count:3` → `count:6`, fixed inline in the 10.3 run (`30da9577`).
