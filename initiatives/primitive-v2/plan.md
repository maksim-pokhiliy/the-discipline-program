# primitive-v2 — plan

**Design-first, then ONE wave.** Step 0 (the planner session) locked scope + the sacred-touching calls WITH the owner (`reshape-design.md`, `decisions.md` D-V2-\*). The owner then directed the whole reshape as a SINGLE `/feature` (full) — no floor-split (D-V2-ONE-WAVE; mirrors `session-primitive` DR-W4-5 ONE-WAVE).

| #   | Step                                | Gap(s)               | Gate / note                                                                                                   |
| --- | ----------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| 0   | **Design lock** (planner session)   | all                  | ✅ DONE — owner "ОК х5"; `reshape-design.md` + 7 ratified D-V2-\* decisions.                                  |
| 1   | **Reshape** — ONE `/feature` (full) | #3,#4,#6,#12,#16,#17 | `reshape-feature-prompt.md`. All 5 changes + `primitive-spec.md` re-freeze in one wave + close-out IN the PR. |
| —   | **Executor-gated** (#11, #20)       | —                    | DEFERRED to the Phase-4 executor (D-V2-EXEC-DEFER-HOLD). NO inert field.                                      |

**The five changes (one wave):** (1) intensity on row + block, one axis, render-time overlay; (2) rest on row (additive to schema rest); (3) cross-cutting `composition.cap`; (4) sub-minute interval (work/off unit); (5) nested byProfile (1–2 axes + cells). Exact shapes + the full layer touch-map in `reshape-design.md` §2.

**Why one wave (not the original floor-split).** The row→block→schema→cross split was a sequencing default, not a constraint. Three of five changes ride inside existing Json (cap/interval in `composition`, byProfile in `load`) — only 3 new Prisma columns total (`SchemaRow.intensity`, `SchemaRow.rest`, `Block.intensity`). The three editors already exist (`IntensityFields`/`RestSpecFields`/`TimeCapFields`). It's a coherent leaf reshape on ONE `db:reset` migration; splitting buys no safety (house aggressive-migration tolerates staged-green) and burns the per-session `/feature` budget needlessly. See D-V2-ONE-WAVE.

**All step-0 open design details are now resolved** (intensity overlay = render-time dimension-wise row>schema>block; row-rest = additive by scope; cap = orthogonal axis, 6 kinds preserved; interval = `{value,unit}`; byProfile = 1–2 axes + cells; #11/#20 = deferred). Detail + rationale in `decisions.md`.
