# /feature prompt — session-primitive typed-axis reshapes (deferred from the Phase-1 e2e)

**Run the block below as the `/feature` input in a fresh session.** These are the model-level reshapes the live UI-polish stream (PR #271) could NOT do inline — they cross the **contract + Prisma + api-server + seed** surface, so they need the full **W4-model ritual** (reseed + gated api-server suite), not a platform-only fix.

> Process reminder for whoever runs it: read the SSOT before specing each axis (anti-instinct-specing) — `e2e-evil-corpus.md` (the shapes), `primitive-spec.md` (the frozen grid rows being re-opened), `decisions.md` (D-FLOORS / D-PLAQUE / D-EXEC-DEFER / D-LOAD-FINAL / D-TEMPO-SMART), and the contract files. Quote verbatim; don't invent.

---

## `/feature` prompt

Reshape the session-primitive typed axes to close the three model gaps the Phase-1 e2e self-test surfaced (`initiatives/session-primitive/e2e-evil-corpus.md` — the live-e2e findings block + the ❌ rows). These are model holes, not UI papercuts: a real CrossFit prescription has no typed home today, so the coach is forced to drop it to a note. Each re-opens a specific frozen-spec grid row.

This is **W4-model class, NOT platform-only**: it touches `@repo/contracts` + Prisma (`@repo/api-server`) + api-server mappers + the seed. Honor the bridge-free reshape law (mappers `.parse()` the new contracts; stale rows 500 the week GET until reseed — by design) and the acceptance ritual: **`pnpm db:reset && pnpm db:seed && pnpm --filter @repo/api-server test`** (dev Neon, no `-pooler`; ~10 min serial, owner-manual — NOT pre-push). The seed is users-only now (D-SEED-TEARDOWN), so add fresh fixtures that exercise each new shape.

### 1 — Time cap orthogonal to the repetition kind (GAP-1 · e2e S1-C / probe P-1)

- **Coach case:** Fran "21-15-9 FOR TIME, 12 min cap" — a fixed LADDER that ALSO carries a time ceiling. Today a schema is `ladder` XOR `timeCap` (a discriminated union — `repetitionAxisSchema` in `composition.schema.ts`), so the cap can only land as a note (D-EXEC-DEFER). The owner rejects cap-as-note here: a time cap must be available on **every** repetition kind.
- **Reshape:** make `cap` (a `TimeCap`, `_shared` `time-cap.ts`) a SEPARATE optional field on the `Composition` (`{ repetition?, rest?, cap? }`), orthogonal to `repetition.kind`. Evaluate retiring the standalone `timeCap` repetition variant (cap subsumes it) against the spec — don't assume; check `primitive-spec.md` Grid A + §7/§8.
- **Surface:** `composition.schema.ts` · composition Prisma storage · api-server mappers · the schema modal (the existing `TimeCapFields` available on any kind, not only the `timeCap` mode) · seed.

### 2 — Sub-minute intervals / Tabata (GAP-2 · e2e S1-D)

- **Coach case:** Tabata "8 × :20 on / :10 off" — and most MetCon intervals are SECONDS. Today `interval.workMin`/`offMin` are `z.number().int()` minutes (editor min 1), so the coach "can't write numbers less than 1."
- **Reshape:** the interval work/off become a duration with a UNIT (sec/min) or seconds. Decide whether `cadence.everyMin` needs the same treatment (check the corpus EMOM shapes).
- **Surface:** `composition.schema.ts` interval (and cadence?) · Prisma · mappers · the interval/cadence axis editors (a unit toggle) · seed.

### 3 — Row-level intensity + rest (scope-pile item B · reverses D-FLOORS + D-PLAQUE)

- **Coach case:** RPE and rest are ROW qualities — "5×5 @ 75%, RPE 8" (RPE on the working row), or rest after a SPECIFIC movement. Splitting movements into separate schemas just to attach rest/RPE is wrong; the owner ratified this reversal.
- **Reshape:** add `intensity` + `rest` to `schema-row` (alongside the schema-level fields). **Promote the D-FLOORS ("intensity schema-only") + D-PLAQUE ("rest schema-only") re-open into `decisions.md` as ratified.**
- **Surface:** `schema-row.schema.ts` contract + Prisma `SchemaRow` + api-server mappers + the row editor (reuse `IntensityFields` / `RestSpecFields`) · seed.

### Sequencing

GAP-1 + GAP-2 are one contract surface (composition/repetition axis, one reseed) — land them together. Row-level intensity+rest (B) is the schema-row surface — ride the same reseed or fast-follow. If all three are too big for one pipeline, do the composition-axis pair (1 + 2) first and B second.

### Out of scope (Phase-3, NOT this /feature)

**1RM** — belongs to the athlete profile; %-loads reference it (the `Performed*`/`OneRMRecord` redesign against the real logging UX). Separate phase, separate surface.

---

_Source: PR #271 (the polish pass that deferred these) · `e2e-evil-corpus.md` GAP-1/GAP-2 + the live-findings block · the handoff scope pile (item B) · `decisions.md` D-FLOORS/D-PLAQUE/D-EXEC-DEFER._
