# analysis/ — training-domain reference (read this before relying on anything here)

The analysis behind the training-domain model: the coach's real plan corpus + a 7-phase derivation, produced from `source/plan.xlsx`.

**Status after the compose pivot (ADR-0037, 2026-06-02):**

- **`source/` — SACRED, current, untouched.** The coach's real plans (33 sheets + `plan.xlsx` + `convert.py`). This is the **acceptance fixture** for the compose model — "any structure here must compose by free nesting." Read-only forever; the seed draws from it.
- **`artifacts/` — mixed; two layers live in most files:**
  - **Backbone / value-object analysis is CURRENT.** The Week/Day/Session/Block tree, the `SchemaRow` leaf, the Json-VOs (`03-content/*`: load/reps/tempo/compound/modifier). The compose model keeps all of it — this is the live reference when designing the axes.
  - **The 34-archetype taxonomy is SUPERSEDED _as target design_** (`02-patterns/schema-archetypes.md` + mapping, `05-synthesis/`, `06-formalization/`). Kept as **evidence** (which structural shapes the primitives must express) and **history** — not deleted. Do not treat the archetype catalog here as the model to build. The `compose-hardening` initiative close-out finalized this quarantine: the live read-path is archetype-clean (charter acceptance met).
- **`06-formalization/` is FROZEN history.** The old "living mirror" protocol (mirror every live schema change here) is **dropped** — the live Prisma schema + `@repo/contracts` are the single source of truth now.

Per-file audit 2026-06-02: zero garbage, nothing to delete. Active work: `initiatives/compose-hardening/`.
