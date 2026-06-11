# session-primitive — charter

**Status: ACTIVE (founded 2026-06-10).** Born from the 2026-06-10 domain-model review (owner-prompted: "жесткое ревью самой концепции/дизайна").

**Goal.** Redesign the session-primitive domain model — the unit that fills cycles: **Session → Block → Schema → Row** — so the coach can express ANYTHING he writes through a constructor whose write and read-back are both obvious. Owner's bar, verbatim: "просто чтобы он принёс в уме тренировку и переложил её на наш конструктор с ясным пониманием что, как и зачем он делает. чтение уже составленной тренировочной сессии — аналогично. смотрит — и однозначно понятно что это."

**Why.** The corpus-first genesis (analysis Phases 1–7) photographed ONE personal plan's Excel notation into the type system: parsing residue frozen as types (Position enum with `FROM_SOFA_BOX`/`FROM_BOX_OR_SOFA`, 8-variant Weight with corpus-cardinality-1 members, 9 row kinds incl. `STANDALONE_URL` with a `wrapped` flag for square brackets), relations smeared across three mechanisms on three floors (derived structural parallel · stored superset rowId-pairs · fat in-row VOs `or_alternative`/`cyclical`/`sandwich`). The compose drains (ADR-0037..0040) cured the container level and stopped — the leaf and the relations were never interrogated. Owner: "модель переписана раз 5. хватит, нужно вывести её на чистую дорогу."

**The ratified skeleton (D-1..D-5).**

```
Session
└─ Block                      секция тренировки: разминка / силовая / меткон
   └─ [Group?]                коробка схем: рамка + opaque coach-owned лейбл
      └─ Schema               примитив: typed repetition (6 kinds) + rest
         └─ [row-grouping?]   коробка/плашка на строках (carrier → F-PLAQUE)
            └─ Row            упражнение / отдых / слот / …
```

- Fixed floors, NO recursion — `parentSchemaId` dies.
- Relations = explicit boxes: membership is the only link; the label is text the system carries but never reads; no sibling→sibling refs; no graph; no semantics derived from child count; no typed relation kinds.
- Channels rule: every notation → structure | typed field (machine-read only) | human text | dropped syntax.

**Acceptance criteria.**

- Every notation in `analysis/source/` is expressible through the new primitive — the grid in `primitive-spec.md` maps each one — with the corpus as FLOOR, not ceiling (it is one PERSONAL plan: group-programming notations — m/f loads, RX/SC — are systematically underrepresented in it).
- No recursion in the stored model; no enum/VO whose only evidence is parsing residue; groups authorable via an explicit gesture (batch flows create visible, one-click-dissolvable boxes — opt-in checkbox in the add-schema modal).
- Editor round-trips the reshaped contracts; gated api-server suite green on a reseeded DB.

**Scope.** Contracts + Prisma + seed + api-server guards + platform editor remap, for the session primitive. Leaf slim-down per the grid.

**Non-goals (→ where they go).**

- Periodization above Week (micro/meso/macro) — future enrichment layered above. Owner: "мы сейчас дизайним модель примитива внутри программирования. примитив это тренировочная сессия и ниже, который наполняет циклы."
- Athlete executor / scoring / timers — Phase 4+; relations harden into typed semantics ONLY against a real engine (ADR-0038 principle).
- Reuse features (clone week/day/block, saved compositions) — app-level features over this model, separate later work (owner: "фича в коде, которая добавляется за пару часов" — not a model concern).
- `Performed*` / `OneRMRecord` redesign — flagged known-wrong (per-row actuals, latest-only unique, no 1RM history); redesigned against the real logging UX in Phase 4, not here.

**Sacred.**

- `analysis/source/` as the acceptance fixture (floor, not ceiling).
- The Plan→Week→Day floors above the primitive + the plan-as-train enrollment model.
- The `repetition` axis (6 kinds: once · count · ladder · timeCap · cadence · interval) + `rest` — the healthy algebra core.
- Process (D-7): every implementation step ships via `/feature` (full/small), ≤1 full per session; owner transports prompts to runner sessions; orchestrator reviews via git diff, never via agent self-report.

**Driving docs.** `primitive-spec.md` (the notation grid + skeleton) · `decisions.md` D-1..D-7 (+ D-MARKER-DEATH OPEN) · predecessors `plan-editor-compose` + `compose-authoring-ux` (CLOSED; ADR-0037..0040 = the live floor of main until this initiative's implementation supersedes it).
