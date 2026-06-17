# coach-station — plan

Phased. Each code step ships via `/feature` (full or `small` by scope; UI-first where it has UI — `[[ui-first-for-training-domain]]`). Budget ≤1 full `/feature` per session → expect multiple sessions. UI/UX of every step is designed through the `ui-ux-pro-max` plugin.

| #   | Step                                                                                                           | Gate                                              | Status                           |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------- |
| 1a  | **R1a — Clone server-engine** (deep-clone D-3 + endpoints + gated tests).                                      | deep-clone round-trips, atomic; Review/QA 0-CRIT  | 🟢 MERGED (PR #270)              |
| 1b  | **R1b — Clone editor-UX** (affordances + flows, `r1-clone-design.md`).                                         | owner browser walkthrough                         | 🟢 MERGED (PR #274; D-8)         |
| 2   | **P — Coach profile UI** (schema-extended D-7 + credentials + avatar).                                         | profile round-trips; walkthrough                  | 🟢 MERGED (PR #273; polish #275) |
| 3   | **A-known — Authoring inline-create** (labels + exercises inline; LABEL-FLOW-UX + QA-007; movementFamily cut). | owner walkthrough                                 | 🟢 MERGED (PR #277; D-10)        |
| 4   | **G — DnD group-creation**                                                                                     | —                                                 | ⬛ DROPPED (D-11 → v1.1 OUT)     |
| —   | **Dashboard redesign** (Triage Stack + real-data backend).                                                     | walkthrough; record `coach-dashboard-redesign.md` | 🟢 MERGED (PR #279)              |
| —   | **Athletes redesign** (roster + detail drawer).                                                                | walkthrough; ⚠ no durable record (deferred GAP)  | 🟢 MERGED (PR #278)              |
| —   | **R2 — Templates/archetypes** (parked, D-2). Slot decided post-Exit.                                           | own mini design-cycle (TBD)                       | 🅿️ parked                        |
| —   | **A-e2e — Authoring polish (e2e-fed)**                                                                         | continuous; fills from the session-primitive e2e  | 🟠 open                          |

**Scope cuts this phase:** equipment (D-9) + movementFamily (D-10) removed from the catalog; G dropped (D-11).

**Phase 2 Exit (roadmap gate, OWED):** the owner programs a full multi-week cycle in the editor, timed, and it beats Excel — the gate to declare Phase 2 DONE; the same hands-on session closes the Phase 1 e2e self-test. Then **Phase 3 (athlete core)** — redesign `Performed*`/`OneRMRecord`/scoring from scratch (its own mini design-cycle).

R2 design detail (deferred to its slotting cycle): the template storage model + save/instantiate flows — a mini-charter at slotting time; reuses R1's deep-clone engine.
