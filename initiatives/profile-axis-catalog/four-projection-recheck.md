# profile-axis-catalog — W2 four-projection re-check (the sacred-VO gate)

**Status: PASSED 2026-06-22.** Discharges PAC-7 (and the D-3 ratification gate). The `byProfile` load axis is a `SchemaRow` Json-VO on plan-editor-compose's "Sacred (do not touch)" list (charter §Sacred; `D-PERSIST`), governed by FOUR-PROJECTION INVARIANCE. This doc is the written re-check that unlocks W2's VO/resolver code. It is the load-bearing SSOT for the W2 binding shape; `.feature-dev/<ts>/design.md` builds on it, does not re-derive it.

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
- **D-1 (gender in exactly ONE place) holds:** gender is resolved SOLELY by the human arm reading the typed column. The resolver's catalog branch reads only `selections` + `cells` — it **never touches the gender column**, never reads `ProfileAxis`. A coach _could_ redundantly create a catalog "sex" axis, but that is a SEPARATE `kind:"catalog"` instance resolving from a manual pick — it does not collide with the human arm at resolution (each instance declares its `kind`), and the authoring UX offers the human attribute as the **first-class gender channel** (steering away from a redundant catalog "sex"). A redundant catalog "sex" axis is a coach-editorial/catalog-hygiene smell (cf. `D-A5` setEnumeration = coach responsibility), NOT a VO-invariance violation → low carry-forward (PAC-3-adjacent), not a blocker.

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
- **The human arm carries NO `values`** — they're the closed `attribute`'s fixed const (`GENDER_AXIS_VALUES`). This **structurally enforces D-1**: the human arm cannot carry arbitrary values; it's locked to the gender vocabulary. The `superRefine` resolves each axis's value-set by `kind` (catalog → `axis.values`; human → `GENDER_AXIS_VALUES`).
- **superRefine carry-over + additions:** keep per-axis value-dedup (catalog only; the gender const is pre-deduped), cartesian-product count, coords-length == axes-length, coord ∈ axis-value-set, unique coord-keys. **ADD:** the ≤2 axes must be **distinct** (no two `catalog` arms with the same `axisId`; not two `human` arms) — a 2-axis grid over one dimension is degenerate (the old free-string version silently allowed it).
- **Staleness (accepted consequence):** editing a catalog axis after a load is authored does NOT retro-update the load's snapshot — correct point-in-time authoring; analytics still groups by the stable `axisId`; the coach re-authors to adopt new values. Cross-epoch value rename = a known low edge (single coach, hand-built plans); carry-forward, not a W2 blocker.

## 6. The other open questions (resolved at the gate)

