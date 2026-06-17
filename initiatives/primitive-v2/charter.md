# primitive-v2 — charter

**Status: ACTIVE (founded 2026-06-17).** Born from the coach-station timed-test (the Phase-2-Exit attempt, which doubles as the Phase-1 e2e self-test): hand-building the evil corpus in the live editor surfaced real expressiveness gaps in the (nominally frozen) session primitive. Source of record: `session-primitive/e2e-findings.md` (basket B).

**Goal.** Close the expressiveness gaps the timed-test found so the coach can express the workouts he actually writes — finishing what Phase 1 ("author ANYTHING, zero model gap") started. The primitive's healthy core stays; the gaps are filled by extending or re-opening specific axes, each re-justified against the new evidence.

**Why now (the legitimacy).** Phase 1 froze the primitive against ONE personal corpus (`analysis/source/`) — explicitly the FLOOR, not the ceiling. The timed-test drove the model with harder, group-programming-heavy CrossFit (the evil corpus + the owner's live authoring), and 8 gaps surfaced. This is the e2e gate doing its job. Several gaps require RE-OPENING deliberate Phase-1 kills — legitimate precisely because those kills were made on corpus-floor evidence and the timed-test is new, harder evidence. This is completing Phase 1, NOT re-litigating it for its own sake.

**The gaps (basket B — `session-primitive/e2e-findings.md`), classified against the frozen spec:**

| #   | Gap                                    | Disposition vs the frozen spec                                                                                                                                                                      |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | rest + RPE at the ROW level            | **RE-OPEN.** `D-FLOORS` killed row-intensity (schema-only); `D-PLAQUE` set ONE-rest-per-schema. Both re-opened.                                                                                     |
| 16  | effort/intensity at the BLOCK level    | **RE-OPEN.** `D-FLOORS` moved intensity OFF the block to schema-only. Re-opened.                                                                                                                    |
| 12  | row duration (Row 2:00 @ Zone 2)       | **MOSTLY EXISTS.** `reps.unit (sec\|min\|km)` is already in the spec (P-6). The only gap is Zone 2 = row-intensity → folds into #3.                                                                 |
| 6   | sub-minute / non-integer intervals     | **EXTEND.** the `interval` kind (`workMin`/`offMin`) → a unit or seconds (Tabata :20 on / :10 off).                                                                                                 |
| 17  | nested profiles (RX/SC × ♂/♀)        | **EXTEND.** `load.byProfile {label→weight}[]` is flat; nest it (axis × axis) instead of the 4-row garble.                                                                                           |
| 4   | time cap on ANY schema                 | **SACRED-TOUCH.** `repetition` = 6 fixed kinds (charter-sacred); `timeCap` is one of them, so a ladder can't also be capped. Cap-as-cross-cutting reshapes placement. Most sensitive — owner-gated. |
| 11  | score / time-windowed effort on schema | **EXECUTOR-GATED.** `D-EXEC-DEFER`: scoring = notes until the Phase-4 executor. Likely NOT primitive-v2 — owner decides defer-vs-include at the design gate.                                        |
| 20  | rest BETWEEN schemas                   | **EXECUTOR-GATED (likely).** Inter-schema rest ≈ a transition/sequencing semantic (`D-EXEC-DEFER` "straight into"). Owner decides: a new rest carrier here, or wait for the executor.               |

**Acceptance criteria.**

- The evil corpus + the in-scope basket-B gaps are all expressible through the reshaped primitive — `e2e-findings.md` maps each.
- Every re-opened kill (`D-FLOORS` intensity, ONE-rest-per-schema) carries a NEW ratified decision in `decisions.md` that **supersedes** the session-primitive original WITH the timed-test rationale — not a silent re-addition.
- The channels rule (D-5) still holds for every new field: structure | typed (machine-read only) | human text | dropped. No inert stored surface for projections that don't exist yet (the D-EXEC-DEFER discipline).
- `session-primitive/primitive-spec.md` updated + re-frozen with the changes; the editor round-trips the reshaped contracts; the gated api-server suite is green on a reseeded DB.

**Scope.** Contracts + Prisma + seed + api-server guards + platform editor remap, for the in-scope basket-B axes (**#3, #4, #6, #12, #16, #17**). Batched by floor (row axes → block axis → schema axis → cross-cutting intervals/profiles).

**Non-goals (→ where they go).**

- **Basket C** (`#2` build-to-a-heavy-single → Phase 3 athlete 1RM; `#19` per-round movement rotation → folded into the design only if cheap). Recorded in `e2e-findings.md`, not built.
- **Executor-gated** (`#11` scoring, `#20` inter-schema transition) — default DEFER to the Phase-4 executor per `D-EXEC-DEFER`; owner ratifies in/out at the design gate. NO inert boolean introduced now.
- Athlete executor / scoring / timers — Phase 3+ (unchanged from session-primitive).
- Reuse/clone, coach profile, dashboards — coach-station (done/parked).
- `Performed*` / `OneRMRecord` — Phase 3.

**Sacred (do not touch).**

- The **channels rule (D-5)** — the legitimacy lens; every new field passes it (machine-read → typed; else human text; no inert surface).
- **Structure-not-graph** (D-2/D-4): groups = membership boxes; no typed relation kinds; no recursion; nothing derived from child count.
- **Catalog natures** (D-ROW-GRAMMAR): one row kind; REST/PLACEHOLDER are catalog natures, not row kinds.
- The **6 repetition kinds as a set** — **#4 does NOT add a 7th kind; it asks whether `timeCap` should ALSO be an optional cross-cutting cap on any schema.** The algebra's identity is preserved; only the cap's placement is in question. This is the one sacred-adjacent call — owner-gated.
- `analysis/source/` as the floor fixture; the Plan→Week→Day floors + the plan-as-train enrollment model.

**Process (session-primitive D-7).** The planner session designs first (reads the spec + decisions + findings, maps each gap, **escalates the sacred-touching calls #4 and the D-FLOORS re-opens #3/#16 to the owner BEFORE locking**) → each code step ships via `/feature` (full/small, ≤1 full per session) → orchestrator reviews via git diff, never agent self-report → owner browser-walkthrough + gated suite. UI-first where it has UI.

**Driving docs.** `session-primitive/primitive-spec.md` (the FROZEN baseline being extended — read FIRST) · `session-primitive/e2e-findings.md` (basket B, the gap source) · `session-primitive/decisions.md` (the kills being re-opened + their original rationale — D-FLOORS, D-PLAQUE, D-EXEC-DEFER, D-LOAD-FINAL, D-TEMPO) · `docs/roadmap.md` Phase 1 (this completes it).
