# W1 corpus — athlete pack (PU-01..04): how this executes through an executor

The owner-read stage of the build loop (step 2). Read this, discuss what needs discussing, THEN carry `prompt-w1-athlete-pack.md` to the executor. If discussion changes anything here, the prompt gets re-cut first.

## What ships

One `/fix` batch, one branch, four findings: the 1RM movement-catalog dead end (PU-01), the RX/SC spread clipping (PU-02), the invisible active level in the workout (PU-03), the write-once in-session 1RM (PU-04). All athlete-facing daily friction from the same screens; the three session items literally converge on two files (`schema-row.tsx`, `row-group.tsx`), which is why they travel together rather than as four PRs.

## Confidence map (the Fix-A lesson applied honestly)

Fix-A taught us that layered static inference can assemble a defect that runtime refutes. Grading the four findings by how they were verified:

- **PU-03 — HIGH.** I personally read the runtime path this session (`pickProfile` → `setActiveEditor(null)`; resolved arm `{kg, perHand}` only; `RowGroup` receives no `editor`). The owner independently confirmed the behavior from the athlete's report. No hidden-layer risk: this is client-side render logic with no interception layer equivalent to `$extends`.
- **PU-02 — HIGH.** Style-level facts (`whiteSpace: nowrap`, `flexShrink: 0`, card `overflow: hidden`) read directly; the screenshot exhibits exactly this clipping. Trivially re-provable by the executor in one render test.
- **PU-01 — MEDIUM-HIGH.** The scoping chain (`records-content.tsx` fed from `data.oneRM`; catalog endpoint coach-gated; regression commit `bb6ed890`) is static but short and was cross-checked against the owner's design-intent question (D-6). Residual risk: some other movement source I haven't seen. The executor's investigation MUST re-prove the empty-picker repro end-to-end (fresh athlete fixture → picker options empty) before building.
- **PU-04 — MEDIUM.** The create-only POST and the vanishing prompt are agent-traced, only spot-checked by me. The idempotency-wedge claim (`use-submit-token` resets only on success → 409 после невидимого 2xx) is pure inference — **the executor must reproduce or refute it with a test before touching the token lifecycle**, Fix-A-style. If refuted, that sub-fix drops; the append-correction path stands regardless.

## Approach per item (how, not just what)

- **PU-01:** new athlete-authorized read (`listForAthlete`, CONCRETE-only) + route mirroring `athlete/records` + additive contract schema + hook with `staleTime: Infinity` + union with own-record movements in the picker. The coach-only endpoint and its 403 test stay byte-identical — that guard is load-bearing for the exercises console.
- **PU-02:** minimal unblock — let the spread wrap (`overflowWrap: "anywhere"`, kill the `nowrap`/`flexShrink` pins). Explicitly NOT the grouped-chips redesign; that is session-screen-v2 (PU-12) territory.
- **PU-03:** one mechanism, three surfaces. Additive `coords` on the resolved arm (server populates from the already-computed cell match in `resolve-load.ts`) → the line renders "24 kg · RX"; resolved rows with a pickable axis keep a re-opening prompt; `RowGroup` gets the `editor` wiring so grouped rows behave like standalone ones. Copy stays short — the label is feedback, not documentation.
- **PU-04:** thread exercise identity to resolved percentage rows (additive, mirroring the unresolved arm), "Edit 1RM" prompt re-opens the existing inline editor, submit APPENDS (D-5 — latest-wins is already the resolution law; no PATCH/DELETE, no history editing). Token `onSettled` reset only if the wedge reproduces.

## Contract-change blast radius (why additive is safe here — and what the executor re-checks)

Three additive deltas: the movements response (new schema), `coords` on the resolved-load arm, exercise identity on resolved rows. Zod object schemas strip unknown keys on parse, so old clients reading new payloads are safe; new fields are optional-or-populated server-side in the same deploy. The mobile-publish projection does NOT consume `session-detail` views (it walks Prisma models through its own formatters), so published bytes cannot move — but the executor verifies this with the projection suite anyway, because that invariant (D-17) is the one we never take on faith. Sacred VOs (`load.ts`, `reps.ts`) are untouched by construction — additions live in `session-detail.schema.ts` and the exercise API schema.

## Risks the plan-approval gate should show mitigations for

1. **The resolved-coords label may collide with narrow-screen space PU-02 just freed** — spread wrapping and the new label land on the same line; the executor should show them together in one render test at 320px.
2. **`RowGroup` editor wiring grows the interactive surface of grouped rows** — the popover anchoring inside a group card needs a presentation-level test, not just "prompt exists".
3. **Token-lifecycle change (if taken) can weaken double-submit protection** — reset-on-settled must not mint a fresh key mid-flight; this is exactly the kind of subtle change the investigation stage exists for.
4. **Gender-bound-only loads** (no pickable axis) must not render a dead re-open prompt — `InlineProfilePicker` already returns null for them; the prompt gating must match.

## What I deliberately did NOT put in scope

No RX-attribution on logged results (product feature, separate decision). No benchmark/records-page edit affordances beyond the catalog fix. No `formatTwoAxisSpread` redesign. No MP-14 (`cap`→`AMRAP` label) ride-along — adjacent surface, but scope discipline beats convenience; it stays in mobile-publish's deferred.

## Executor mechanics

Standard `/fix` pipeline (investigation → findings → plan → gate → fix agents → review → verify → PR), one branch (`uat-athlete-pack` suggested slug), the prompt is already in skill-input form. Expected pause at the plan-approval gate for the external tech-lead review. Platform tests via the root runner (`--project` filter); api-server touched files in isolation; the full serial suite at the executor's discretion.
