# profile-axis-catalog — decisions

D-numbered ratified decisions. The SSOT for "why." Cross-initiative architecture → `docs/adr/`; the sacred-VO change is cross-ref'd to `plan-editor-compose`.

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting ratification — do not execute past it) · `SUPERSEDED`.

## Index

| ID  | Topic                                                                             | Status             |
| --- | --------------------------------------------------------------------------------- | ------------------ |
| D-1 | Two-category ontology: human identity vs training classification                  | RATIFIED           |
| D-2 | Profile axis = first-class catalog entity; freedom via find-or-create             | RATIFIED           |
| D-3 | byProfile axis = discriminated union (catalog \| human); resolver branches        | RATIFIED (W2 gate) |
| D-4 | W1 `ProfileAxis.key` is case-sensitive `@unique` (no `keyLower` mirror)           | RATIFIED (W1)      |
| D-5 | W1 placement = `coaching/`; admin admitted via file-precise dep-cruiser carve-out | RATIFIED (W1)      |

---

### D-1 — Two-category ontology: human identity vs training classification

- **Status:** RATIFIED (owner, 2026-06-22 — "вопрос семантики и честности").
- **Decision.** An athlete's attributes split into two categories that are NEVER merged:
  - **Human identity** — gender (and height, weight, health). Natural/intrinsic; exist independently of whether any coach ever programmed anything. Stay TYPED columns on `AthleteProfile`. Rendered in the profile's _human_ card; always editable regardless of the catalog.
  - **Training classification** — level, scale, masters-division, weight-class. Exist ONLY because a coach differentiates load by them. Free-form CATALOG axes. Rendered in the profile's _athletic_ card.
    The athlete profile is two layers, not one flat "list of axes."
- **Rationale.** Owner caught the smell in the first design (gender-as-an-axis-in-the-shared-catalog): gender is about the athlete-as-human, level is about the athlete-as-athlete; collapsing them makes "can the athlete state his sex" hostage to whether a catalog axis exists — a corrupt model, and one where a coach editing the catalog could rename/delete the values of "sex." The split keeps identity intrinsic + protected while keeping classification flexible.
- **Links.** Supersedes the first-pass "bound-axis in a shared catalog" sketch. Builds on athlete-core `D-FIELDS-GENDER-INERT` (gender stored, not yet wired) + `D-PROF-SELECTIONS-HONEST` (no fabricated catalog).

### D-2 — Profile axis = first-class catalog entity; freedom via find-or-create

- **Status:** RATIFIED (owner, 2026-06-22).
- **Decision.** A training-classification axis becomes a first-class catalog row — `ProfileAxis { id, key @unique, label, values String[] }` — edited via the admin console like labels and exercises. Coach freedom (axes are NOT a closed enum) is preserved via **find-or-create**: in the load-editor the coach types an axis name and either picks an existing catalog axis (gets its id) or creates a new one on the fly (like labels here / tags in Linear). Values are a controlled `String[]` on the axis — ONE source for both the coach's `cells` and the athlete's pick (no re-typing). Catalog is GLOBAL (single-coach project; owner-scoping deferred PAC-5).
- **Rationale.** Today an axis has NO identity — it lives as bare strings inside one row's `byProfile` load, joined to the profile by the string `axis.name`. That join is a footgun (`D-PROF-SELECTIONS-HONEST`: "a typo 'Rx' vs 'RX' silently breaks load resolution") and spawns duplicate axes ("level" vs "Level"). Identity fixes the join, kills dupes, and UNLOCKS the curated profile picker that D-PROF-SELECTIONS-HONEST had to cut for lack of a catalog.
- **Links.** athlete-core `D-PROF-SELECTIONS-HONEST` / `D-PROFILE-SELECTIONS`; admin labels/exercises CRUD as the pattern.
- **Acted.** W1 shipped the `ProfileAxis` model (`app_profile_axes`) + contract `@repo/contracts/coaching/profile-axis` + api-server `profileAxisAdminApi` + admin "Profile Axes" CRUD module per this (2026-06-22, `feat/profile-axis-catalog-w1`). Refined by D-4 (case-sensitive `key`) + D-5 (placement).

### D-3 — byProfile axis = discriminated union (catalog | human); resolver branches by kind

