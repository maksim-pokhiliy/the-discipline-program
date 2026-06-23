# profile-axis-catalog — W2 four-projection re-check (the sacred-VO gate)

**Status: design A RATIFIED 2026-06-23 — supersedes the W2-union analysis (Part A, §0–§9 below).** The W2 union (`{kind:"catalog"} | {kind:"human"}`) PASSED the EXECUTE / RENDER / ANALYTICS projections, but the re-check **MISSED the AUTHORING (coach-SETS) projection**: it had TWO ways to express gender (the `human` arm AND a coach-made `catalog` axis literally named "Gender"/"Sex"), and Part A §4 dismissed the duplicate as a "catalog-hygiene smell, not a VO-invariance violation." Owner smoke proved it a real correctness hole — a coach assigned a catalog "Gender" axis; it resolved from `profileSelections` (a manual pick), ignored the typed `gender` column, and a `gender=MALE` athlete got "pick your gender" (values even mismatched: catalog `M`/`F` vs the human arm's `Male`/`Female`). Two parallel ways to express gender = the "gender lives a separate life" disease (D-1) back via the catalog door. **Design A closes the duplicate BY CONSTRUCTION.** Part B is the load-bearing SSOT for the W2-REVISION binding shape; `.feature-dev/<ts>/design.md` builds on it. Part A is retained as the superseded union analysis (the four-projection RATIONALE in it — the free-string axis is a name-collision; gender must resolve from the typed column — STANDS and is carried forward by design A).

---

# Part B — design A: gender = one system, protected, bound catalog axis

## B.0 The lens (verbatim) + the miss

`plan-editor-compose/decisions.md:7` — _"a primitive is legitimate iff it means the same thing across (1) coach SETS, (2) athlete EXECUTES, (3) RENDER, (4) ANALYTICS. If it splits into 'depends what was meant' in any projection, it is a name-collision, not a primitive, and must be split before the contract freezes it."_ Memory: `[[compose-four-projection]]`.

**The miss.** The lens has FOUR projections. The W2 re-check tabulated EXECUTE / RENDER / ANALYTICS per-arm (Part A §4) but treated **coach-SETS** as merely "pick the kind" — it never asked whether gender had ONE author path. It did not:

- **Path 1** — `{ kind:"human", attribute:"gender" }` → reads the typed `AthleteProfile.gender` column.
- **Path 2** — create/pick a `{ kind:"catalog" }` axis named "Gender"/"Sex" with values M/F → resolves from a **manual pick** (`profileSelections[axisId]`), never touching the typed column.

Two SET-projection encodings of the same intrinsic attribute = **a name-collision IN THE AUTHORING PROJECTION** — the exact lens failure ("depends what was meant": did the coach mean the typed column or a manual pick?). Part A §4 cross-arm SAW it ("a coach _could_ redundantly create a catalog 'sex' axis") and WRONGLY ruled it editorial hygiene. It is the disease D-1 exists to kill, re-entering by the catalog door. The fix must make gender **single-path in the SET projection**.

## B.1 The new shape

gender stops being a separate union arm. It becomes ONE protected catalog row, bound to the typed column by a `binding` enum. The byProfile axis collapses from a `kind`-union to a SINGLE object discriminated by `binding`:

```
// ProfileAxis (W1 catalog model) gains:
//   binding ProfileAxisBinding?       // enum { GENDER } ; nullable
//   @@unique([binding])               // Postgres: many NULLs allowed, AT MOST ONE GENDER (by construction)

// packages/contracts/src/entities/lms/_shared/load.ts
const byProfileAxisSchema = z.object({
  axisId:  z.string().cuid(),
  label:   z.string().trim().min(1),                 // denormalized snapshot
  values:  z.array(z.string().trim().min(1)).min(1), // denormalized snapshot
  binding: z.literal("GENDER").nullable(),           // denormalized: null = plain pick; GENDER = bound to the typed column
});
// byProfile: { kind:"byProfile", axes: array(byProfileAxisSchema).min(1).max(2), cells: [{coords, kg}] }  (unchanged)
```

- `binding = null` → **PLAIN axis**: resolves from `profileSelections[axisId]` (the athlete's manual pick). Every coach-made training axis (level, scale, …).
- `binding = "GENDER"` → **BOUND axis**: resolves by reading the typed `AthleteProfile.gender` column, mapped enum→coord; **NO athlete pick**. There is exactly ONE such axis — the system row the migration inserts (reserved `key`, `label "Gender"`, `values ["Male","Female"]`, `binding GENDER`), protected from create/edit/delete/duplication.
- The snapshot carries `binding` so the resolver stays a **PURE function of the load** (never reads `ProfileAxis`) — the D-6 denormalization invariant, extended by one field.

**Simpler than the union.** Both "arms" share ONE object shape (`axisId`+`label`+`values`+`binding`); the discriminant is a field value, not a structural split → a flat `z.object`, not a `z.discriminatedUnion`. gender is no longer a parallel shape; it is a catalog row like any other, distinguished only by its `binding`.

## B.2 Single-path authoring — the fix, by construction

A **gender differentiation** = an axis that reads the typed `gender` column = `binding = "GENDER"`. Design A makes that authorable exactly ONE way and a second impossible:

1. **One picker, no kind toggle.** The coach authors a byProfile axis by picking from the catalog (one `CreatablePicker`). The system Gender axis appears in that list, marked "profile attribute". Picking it binds its snapshot incl. `binding:"GENDER"`; values lock; cells seed from its canonical values.
2. **`binding` is NOT an API-settable field.** `createProfileAxisSchema` / `updateProfileAxisSchema` omit `binding`; no coach/admin request can set it. The only `binding="GENDER"` row is the migration-inserted system row.
3. **DB `@@unique([binding])`.** Postgres unique-on-nullable allows unlimited `null` bindings but **AT MOST ONE `GENDER`** — a second gender-bound axis is rejected by the database, not by app logic.
4. **System row protected.** CRUD rejects edit/delete of any `binding != null` row; the reserved `key @unique` blocks a key-collision dup of the system axis.

**Result:** there is NO second way to express a gender differentiation. A coach CAN still create a plain axis they NAME "Gender" — but it is `binding=null`, a manual-pick training axis that **never touches the typed column**; it is not a gender differentiation, cannot masquerade as one (the resolver reads the column ONLY for `binding=GENDER`), and the picker shows the real system axis marked, steering the coach to it. Label-text is deliberately **not policed** (brittle: Sex / Sexe / М-Ж / …); the invariant is the `binding`, and the `binding` is singular by DB constraint.

## B.3 The split passes — per "arm" × projection (discriminated by `binding`)

### BOUND axis — `binding = "GENDER"` (the one system row)

| Projection       | Meaning                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| coach SETS       | Pick the system Gender axis from the catalog (the ONLY gender path; a second cannot be created). → "load varies by the athlete's intrinsic sex." |
| athlete EXECUTES | resolved kg = the cell whose coord == map(typed `AthleteProfile.gender`); **NO pick**. `gender=null` → unresolved, profile steer, no pick (D-1). |
| RENDER           | snapshot `label "Gender"` + per-sex cells; athlete view resolves from his column.                                                                |
| ANALYTICS        | group by the stable `axisId`; dimension value = the typed gender. → "load attributable to a sex."                                                |

**Invariant:** all four = _"the system gender attribute, valued by the typed column, never a manual pick, authorable exactly once."_ No "depends what was meant." ✓

### PLAIN axis — `binding = null` (every coach-made training axis)

| Projection       | Meaning                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| coach SETS       | Pick/create a catalog axis (find-or-create), bind `axisId` + snapshot `label`+`values`, fill cells. → "load varies by a coach-defined **training classification**." |
| athlete EXECUTES | resolved kg = the cell whose coord == `profileSelections[axisId]` (the athlete's saved pick for this axis).                                                         |
| RENDER           | snapshot `label` + per-value cells; athlete highlights his resolved cell.                                                                                           |
| ANALYTICS        | group by the stable `axisId`; dimension value = the athlete's selection.                                                                                            |

**Invariant:** all four = _"a coach-defined training-classification dimension, identified by `axisId`, valued per-athlete by his saved selection."_ No "depends what was meant." ✓

### Cross-arm — the collision-avoidance design A clears

- **Discriminant `binding`** (`"GENDER"` | `null`): every load instance declares its resolution path. No instance is "depends what was meant."
- **Single identity space (improvement over the union).** Both arms are keyed by `axisId` (cuid). gender is no longer a special parallel shape with its own `attribute` key; it is a catalog row distinguished only by `binding`. This REMOVES the union's escape hatch — under the union a `kind:"catalog"` axis could ALSO be "gender"; under design A "is it gender?" is answered solely by `binding`, which is singular.
- **D-1 holds, now BY CONSTRUCTION at authoring (not just resolution).** gender is resolved in exactly ONE place (the `binding=GENDER` branch reading the typed column) AND authorable in exactly one place (the protected system row, `@@unique([binding])`). The union held D-1 only at RESOLUTION (each instance declared its `kind`); design A holds it at AUTHORING too. The typed column stays the SSOT for an athlete's gender VALUE (D-1); the catalog holds only the axis DEFINITION (label / values / binding), never an athlete's gender value.

## B.4 Why design A is the lens-correct shape (not just a patch)

Under the lens, a field that means two things in a projection is SPLIT. But the union's two SET-encodings of gender are not two legitimate primitives (unlike `ladder`'s two node-levels) — they are ONE concept (gender) with a redundant second spelling. The lens-correct move for a **redundant spelling** is not to split but to COLLAPSE to one canonical representation and make the redundant one unconstructable. Design A does exactly that: one representation (a bound catalog row), the redundant one (a hand-rolled "Gender" catalog axis that reads the column) made impossible by `binding`-singularity. The `binding` discriminant then keeps bound-vs-plain four-projection-invariant. **PASSED.**

## B.5 Guardrail ledger (design A — all hold)

- Resolver stays PURE — branches on the snapshot's `binding`; reads `gender` via prisma + a **LOCAL** enum→coord map (NOT `mappers/coaching` `GENDER_MAP` — `api-server-lms-no-coaching`); never reads `ProfileAxis`. ✓
- gender stays a TYPED column (D-1) — the bound axis READS it; the gender value is never moved into the catalog or `profileSelections`. ✓
- The catalog holds only the axis DEFINITION; the system row's value vocabulary (`["Male","Female"]`) is set by the migration and MUST equal the resolver's `GENDER_AXIS_VALUES` — the two ends of the enum→coord contract, pinned by a test. ✓
- W1's `ProfileAxis` catalog is EXTENDED by one column (`binding`) + one index, not re-authored; admin renders the system row read-only/protected. ✓
- Existence guarantee = migration INSERT — the only mechanism that reaches prod (prod runs `migrate deploy`, no seed; dev `migrate reset` re-applies it). ✓
- Intermediate-red between W2 and W3 unchanged (PAC-2 / PAC-12). ✓

## B.6 Execution calls ratified with design A (→ decisions.md D-7)

- **VO** = a flat object (the `kind`-union is REMOVED; the `human` arm is gone) discriminated by a nullable `binding`. `superRefine`: per-axis value-dedup now applies to ALL axes (every axis carries `values`); `axisValueSet(axis) = axis.values` for all axes; distinct-axes keyed by `axisId` for all axes.
- **Existence** = migration insert of the one system row (reserved cuid-shaped `id`, reserved `key`, `binding GENDER`, `values ["Male","Female"]`); `@@unique([binding])` for the by-construction singularity.
- **Protection** = `binding` omitted from create/update form schemas (not settable) + CRUD rejects edit/delete of `binding != null` rows.
- **The two unresolved arms** (D-6 DR-1) re-expressed on `binding`: `missing_profile_pick` (a `binding=null` axis unpicked — inline-fixable) vs `missing_profile_attribute` (a `binding=GENDER` axis with `gender=null` — profile steer, no inline pick); a mixed unresolved load surfaces the catalog pick FIRST. `ResolvedLoad` arms + `axisLabels` field unchanged.

---

# Part A — W2-UNION analysis (SUPERSEDED 2026-06-23 by Part B / design A; retained for history)

> The sections below analysed the W2 discriminated-union shape `{kind:"catalog"} | {kind:"human"}`. They are **superseded** by Part B (design A). The four-projection RATIONALE (free-string axis = name-collision; gender must resolve from the typed column; the cells/coords shape and the ≤2 cap are preserved) STANDS and is carried forward. The shape decisions (the `kind` discriminant, the `human` arm, §4's dismissal of the catalog "sex" dup as a hygiene smell) are REPLACED by design A.

## 0. The lens (verbatim)

`plan-editor-compose/decisions.md:7` — _"a primitive is legitimate iff it means the same thing across (1) coach SETS, (2) athlete EXECUTES, (3) RENDER, (4) ANALYTICS. If it splits into 'depends what was meant' in any projection, it is a name-collision, not a primitive, and must be split before the contract freezes it."_ Memory: `[[compose-four-projection]]`. Two ratified precedents — `interval` CONFIRMED as one primitive; `ladder` SPLIT into two primitives on two node levels because `steps` collided in the analytics projection.

## 1. The subject

The `byProfile` load's `axes[]` element (`packages/contracts/src/entities/lms/_shared/load.ts`).

- **Current (frozen by primitive-v2 `D-V2-PROFILE-NESTING` / gap #17, `reshape-design.md` §2.5):** `axes[i] = { name: string, values: string[] }` — a **free-string** axis. cells = cartesian product of axis values, `{coords, kg}`.
- **Post-D-3 (W2):** `axes[i] = { kind:"catalog", axisId, label, values } | { kind:"human", attribute:"gender" }`. cells shape (coords/kg) + the 1–2 axes cap **preserved**.

## 2. Verdict first

**The current free-string axis is a latent NAME-COLLISION under the lens; D-3's discriminated union is the lens-MANDATED split** — structurally the same move as `D-LADDER` (one field that means two things in a projection → split onto a discriminant). The union PASSES four-projection invariance. The contract may freeze it.

## 3. Why the free-string axis collides (the thing the split fixes)

Take `axis.name = "gender"` vs `axis.name = "level"`. Same TYPE (free string), but different meaning in two projections:

- **EXECUTE.** `"level"` must resolve from a **manual athlete pick** (`profileSelections["level"]`). `"gender"` must resolve from the **typed `AthleteProfile.gender` column** — the athlete already IS a gender; re-picking it by hand is the exact smell D-1/`athlete-core D-FIELDS-GENDER-INERT` name (_"the athlete re-picks his sex by hand"_). One field, two resolution paths = "depends what was meant" = collision. (Today the resolver has only the manual-pick path — `resolve-load.ts:14` `selections[axis.name]` — so `"gender"` is mis-resolved as a manual pick. That mis-resolution IS the bug this initiative exists to kill.)
- **ANALYTICS.** Grouping "by level" = grouping by a **mutable coach-defined training classification**; grouping "by gender" = grouping by an **intrinsic, fixed human identity**. Same field, two ontological categories (D-1) = collision.

So the free-string axis conflates a human-identity attribute and a training-classification dimension under one untyped name. Per the lens it MUST split before the resolver relies on it. It was frozen in primitive-v2 for **authoring + render only** — §2.5 says verbatim _"no live reader (the byProfile resolver is Phase 3 per D-LOAD-FINAL)"_ — so the collision was **dormant**. W2 is that Phase-3 resolver wiring; the lens says the split happens exactly now.

## 4. The split passes — per arm × projection

### Arm CATALOG — `{ kind:"catalog", axisId, label, values }`

| Projection       | Meaning                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| coach SETS       | Pick/create a `ProfileAxis` catalog row (find-or-create), bind its `axisId`, snapshot `label`+`values`, fill cells per value. → "load varies by this coach-defined **training classification**." |
| athlete EXECUTES | resolved kg = the cell whose coord == `profileSelections[axisId]` (the athlete's saved pick for this axis). → "read the athlete's class on `axisId`, take the matching cell."                    |
| RENDER           | axis shown by snapshot `label` + per-value cells; athlete view highlights his resolved cell. → "dimension `label`, these per-class loads."                                                       |
| ANALYTICS        | group by the **stable `axisId`**; dimension value = the athlete's selection. → "load attributable to a training-classification value."                                                           |

**Invariant:** all four = _"a coach-defined training-classification dimension, identified by `axisId`, valued per-athlete by his saved selection."_ No "depends what was meant." ✓

### Arm HUMAN — `{ kind:"human", attribute:"gender" }`

| Projection       | Meaning                                                                                                                                                                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| coach SETS       | Pick the human **gender** attribute (a distinct, kind-first pick — NOT a catalog row), fill cells per gender value (`Male`/`Female`, the fixed const). → "load varies by the athlete's **sex** (intrinsic identity, not a coach classification)."                                                           |
| athlete EXECUTES | resolved kg = the cell whose coord == `map(AthleteProfile.gender)`; **NO manual pick** (auto from the typed column). `gender = null` → **unresolved, NO pick offered** (D-1: fix by setting sex in the human profile card, never on the workout). → "read the athlete's typed sex, take the matching cell." |
| RENDER           | axis shown as "Gender" + per-sex cells; athlete view resolves from his column. → "dimension sex, these per-sex loads."                                                                                                                                                                                      |
| ANALYTICS        | group by the fixed `attribute = gender`; dimension value = the gender column. → "load attributable to a sex."                                                                                                                                                                                               |

**Invariant:** all four = _"the fixed human-identity attribute gender, valued per-athlete by the typed column, never a manual pick."_ No "depends what was meant." ✓

### Cross-arm — the collision-avoidance a union must clear

- **Discriminant `kind`** ("catalog" | "human"): every load instance unambiguously declares its resolution path. No instance is "depends what was meant."
- **Identity-space disjoint:** catalog keyed by `axisId` (cuid); human keyed by `attribute` (closed enum, `gender`-only — `Gender = {MALE, FEMALE}`, exactly 2). A cuid is never an attribute; the `kind` tag makes them un-confusable.
- **D-1 (gender in exactly ONE place) holds:** gender is resolved SOLELY by the human arm reading the typed column. The resolver's catalog branch reads only `selections` + `cells` — it **never touches the gender column**, never reads `ProfileAxis`. A coach _could_ redundantly create a catalog "sex" axis, but that is a SEPARATE `kind:"catalog"` instance resolving from a manual pick — it does not collide with the human arm at resolution (each instance declares its `kind`), and the authoring UX offers the human attribute as the **first-class gender channel** (steering away from a redundant catalog "sex"). A redundant catalog "sex" axis is a coach-editorial/catalog-hygiene smell (cf. `D-A5` setEnumeration = coach responsibility), NOT a VO-invariance violation → low carry-forward (PAC-3-adjacent), not a blocker. **[SUPERSEDED: design A (Part B §B.0) reclassifies this exact dismissal as the MISS — the dup IS a SET-projection collision, closed by `binding`-singularity.]**

## 5. VO shape (OQ-1 resolved — the encoding + denormalization)

```
// packages/contracts/src/entities/lms/_shared/load.ts
const GENDER_AXIS_COORDS = { MALE: "Male", FEMALE: "Female" } as const;   // coord vocabulary, lms-local
const GENDER_AXIS_VALUES = Object.values(GENDER_AXIS_COORDS);             // ["Male","Female"]

const byProfileAxisSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("catalog"),
    axisId: z.string().cuid(),
    label: z.string().trim().min(1),                       // denormalized snapshot
    values: z.array(z.string().trim().min(1)).min(1),      // denormalized snapshot
  }),
  z.object({
    kind: z.literal("human"),
    attribute: z.literal("gender"),                        // closed; values implied by const
  }),
]);
// byProfile: { kind:"byProfile", axes: array(byProfileAxisSchema).min(1).max(2), cells: [{coords, kg}] }
```

- **`z.discriminatedUnion("kind", …)`** — the codebase's native pattern (`loadSchema` itself, `percentageReferenceSchema` on `scope`, composition `repetition`/`arrangement`). Nested-discriminated-union (axis `kind` inside the load `kind:"byProfile"` arm) is the existing `percentageReferenceSchema` shape — fine.
- **DENORMALIZE `label` + `values` onto the catalog arm (decisive, not optional).** The `superRefine` validates "coords ⊆ axis values" + "cells = cartesian product" — it must stay a **pure function of the load** (the contracts package must never reach the catalog). So the catalog arm MUST carry its `values`. `label` rides along so **every render/picker surface stays a pure function of the load** (no catalog fetch on the athlete-session hot path; coach-daily-UX = #1). Identity = `axisId` (resolution + analytics, drift-proof); presentation = the snapshot `label`/`values` (render + validation). They never collide: resolution matches selection→coord by **value**, analytics groups by **axisId**, render shows **label** — three orthogonal uses.
- **The human arm carries NO `values`** — they're the closed `attribute`'s fixed const (`GENDER_AXIS_VALUES`). This **structurally enforces D-1**: the human arm cannot carry arbitrary values; it's locked to the gender vocabulary. The `superRefine` resolves each axis's value-set by `kind` (catalog → `axis.values`; human → `GENDER_AXIS_VALUES`). **[design A: every axis carries `values`; the bound axis's `values` are the snapshot `["Male","Female"]`; D-1 is enforced by `binding`-singularity, not by the absence of values.]**
- **superRefine carry-over + additions:** keep per-axis value-dedup (catalog only; the gender const is pre-deduped), cartesian-product count, coords-length == axes-length, coord ∈ axis-value-set, unique coord-keys. **ADD:** the ≤2 axes must be **distinct** (no two `catalog` arms with the same `axisId`; not two `human` arms) — a 2-axis grid over one dimension is degenerate (the old free-string version silently allowed it).
- **Staleness (accepted consequence):** editing a catalog axis after a load is authored does NOT retro-update the load's snapshot — correct point-in-time authoring; analytics still groups by the stable `axisId`; the coach re-authors to adopt new values. Cross-epoch value rename = a known low edge (single coach, hand-built plans); carry-forward, not a W2 blocker.

## 6. The other open questions (resolved at the gate)

- **OQ-2 — find-or-create UX = KIND-FIRST authoring.** A `kind` selector ("Training axis (catalog)" vs "Athlete attribute") mirrors the discriminant AND makes the D-1 human/training split **visible** in the editor. **[SUPERSEDED: design A drops the kind toggle — ONE catalog picker; the system Gender axis appears in the list marked "profile attribute" (single-path).]**
- **OQ-3 — profileSelections re-key BOUNDARY = W2 reads by `axisId`; W3 owns the write-side + bulk migration.** (Unchanged by design A.) W2 changes the resolver READ (`profileSelections[axisId]`) AND the athlete-session inline picker to read/write by `axisId`. The proactive profile-card write + the bulk legacy-key migration (PAC-2) are W3. Intermediate-red stated. `profileSelectionsSchema = z.record(string, string)` unchanged.
- **OQ-4 — human coord values = `{ MALE:"Male", FEMALE:"Female" }`, lms-local.** `Gender` has exactly `MALE|FEMALE` (verified `schema.prisma:125`). The resolver maps `prisma.gender → GENDER_AXIS_COORDS[gender]` with a LOCAL inline map (NOT importing `mappers/coaching GENDER_MAP` — `api-server-lms-no-coaching`). `gender = null` → unresolvable (no pick offered). (Unchanged by design A; the bound axis's snapshot `values` must equal `GENDER_AXIS_VALUES`.)

## 7. PAC-8 / PAC-9 — resolved as a BENEFIT of the denormalize+bind-by-axisId design

- **PAC-8 (normalization + case-fold law).** The byProfile load **no longer free-types axis values** — catalog values are a **snapshot of the catalog's already-`normalizedString` (NFKC + zero-width-strip) values**; the find-or-create picker binds by **`axisId` (cuid)**, NOT `key`/`label` string → a `level`/`Level` catalog split is two **visible, distinct** rows the coach chooses between, never a silent resolution fork. **W2 does NOT need `keyLower`** (D-4 carry-forward closed). (Unchanged by design A.)
- **PAC-9 (axis-delete referential policy) = TOLERATE-ORPHAN.** No FK (D-2 global catalog). Because the load **denormalizes label+values+cells**, a deleted axis leaves the referencing load **fully functional** — it still RENDERS (snapshot label) and RESOLVES (cells + selection by `axisId`). (Unchanged by design A; the system Gender axis additionally cannot be deleted at all — protected.)

## 8. Superseding note (primitive-v2 #17 — cross-ref, NOT a deep-edit)

D-3 **revised** the byProfile axis shape frozen by primitive-v2 `D-V2-PROFILE-NESTING` (#17, `reshape-design.md` §2.5): axis `{ name, values }` (free-string) → discriminated union. design A (D-7) revises it again → a single `binding`-discriminated object. The **cells shape (coords/kg) + the 1–2 axes cap are preserved** throughout. primitive-v2 is a CLOSED initiative — this is a forward cross-ref recorded here + in `decisions.md`, **not** an edit to the closed doc.

## 9. Guardrail ledger (union — all held; carried forward by design A §B.5)

- lms resolver imports NO `coaching/*` — reads `gender` via prisma + a local inline `GENDER_AXIS_COORDS` map; catalog axes need only the load's `cells` + the athlete's `selections` (NOT `ProfileAxis`). ✓
- gender stays a typed column (D-1) — the human arm READS it; not absorbed into the catalog, not duplicated into `profileSelections`. ✓
- W1's `ProfileAxis` catalog (model/contract/endpoints/admin) is CONSUMED, not re-authored. ✓
- Intermediate-red between W2 and W3 = §6 OQ-3. Stated, owner-acceptable.
