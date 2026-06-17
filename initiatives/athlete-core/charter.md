# athlete-core — charter

**Status: founded 2026-06-17; `initiatives/ACTIVE` since 2026-06-17** — `primitive-v2` is CLOSED (PR #282 merged + close-out done). Roadmap **Phase 3** (athlete core + honest coach metrics).

**Goal.** An athlete opens the app, sees the plan as a timetable (plan-as-train), logs a session in seconds, and sees benchmarks + records; the coach sees honest derived metrics. The `Performed*` / `OneRMRecord` stubs are redesigned FROM SCRATCH against the (now final) primitive.

**Why now / legitimacy.** coach-station (Phase 2) is substantively complete; `primitive-v2` is closed and the primitive is fully frozen again. Phase 3 builds on the stable, complete primitive — skeleton + 6 repetition kinds + the reshape leaves (intensity trinity, row rest, cross-cutting cap, interval units, nested byProfile). The athlete domain was mined this session into 5 ratified decisions.

**The ratified floor (`decisions.md` is the SSOT for "why").**

- **D-LAYERS** — plan-as-train = a FREE navigation/performance/statistics layer (here) + a RIGID subscription/billing layer (Phase 5). Free-walk and "the train doesn't wait" are different layers.
- **D-STATS** — "statistics" = compliance tick (first, sticky) + records (best-of) + history (every). Everyday session done once; benchmark repeats count, best → profile. The benchmark chip switches the law.
- **D-RESULT-TYPES** — a benchmark carries one of six canonical CrossFit result types (time / rounds+reps / load / max-reps / distance / calories); direction is intrinsic; type is its own axis (default from format, coach overrides); "not for score" = ordinary session.
- **D-PUBLISH** — plan-level publish, draft/published snapshot (not a VCS). Visibility gate #2.
- **D-DATE-THREAD** — optional hide-the-PAST at enroll (protects the coach's multi-year asset); future not gated until Denys asks. Visibility gate #1.

**Scope (athlete-side core).** `Performed*` redesign · `OneRMRecord` history · the six result-types · records/PR derivation · **the load resolver** (byProfile cell-pick by athlete profile + percentage-of-1RM, with athlete context) · athlete plan-view (plan-as-train, date-thread visibility, publish-gated) · logging-in-30s · athlete profile (incl. benchmarks) · coach honest-metrics (derived fields + reconcile cron). **Enabling coach-side (minimal):** the benchmark chip + result-type on a schema, the publish mechanism.

**Scope expansion vs roadmap (flagged, not silent).** The roadmap said "benchmark catalog (seed ≥25) + results". The mining showed benchmarks are a SUBSYSTEM (any schema → benchmark via chip; save-as / use-as; catalog; admin CRUD; athlete logging; profile linkage), plus templates (block/schema reusables) and a plan publish mechanism. Per `scope-not-deciding-criterion` the owner takes the bigger-but-correct scope; recorded here so it isn't a silent grow.

**Non-goals (→ where they go).**

- Benchmark/template fusion FORM (flag vs facet) → **deferred** ("добьём позже"); blocks the catalog wave, not athlete logging.
- Complex coach scoring-directive (#11 "score = rounds+reps, last 3 min @90%") → stayed in `primitive-v2` as notes (`D-V2-EXEC-DEFER-HOLD`); the executor layer is post-MVP.
- Subscription/billing automation → **Phase 5**.
- In-workout timers / scoring engine → **post-MVP**.
- Championship-video → a media attachment on a performance; deferred.

**Boundary flag — the coach-side of benchmarks/templates.** They have a coach-side half (catalog, creation, chip — coach-station territory) and an athlete-side half (result logging, profile — here). Open: is the coach-side half an enabling wave here, or does it return to coach-station? **Recommendation:** pull the MINIMAL enabler (chip + result-type on a schema) here, since the athlete profile needs it; the full catalog/template library is its own wave gated on the fusion form.

**Dependencies — now all satisfied.** `primitive-v2` is CLOSED (#282) — the byProfile nested shape (axes/cells), intensity trinity, cross-cutting cap, and interval units are FINAL (see `primitive-v2/reshape-design.md`). The byProfile + %-of-1RM **resolver is OUR work** — `D-LOAD-FINAL` routed it to Phase 3. We build on the now-stable, complete primitive — no open cross-thread waits.

**Process.** mini design-cycle (this) → contract-shape spec → **ui-first** (UI on mocks under approved UX; backend after) → each code step via `/feature`, **waves kept coarse** (owner directive: move the roadmap, no atomic over-splitting, not at quality's expense). The UI/design-tool wave is owner-run (out of planner scope). Driving docs: `discovery.md`, `decisions.md`, `primitive-v2/reshape-design.md` (the final primitive), `docs/roadmap.md` Phase 3.
