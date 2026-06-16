# coach-station — R1 Clone — UX + contract design

**Status: DRAFT for owner ratification.** Synthesizes D-4 (the verbatim per-floor semantics) × the plan-editor UI recon (insertion points in the real components) × `ui-ux-pro-max` (ux domain: confirm-before-destructive, undo-for-destructive, success-toast, loading/disabled, aria-label for icon-only, empty-state messaging, color-not-only). The semantics are locked (D-4); this doc designs the **affordance / UX layer** + a server-contract sketch so UX ↔ API align. Five UX forks for the owner are in §9.

---

## 1. The two clone semantics (D-4 recap)

| Semantic                 | Floors                        | Gesture                                        | Destructive?                  | Confirm?           |
| ------------------------ | ----------------------------- | ---------------------------------------------- | ----------------------------- | ------------------ |
| **Replace-into-current** | Week, Day                     | pick a SOURCE → replace the current's contents | YES (deletes current subtree) | YES (danger modal) |
| **Duplicate-append**     | Session, Block, Schema, Row   | instant copy → end of the same parent          | no                            | no                 |
| **Group members**        | schema-in-group, row-in-group | instant copy → end of the SAME group           | no                            | no                 |

Whole groups are never cloned (D-4-C).

**Copy = everything (D-6).** A clone reproduces the full source subtree verbatim — every field, every floor below — re-referencing the shared catalog. The ONLY thing not copied is the target's slot position (week `startDate` / day `dayOfWeek`). Nuance: a _subtree_ clone (week/day/session/block) copies the `SchemaGroup` / `RowGroup` containers inside it too — "groups aren't cloned" (D-4-C) only means there is no standalone duplicate-a-whole-group affordance.

## 2. Affordances per floor (where + control + icon)

Recon insertion points are exact (file:line from the plan-editor recon). The per-element control is an `IconButton size="small"` + `Tooltip`, **`ContentCopyIcon`** (reads as "duplicate"; visually distinct from `TuneIcon` edit and `DeleteIcon`), placed **after edit, before delete** — delete stays last + `error.main` + spatially the terminal action (`destructive-nav-separation`).

| Floor               | Trigger location                                                                | Control                                                                                              | Behavior                                           |
| ------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Week**            | `week-navigator.tsx` action row (after the Today button, ~:69)                  | labelled button "Clone week…" (icon + text — a navigator card has room; discoverable, not icon-only) | opens the source-picker modal (week scope)         |
| **Day**             | `day-row-head.tsx` head zone (~:103, near the day label/notes)                  | `IconButton` + `ContentCopyIcon`, tooltip "Clone a day into this one"                                | opens the source-picker modal (day scope)          |
| **Session**         | `session-card-head.tsx` cluster, after Notes (~:125), before Delete (:129)      | `IconButton` + `ContentCopyIcon`, tooltip "Duplicate session"                                        | instant duplicate-append to the same day           |
| **Block**           | `block-card-head.tsx`, between labels (:89) and Delete (:91)                    | same                                                                                                 | instant duplicate-append to the same session       |
| **Schema**          | `schema-card-head.tsx`, after Edit-axes `TuneIcon` (:136), before Delete (:138) | same                                                                                                 | instant duplicate-append to the same block         |
| **Row**             | `schema-row-card.tsx` grid action cols, after Edit (:214), before Delete (:216) | same (the `auto auto auto` grid already reserves action columns — add one)                           | instant duplicate-append to the same schema        |
| **Schema in group** | the boxed member's `schema-card-head.tsx` (when `isBoxed`)                      | same icon                                                                                            | instant duplicate-append to the **same group**     |
| **Row in group**    | the member `schema-row-card.tsx` inside `RowGroupBox`                           | same icon                                                                                            | instant duplicate-append to the **same row-group** |

The group-box HEADS (`schema-group-box-head.tsx`, `row-group-box-head.tsx`) get **no** clone control — whole groups don't clone (D-4-C).

## 3. Flow A — Week / Day replace-into-current

1. **Trigger.** "Clone week…" button on the `WeekNavigator` card (the natural home — it already owns week movement). Day: a `ContentCopyIcon` button on `DayRowHead`.
2. **Source-picker modal.** Lists the plan's weeks (or days) with a **content summary**: "Week of Jun 9 — 4 sessions" / "Week of Jun 2 — Empty". The coach picks the source. Empty sources are **disabled rows** with an "Empty — nothing to clone" tag (a pre-condition, not a post-error — and it still satisfies D-4's "если пустая — сообщить явно", via the visible tag). [§9 Q2]
3. **Destructive confirm** (`ConfirmationModal type="danger"`). Title "Replace this week?"; message names the count being destroyed AND the source. Confirm "Replace week" / Cancel. Confirm button is **not auto-focused** (avoid an accidental destructive Enter).
4. **Execute.** The server deep-clone replace transaction (D-3). `isConfirming` spinner + disabled on the confirm button (`ConfirmationModal` supports `isConfirming` + `error`).
5. **Done.** Modal closes; the week re-renders with cloned content; a success toast (auto-dismiss ~4s). **No undo** (D-6) — the danger-confirm is the only guard.
6. **Empty-source guard.** If an empty source ever reaches execute, NO destructive modal fires — an info notice instead: "Week of {date} is empty — nothing to clone. This week was left unchanged." No delete (D-4: cloning an empty week must not clear the current week).