- **Status:** RATIFIED (W2 gate, 2026-06-22) — concept owner-APPROVED 2026-06-22; the ratification gate (four-projection re-check + plan-editor-compose cross-ref) is now DISCHARGED. See `four-projection-recheck.md` for the full written analysis.
- **Decision.** A `byProfile` load axis becomes a discriminated union (`z.discriminatedUnion("kind", …)` — the codebase-native pattern):
  - `{ kind:"catalog", axisId, label, values }` → resolves from `profileSelections[axisId]`; `label`+`values` are a **denormalized snapshot** of the catalog row at authoring time (keeps the `superRefine` + every render/picker a pure function of the load; the resolver never reads `ProfileAxis`).
  - `{ kind:"human", attribute:"gender" }` → resolves by reading the typed `AthleteProfile.gender` column via a LOCAL inline `MALE|FEMALE → coord` map; **NO denormalized values** (the closed `attribute` implies the fixed const `GENDER_AXIS_COORDS = {MALE:"Male", FEMALE:"Female"}`), which structurally locks the human arm to the gender vocabulary. `attribute` is a CLOSED enum, `GENDER`-only (weight resolves via bodyweight/percentage; height doesn't differentiate). `gender = null` → unresolvable, **no pick offered**.
    The resolver branches by `kind`. Write-back is symmetric: a human-axis pick writes the `gender` column (W3), a catalog-axis pick writes `profileSelections` by `axisId` (W2 inline picker + read; W3 profile-card + bulk migration).
- **Four-projection verdict (the gate).** PASSED. The **current free-string axis `{name, values}` is a latent NAME-COLLISION** — `name:"gender"` (resolve from the typed column, group by intrinsic identity) vs `name:"level"` (resolve from a manual pick, group by mutable classification) is "depends what was meant" in the EXECUTE and ANALYTICS projections. D-3's union is the lens-MANDATED split on `kind` — the inverse of confirming a primitive, structurally identical to `D-LADDER` (one `steps` field → two primitives because it collided in analytics). Each arm means one thing across all four projections; the `kind` discriminant + disjoint identity-space (cuid `axisId` vs closed `attribute`) clear the cross-arm collision; D-1 holds (gender resolved in exactly one place — the human arm). Full per-arm × per-projection table in `four-projection-recheck.md` §4.
- **OQ resolutions (gate).** Encoding + denormalization → §5; find-or-create UX = kind-first authoring → §6 OQ-2; profileSelections re-key cut = W2 reads by `axisId` / W3 owns write + bulk migration, intermediate-red stated → §6 OQ-3; human coord values = `Male`/`Female` lms-local → §6 OQ-4. **PAC-8** (normalization/case-fold) + **PAC-9** (axis-delete = tolerate-orphan) resolved as a benefit of denormalize+bind-by-`axisId` → §7.
- **Supersedes (cross-ref, not a deep-edit).** Revises primitive-v2 `D-V2-PROFILE-NESTING` (#17, `reshape-design.md` §2.5) — free-string axis → discriminated union; cells (coords/kg) + the 1–2 axes cap preserved. primitive-v2 §2.5 scoped #17 to authoring+render with "no live reader (resolver is Phase 3)"; W2 is that Phase-3 wiring. primitive-v2 is CLOSED — forward cross-ref only.
- **Links.** `four-projection-recheck.md` (the gate analysis); plan-editor-compose `D-PERSIST` + the new cross-ref entry (sacred VO); contracts `lms/_shared/load.ts`; athlete-core `D-FIELDS-GENDER-INERT` (named this exact fix). Discharges PAC-7; sets up PAC-1 (W2 migration probe) / PAC-2 (W3 selections re-key).

### D-4 — W1 `ProfileAxis.key` is case-sensitive `@unique` (no `keyLower` mirror)

- **Status:** RATIFIED (owner, Gate A 2026-06-22).
- **Decision.** W1's `ProfileAxis.key` carries a plain case-sensitive `@unique` constraint — NO derived `keyLower @unique` column (unlike `Label.nameLower` / `Exercise.canonicalNameLower`). `level` and `Level` are therefore two distinct catalog rows. The shared `normalizedString` (NFKC + zero-width strip + trim) applies to `key`/`label`/values inputs but does NOT lowercase.
- **Rationale.** `key` is a deliberately-typed machine slug (the admin chooses it), not free-typed prose; case collisions are a low-probability admin-discipline edge, not the athlete-facing footgun. The dupe D-2's rationale names ("level vs Level") is killed primarily by W2's find-or-create — the coach picks the one canonical catalog row instead of free-typing — so a within-catalog case-fold is a W2 concern, not a W1 model requirement. Simplest-correct for W1; `keyLower` is a cheap, reversible add later.
- **Carry-forward.** If W2's `byProfile` picker keys off `axis.key`, a `level`/`Level` split silently forks the controlled vocabulary → decide case-folding (`keyLower @unique` + derivation) when wiring W2. See `deferred.md` PAC-8.
- **Links.** design.md MD-3 / OQ-1; qa.md QA-004 (awareness flag). Refines D-2.

### D-5 — W1 placement = `coaching/`; admin admitted via a file-precise dep-cruiser carve-out

- **Status:** RATIFIED (owner, Gate A 2026-06-22).
- **Decision.** `ProfileAxis` lives in the `coaching/` bounded context — contract `@repo/contracts/coaching/profile-axis`, api-server flat `endpoints/coaching/profile-axis.ts` + `mappers/coaching/profile-axis.mapper.ts`, `@@map("app_profile_axes")` (the `app_*` coaching-table convention). The admin app's three new `profile-axes/*` route handlers import `@repo/api-server/coaching`, which the dep-cruiser rule `admin-coaching-only-via-user-detail-route` forbids by default; admitted via a FILE-PRECISE carve-out (the 3 route files added to `from.pathNot`) — the literal mirror of how `admin-no-lms` admitted labels/exercises.
- **Rationale.** Charter D-2 puts the entity in coaching/admin territory (NOT `lms/`). ANY new admin-managed catalog route needs a carve-out regardless of placement (admin is default-denied from both the `lms` and `coaching` backends) — so the carve-out is intrinsic, not avoidable by relocation. Chose Option 1 (extend the existing carve-out, file-precise) over Option 2 (a new `library` bounded context — scope creep, deferred PAC-10) and Option 3 (reframe as resolver-isolation — collapses into Option 1 for the actual blocker). The named `api-server-lms-no-coaching` invariant (the one the W1 prompt called out) needs NO edit — it holds for free: no `lms/**` file imports the catalog, and the resolver never reads it.
- **Consequence.** `.dependency-cruiser.cjs` (a CI-config) gained 3 `pathNot` entries — owner-confirmed at Gate A. `pnpm dep:check` green (0 violations, 2048 modules).
- **Links.** research.md §0; design.md §6 / DR-4 / DR-5. Deferred PAC-10 (future library context).
