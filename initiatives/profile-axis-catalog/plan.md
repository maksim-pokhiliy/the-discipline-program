# profile-axis-catalog — plan

3 vertical waves (each a visible slice, not server-then-UI), each ships via `/feature`, each owner-smoke-tested on dev. Budget ≤1 `/feature`/session. Sequential: W2 needs W1's catalog, W3 needs W2's binding. Intermediate-red between waves on dev is OK (owner rule — `migration-intermediate-velocity`).

| #   | Wave                          | Covers                                                                                                                                                                                                                                                     | Gate                                                                                                                | Status                                                                           |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | **Catalog + admin**           | `ProfileAxis` Prisma model + migration · contract (entity + CRUD api) · CRUD endpoints · admin CRUD module (labels/exercises pattern)                                                                                                                      | admin creates/edits/deletes axes; api-server suite green; NO load-VO/resolver/athlete touch                         | ✅ shipped (D-4/D-5; migration file + owner-smoke pending `SHADOW_DATABASE_URL`) |
| 2   | **Coach binding** (sacred-VO) | plan-editor-compose decision + four-projection re-check FIRST → byProfile axis → `{kind:catalog,axisId}\|{kind:human,attribute}` · resolver branch (catalog→selections, human→`gender` col) · find-or-create in coach load-editor · migrate existing loads | D-3 ratified in plan-editor-compose; coach authors load by catalog axis / gender; existing byProfile loads migrated | ⬜ pending                                                                       |
| 3   | **Athlete two-layer profile** | athletic-card curated picker over catalog · write-back by kind · migrate `profileSelections` keys string→axisId                                                                                                                                            | athlete sets level from catalog; gendered load resolves with NO manual pick; human card unchanged                   | ⬜ pending                                                                       |

**Sequencing rationale.** Vertical, not horizontal — each wave is something the owner can see and smoke (W1 in admin, W2 in the coach editor, W3 in the athlete profile). Server-then-UI would leave nothing visible after a run. W1 is deliberately the LOW-RISK slice (isolated new entity, zero sacred-VO radius); the sacred-VO change is quarantined to W2 behind its ratification gate.

**W1 design details LOCKED here** (not silently deferred):

- `ProfileAxis { id @cuid, key @unique, label, values String[], createdAt, updatedAt }`.
- Values = controlled `String[]` ON the axis (NO `ProfileAxisValue` table yet — PAC-4).
- GLOBAL catalog (no owner/coach FK — single-coach project — PAC-5).
- Admin module MIRRORS the existing labels/exercises CRUD (find that module, match its pattern — don't invent).
- **The lms resolver does NOT read `ProfileAxis`** — resolution needs only the load VO's axisId + cells + the profile's selections, so there is no `lms → coaching/admin` boundary breach (`api-server-lms-no-coaching` stays green). W1 doesn't touch the resolver anyway; this is the design invariant that keeps W2/W3 clean.

**Deferred to W2** (don't decide early): the exact discriminated-union VO shape + whether `label` is denormalized onto the load for display; the find-or-create UX (inline-create vs picker); the existing-load migration map (probe prod first — likely near-empty).

**Deferred to W3** (don't decide early): the curated-picker UX on the athletic card; confirming human-attribute axes are HIDDEN from the athletic card (yes — gender already lives in the human card, no dup render).