## 4. Flow B — Duplicate-append (session / block / schema / row + group members)

- **Instant** on click — no modal, no confirm (non-destructive, D-4-B).
- Click → `duplicate` mutation → the clone appears appended at the end of the same parent (or the same group for members).
- **In-flight:** the clicked icon shows an inline `CircularProgress` (size 16) + `disabled` + `aria-busy` (`loading-buttons`); the rest of the card stays interactive. Siblings are independent (no global lock).
- **Done feedback:** the appended card/row IS the primary feedback. Rec: **scroll-into-view + a brief highlight** on the new node, a subtle fade/stagger entrance (`duration-timing` 150–300ms, `prefers-reduced-motion` respected) — and NO toast (toasts are noise on a dense editor; reserve them for the destructive replace). [§9 Q3]
- **Error:** a `role="alert"` toast "Couldn't duplicate — try again."

## 5. Microcopy (English, terse, coach-facing)

- Week trigger label: **"Clone week…"** · Day trigger tooltip: **"Clone a day into this day"**
- Source-picker title: **"Clone into this week"** / **"Clone into this day"** · row: **"Week of Jun 9 — 4 sessions"** · empty row tag: **"Empty — nothing to clone"**
- Destructive confirm — title **"Replace this week?"**, message **"This week's {N} sessions will be deleted and replaced with Week of {date} ({M} sessions). This can't be undone."**, confirm **"Replace week"**, cancel **"Cancel"**
- Empty-source notice (info): **"Week of {date} is empty — nothing to clone. This week was left unchanged."**
- Per-element tooltips: **"Duplicate session / block / schema / row"**
- Success toast (replace): **"Week replaced — {M} sessions cloned."**
- Append: silent (Q3) · Error: **"Couldn't clone — try again."**

## 6. Interaction states

- **Replace confirm button:** `isConfirming` spinner + disabled; `error` surfaced inline in the modal.
- **Per-element icon:** disabled + inline 16px spinner + `aria-busy` while pending.
- **Source-picker:** skeleton rows if the week/day summaries fetch async.
- **Success:** toast auto-dismiss ~4s (`toast-dismiss`); no undo (D-6).
- **Error:** modal `error` prop (replace) / `role="alert"` toast (append).

## 7. Accessibility

- Every icon-only duplicate button: `aria-label="Duplicate {floor}"` (`aria-labels` — icon-only). Touch target ≥44px (pad the dense row icons).
- Confirm modal: focus-trap, Escape cancels, focus returns to the trigger (`escape-routes`); danger conveyed by text + color (`color-not-only`); confirm not auto-focused.
- Source-picker rows keyboard-navigable; "Empty" conveyed by text/tag, not color alone.
- Toast `aria-live="polite"`; error `role="alert"`.

## 8. Contract / server sketch (D-3 — so UX ↔ API align; finalized at the wave-plan)

A server-side deep-clone endpoint family, each in ONE transaction, idempotency-keyed (`IDEMPOTENCY_KEY_REGEX` / `prismaIdempotencyStore`):

- `POST .../weeks/{startDate}/clone-from { sourceStartDate }` — **replace** tx (delete current week subtree → deep-copy source); empty source → 200 no-op + `{ cloned: false, reason: "empty-source" }`.
- `POST .../days/{...}/clone-from { source }` — replace tx, day scope.
- `POST .../sessions/{id}/duplicate` — append to the same day.
- `POST .../blocks/{id}/duplicate` — append to the same session.
- `POST .../schemas/{id}/duplicate` — append to the same block; if grouped, append to the same group (`groupId` preserved, contiguity held).
- `POST .../schema-rows/{id}/duplicate` — append to the same schema; if grouped, the same `rowGroup`.

Deep-copy invariants: fresh ids; **re-reference** the catalog (`exerciseId` FK, `modifierIds`, `labelIds`, `media`) — copy structure + prescriptions, point at the same catalog records (never duplicate Exercises/Modifiers/Labels); copy the `load`/`tempo`/`side` VOs + `notes`; `order = max+1` (group-internal: the 2-pass shift to stay contiguous — `[[planner-mutation-invariant-trace]]`). Verb reflects semantic: **`clone-from`** = replace (A), **`duplicate`** = append (B/C).

## 9. Resolved (D-6, owner 2026-06-15)

1. **Undo on the destructive week/day replace → NO.** The danger-confirm is the only guard; no pre-clone snapshot/reverse-op in R1 (keeps the engine lean for a solo non-prod tool). The confirm copy keeps "This can't be undone."
2. **Empty source in the picker → BLOCK.** Empty weeks/days are disabled rows with an "Empty — nothing to clone" tag (pre-condition, not post-error).
3. **Duplicate-append feedback → SILENT.** The clone appears + scroll-into-view + brief highlight; no toast.
4. **Week source scope → ANY week** (most-recent prior at the top of the picker).
5. **Day source scope → ANY day** in the plan.
