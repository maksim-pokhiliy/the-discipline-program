# coach-station — plan

Phased. Each code step ships via `/feature` (full or `small` by scope; UI-first where it has UI — `[[ui-first-for-training-domain]]`). Budget ≤1 full `/feature` per session → expect multiple sessions. UI/UX of every step is designed through the `ui-ux-pro-max` plugin.

| #   | Step                                                                                                   | Gate                                                                                                | Status  |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------- |
| 1   | **R1 — Clone** (server-side deep-clone engine D-3 + per-floor affordances/semantics D-4). Likely splits server-engine + editor-UX (the W4 model-then-editor rhythm). | deep-clone round-trips (structure + prescriptions + memberships + refs), atomic; gated api-server suite green on reseed; owner browser walkthrough; **timed cycle beats Excel** | 🔵 active (design) |
| 2   | **P — Coach profile UI** (wire existing GET/PUT into a bio + user-meta form). Off-spine small.          | profile round-trips; owner walkthrough                                                              | ⬜ pending |
| 3   | **G — DnD group-creation** (drag-to-group + drag-in/out, both floors). Own wave (rec: separate from R1). | owner browser walkthrough (jsdom-blind pointer layer); QA-D-03 absorbed                             | ⬜ pending |
| 4   | **A-known — Authoring polish** (LABEL-FLOW-UX consume the built picker + QA-007 + accumulated cleanups). | owner walkthrough                                                                                   | ⬜ pending |
| —   | **R2 — Templates/archetypes** (parked, D-2). Slot decided at R1 close.                                  | own mini design-cycle (TBD)                                                                          | 🅿️ parked |
| —   | **A-e2e — Authoring polish (e2e-fed)**                                                                  | continuous; list fills from the session-primitive e2e                                               | 🟠 open  |

Open design details deferred to their step (so they aren't silently decided early):

- **R1:** the clone-affordance placement + the two modal flows (week/day source-pick + destructive warning; session↓ duplicate-icon) — designed via `ui-ux-pro-max`; the server endpoint shape + route family; the order/contiguity 2-pass for group-internal duplicates; concurrent-clone / partial-failure / undo (adversarial pass — `deferred.md` CLONE-WEEK-DESTRUCTIVE); whether R1 splits into server + UI builds.
- **R2:** the template storage model + save/instantiate flows (a mini-charter at slotting time).
- **G:** the drop-onto collision layer + the add-to-existing contract change.
- **P:** whether any `User` field beyond `name`/`timezone`/`image` is editable here.
