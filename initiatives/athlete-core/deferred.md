# athlete-core — deferred (carry-forwards)

- **byProfile + %-of-1RM resolver — RESOLVED (no longer deferred).** `primitive-v2` is closed (#282); the byProfile nested shape (axes/cells) + the percentage reference (self / other_exercise) are FINAL. `D-LOAD-FINAL` routed the resolver to Phase 3 — it is now IN athlete-core scope (block 1 / step 0), never a cross-thread wait.
- **Benchmark/template fusion FORM** — bare `isBenchmark` flag vs a benchmark carrying its own facet (it also needs a result-type + profile links a plain template lacks). Owner-deferred ("добьём позже"). Blocks the benchmark/template **catalog** wave, NOT athlete result-logging.
- **Coach-side benchmark/template boundary** — an enabling wave here vs back to coach-station. Charter recommends the minimal enabler (chip + result-type) here.
- **Complex coach scoring-directive (#11)** — "score = rounds+reps, last 3 min @90%" stays with `primitive-v2`; not this initiative.
- **Subscription / billing automation** — Phase 5 (the rigid layer of D-LAYERS).
- **In-workout timers / scoring engine** — post-MVP.
- **Championship-video** — a media attachment on a performance; rare; deferred.
- **D-PUBLISH snapshot-vs-history seam — RESOLVED (block 1, D-RESULT-RELATION):** a recorded `PerformedSchemaResult` pins its `plannedSchema` (`onDelete: Restrict`) — a scored car can't be deleted out from under athlete history. The full publish GATE itself is its own wave (below).
- **Publish / version-gate (D-PUBLISH / D-PUBLISH-MODEL) — its own wave (D-SCOPE-PUBLISH):** OUT of block 1; needs a `TrainingPlan` publish field + the athlete reads-only-published filter + the coach Publish action. Visibility gate #2 (gate #1 = the shipped date-thread `hidePastBeforeBoarding`).
- **Input-sanity bounds (block-1 QA WARNINGs, low severity) — one mini contracts pass:** future-date reject on `recordedAt`/`performedAt` (QA-014; the harmful symptom — negative `daysSinceLastActivity` — is already clamped in `coach-athletes/list.ts`); `valueKg` upper `.max` (QA-016, mirror `weightKg`); `profileSelections` cardinality cap (QA-015 — coordinate with the FROZEN `load.ts` axis-string policy, currently unbounded, so a divergent cap would reject valid axis names).
- **Per-exercise actuals (`PerformedExerciseInstance`) — post-MVP (D-LOGGING-MINIMAL):** the rich per-row actual load/reps path was dropped; revisit only if the 30-second-log floor proves insufficient.
- **Profile-type catalog — library wave:** re-homes `profileSelections` free-string axis keys to stable catalog profile-type ids (kin to the benchmark/template catalog); until then byProfile picks key on free strings (D-PROFILE-SELECTIONS).
- **Leaderboard (best-of ranked across athletes) — later wave:** derived from the same records (per-1RM + per-benchmark); surfaced scope, not MVP-blocking.
