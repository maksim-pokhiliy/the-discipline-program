# session-primitive — journal

Append-only. One entry per session/step.

## 2026-06-10 — founded out of the domain-model review

- **Trigger.** Owner: "что не так с нашей тренировочной доменной моделью? я не могу понять почему, но мне она не нравится … нужно честно." Full review run (schema, live contracts, ADR-0037..0040, analysis genesis, persona, roadmap).
- **Diagnosis the owner accepted.** (1) Corpus-first genesis photographed ONE personal plan's Excel into types — parsing residue as types (Position enum both-orderings, `wrapped` bracket flag, 8-variant Weight with cardinality-1 members, 9 row kinds); owner: "фотография/музей похож на бредовую галлюцинацию программиста, я согласен." (2) Relations smeared across three mechanisms on three floors (derived parallel / stored superset pairs / fat in-row VOs). (3) The June drains (ADR-0037..0040) were the cure but stopped at the container level. (4) The model models the plan-document, not the coaching — though reuse/copy is feature-work, not model-work (owner correction), and cycles are future enrichment above the primitive (owner scoping).
- **The owner designed the cure's core himself across the session:** relations = boxes that hold contiguous members and carry an unread label ("связывает блок … я не вижу что на нём написано"); auto-linking = "медвежья услуга" (explicit gesture + batch checkbox); my typed relation core (parallel|choice|superset) rejected via the applicability-matrix argument ("запашок"); fixed floors session-блок-схема-строка; the instruction-plaque candidate primitive ("плашка … на ней может быть написано OR, THEN, ANY, и даже REST — одним махом закрывает несколько функционально однотипных пунктов").
- **Founding artifacts.** D-1..D-7 ratified + D-MARKER-DEATH OPEN (`decisions.md`); the notation grid over the whole corpus with verbatim owner verdicts folded in (`primitive-spec.md`); F-ledger of owner-marked follow-ups (`deferred.md`); rough 5-step plan (`plan.md`). Grid numbers verified against `schema-content-primitives.md`, `modifier-scope.md`, `compound-and-alternative.md`, `03-content/edge-cases.md` (re-read in full at founding); `load-representation.md` deferred to F-WEIGHT-EXOTICS by owner's own "не сейчас".
- **Predecessor closed.** `compose-authoring-ux` CLOSED the same session (both steps merged: PR #258; PRs #259+#260 + ADR-0040); its open carry-forwards transferred here; `initiatives/ACTIVE` → `session-primitive`.
- **Working model ratified (D-7).** Orchestrator (план → промпт → ревью) + owner as transport/ratifier; runner sessions via `/feature`; review via git diff.
- **Next.** Step 1 follow-ups, owner-paced, F-PLAQUE first. No runner sessions until spec freeze.

## 2026-06-10 — D-8 ratified (JIT freeze); W1 launched

- Owner: "а мы можем сейчас начать имплементацию?" → dependency-honest answer: the schema-level world (D-2/D-3) is fully ratified; OPEN items gate only the row-level grammar and part of the leaf. The founding "no runner sessions until spec freeze" gate was over-cautious — relaxed as **D-8 JIT-FREEZE** (owner: "давай промпт, я готов запускать"); `plan.md` restructured into waves W1–W4 with explicit needs-decided-first column.
- **W1 prompt issued** (Group/box UX on the existing model): box render gated by the live `isStructurallyParallel` predicate, label = parent `header` via the existing update path, explicit «связать в коробку» checkbox (default checked) in the ladder batch flow; DnD/ungroup persistence explicitly OUT (no re-parenting API → W2/W3); platform-only red line. Runner = `/feature` full in a fresh session, owner transports; orchestrator reviews the git diff on return.
- **Pending from owner before W2:** D-MARKER-DEATH (yes/no).
