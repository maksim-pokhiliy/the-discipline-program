# profile-axis-catalog — decisions

D-numbered ratified decisions. The SSOT for "why." Cross-initiative architecture → `docs/adr/`; the sacred-VO change is cross-ref'd to `plan-editor-compose`.

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting ratification — do not execute past it) · `SUPERSEDED`.

## Index

| ID  | Topic                                                                             | Status             |
| --- | --------------------------------------------------------------------------------- | ------------------ |
| D-1 | Two-category ontology: human identity vs training classification                  | RATIFIED           |
| D-2 | Profile axis = first-class catalog entity; freedom via find-or-create             | RATIFIED           |
| D-3 | byProfile axis = discriminated union (catalog \| human); resolver branches        | OPEN (gated to W2) |
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

- **Status:** OPEN — owner-APPROVED in concept (2026-06-22); RATIFICATION GATE before any W2 code.
- **Decision.** A `byProfile` load axis becomes a discriminated union:
  - `{ kind: "catalog", axisId }` → resolves from `profileSelections[axisId]`.
  - `{ kind: "human", attribute: "gender" }` → resolves by reading the typed `AthleteProfile.gender` column (mapped to the axis value); `attribute` is a CLOSED enum, `GENDER`-only at start (weight already resolves via bodyweight/percentage loads; height doesn't differentiate).
    The resolver branches by `kind`. Write-back is symmetric: a human-axis pick writes the `gender` column, a catalog-axis pick writes `profileSelections` by axisId.
- **Rationale.** This is HOW D-1's two categories meet load resolution WITHOUT merging them: the catalog stays training-only, the human attribute reads the typed column, the athlete never re-states his sex. The discriminated-union is the codebase's native pattern (`loadSchema` is already a `discriminatedUnion` on `kind`).
- **GATE (why OPEN).** The `byProfile` load VO is SACRED in plan-editor-compose (`D-PERSIST`) with four-projection invariance. This change is ratified ONLY by: (1) a cross-ref decision added to `plan-editor-compose/decisions.md`, (2) a four-projection re-check on the changed VO. Both run as W2's FIRST task, BEFORE the VO code. W1 does not touch the VO.
- **Links.** plan-editor-compose `D-PERSIST` (sacred VO); contracts `lms/_shared/load.ts`; athlete-core `D-FIELDS-GENDER-INERT` (named this exact fix). Deferred items PAC-1/PAC-7.

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
