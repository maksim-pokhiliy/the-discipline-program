# Planner discipline — read/verify-then-spec checklists

Nine procedural checklists for planning a cross-package change before writing the spec/prompt. Accreted across the training-domain workflow (steps 1–9.2) as "we shipped, then learned"; **generalized here as durable repo discipline** (migrated 2026-06-03 out of the now-removed two-session workflow spec). Each maps to a memory slug — those carry the essence cross-session; this is the fuller reference.

These are not optional and not a substitute for the collaboration stance (`[[global-preferences]]` / co-ownership). They are the "don't instinct-spec" guardrails: **read the source of truth and quote it before you spec against it.**

## The nine

1. **(a) Canonical codebase patterns** — `[[scope-via-existing-patterns]]`. Before specing a cross-package boundary (mapper output, contract schema, API response, client API type, form field, list/filter/search), read 2–3 canonical implementations verbatim and quote them with file:line. No "TS best practice" instincts — existing project patterns are sacred.

2. **(b) Domain semantics** — `[[coach-pov-first]]`. Before specing a domain field or operation, cite the source of truth verbatim (the live schema/contracts, the active initiative's spec, an ADR). No citation → the field is engineer-cargo or genuinely deferred → escalate with a hypothesis, don't invent.

3. **(c) Registration-file completeness** — `[[planner-verbatim-registration]]`. For barrels, `package.json` exports, app routers, sidebar config, dep-cruiser arrays, `pnpm-workspace.yaml`, `turbo.json` — `Read` verbatim at prompt-write time. Quote the current state in full; state additive intent explicitly; show the final state in full.

4. **(d) Engineering correctness under adversarial input** — `[[planner-adversarial-review]]`. Before locking a section with write ops, run a mental sweep: concurrent / TOCTOU / partial inputs (subset / superset / empty / duplicates) / malformed / boundary. ~30 seconds per axis.

5. **(e) Commit-strategy correctness under live hook config** — `[[husky-cross-package-squash]]`. Before locking the commit strategy, read `.husky/{pre-commit,pre-push}` + `turbo.json`. A cross-package change with intermediate broken trees → squash into one commit with a per-layer body. Never bypass hooks. Deprecation-shims are an anti-pattern (they import in directions dep-cruiser forbids).

6. **(f) Consumer-pattern completeness for contract response-shape changes** — `[[planner-consumer-pattern-read]]`. When extending a contract response shape, read every HTTP route handler + client API endpoint + client hook/adapter + downstream mapper that consumes it, verbatim — handlers may manually wrap/transform/validate and cascade into double-wrap or parse-fail. Mapper-side: grep every call site of each mapper touched (a single mapper feeds 2–3 endpoints — the Day/Week chain).

7. **(g) Read-surface trace for UI step planning** — `[[planner-read-surface-trace]]`. Before locking a UI step, trace the read path **backwards** from the displayed entities: which hook → query key → API method → HTTP route? Does the response embed the entity, or is there a dedicated GET? Gap → STOP, queue a read-enabler sub-step before the UI. (Distinct from (f): (f) catches shape-change misses; (g) catches ship-write-without-read.)

8. **(h) Mutation-invariant trace for schema-constraint additions** — `[[planner-mutation-invariant-trace]]`. Before adding `@@unique([parent, ordered_column])`, run intra-transaction state analysis on every mutation touching the column — sequential UPDATEs in one tx can hit an intermediate-state P2002 even when the final state is valid (Postgres unique fires immediately, not `DEFERRABLE`). Distinct-in-final ≠ distinct-in-intermediate. Fix: the canonical 2-pass UPDATE (stage to safe offsets, then final positions).

9. **(i) Lint/type-impact trace for component & schema specs** — `[[planner-lint-impact-trace]]`. Before locking a component refactor (esp. in `@repo/ui`), mentally simulate which ESLint rules / TS strict flags / dep-cruiser policies fire. Gotcha: JSX-returning module-scope functions trip `react/no-multi-comp` + `react/display-name` (`--max-warnings 0`) — keep JSX helpers inline in the parent closure, or extract to their own file as a named component (`[[one-component-per-file]]`). **Zod sub-axis:** a schema's runtime validation and its `z.infer` type are distinct surfaces — `superRefine`/`refine` preserve the base object type (a cross-field invariant stays invisible to the type system, forcing a dead `throw`/`!`), while `z.union`/`z.discriminatedUnion` yield a narrowable type. `superRefine` for conditional-field invariants; `z.union` for mutually-exclusive ones.

## Adjacent bindings

- **Prompt-internal consistency** — every field handled exactly once; no contradictory instructions across scope-list / phases / decisions.
- **Memory hygiene** — when deleting a memory entry, grep survivors for cross-references; after a namespace refactor, sweep the memory dir for stale paths.
- **Escalation protocol** — surface-with-hypothesis-and-wait; never silently comply with a wrong prompt. The planner answers fast and owns prompt errors.
- **Postgres SSI write semantics** — `[[postgres-ssi-upsert-unique-key]]`: concurrent `$transaction(..., Serializable)` upserts on the same unique key fail P2034 even with disjoint UPDATE columns (SSI is row-grained). Production: retry-on-P2034 at the HTTP layer.

> History: the verbatim per-step anti-precedents that produced these are preserved in git history (the superseded two-session log). The lesson, not the training-domain incident, is what carries forward.
