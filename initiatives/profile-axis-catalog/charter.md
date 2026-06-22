# profile-axis-catalog — charter

**Status: founded 2026-06-22; `initiatives/ACTIVE` since 2026-06-22.** Pulls the **profile-type-catalog** carry-forward out of `athlete-core` (its deferred "library wave" — `state.md`: the profile-type catalog "re-homes `profileSelections` AND would wire the typed `gender` field into byProfile resolution — D-FIELDS-GENDER-INERT") into its own initiative. Foundation under roadmap Phase 3 (athlete/coach core): blocks nothing already shipped, fixes a known seam.

**Goal.** Profile axes (level, scale, …) become a first-class, coach-extensible CATALOG that BOTH a workout's `byProfile` load AND an athlete's profile reference by identity — so load resolves from what the athlete already IS, instead of a brittle re-typed string join. The athlete's _human_ identity (gender) stays typed and SEPARATE from his _training_ classification.

**Why now.** `athlete-core/D-FIELDS-GENDER-INERT` deferred wiring `gender` into resolution and named the fix verbatim: "a typed gender axis bound to the field … the deferred profile-type-catalog wave; a brittle axis-name convention is rejected." The cost has surfaced — the athlete re-picks his sex by hand (typed `gender` is invisible to the resolver, which reads only `{weightKg, profileSelections}`), and free-string axis names footgun "Rx vs RX" (`athlete-core/D-PROF-SELECTIONS-HONEST`). This initiative is that named wave.

**The ratified floor (`decisions.md` is the SSOT for "why").**

- **D-1 (two-category ontology)** — human identity (gender / height / weight / health — typed columns, exist independently of programming) vs training classification (level / scale — free-form catalog axes). NEVER merged into one bucket; the profile renders two layers. The smell owner caught: gender-as-a-catalog-axis makes "can the athlete state his sex" hostage to the catalog.
- **D-2 (axis = first-class catalog entity)** — `ProfileAxis` edited via admin like labels/exercises; coach freedom preserved via FIND-OR-CREATE, not a closed enum; identity kills the string-join footgun + unlocks the curated picker that D-PROF-SELECTIONS-HONEST had to cut.
- **D-3 (byProfile axis = discriminated union, OPEN-gated)** — `{kind:catalog,axisId} | {kind:human,attribute}`; resolver branches by kind; human attribute = `GENDER` only. SACRED-VO touch → ratify in plan-editor-compose + four-projection re-check BEFORE W2.

**Scope — 3 vertical waves (each a visible slice, not server-then-UI).**

- **W1 — catalog + admin.** `ProfileAxis` model + migration + contract (entity + CRUD api) + CRUD endpoints + admin CRUD module. NO load-VO / resolver / athlete-profile touch.
- **W2 — coach binding** (sacred-VO, decision-first). byProfile axis → discriminated union (D-3) + resolver branch + find-or-create in the coach load-editor + migrate existing loads.
- **W3 — athlete two-layer profile.** athletic-card curated picker over catalog axes + write-back by kind (human→`gender` column, catalog→`profileSelections` by axisId) + migrate selections keys.

**Acceptance (properties, not tasks).** A coach creates/edits/deletes axes in admin; authors a byProfile load by picking a catalog axis (find-or-create) OR the human gender attribute; an athlete with `gender` set resolves a gendered load WITHOUT a manual pick; an athlete proactively sets his level from the catalog on his profile; no free-string axis-name join remains in the resolution path.

**Non-goals (→ where they go).**

- Benchmark/template catalog → stays `athlete-core` deferred library wave (this initiative is the PROFILE-axis slice only).
- Per-coach axis scoping → single-coach now ⇒ GLOBAL catalog; multi-tenant later (`deferred.md` PAC-5).
- age/masters as a human attribute → default: masters is a CUSTOM catalog axis until Denys needs auto age-resolution (`deferred.md` PAC-3).
- `ProfileAxisValue` as its own table → values stay a `String[]` on the axis until cardinality/per-value metadata demands it (`deferred.md` PAC-4).

**Sacred (do not touch).**

- The `byProfile` load VO is sacred in `plan-editor-compose` (`D-PERSIST`) with four-projection invariance — W2 changes it ONLY via a ratified plan-editor-compose decision + re-check. **W1 does not touch it at all.**
- The typed `AthleteProfile.gender` column + its coach-facing read surfaces (roster / passport / health-pane / admin — 7 sites) stay; gender is NOT absorbed into the catalog (D-1).
- athlete-core's shipped profile screen (D-PROF-\* / D-FIELDS-\*) is EXTENDED in W3, not rebuilt.

**Process.** 3 vertical waves, each one `/feature`, each owner-smoke-tested locally on dev. W1 now. Driving prior art: `athlete-core/decisions.md` (D-FIELDS-GENDER-INERT, D-PROF-SELECTIONS-HONEST, D-PROFILE-SELECTIONS), `plan-editor-compose/decisions.md` (D-PERSIST sacred VO), `packages/contracts/src/entities/lms/_shared/load.ts`.