- **OQ-2 — find-or-create UX = KIND-FIRST authoring.** A `kind` selector ("Training axis (catalog)" vs "Athlete attribute") mirrors the discriminant AND makes the D-1 human/training split **visible** in the editor — matching the codebase's kind-first editors (load-editor's kind selector; compose inspector). Catalog → an Autocomplete find-or-create over the W1 `GET ProfileAxis` list (pick existing → bind `axisId` + snapshot; create new inline → POST, get `axisId`, snapshot) — the "like labels/tags" pattern D-2 names. Human → pick "gender", NO further pick (cells seed from `GENDER_AXIS_VALUES`). _Exact widget reuse verified in Stage-1 research (the labels/tags Autocomplete + load-editor kind selector are the templates)._
- **OQ-3 — profileSelections re-key BOUNDARY = W2 reads by `axisId`; W3 owns the write-side + bulk migration.** W2 changes the **resolver READ** (`profileSelections[axisId]`) AND the **athlete-session inline picker** (Build §5) to read/write by `axisId`. The **proactive profile-card** write + the bulk legacy-key migration (PAC-2) are W3. **Intermediate-red (stated):** any legacy `profileSelections` entry keyed by axis _name_ is dead to the W2 resolver until re-picked inline (or W3 migrates it); the W2 inline picker (writes by `axisId`) and a still-name-keyed profile card can transiently hold both keys for one athlete (different keys coexist; resolver reads only `axisId`; no corruption). Near-greenfield on dev (athlete-core seeds zero selections) → negligible in practice. `profileSelectionsSchema = z.record(string, string)` is **unchanged** (only key _semantics_ move name→axisId).
- **OQ-4 — human coord values = `{ MALE:"Male", FEMALE:"Female" }`, lms-local.** `Gender` has exactly `MALE|FEMALE` (verified `schema.prisma:125`). The coord const lives in `lms/_shared` (the VO's home), keyed by the gender-member name; the **resolver** maps `prisma.gender → GENDER_AXIS_COORDS[gender]` with a LOCAL inline map (NOT importing `mappers/coaching/enum-maps.ts GENDER_MAP` — `api-server-lms-no-coaching`); the platform render imports the same const for labels. ONE coord vocabulary, referenced (not re-defined) everywhere. `gender = null` → unresolvable (no pick offered).

## 7. PAC-8 / PAC-9 — resolved as a BENEFIT of the denormalize+bind-by-axisId design

- **PAC-8 (normalization + case-fold law).** The byProfile load **no longer free-types axis values** — catalog values are a **snapshot of the catalog's already-`normalizedString` (NFKC + zero-width-strip) values**; human values are the fixed const. cells coords + the athlete's pick are seeded FROM the snapshot. So the catalog's NFKC law is the **single law**; `load.ts`'s bare `.trim()` is defensive only (values are never free-entered). Case-fold: the find-or-create picker binds by **`axisId` (cuid)**, NOT `key`/`label` string → a `level`/`Level` catalog split is two **visible, distinct** rows the coach chooses between, never a silent resolution fork. **W2 does NOT need `keyLower`** (D-4 carry-forward closed).
- **PAC-9 (axis-delete referential policy) = TOLERATE-ORPHAN.** No FK (D-2 global catalog, no reference column). Because the load **denormalizes label+values+cells**, a deleted axis leaves the referencing load **fully functional** — it still RENDERS (snapshot label) and RESOLVES (cells + selection by `axisId`). The only losses: the axis can't be re-picked in find-or-create (it's gone), and analytics-by-`axisId` shows a snapshot-labeled orphan. No restrict-on-reference, no reference-scan-on-delete needed (over-engineering for single-coach). Denormalization makes delete intrinsically safe.

## 8. Superseding note (primitive-v2 #17 — cross-ref, NOT a deep-edit)

D-3 **revises** the byProfile axis shape frozen by primitive-v2 `D-V2-PROFILE-NESTING` (#17, `reshape-design.md` §2.5): axis `{ name, values }` (free-string) → discriminated union `{ kind:"catalog", … } | { kind:"human", … }`. primitive-v2 §2.5 itself scoped #17 to authoring+render with _"no live reader (the resolver is Phase 3)"_; W2 is that Phase-3 wiring, and the lens requires the free-string axis to split when the resolver binds it. The **cells shape (coords/kg) + the 1–2 axes cap are preserved**. primitive-v2 is a CLOSED initiative — this is a forward cross-ref recorded here + in `decisions.md` D-3, **not** an edit to the closed doc.

## 9. Guardrail ledger (all hold)

- lms resolver imports NO `coaching/*` — reads `gender` via prisma + a local inline `GENDER_AXIS_COORDS` map; catalog axes need only the load's `cells` + the athlete's `selections` (NOT `ProfileAxis`). ✓
- gender stays a typed column (D-1) — the human arm READS it; not absorbed into the catalog, not duplicated into `profileSelections`. ✓
- W1's `ProfileAxis` catalog (model/contract/endpoints/admin) is CONSUMED, not re-authored. ✓
- Intermediate-red between W2 and W3 = §6 OQ-3 (legacy name-keyed selections + the profile-card write-side). Stated, owner-acceptable.
