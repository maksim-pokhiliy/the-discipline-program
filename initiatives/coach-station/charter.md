# coach-station — charter

**Goal.** The coach's daily station is complete and provably faster than Excel: he reuses prior work (clone at every floor — week / day / session / block / schema / row), manages his coach profile, groups by drag, and authors on a polished surface — all over the FROZEN session primitive.

**Driving decision.** `docs/roadmap.md` §Phase 2 (the phase this initiative IS). Step-level "why" → this dir's `decisions.md` (D-1..D-5). Builds ON the frozen primitive: `initiatives/session-primitive/primitive-spec.md` (FROZEN), ADR-0041 (the `SchemaGroup` law), the W4 leaf law. No new cross-initiative ADR yet — clone is app-level orchestration over the existing model.

**Acceptance criteria** (properties of the result, not a task-list):

- **The bar (roadmap Exit):** Maksim programs a full multi-week cycle end-to-end, **timed**, and it beats his Excel baseline.
- **Clone (R1):** works at all six floors with the ratified per-floor semantics (D-4); the server-side deep-clone (D-3) round-trips structure + prescriptions + group memberships + catalog refs, is atomic, and re-references (does not duplicate) the shared catalog; the gated api-server suite is green on a reseed; the owner browser walkthrough passes.
- **Coach profile (P):** bio + user-meta editable and round-tripping over the already-shipped GET/PUT plumbing.
- **DnD group-creation (G):** drag-to-group + drag-in / drag-out on both floors; owner browser walkthrough passes (jsdom is blind to the pointer layer).
- **Authoring polish (A-known):** LABEL-FLOW-UX (the searchable create-on-the-fly picker consumed at the label dropdowns) + QA-007 landed.

**Scope (in).**

- **R1 — Reuse / Clone** (pain #1): server-side deep-clone (D-3) + the per-floor affordances + semantics (D-4).
- **P — Coach profile UI**: wire the existing `coachProfile` GET/PUT into a form (bio + user-meta).
- **G — DnD group-creation**: its own wave (drag-to-group + drag-in/out, both floors).
- **A-known — Authoring polish (freeze-independent)**: LABEL-FLOW-UX (picker already built — D-MODIFIER / DR-W4E-PICKER-LOCAL — just consumed at the label surfaces) + QA-007 (same picker bug) + the accumulated low-pri W3/W4 cleanups.

**Non-goals (out — and where they go).**

- **R2 — Saved compositions / archetypes.** PARKED inside this initiative (D-2; `deferred.md` → TEMPLATES), **not dropped** — keep it on the radar; we decide where to slot the implementation later. Persona-grounded ("писать EMOM по 200 раз" → archetypes), but a new entity + its own design-cycle.
- **A-e2e — the e2e-fed polish unknowns** (P-6 reps-unit, QA-D-03, + new findings still landing): held OPEN, fed by the in-flight session-primitive e2e. Do NOT build polish assuming a reps-unit shape — **P-6's outcome is a session-primitive FREEZE decision owned by the parallel session.**
- **Phase 3** athlete core, `Performed*` / `OneRMRecord` / scoring redesign.
- **Coach-profile schema expansion** (branding / gym / avatar beyond `User.image`) until Denys names a real need (anti-"one more feature").

**Sacred (do not touch / reuse, don't edit).**

- **The frozen primitive contract:** `primitive-spec.md`; ADR-0041 (`SchemaGroup` is membership-based — no recursion, no typed relation kinds, no child-count semantics); the W4 leaf law (one row kind; `load`/`tempo`/`side` VOs; `notes` = `Json?` `string[]`); the **one-predicate rule at both floors** (`buildBlockItems` / `buildRowItems` are the SOLE clustering source — never hand-roll a child-count/cluster check). Clone must reuse these, not fork them.
- **session-primitive's durable docs + `initiatives/ACTIVE`** — owned by the parallel session until its `/initiative-close`. This initiative runs in an **isolated worktree** (`worktree-coach-station`); `ACTIVE` in `main` stays `session-primitive`.
- **House rules:** no hex outside the theme palette; one component per file; MUI floating labels; owner columns render `UserChip`; no silent list caps; aggressive bridge-free migrations (final state green).
