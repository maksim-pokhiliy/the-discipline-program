# W3.1 / PAC-17 — Inline-set the bound gender attribute from the session · `/feature small` prompt

**For an EXECUTOR session, AFTER W3-core ships.** Open → `/initiative-resume` (read **decisions D-10** — the ratified decision + the four-projection note; **D-7 §B.3 / §B.6**; **D-1**) → then run `/feature small` with the brief below. This is a fast-follow mini-feature on a DISTINCT surface (the athlete SESSION, not the profile screen) with ZERO shared code with W3-core's athletic card. **The decision-first gate is already DISCHARGED in D-10 — do NOT re-litigate it; build to it.** Owner-smoke after.

## What this is (one paragraph)

Today, when a byProfile load needs the athlete's gender and `AthleteProfile.gender = null`, the session only STEERS — `schema-row.tsx`'s `openPrompt` `case "profile_attribute"` is a **no-op** and a grey "Set your sex in your profile" `Typography` renders. PAC-17 makes it an inline PICK with the SAME UX as a plain-axis pick, but the pick writes the **typed `gender` column** (via the existing `useUpdateAthleteProfile` `mutate({ gender })`), **NOT** `profileSelections`. gender stays intrinsic (D-1); only the write entry-point is added. (Owner-requested.)

## Lens

- **Athlete-POV, first person** ("I set my sex right here without leaving the workout").
- **Athlete-facing UX → mocks first, owner-approve BEFORE wiring** (`ui-first-for-training-domain`) — though this reuses the plain-pick UX, so the mock is small.

## What it builds — and ONLY this

- **Flip the no-op to a pick.** `apps/platform/src/modules/athlete-session/components/schema-row.tsx`: the `case "profile_attribute"` in `openPrompt` opens a Popover with a gender picker, mirroring the `case "profile"` path (anchor + `editor.open…`). The grey steer is replaced by the actionable pick (or the pick sits where the steer was).
- **A gender picker** (a sibling of `inline-profile-picker.tsx`) that filters `binding === "GENDER"` from `row.load.axes`, renders that axis's `values` (`["Male","Female"]`) via the EXISTING `ProfileOptionButton`, and on pick calls a new `pickGender`. **The values + axisId come from `row.load`** (the bound axis carries them) — exactly as `InlineProfilePicker` reads `load.axes`. **NO `ResolvedLoad` / contract change** (D-10 corrected the older "the arm must carry values+axisId" note — the picker reads the LOAD).
- **A `binding → { column, vocab, mutation }` registry.** The session inline picker gains a SECOND write-path chosen by `binding`:
  - `binding = null` → `profileSelections[axisId]` (today's `pickProfile` — unchanged).
  - `binding = "GENDER"` → the typed column via `updateProfile.mutate({ gender })`, mapping the picked axis value → the enum with `{ "Male": MALE, "Female": FEMALE }` (the inverse of `GENDER_AXIS_COORDS` in `load.ts`). gender is just the FIRST bound attribute; the registry is the extension point for future ones.
- **`pickGender` in `use-session-logging.ts`** (next to `pickProfile`): map value→enum → `updateProfile.mutate({ gender }, { onSuccess: invalidate + close })`. Reuse the existing mutation — NO new backend.

## Read first (verbatim)

- **`decisions.md` D-10** (the decision + the four-projection note + the registry) · **D-7 §B.3** (the bound-arm invariant the note preserves) + **§B.6** (the two unresolved arms; mixed-load pick-first — unchanged) · **D-1** (gender typed, single SSOT).
- **The session surface:** `apps/platform/src/modules/athlete-session/components/schema-row.tsx` (the `openPrompt` `case "profile_attribute"` no-op + the steer render) · `components/inline-profile-picker.tsx` (the plain picker to MIRROR) · `components/profile-option-button.tsx` (the reused primitive) · `utils/athlete-session-presentation.ts` (the `LoadPrompt` + the `profile_attribute` construction) · `utils/use-session-logging.ts` (`pickProfile` → add `pickGender`) · `utils/athlete-session.constants.ts` (`SET_SEX_STEER_LABEL`).
- **The write (reuse):** `apps/platform/src/lib/hooks/use-athlete-profile.ts` (`useUpdateAthleteProfile`) · `packages/contracts/src/entities/coaching/athlete-profile/athlete-profile.schema.ts` (`gender: z.nativeEnum(Gender).optional()`).
- **The vocab source:** `packages/contracts/src/entities/lms/_shared/load.ts` (`GENDER_AXIS_COORDS = { MALE:"Male", FEMALE:"Female" }` — the registry's inverse map).
- **READ-ONLY (DO NOT TOUCH):** `packages/api-server/src/endpoints/lms/athlete-records/resolve-load.ts` (the `missing_profile_attribute` arm — the picker reads `row.load`, NOT this arm) · `load.ts` (the VO).

## Guardrails (HARD)

- **The inline gender pick MUST write the typed `gender` column, NEVER `profileSelections`.** This is the four-projection safety (D-10): if it wrote `profileSelections`, gender would resolve as a manual pick → the D-7 hole re-opens (a real EXECUTE collision). The `binding`-routed registry is the enforcement — keep it the single decision point.
- **DO NOT change the resolver, the VO, or the `ResolvedLoad` contract** (`resolve-load.ts`, `load.ts`, `session-detail.schema.ts`). The picker reads `row.load`. `git diff` must show ZERO change to these.
- **gender stays a TYPED column** (D-1) — reuse `mutate({ gender })`; no new backend, no schema/migration touch.
- **Reversible** — the whole feature = the `case "profile_attribute"` handler + the registry's GENDER entry; reverting them restores the steer.
- **House rules:** floating labels, `palette.*` not hex, no px sizing, one-component-per-file, MUI per-icon imports.
- **Tests:** add a session-interaction test (the gender pick writes `{ gender }`, not `profileSelections`; the plain pick still writes `profileSelections`). The `@repo/api-server` suite is GATED — not needed here (no resolver/backend change), but if you touch it, owner-gate it.

## Acceptance (properties)

- A byProfile load with a `binding=GENDER` axis + the athlete's `gender = null` → the session shows an inline PICK (Male / Female), not just the steer.
- Picking writes the typed `gender` column (`mutate({ gender })`) — **NOT** `profileSelections`; the load then resolves from the typed column (and the profile details card reflects the now-set gender — same SSOT).
- A MIXED unresolved load still surfaces the plain (`binding=null`) pick FIRST (D-7 §B.6 — unchanged).
- A plain-axis pick still routes through `profileSelections[axisId]` (the registry's `binding=null` path — unchanged).
- `git diff`: ZERO change to `resolve-load.ts` / `load.ts` / the `ResolvedLoad` contract.
- `check-types` + `lint` + platform unit tests green.

## Owner smoke (on dev)

An athlete with `gender = null` + a byProfile load carrying the system Gender axis → session → tap the load → an inline Male / Female pick (where the steer was) → pick Female → the load resolves; open Profile → the details card shows Gender = Female (same column). Confirm a plain `level` pick still writes `profileSelections` (unchanged). That closes PAC-17 → W3 (and the initiative) is done; run `/initiative-close`.
