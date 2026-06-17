# athlete-core — discovery notes

Live capture of the Phase-3 (athlete core) domain dialogue. NOT a locked charter — scope is still being mined with the owner (athlete + coach, first-person authority). Ratified calls live in `decisions.md` (the SSOT); this file holds the working capture + still-open tails.

## Ratified (see decisions.md for the full "why")

- **D-LAYERS** — plan-as-train splits into a FREE navigation/performance/statistics layer (athlete-core) and a RIGID subscription/access layer (Phase-5 billing). Free-walk and "the train doesn't wait" are different layers.
- **D-STATS** — "statistics" = compliance tick (first, sticky) + records (best-of) + history (every). Everyday session: done once, repeats are history-only. Benchmark: every performance counts, best → profile. The benchmark chip switches the law.
- **D-RESULT-TYPES** — a benchmark carries one of six canonical CrossFit result types (time / rounds+reps / load / max-reps / distance / calories); direction is intrinsic; the type is its own axis (default from format, coach overrides); "not for score" = ordinary session, chip off.
- **D-PUBLISH** — plan-level publish, draft/published snapshot ("old vs new", not a VCS). Visibility gate #2.
- **D-DATE-THREAD** — optional hide-the-PAST at enroll (protects the coach's multi-year asset); future not gated until Denys asks. Visibility gate #1.

## Surfaced scope (carries into the charter)

- **GAP-BENCHMARKS (needed soon).** A benchmark = a schema + a "benchmark" chip, visually/technically a normal schema. "Save as benchmark" (→ library) vs "use as benchmark" (assign in a plan as graded). Admin CRUD. Athlete MAY log a benchmark result → coach sees a "benchmark updated" event, athlete sees the update. Benchmarks surface in the athlete profile (performed list linked to the catalog + results + history/trend).
- **GAP-TEMPLATES (direction confirmed; final form deferred — "добьём позже").** ONE catalog for benchmarks-that-are-also-templates. A template is just a schema + extra trim, used as a schema in programming: the coach picks a template and it drops into a block / schema-group. **Instancing invariant (owner-stated):** inserting a template VALUE-COPIES its primitives INTO the plan; the coach then tweaks the inserted copy in the constructor, NOT the template entity — the source stays immutable, edits never propagate back. **Open tail:** the storage form — a bare `isBenchmark` flag vs a benchmark carrying its own facet (it also needs a result-type + profile links a plain template lacks).
- **EDGE-CHAMPIONSHIP-VIDEO.** Rare repeat reason = filmed championship-selection attempt. Likely a media attachment on a performance, not a statistics mechanic. Defer.
- **GAP-INLINE-1RM (surfaced 2026-06-17, ratified in D-LOAD-RESOLVE).** HWPO-style: a percentage prescription resolves to kg if the athlete has a 1RM, else shows the % + an inline "set your 1RM" affordance that creates the 1RM on the spot and re-resolves. A create-1RM surface reachable from plan-view/logging.
- **GAP-LEADERBOARD (surfaced 2026-06-17).** Ranked best-of per 1RM / per benchmark, derived from the records — for the coach AND athletes (competitive). Follows naturally from records; a later wave, not MVP-blocking.
- **GAP-PROFILE-CATALOG (surfaced 2026-06-17; planner rec).** byProfile axes are currently coach-free strings (ad-hoc; "RX" vs "Rx" don't match → resolve leaks). Owner intuition: profile types should be a union OR a catalog. **Planner rec: a CATALOG** (CRUD in admin + create-on-the-fly in the editor — the project's existing library pattern, like exercises/labels/modifiers), NOT a hardcoded union (a union breaks the moment a coach wants an axis outside the list and fights the just-shipped free axes). It re-touches the primitive byProfile shape (free strings → catalog refs) and is KIN to the benchmark/template library → fold all three into ONE library wave (one admin + editor pass, anti-fragmentation). NOT block 1; block 1's resolver rides the current shape and the swap-in is cheap (only where the cell coords come from). Fixes pick-once too (the pick binds to a stable catalog profile-type, reused across schemas).

## Open tail

- Template/benchmark fusion FORM (above) — deferred by owner, revisit during the benchmarks wave.
- Next step: charter the initiative now that the domain floor (D-LAYERS / D-STATS / D-RESULT-TYPES / D-PUBLISH / D-DATE-THREAD) is ratified — goal, scope, the three-block decomposition (data core → athlete UX → coach honest-metrics), benchmarks/templates placed, the byProfile-nesting tail flagged as pending primitive-v2.
