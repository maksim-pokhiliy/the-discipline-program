# profile-axis-catalog — journal

Append-only. One entry per session/step.

## 2026-06-22 — founded; W1 prompt prepared (paper-only session)

- **Founded** the initiative — pulls the **profile-type-catalog** carry-forward out of `athlete-core` (its deferred "library wave": re-home `profileSelections` + wire typed `gender` into resolution, named in `D-FIELDS-GENDER-INERT`) into its own 3-wave initiative. Set `initiatives/ACTIVE` → `profile-axis-catalog`.
- **Design dialogue** (this session): diagnosed that the real defect is axes have NO identity (string-join footgun + typed `gender` invisible to the resolver) — NOT a lack of coach freedom (free-form axis names already ship in `load-by-profile-fields.tsx`). Owner caught the ontology smell in the first "gender-as-bound-axis" sketch → ratified the two-category split (D-1), the catalog-with-find-or-create (D-2), and the discriminated-union axis (D-3, gated to W2).
- **Waves** ratified: W1 catalog+admin (no sacred-VO touch) · W2 coach binding (sacred-VO, decision-first) · W3 athlete two-layer profile. Owner GO on the slicing; ≤1 `/feature`/wave, owner-smoke per wave.
- **W1 feature-prompt PREPARED** (`w1-feature-prompt.md`) for a separate EXECUTOR session — this planning session is paper-only (owner: «волны будем запускать в отдельной сессии-исполнителе, здесь только бумажки»). The prompt is the self-contained W1 brief (scope + read-list + hard guardrails + acceptance + owner-smoke).
- **Research basis** (read this session): `contracts/lms/_shared/load.ts` (the `byProfile` VO — axes `{name,values}` + cartesian `cells`), `endpoints/lms/athlete-records/resolve-load.ts` + `load-records.ts` (resolver reads ONLY `{weightKg, profileSelections}` — gender disconnected, confirmed), `AthleteProfile` schema, the full write-back flow (`inline-profile-picker.tsx` → `pickProfile` → `profileSelections` mutation), `load-by-profile-fields.tsx` (free-text authoring), athlete-core decisions (`D-FIELDS-GENDER-INERT` / `D-PROF-SELECTIONS-HONEST`), `plan-editor-compose/D-PERSIST` (sacred VO).
