# Step 6.7 — Session body: SessionCard + dnd-kit reorder + Add session + extracts (LabelSelect, useBlurCommit)

**Branch**: `feat/training-domain` (HEAD `cfa4a792` post-Step-6.6 close-out; 3 commits ahead of `main`, not pushed).
**Type**: UI step (apps/platform) + cross-package extracts (@repo/ui LabelSelect, @app/lib/hooks useBlurCommit) + new repo dependency (`@dnd-kit/*`). Second UI surface workflow's; second consumer of Step-6.5 hooks (4 Session-CRUD hooks).
**Scope**: replace `<Typography>No sessions</Typography>` block (lines 84-86) in `apps/platform/src/modules/plan-detail/components/day-row.tsx` with real `SessionList` + `AddSessionButton`. `SessionCard` rendered per Session with drag handle, embedded label Autocomplete, blur-commit notes field, and trailing kebab menu (Delete via `ConfirmationModal`). dnd-kit-sortable enables reorder within a day (no cross-day move). Concurrently extract `LabelSelect` to `@repo/ui` and `useBlurCommit` hook (3rd-surface trigger satisfied), refactoring existing WeekNotes + DayNotesField + DayLabelSelect to consume the extracts.
**Execution mode**: direct prompt execution (no `/feature` wrapper) per Step 6.4.5 D-1 + 6.5 D-1 + 6.6 precedent — self-contained brief; `/feature` would re-derive Research/Design stages.

---

## § 0. Hard triggers — read-then-act gate

Before any code, verify EVERY verbatim quote in § 0.1-0.9 against the actual HEAD `cfa4a792` byte-for-byte. If any quote diverges, STOP, run `AskUserQuestion` showing the actual content + this prompt's claim, wait for planner ratification. Do NOT silently adapt.

Zero-state re-verification at executor launch:

```bash
grep -rn "useCreateSession\|useUpdateSession\|useDeleteSession\|useReorderSessions" apps/platform/src/modules/
# Expected: 0 hits. If non-zero, STOP and surface — Step 6.7 was partially done earlier.

grep -rln "@dnd-kit/" apps/ packages/
# Expected: 0 hits. If non-zero, STOP and surface — dnd-kit already installed.
```

### § 0.1 Existing surface — `apps/platform/src/modules/plan-detail/`

#### `components/day-row.tsx` (95 LOC post-Step-6.6)

```tsx
"use client";

import { Box, Stack, Typography } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { Label } from "@repo/contracts/lms/label";
import { formatDayName, isSameDay } from "@repo/shared";

import { useUpdateDayLabel, useUpdateDayNotes } from "@app/lib/hooks";

import { DayLabelSelect } from "./day-label-select";
import { DayNotesField } from "./day-notes-field";

type DayRowProps = {
  date: Date;
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  label: Label | null;
  notes: string | null;
  labelOptions: Label[];
  labelOptionsLoading: boolean;
};

export const DayRow: React.FC<DayRowProps> = ({
  date,
  planId,
  startDate,
  dayOfWeek,
  label,
  notes,
  labelOptions,
  labelOptionsLoading,
}) => {
  const updateLabel = useUpdateDayLabel(planId, startDate, dayOfWeek);
  const updateNotes = useUpdateDayNotes(planId, startDate, dayOfWeek);
  const isToday = isSameDay(date, new Date());
  const dayOfMonth = date.getDate();

  return (
    <Stack direction="column" spacing={1.5} sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: 72, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          {formatDayName(date)}
        </Typography>
        {isToday ? (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="subtitle2">{dayOfMonth}</Typography>
          </Box>
        ) : (
          <Typography variant="subtitle2">{dayOfMonth}</Typography>
        )}
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "flex-start" }}
      >
        <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>
          <DayLabelSelect
            value={label}
            options={labelOptions}
            isLoading={labelOptionsLoading}
            onChange={(labelId) => updateLabel.mutate({ labelId })}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <DayNotesField value={notes} onCommit={(next) => updateNotes.mutate({ notes: next })} />
        </Box>
      </Stack>

      <Typography variant="body2" sx={{ color: "text.disabled" }}>
        No sessions
      </Typography>
    </Stack>
  );
};
```

**Replacement target**: lines 84-86 `<Typography>No sessions</Typography>` block. Replace with `<SessionList />` invocation (new component). DayRow gets 2 new props: `sessions: SessionWithLabel[]` + `sessionLabelOptions: Label[]` + `sessionLabelOptionsLoading: boolean`.

#### `components/day-label-select.tsx` (69 LOC — refactor target Phase 4)

(Full file at `apps/platform/src/modules/plan-detail/components/day-label-select.tsx:1-69`; pattern: `Autocomplete<Label>` + slotProps + CircularProgress endAdornment. Phase 4 refactors this to wrap `@repo/ui/LabelSelect`.)

#### `components/day-notes-field.tsx` (62 LOC — refactor target Phase 4)

Read fully at HEAD before Phase 4. Pattern: `useState(value ?? "")` + `committedRef` + `isFocusedRef` + `useEffect`-sync-when-unfocused + `commit()` block (trim + early-return-if-unchanged + null-on-empty + `onCommit`). Phase 4 refactors to consume `useBlurCommit` hook.

#### `components/week-notes.tsx` (68 LOC — refactor target Phase 4)

Same blur-commit pattern as DayNotesField except `useUpdateWeekNotes` mutation lives inside (vs DayNotesField's external `onCommit` prop). Phase 4 refactors to consume `useBlurCommit` hook for the draft/commit logic, mutation stays inside (or moves to a thin wrapper).

**Important asymmetry**: WeekNotes calls `updateNotes.mutate({startDate: formatDateParam(monday), data: {notes}})` inline (line 43-46); DayNotesField calls `onCommit(next)` prop. After extraction, both should converge on the same `useBlurCommit` hook + an `onCommit` callback; WeekNotes wraps the mutation invocation in an `onCommit` callback at the call-site (DayRow already does this; PlanDetailView does it directly via `<WeekNotes>` invocation).

#### `views/plan-detail-view.tsx` (72 LOC post-Step-6.6 — modify target Phase 8)

Read fully at HEAD before Phase 8. Currently calls `useLabelSearch({level:"DAY"})` once for Day labels (Step 6.6). Phase 8 adds second call `useLabelSearch({level:"SESSION"})` for Session labels; drills both option lists + loadings to WeekGrid.

#### `components/week-grid.tsx` (48 LOC post-Step-6.6 — modify target Phase 8)

Read fully at HEAD before Phase 8. Currently drills `planId`, `monday`, `days`, `labelOptions`, `labelOptionsLoading` to each `DayRow`. Phase 8 adds 2 new props: `sessionLabelOptions`, `sessionLabelOptionsLoading`. Pass through to each DayRow alongside `sessions: day?.sessions ?? []`.

### § 0.2 Step 6.5 Session hooks (read-only, do not modify)

#### `apps/platform/src/lib/hooks/use-sessions.ts` (50 LOC)

```ts
"use client";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type {
  CreateSessionData,
  ReorderSessionsData,
  Session,
  UpdateSessionData,
} from "@repo/contracts/lms/session";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useCreateSession = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<CreateSessionData, Session>({
    mutationFn: (data) => api.sessions.create(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Session created",
    errorMessage: "Failed to create session",
  });

export const useUpdateSession = (planId: string, startDate: string) =>
  useWeekMutation<{ sessionId: string; data: UpdateSessionData }, Session>({
    mutationFn: ({ sessionId, data }) => api.sessions.update(planId, sessionId, data),
    planId,
    startDate,
    successMessage: "Session updated",
    errorMessage: "Failed to update session",
  });

export const useDeleteSession = (planId: string, startDate: string) =>
  useWeekMutation<{ sessionId: string }, void>({
    mutationFn: ({ sessionId }) => api.sessions.delete(planId, sessionId),
    planId,
    startDate,
    successMessage: "Session deleted",
    errorMessage: "Failed to delete session",
  });

export const useReorderSessions = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<ReorderSessionsData, { sessions: Session[] }>({
    mutationFn: (data) => api.sessions.reorder(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Sessions reordered",
    errorMessage: "Failed to reorder sessions",
  });
```

**Signature note**: `useUpdateSession` + `useDeleteSession` take ONLY `(planId, startDate)` (no `dayOfWeek` — `sessionId` is global identifier). `useCreateSession` + `useReorderSessions` take `(planId, startDate, dayOfWeek)` (day-scoped). The first invocation in SessionCard uses `useUpdateSession.mutate({sessionId: session.id, data: {labelId|notes: ...}})`.

### § 0.3 Contracts (read-only, do not modify)

#### `packages/contracts/src/entities/lms/session/session.schema.ts` (relevant)

```ts
export const sessionSchema = z.object({
  id: z.string().cuid(),
  dayId: z.string().cuid(),
  order: z.number().int().positive(),
  labelId: z.string().cuid().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSessionSchema = z.object({
  labelId: z.string().cuid().nullable().optional(),
  notes: z.string().max(SESSION_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const updateSessionSchema = createSessionSchema;

export const reorderSessionsSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
```

- `createSessionSchema` is fully optional+nullable — `mutate({})` valid (server stores `labelId: null, notes: null`). Coach POV: "+ Add session" instantly creates an empty card.
- `updateSessionSchema = createSessionSchema` — both partial. UI sends only the changed field.
- `reorderSessionsSchema`: server-side complete-set check (Step 6.1 QA-001) — UI must send ALL session ids of the day in new order, not subset.

#### `packages/contracts/src/entities/lms/session/session.constants.ts`

```ts
export const SESSION_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
} as const;
```

Mirror of `DAY_CONSTANTS`. Apply via `inputProps={{maxLength: SESSION_CONSTANTS.MAX_NOTES_LENGTH}}`.

#### `packages/contracts/src/entities/lms/day/day.schema.ts:9-18` — `SessionWithLabel` shape

```ts
export const sessionWithLabelSchema = sessionSchema.extend({
  label: labelSchema.nullable(),
});

export const daySlotSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  label: labelSchema.nullable(),
  notes: z.string().nullable(),
  sessions: z.array(sessionWithLabelSchema),
});
```

`DaySlot.sessions[i].label: Label | null` is embedded (Step 6.2 7-day GET extension). UI displays the embedded label directly; for EDIT (select another label), the SESSION-applicable-label options come from the new `useLabelSearch({level:"SESSION"})` call in PlanDetailView.

#### `packages/contracts/src/entities/lms/label/label.constants.ts:6-7` (relevant)

```ts
export const APP_LEVELS = ["DAY", "SESSION", "BLOCK"] as const;
export type AppLevelValue = (typeof APP_LEVELS)[number];
```

Use `"SESSION"` in `useLabelSearch({level:"SESSION"})`.

### § 0.4 Existing Step 6.6 extraction targets (Phase 2 + 3 sources)

#### `apps/platform/src/modules/plan-detail/components/day-label-select.tsx` (69 LOC — Phase 2 extract source)

(Quoted in § 0.1 above. Phase 2 extracts the body to `packages/ui/src/components/label-select/index.tsx` as a generic component; Phase 4 refactors this file to a thin wrapper.)

#### `apps/platform/src/modules/plan-detail/components/week-notes.tsx` (68 LOC — Phase 3 extract source — `commit()` block)

```tsx
const commit = () => {
  isFocusedRef.current = false;

  const trimmed = draft.trim();

  if (trimmed === committedRef.current) {
    setDraft(committedRef.current);

    return;
  }

  committedRef.current = trimmed;
  setDraft(trimmed);
  updateNotes.mutate({
    startDate: formatDateParam(monday),
    data: { notes: trimmed === "" ? null : trimmed },
  });
};

const handleFocus = () => {
  isFocusedRef.current = true;
  committedRef.current = notes ?? "";
};
```

The `commit()` block currently invokes `updateNotes.mutate` inline (week-specific). Phase 3 extract — `useBlurCommit({value, onCommit})` returns generic `{draft, setDraft, handleFocus, handleBlur}` — replaces the inline mutate with an `onCommit(trimmed === "" ? null : trimmed)` callback. WeekNotes Phase 4 refactor wraps the mutation in the onCommit lambda.

### § 0.5 `@repo/ui` package shape (Phase 2 target)

#### `packages/ui/package.json` exports map (current)

```json
"exports": {
  ".": "./src/index.ts",
  "./error-pages": "./src/components/error-pages/index.ts",
  "./brand-icon": "./src/brand-icon.tsx"
}
```

**Phase 2 does NOT add a new exports entry** — `@repo/ui/LabelSelect` is reached via the default `.` barrel (`src/index.ts` → `./components` → `./label-select`).

#### `packages/ui/src/index.ts` (current — DO NOT modify)

```ts
export * from "./components";
export * from "./hooks";
```

#### `packages/ui/src/components/index.ts` (current — 34 exports, Phase 2 adds 1)

```ts
export * from "./chip-tab";
export * from "./collapsible-list";
export * from "./data-table";
export * from "./detail-field";
export * from "./error-pages";
export * from "./drawer";
export * from "./dynamic-list-item";
export * from "./empty-state";
export * from "./form-card";
export * from "./form-view";
export * from "./image-upload";
export * from "./inline-edit-text";
export * from "./label-select"; // ← Phase 2 insert (alphabetic after "inline-edit-text")
export * from "./layout";
export * from "./loading-state";
export * from "./login-form";
export * from "./logo";
export * from "./modal";
export * from "./multi-select";
export * from "./nav-link-button";
export * from "./page-header";
export * from "./person-card";
export * from "./plan-status-chip";
export * from "./pulse-stat";
export * from "./pulse-stats-card";
export * from "./query-wrapper";
export * from "./markdown-editor";
export * from "./rich-text-viewer";
export * from "./skip-to-content";
export * from "./status-chip";
export * from "./tags-input";
export * from "./stats-card";
export * from "./toast";
export * from "./user-chip";
```

(Phase 2 final state shown above with `+1` insert marked.)

### § 0.6 `ConfirmationModal` (re-use, do not modify)

#### `packages/ui/src/components/modal/confirmation-modal.tsx` (relevant signature)

```ts
export type ConfirmationModalProps = Omit<BaseModalProps, "children" | "actions"> & {
  type: "warning" | "danger" | "info";
  message: string;
  details?: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  error?: string | null;
};
```

Use `type="danger"` for Session delete; `message="Delete this session?"`; `details={session.label?.name ?? "Empty session"}` for context; `onConfirm={() => deleteSession.mutate({sessionId: session.id})}`; `isConfirming={deleteSession.isPending}`.

`BaseModalProps` includes `open` + `onClose` (verify at prompt-time by Reading `packages/ui/src/components/modal/base-modal.tsx` if signature surface unclear).

#### `apps/platform/src/modules/plans/components/plan-action-menu.tsx` (canonical platform precedent)

Lines 1-100 quoted in extended verification. Pattern: `useRef + useState(menuOpen) + useState(modalOpen)`; `<IconButton ref={anchorRef} onClick={openMenu}>` + `<Menu anchorEl={anchorRef.current} open={menuOpen}>` + `<MenuItem onClick={() => {close(); setModalOpen(true);}}>` + `<ConfirmationModal open={modalOpen} onClose={() => setModalOpen(false)} ...>`. Mirror this pattern в SessionCard's trailing kebab menu.

### § 0.7 Registration files (additive — quote current + final)

#### `apps/platform/src/modules/plan-detail/components/index.ts` (6 → 11 exports — Phase 8 final)

**Current**:

```ts
export { DayLabelSelect } from "./day-label-select";
export { DayNotesField } from "./day-notes-field";
export { DayRow } from "./day-row";
export { WeekGrid } from "./week-grid";
export { WeekNavigator } from "./week-navigator";
export { WeekNotes } from "./week-notes";
```

**Phase 8 final** (alphabetic insert of 5 new exports):

```ts
export { AddSessionButton } from "./add-session-button";
export { DayLabelSelect } from "./day-label-select";
export { DayNotesField } from "./day-notes-field";
export { DayRow } from "./day-row";
export { SessionCard } from "./session-card";
export { SessionLabelSelect } from "./session-label-select";
export { SessionList } from "./session-list";
export { SessionNotesField } from "./session-notes-field";
export { WeekGrid } from "./week-grid";
export { WeekNavigator } from "./week-navigator";
export { WeekNotes } from "./week-notes";
```

#### `apps/platform/src/lib/hooks/index.ts` (12 → 13 exports — Phase 3 final)

**Current**:

```ts
export * from "./use-coach-athletes";
export * from "./use-current-user-role";
export * from "./use-coach-action-items";
export * from "./use-coach-dashboard";
export * from "./use-coach-invite";
export * from "./use-day-metadata";
export * from "./use-label-search";
export * from "./use-sessions";
export * from "./use-training-plans";
export * from "./use-users";
export * from "./use-week-mutation";
export * from "./use-weeks";
```

**Phase 3 final** (alphabetic insert of `use-blur-commit`):

```ts
export * from "./use-blur-commit";
export * from "./use-coach-athletes";
... (rest unchanged, but the file is sorted by current local convention which is NOT strictly alphabetic — verify at prompt-time and either: alphabetic insert OR insert at end with comment-less alphabetic justification. Mirror existing sort order if mixed.)
```

**Note**: existing order has `use-coach-athletes` → `use-current-user-role` → `use-coach-action-items` — NOT alphabetic (`current` before `coach-action`). So local convention is "insertion order, no strict sort". For Phase 3, insert `use-blur-commit` at the top (alphabetic-leading) or wherever fits the local convention naturally. Stylistic, no behavior. If ESLint complains about ordering — let lint-staged auto-fix.

### § 0.8 Husky hooks (re-quoted — commit-strategy gate, per `[[husky-cross-package-squash]]`)

```
# .husky/pre-commit
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
```

```
# .husky/pre-push
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

**Multi-package surface — Phase 2 + 4 cross `packages/ui` ↔ `apps/platform`**:

- Phase 2 ships `@repo/ui/LabelSelect`. Apps still import their local DayLabelSelect — no break.
- Phase 4 refactors DayLabelSelect to wrap `@repo/ui/LabelSelect` AND introduces useBlurCommit-adoption in WeekNotes + DayNotesField. apps/platform `check-types` must pass per-commit.

If a Phase-N commit leaves any downstream package broken under `turbo check-types --filter="...[HEAD]"` (which it should NOT for the proposed phasing — each phase is additive then consumer-side-only), collapse downstream into one squashed commit per Step 6.1.5 precedent.

### § 0.9 Domain citations (per `[[coach-pov-first]]`)

#### `analysis/artifacts/05-synthesis/domain-model.md §1.2 — Session` (verbatim, lines 104-122)

```
**Purpose**: тренировочная сессия — set of blocks выполняемых в рамках одного entry под day.

**Attributes**:
- `id`.
- `order` — позиция внутри Day.
- `label` — optional single LabelRef.
- `notes` — optional free-text.
- `blocks` — ordered children, 0..N.

**Invariants**:
- Single label (sample: только `1ST SESSION`, 165 occurrences).
- `blocks.length === 0` теоретически валидно, в sample не встречается.
- В sample каждый active Day имеет ровно 1 session, но модель допускает N.
```

Coach mental model:

- **Single label per Session** (UI: simple Autocomplete, no multi-select). Cleared label → `mutate({labelId:null})`; row stays.
- **Free-text notes**, optional. Same cap as Day (2000 chars per SESSION_CONSTANTS).
- **Order** within Day — coach can reorder via drag; 1 session/day is typical, N possible.
- **Blocks** = Step 7 surface; Step 6.7 ignores them entirely. SessionCard does NOT render Block children.

### § 0.10 Resolved planner decisions for Step 6.7

| OQ                                     | Resolution                                                                                                                                           | Rationale                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **A** (SessionLabelSelect shape)       | A1 — extract `@repo/ui/LabelSelect`, refactor DayLabelSelect to wrap it; new SessionLabelSelect = thin wrapper                                       | 100% dup with 2 known callsites (Day + Session) + Block in Step 7. Premature was at 1 callsite; satisfied now.            |
| **B** (SessionNotesField shape)        | B1 — extract `useBlurCommit` hook in `@app/lib/hooks/`, refactor WeekNotes + DayNotesField + new SessionNotesField                                   | 3rd-surface trigger satisfied (Week + Day + Session). All 3 refactored in same step to avoid mixed convention.            |
| **C** (SESSION label preload location) | C1 — PlanDetailView (mirror Day pattern), drill 4 levels (PlanDetailView → WeekGrid → DayRow → SessionList → SessionCard)                            | Single source of truth, dedup-noise free, consistent with Day. 5-level depth in Step 7 — Context extraction trigger then. |
| **D** (Reorder UX)                     | D1 — optimistic local state via `arrayMove` + `useReorderSessions.mutate` + rollback to pre-drag snapshot on error + invalidate-resync on success    | Standard dnd UX; coach expects immediate visual feedback. Rollback handled by storing pre-drag `sessions` snapshot.       |
| **E** (Delete confirmation)            | E1 — reuse existing `@repo/ui` `ConfirmationModal` `type="danger"`                                                                                   | Already shipped; canonical pattern in plan-action-menu. Destructive op needs explicit confirmation gate.                  |
| **F** (+ Add session semantics)        | F1 — server-create immediately on click; `createSessionSchema` accepts `{}`; server stores `{labelId:null, notes:null, order=(max+10)}`              | Simpler state machine; coach POV "I clicked +Add, I want a row I can edit".                                               |
| **G** (dnd-kit version + catalog)      | G1 — add `@dnd-kit/core ^6`, `@dnd-kit/sortable ^8`, `@dnd-kit/utilities ^3` to pnpm catalog, consume via `catalog:` in `apps/platform/package.json` | Future-proof for Step 7 Block reorder; mirrors `@mui/*` catalog idiom.                                                    |

### § 0.11 STOP-and-surface protocol

If during any Phase you find:

- Verbatim quote in § 0.1-0.9 diverges from HEAD `cfa4a792` byte-for-byte.
- `useCreateSession` / `useUpdateSession` / `useDeleteSession` / `useReorderSessions` signature drift since Step 6.5.
- `sessionSchema` / `daySlotSchema` / `reorderSessionsSchema` shape drift.
- `@dnd-kit` already present in any package.json or pnpm-workspace.yaml.
- `ConfirmationModal` API drift since § 0.6 snapshot.
- An unrelated planner-discipline miss (e.g. § 3 implies a contract change — IT SHOULD NOT; Step 6.7 is pure UI + dep install + cross-package extract).
- A prior-attempt trace (vocab: `coach always edit mode`, `plan-editor rollback`, `per-block atomic save`, `SETS_REPS as 9th archetype`) per WORKFLOW.md § Context — STOP and surface.

STOP. Run `AskUserQuestion` showing the divergence + hypothesis. Wait for planner ratification.

---

## § 1. Goal

Заполнить `<Typography>No sessions</Typography>` placeholder в DayRow реальным SessionList'ом — coach видит embedded Sessions per Day с label chips + notes + drag handles + delete menus, может создавать через "+ Add session", переупорядочивать через dnd-kit, удалять через ConfirmationModal. Первый production UI consumer 4 хуков Step 6.5; first install + first usage `@dnd-kit/*` в repo; concurrent extract `@repo/ui/LabelSelect` (2 callsites known + 3rd Step 7) + `@app/lib/hooks/useBlurCommit` (3 callsites — Week + Day + Session).

---

## § 2. Context — decision lineage

- **D1** (2026-05-12) — `Session` has `(dayId, order, labelId?, notes?)`. Order axis sparse-int (Phase 4 Q6).
- **D6** (2026-05-14) — Week lazy slot.
- **D7** (2026-05-15) — Day lazy slot, breadcrumb on empty. Session create materializes Week+Day atomically (Step 6.1).
- **D8** (2026-05-15) — Label in lms/\* namespace.
- **Step 6.0-6.2** (2026-05-15-16) — Session contract slice + `lmsSessionApi.{create,update,delete,reorder}` + retry-on-P2034 (Step 6.4-6.4.5).
- **Step 6.5** (2026-05-16) — 4 Session hooks + `useLabelSearch` shipped; first UI callsite is this step.
- **Step 6.6** (2026-05-17) — DayRow header reshape (Day label + notes). Drove OQ-B (LabelSelect extract trigger) + OQ-B (useBlurCommit 3rd-surface trigger) — both triggered by Step 6.7.
- **OQ resolutions** (§ 0.10): A1 / B1 / C1 / D1 / E1 / F1 / G1.

Out of scope (Step 7+ surfaces):

- Block-level operations (BlockCard, block-label assignment, block intensity/timeCap) — Step 7.
- Schema-level operations (Archetype picker, archetypeParams form) — Step 8.
- SchemaRow editor (per-rowKind forms) — Step 9.
- Athlete view of sessions — separate workflow.
- Cross-day session move (drag Session from Monday to Tuesday) — explicit OUT per `[[scope-via-existing-patterns]]` Step 6.1 design (reorder is day-scoped).
- Day auto-cleanup-on-empty — D7 explicit breadcrumb.
- Session contract changes (e.g. adding `name` field) — Q10/Session.name regression guard per Step 6.0; do NOT add.

---

## § 3. Implementation phases

8 phases in dependency order. Each commit is atomic per-phase; cross-package gates verified per § 0.8.

### Phase 1 — `@dnd-kit/*` dependency install

**`pnpm-workspace.yaml`** — add 3 catalog entries (insert alphabetically among existing `@d*` entries — verify ordering at prompt-time; the catalog currently has `@dnd-kit` block missing, so insert as new contiguous lines):

```yaml
"@dnd-kit/core": ^6.3.1
"@dnd-kit/sortable": ^10.0.0
"@dnd-kit/utilities": ^3.2.2
```

(Versions are latest stable at knowledge cutoff. If `pnpm install` fails on version mismatch — adjust to a resolvable version that satisfies React 19 + ESM; document as D-N in `output.md`.)

**`apps/platform/package.json`** — add 3 deps to `dependencies` (alphabetic, all `catalog:`):

```json
"@dnd-kit/core": "catalog:",
"@dnd-kit/sortable": "catalog:",
"@dnd-kit/utilities": "catalog:",
```

**`pnpm install`** — regenerates `pnpm-lock.yaml`. Verify `pnpm --filter platform check-types` still passes after install (it should — no code uses deps yet).

**Commit 1**: `chore(platform): add dnd-kit deps for session reorder`. Body lists the 3 packages + cited Step-6.7 usage.

### Phase 2 — extract `@repo/ui/LabelSelect`

**New file**: `packages/ui/src/components/label-select/index.tsx`

Generic Label-Autocomplete. Props:

```ts
type LabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
};
```

Body — verbatim mirror of current `apps/platform/src/modules/plan-detail/components/day-label-select.tsx` (Step 6.6), with two surface differences:

1. `label = "Label"` and `placeholder = "Select…"` default props (was hardcoded `"Day label"` / `"Tag this day…"`).
2. Imports `Label` from `@repo/contracts/lms/label` (verify `@repo/ui/package.json` has `@repo/contracts: workspace:*` — yes per § 0.5 quote).

**Modified**: `packages/ui/src/components/index.ts` — add `export * from "./label-select";` alphabetic between `inline-edit-text` and `layout`.

**Commit 2**: `feat(ui): add generic LabelSelect autocomplete component`. Body mentions Day + Session + future Block consumer plan.

**Husky gate**: pre-commit `turbo check-types --filter="...[HEAD]"` runs on `@repo/ui` (changed) + all packages that depend on it transitively (apps/platform, apps/admin, apps/marketing, apps/storybook). All should pass — change is additive export.

### Phase 3 — extract `@app/lib/hooks/useBlurCommit`

**New file**: `apps/platform/src/lib/hooks/use-blur-commit.ts`

Generic blur-commit primitive. Signature:

```ts
type UseBlurCommitArgs = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

type UseBlurCommitResult = {
  draft: string;
  setDraft: (next: string) => void;
  handleFocus: () => void;
  handleBlur: () => void;
};

export const useBlurCommit = ({ value, onCommit }: UseBlurCommitArgs): UseBlurCommitResult => {
  // verbatim port of DayNotesField/WeekNotes pattern:
  // - useState(value ?? "")
  // - committedRef.current = value ?? ""
  // - isFocusedRef.current = false
  // - useEffect(...) -> sync setDraft + committedRef when !isFocusedRef.current
  // - handleFocus -> isFocusedRef = true; committedRef = value ?? ""
  // - handleBlur -> isFocusedRef = false; trimmed = draft.trim();
  //                  if trimmed === committedRef.current -> setDraft(committedRef); return;
  //                  committedRef = trimmed; setDraft(trimmed);
  //                  onCommit(trimmed === "" ? null : trimmed);
  ...
};
```

Implement verbatim port — behavior MUST be byte-equivalent to existing WeekNotes.commit() and DayNotesField.commit() to preserve smoke-test invariants (Step 5 + 6.6 smoke-tests).

**Modified**: `apps/platform/src/lib/hooks/index.ts` — add `export * from "./use-blur-commit";` (alphabetic-first slot; if local convention is insertion-order — insert at top with same justification).

**Commit 3**: `feat(platform): add useBlurCommit hook for shared blur-commit text fields`. Body mentions 3 callsites (Week + Day + Session) consuming in Phase 4 + 5.

**Husky gate**: scope limited to `apps/platform`. Pre-commit passes.

### Phase 4 — refactor existing 3 callsites to consume extracts

**Three refactors in one commit** — atomic transition; per-file changes preserve behavior:

**4a. `apps/platform/src/modules/plan-detail/components/day-label-select.tsx`** — replace body with thin wrapper:

```tsx
"use client";

import type { Label } from "@repo/contracts/lms/label";
import { LabelSelect } from "@repo/ui";

type DayLabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};

export const DayLabelSelect = ({
  value,
  options,
  isLoading,
  onChange,
  disabled = false,
}: DayLabelSelectProps) => (
  <LabelSelect
    value={value}
    options={options}
    isLoading={isLoading}
    onChange={onChange}
    disabled={disabled}
    label="Day label"
    placeholder="Tag this day…"
  />
);
```

(~22 LOC; was 69 LOC.)

**4b. `apps/platform/src/modules/plan-detail/components/day-notes-field.tsx`** — replace body with thin wrapper consuming `useBlurCommit`:

```tsx
"use client";

import { TextField } from "@mui/material";

import { DAY_CONSTANTS } from "@repo/contracts/lms/day";

import { useBlurCommit } from "@app/lib/hooks";

type DayNotesFieldProps = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

export const DayNotesField = ({ value, onCommit }: DayNotesFieldProps) => {
  const { draft, setDraft, handleFocus, handleBlur } = useBlurCommit({ value, onCommit });

  return (
    <TextField
      label="Day notes"
      placeholder="Notes for this day…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      multiline
      minRows={2}
      fullWidth
      size="small"
      inputProps={{ maxLength: DAY_CONSTANTS.MAX_NOTES_LENGTH }}
    />
  );
};
```

(~32 LOC; was 62 LOC.)

**4c. `apps/platform/src/modules/plan-detail/components/week-notes.tsx`** — refactor to consume `useBlurCommit`, keeping mutation inside:

```tsx
"use client";

import { TextField } from "@mui/material";

import { formatDateParam } from "@repo/shared";

import { useBlurCommit } from "@app/lib/hooks";
import { useUpdateWeekNotes } from "@app/lib/hooks";

type WeekNotesProps = {
  planId: string;
  monday: Date;
  notes: string | null;
};

export const WeekNotes: React.FC<WeekNotesProps> = ({ planId, monday, notes }) => {
  const updateNotes = useUpdateWeekNotes(planId);
  const { draft, setDraft, handleFocus, handleBlur } = useBlurCommit({
    value: notes,
    onCommit: (next) =>
      updateNotes.mutate({
        startDate: formatDateParam(monday),
        data: { notes: next },
      }),
  });

  return (
    <TextField
      label="Week notes"
      placeholder="Add week notes…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      multiline
      minRows={2}
      fullWidth
      size="small"
    />
  );
};
```

(~35 LOC; was 68 LOC.)

**Note**: WeekNotes doesn't currently have a client `maxLength` cap (Step 5 QA-005 deferred). Phase 4 preserves that omission — adding cap to WeekNotes is out-of-scope for Step 6.7 (it's a Week concern, not Session; close separately if needed).

**Commit 4**: `refactor(platform): adopt LabelSelect and useBlurCommit in week-notes, day-label-select, day-notes-field`. Body lists 3 files + cited extract sources from Phase 2 + 3.

**Husky gate**: `apps/platform` check-types passes; behavior is byte-equivalent per spec.

### Phase 5 — new `SessionLabelSelect` + `SessionNotesField` components

**5a. `apps/platform/src/modules/plan-detail/components/session-label-select.tsx`** (new, ~22 LOC):

```tsx
"use client";

import type { Label } from "@repo/contracts/lms/label";
import { LabelSelect } from "@repo/ui";

type SessionLabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};

export const SessionLabelSelect = ({
  value,
  options,
  isLoading,
  onChange,
  disabled = false,
}: SessionLabelSelectProps) => (
  <LabelSelect
    value={value}
    options={options}
    isLoading={isLoading}
    onChange={onChange}
    disabled={disabled}
    label="Session label"
    placeholder="Tag this session…"
  />
);
```

**5b. `apps/platform/src/modules/plan-detail/components/session-notes-field.tsx`** (new, ~32 LOC):

Mirror DayNotesField (post-4b refactor) — use `useBlurCommit`, `label="Session notes"`, `placeholder="Notes for this session…"`, `maxLength={SESSION_CONSTANTS.MAX_NOTES_LENGTH}` from `@repo/contracts/lms/session`.

### Phase 6 — new `SessionCard` component

**File**: `apps/platform/src/modules/plan-detail/components/session-card.tsx` (~120 LOC)

Single Session row. Owns `useUpdateSession` + `useDeleteSession` mutations + Confirm-delete modal state + dnd-kit `useSortable`.

**Props**:

```ts
type SessionCardProps = {
  session: SessionWithLabel;
  planId: string;
  startDate: string;
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};
```

**Imports** (relevant):

```ts
"use client";

import { useRef, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Label } from "@repo/contracts/lms/label";
import type { SessionWithLabel } from "@repo/contracts/lms/day";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteSession, useUpdateSession } from "@app/lib/hooks";

import { SessionLabelSelect } from "./session-label-select";
import { SessionNotesField } from "./session-notes-field";
```

**Body sketch** (adapt; mirror plan-action-menu modal pattern § 0.6):

```tsx
export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  planId,
  startDate,
  sessionLabelOptions,
  sessionLabelOptionsLoading,
}) => {
  const updateSession = useUpdateSession(planId, startDate);
  const deleteSession = useDeleteSession(planId, startDate);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
    disabled: updateSession.isPending || deleteSession.isPending,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleLabelChange = (labelId: string | null) =>
    updateSession.mutate({ sessionId: session.id, data: { labelId } });

  const handleNotesCommit = (notes: string | null) =>
    updateSession.mutate({ sessionId: session.id, data: { notes } });

  const handleDeleteConfirm = () => {
    deleteSession.mutate({ sessionId: session.id }, { onSuccess: () => setDeleteOpen(false) });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        ...style,
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <IconButton {...attributes} {...listeners} size="small" aria-label="Drag session">
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box sx={{ width: 240, flexShrink: 0 }}>
          <SessionLabelSelect
            value={session.label}
            options={sessionLabelOptions}
            isLoading={sessionLabelOptionsLoading}
            onChange={handleLabelChange}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SessionNotesField value={session.notes} onCommit={handleNotesCommit} />
        </Box>

        <IconButton
          ref={anchorRef}
          onClick={() => setMenuOpen(true)}
          aria-label="Session actions"
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>

        <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
          <MenuItem
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        <ConfirmationModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          type="danger"
          title="Delete session"
          message="Delete this session?"
          details={session.label?.name ?? "Empty session"}
          onConfirm={handleDeleteConfirm}
          isConfirming={deleteSession.isPending}
        />
      </Stack>
    </Box>
  );
};
```

**Notes**:

- `useSortable.disabled` follows `updateSession.isPending || deleteSession.isPending` to prevent drag during in-flight mutation (adversarial axis 2).
- `useSortable.attributes + listeners` spread onto the drag-handle IconButton (NOT the whole Box) — coach can hover/click label/notes without triggering drag.
- `ConfirmationModal.title` is part of `BaseModalProps` (verify by Reading `packages/ui/src/components/modal/base-modal.tsx` if uncertain; if `title` is required and the prompt missed it, add per actual prop).
- ESLint `react/no-multi-comp` may flag if SessionCard contains inline sub-components — keep all helpers as top-level arrow functions or extract.

### Phase 7 — new `AddSessionButton` + `SessionList` components

**7a. `apps/platform/src/modules/plan-detail/components/add-session-button.tsx`** (~25 LOC)

```tsx
"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";

import { useCreateSession } from "@app/lib/hooks";

type AddSessionButtonProps = {
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
};

export const AddSessionButton: React.FC<AddSessionButtonProps> = ({
  planId,
  startDate,
  dayOfWeek,
}) => {
  const createSession = useCreateSession(planId, startDate, dayOfWeek);

  return (
    <Button
      onClick={() => createSession.mutate({})}
      startIcon={<AddIcon />}
      disabled={createSession.isPending}
      size="small"
      variant="outlined"
    >
      Add session
    </Button>
  );
};
```

**Per OQ-F F1**: `mutate({})` — server creates `{labelId:null, notes:null, order=max+10}`.

**7b. `apps/platform/src/modules/plan-detail/components/session-list.tsx`** (~80 LOC)

DndContext + SortableContext wrap. Owns `useReorderSessions` + optimistic local state with rollback.

```tsx
"use client";

import { useEffect, useState } from "react";

import { Stack } from "@mui/material";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { SessionWithLabel } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";

import { useReorderSessions } from "@app/lib/hooks";

import { AddSessionButton } from "./add-session-button";
import { SessionCard } from "./session-card";

type SessionListProps = {
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  sessions: SessionWithLabel[];
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};

export const SessionList: React.FC<SessionListProps> = ({
  planId,
  startDate,
  dayOfWeek,
  sessions,
  sessionLabelOptions,
  sessionLabelOptionsLoading,
}) => {
  const reorderSessions = useReorderSessions(planId, startDate, dayOfWeek);

  const [sortedSessions, setSortedSessions] = useState<SessionWithLabel[]>(sessions);

  useEffect(() => {
    setSortedSessions(sessions);
  }, [sessions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedSessions.findIndex((s) => s.id === active.id);
    const newIndex = sortedSessions.findIndex((s) => s.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousOrder = sortedSessions;
    const nextOrder = arrayMove(sortedSessions, oldIndex, newIndex);

    setSortedSessions(nextOrder);
    reorderSessions.mutate(
      { orderedIds: nextOrder.map((s) => s.id) },
      {
        onError: () => setSortedSessions(previousOrder),
      },
    );
  };

  return (
    <Stack spacing={1.5}>
      {sortedSessions.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedSessions.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1}>
              {sortedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  planId={planId}
                  startDate={startDate}
                  sessionLabelOptions={sessionLabelOptions}
                  sessionLabelOptionsLoading={sessionLabelOptionsLoading}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      ) : null}

      <Box>
        <AddSessionButton planId={planId} startDate={startDate} dayOfWeek={dayOfWeek} />
      </Box>
    </Stack>
  );
};
```

(`Box` import missing in the snippet — add `Box` to MUI import. Verify at prompt-time.)

**Per OQ-D D1**: optimistic local reorder + rollback on error. `useEffect` re-syncs `sortedSessions` when parent `sessions` prop changes (invalidate-driven refresh after success).

### Phase 8 — `DayRow` + `WeekGrid` + `PlanDetailView` wire-up

**8a. `day-row.tsx`** — extend props, replace No-sessions block:

```ts
type DayRowProps = {
  date: Date;
  planId: string;
  startDate: string;
  dayOfWeek: DayOfWeek;
  label: Label | null;
  notes: string | null;
  sessions: SessionWithLabel[];
  labelOptions: Label[];
  labelOptionsLoading: boolean;
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};
```

Replace the `<Typography>No sessions</Typography>` block (lines 84-86) with:

```tsx
<SessionList
  planId={planId}
  startDate={startDate}
  dayOfWeek={dayOfWeek}
  sessions={sessions}
  sessionLabelOptions={sessionLabelOptions}
  sessionLabelOptionsLoading={sessionLabelOptionsLoading}
/>
```

Add `SessionWithLabel` type import: `import type { SessionWithLabel } from "@repo/contracts/lms/day";`. Add `import { SessionList } from "./session-list";`.

**8b. `week-grid.tsx`** — extend props, drill new fields:

```ts
type WeekGridProps = {
  planId: string;
  monday: Date;
  days: DaySlot[];
  labelOptions: Label[];
  labelOptionsLoading: boolean;
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};
```

In the `dayOfWeekValues.map(...)` body, pass `sessions: day?.sessions ?? []` + the 2 new sessionLabel\* props to each `<DayRow>`.

**8c. `views/plan-detail-view.tsx`** — add second `useLabelSearch` call, drill to WeekGrid:

```ts
const { data: sessionLabelOptions = [], isLoading: sessionLabelOptionsLoading } = useLabelSearch({
  level: "SESSION",
});
```

Update WeekGrid invocation:

```tsx
<WeekGrid
  planId={planId}
  monday={activeMonday}
  days={weekData?.days ?? []}
  labelOptions={labelOptions}
  labelOptionsLoading={labelOptionsLoading}
  sessionLabelOptions={sessionLabelOptions}
  sessionLabelOptionsLoading={sessionLabelOptionsLoading}
/>
```

**8d. `components/index.ts`** — alphabetic insert of 5 new exports per § 0.7 final state.

**Commit 5**: `feat(platform): add session body with sessioncard list and dnd-kit reorder`. Body lists 8 files (5 new + 3 modified: day-row, week-grid, plan-detail-view, components/index.ts — total 8 + extracts already in C4) + cited OQ resolutions A1/D1/E1/F1.

---

## § 4. Out of scope (do NOT do)

- ❌ Contract / api-server / api-routes / hooks file modifications (Step 6.5/6.4.5/6.4 already shipped server side).
- ❌ Schema change (no Prisma touch; no analysis-artifacts touch).
- ❌ Add SessionCard support for Block children (Step 7 surface).
- ❌ Cross-day Session drag (out per Step 6.1 design).
- ❌ Add `Session.name` field (Q10 guard — domain modeling anti-pattern).
- ❌ `dnd-kit/modifiers` package (not needed — closestCenter + verticalListSortingStrategy sufficient).
- ❌ ZWS strip on Session notes (Step 6.6 OQ-C deferred — same domain rationale applies to Session).
- ❌ Optimistic update for label/notes via `useMutation onMutate` (per Step 6.5 OQ-D — all 6 mutations use invalidate; UI re-fetches on success).
- ❌ Tests for new components (UI-layer; mirror Step 5 + 6.5 + 6.6 no-test precedent; coverage via 13-step smoke).
- ❌ Refactor `WeekNotes` to gain `maxLength` (deferred Step 5 QA-005; out of Step 6.7 scope).
- ❌ React Context for label preload (4-level prop drilling acceptable per OQ-C C1; Step 7 5-level trigger).
- ❌ Add code comments (per `[[global-preferences]]`).
- ❌ Memoize anything via `useMemo`/`useCallback` without measured perf reason.
- ❌ Search git history or memory for prior-implementation traces per WORKFLOW.md § Forbidden.

---

## § 5. Acceptance criteria

### § 5.1 Verification commands (run from repo root)

```bash
pnpm install                    # regenerates pnpm-lock.yaml after Phase 1
pnpm check-types                # expect 16/16
pnpm lint                       # expect 16/16
pnpm test                       # expect 929/929 (no test deltas; baseline preserved)
pnpm dep:check                  # expect 0 violations / [1155-1180] modules (+7 new files +~10 dnd-kit modules)
```

### § 5.2 Grep regressions

```bash
# New UI callsites — was 0 before Step 6.7
grep -rn "useCreateSession\|useUpdateSession\|useDeleteSession\|useReorderSessions" apps/platform/src/modules/
# Expected: ≥ 4 callsites + imports

grep -rn "@dnd-kit/" apps/platform/src/
# Expected: ≥ 2 hits (session-list.tsx + session-card.tsx)

grep -rn "useBlurCommit" apps/platform/src/
# Expected: ≥ 4 hits (use-blur-commit.ts definition + 3 consumers: week-notes, day-notes-field, session-notes-field)

grep -rn "LabelSelect" packages/ui/src/ apps/platform/src/
# Expected: ≥ 4 hits (@repo/ui definition + 3 consumers: day-label-select wrapper, session-label-select wrapper, + index.ts barrel)

# Component file count
ls apps/platform/src/modules/plan-detail/components/*.tsx | wc -l
# Expected: 11 (added: add-session-button, session-card, session-label-select, session-list, session-notes-field)

# Cross-namespace regression
grep -rn "@repo/contracts/cms/\|@repo/api-server/cms" apps/platform/src/modules/plan-detail/
# Expected: 0 hits (D8 invariant)
```

### § 5.3 Browser smoke-test scenario

**Preconditions**:

1. `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`.
2. `pnpm dev` (or `pnpm --filter platform dev`) — platform on port 3001.
3. Login as `coach@thedisciplineprogram.com` / `password12345`.
4. Open `/admin` (port 3002), create 3 labels:
   - `1ST SESSION` (applicableLevels=[SESSION])
   - `EASY PACE` (applicableLevels=[SESSION, BLOCK])
   - `REST DAY` (applicableLevels=[DAY])
5. From `/coach/plans`, pick any seeded plan; navigate to `/coach/plans/<planId>?week=<this-monday>`.

**Steps**:

1. **Initial render**. Each DayRow under metadata header shows "+ Add session" outlined button + zero SessionCards (no `<Typography>No sessions</Typography>` anymore). DevTools Network: `useLabelSearch({level:"SESSION"})` fires 1 GET `/api/platform/labels/search?level=SESSION` returning 2 SESSION-applicable labels.
2. **Click "+ Add session" on Monday**. POST `/api/platform/training-plans/.../days/MONDAY/sessions` body `{}` → 200 → toast "Session created" → empty SessionCard appears with drag-handle (left), empty "Session label" Autocomplete, empty multiline "Session notes" field, kebab menu (right).
3. **Open Monday SessionCard's label Autocomplete**. Dropdown shows 2 SESSION labels sorted alphabetically: `1ST SESSION`, `EASY PACE`. `REST DAY` (DAY-only) is absent.
4. **Select `1ST SESSION`**. Autocomplete updates immediately; toast "Session updated"; PUT `/api/platform/training-plans/.../sessions/<sid>` body `{"labelId":"<cuid>"}` → 200; invalidate-fetch → chip renders.
5. **Focus Monday SessionCard notes, type `snatch 5x3 + clean 5x3`, blur**. Toast "Session updated"; PUT body `{"notes":"snatch 5x3 + clean 5x3"}` → 200.
6. **F5 refresh**. Monday SessionCard persists with label + notes.
7. **Click "+ Add session" on Monday again**. 2nd empty SessionCard appears below 1st.
8. **Drag 2nd card by its drag-handle above the 1st card, drop**. Visual order swaps immediately (optimistic local state). PUT `.../sessions/reorder` body `{"orderedIds":["<id2>","<id1>"]}` → 200 → toast "Sessions reordered".
9. **F5**. Order persists from server-authoritative response.
10. **Click trailing kebab on top SessionCard → Delete**. ConfirmationModal opens with message "Delete this session?" + details `1ST SESSION` (or `Empty session` if label cleared) + red "Delete" button + "Cancel".
11. **Click "Delete" in modal**. DELETE `.../sessions/<sid>` → 200 → toast "Session deleted" → modal closes → card removed → only 1 SessionCard remains.
12. **DevTools offline → change label on remaining SessionCard**. Toast "Failed to update session"; Autocomplete value reverts to previous label on next invalidate cycle (cache stays consistent with server).
13. **Restore network online**. Retry the label change → succeeds; persists on F5.

(Additional verification suggested but optional in scope):

14. **Open second tab to same URL, delete the remaining SessionCard there. Return to tab 1. Drag attempt on the (stale) card** → server 404 NotFoundError → toast "Failed to reorder sessions" → invalidate → SessionList empties.
15. **Week navigation `>` then `<`**. Other weeks show empty SessionLists. Return to original → state per latest invalidate. No cached SESSION-label refetch (TanStack cache key `["labels","search","SESSION",undefined]` stable).

**Rollback**: `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`.

### § 5.4 What "done" means

All five must hold:

1. § 5.1 commands all green.
2. § 5.2 grep counts match.
3. § 5.3 smoke-test 13/13 (steps 14-15 nice-to-have) green in user's browser.
4. Husky pre-commit + pre-push clean for every commit, no `--no-verify`.
5. `output.md` written per § 8 with smoke-test scenario embedded.

---

## § 6. File-by-file inventory (final state)

| Path                                                                        | Change                              | LOC delta (rough)   |
| --------------------------------------------------------------------------- | ----------------------------------- | ------------------- |
| `pnpm-workspace.yaml`                                                       | EXTEND (catalog +3)                 | +3                  |
| `apps/platform/package.json`                                                | EXTEND (deps +3)                    | +3                  |
| `pnpm-lock.yaml`                                                            | REGEN                               | (auto)              |
| `packages/ui/src/components/label-select/index.tsx`                         | NEW                                 | +70                 |
| `packages/ui/src/components/index.ts`                                       | EXTEND (+1 export)                  | +1                  |
| `apps/platform/src/lib/hooks/use-blur-commit.ts`                            | NEW                                 | +35                 |
| `apps/platform/src/lib/hooks/index.ts`                                      | EXTEND (+1 export)                  | +1                  |
| `apps/platform/src/modules/plan-detail/components/day-label-select.tsx`     | REWRITE (thin wrapper)              | +22 / −69 (net −47) |
| `apps/platform/src/modules/plan-detail/components/day-notes-field.tsx`      | REWRITE (use useBlurCommit)         | +32 / −62 (net −30) |
| `apps/platform/src/modules/plan-detail/components/week-notes.tsx`           | REWRITE (use useBlurCommit)         | +35 / −68 (net −33) |
| `apps/platform/src/modules/plan-detail/components/session-label-select.tsx` | NEW                                 | +22                 |
| `apps/platform/src/modules/plan-detail/components/session-notes-field.tsx`  | NEW                                 | +32                 |
| `apps/platform/src/modules/plan-detail/components/session-card.tsx`         | NEW                                 | +120                |
| `apps/platform/src/modules/plan-detail/components/session-list.tsx`         | NEW                                 | +80                 |
| `apps/platform/src/modules/plan-detail/components/add-session-button.tsx`   | NEW                                 | +25                 |
| `apps/platform/src/modules/plan-detail/components/day-row.tsx`              | EXTEND (new props + SessionList)    | +20 / −5            |
| `apps/platform/src/modules/plan-detail/components/week-grid.tsx`            | EXTEND (2 new props)                | +15 / −2            |
| `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx`          | EXTEND (2nd useLabelSearch + drill) | +12 / −2            |
| `apps/platform/src/modules/plan-detail/components/index.ts`                 | EXTEND (+5 exports)                 | +5                  |

**Total**: 19 files touched (8 new, 10 modified, 1 regenerated). ~+530 / −208 LOC; net +320.

---

## § 7. Commit strategy

Per § 0.8 husky pre-check + cross-package phasing analysis:

- **Commit 1** (Phase 1): `chore(platform): add dnd-kit deps for session reorder` — `pnpm-workspace.yaml` + `apps/platform/package.json` + `pnpm-lock.yaml`. No code uses deps yet → check-types passes. Single-package + lockfile.
- **Commit 2** (Phase 2): `feat(ui): add generic LabelSelect autocomplete component` — `packages/ui/src/components/label-select/index.tsx` + `packages/ui/src/components/index.ts`. Cross-package additive; `apps/platform` still imports local DayLabelSelect (Phase 4 refactor not yet) → no break.
- **Commit 3** (Phase 3): `feat(platform): add useBlurCommit hook for shared blur-commit text fields` — `use-blur-commit.ts` + `hooks/index.ts`. Single-package; existing 3 callsites untouched → no break.
- **Commit 4** (Phase 4): `refactor(platform): adopt LabelSelect and useBlurCommit in week-notes, day-label-select, day-notes-field` — 3 files refactored, behavior byte-equivalent. apps/platform `check-types` passes.
- **Commit 5** (Phases 5+6+7+8): `feat(platform): add session body with sessioncard list and dnd-kit reorder` — 5 new component files + 4 modified (day-row, week-grid, plan-detail-view, components/index.ts). apps/platform `check-types` passes after all wired.
- **Commit 6** (Step close-out): `docs(step-06.7): write executor output report`.

**5 code commits + 1 docs**. Each passes husky individually. If any intermediate state breaks (cross-package surface broader than analyzed):

1. DO NOT `--no-verify`.
2. Surface via `AskUserQuestion` showing the failing hook output + analysis.
3. Wait for ratification: either re-order, restructure, or squash per `[[husky-cross-package-squash]]` Step 6.1.5 precedent.

### § 7.1 Commit message style

- Subject: ≤ 100 chars, fully lowercase (acronyms included — `mui`, `dnd-kit`).
- Body: lines ≤ 100 chars (per `[[commitlint-subject-case]]` + Step 6.1 PROMPT-001 precedent).
- No `Co-Authored-By` / `Generated-with` trailers.

---

## § 8. Output (`implementation/step-06.7/output.md`)

Standard executor report per WORKFLOW.md § "output.md format":

```markdown
## Что сделано

- <2-4 sentences narrating the shipped diff: dnd-kit install, extracts shipped, Session UI body, 3 callsites refactored>

## Изменённые/созданные файлы

- <bullet list with paths + (new) / (modified) / (regenerated) + brief 1-line purpose>

## Принятые решения

- D-1 — <decision name>: <1-2 sentence justification>
- D-2 — ...
  (record D-N for any: dnd-kit version selection if catalog versions adjusted, ESLint react/no-multi-comp split if SessionCard touched, ConfirmationModal title/details optional handling, any TS-narrowing approach used)

## Возникшие вопросы и как решены

- (if no escalations: "Zero § 0 STOP-and-surface escalations; all verbatim quotes matched HEAD <sha> byte-for-byte.")
- Otherwise per-question entry: name, surface mechanism, resolution path.

## Что отложено

- ZWS strip on Session notes (per OQ-C carry-forward from Step 6.6; Session inherits the same domain rationale — free-text + coach-owned)
- React Context for label preload (5-level trigger Step 7 Block surface)
- Optimistic updates for label/notes mutations (per Step 6.5 OQ-D — invalidate-only; revisit if UX surfaces flicker)
- WeekNotes client maxLength cap (Step 5 QA-005 deferred; not in Step 6.7 scope per § 4)
- Cross-day Session drag (out per Step 6.1 design)
- @repo/ui LabelSelect props for `size` / variant control (currently hardcoded `size="small" variant="outlined"`; extend on Step 7 Block trigger if needed)

## Verification notes

- `pnpm install`: <result>
- `pnpm check-types`: <result>
- `pnpm lint`: <result>
- `pnpm test`: <result>
- `pnpm dep:check`: <result>
- Grep regressions per § 5.2: <table or bulleted results>

## Сценарий смоук-теста

(copy § 5.3 verbatim — 13 steps + 2 nice-to-have + preconditions + rollback)

## Acceptance criteria self-check

| Criterion                                         | Status         |
| ------------------------------------------------- | -------------- |
| § 5.1 commands green                              | ☐              |
| § 5.2 grep counts match                           | ☐              |
| § 5.3 smoke-test 13/13                            | ☐ user-pending |
| Husky pre-commit + pre-push clean без --no-verify | ☐              |
| output.md sections complete                       | ☐              |
```

---

## § 9. Style invariants

- **No code comments** unless non-obvious WHY (single line ≤ 100 chars).
- **English** for code/commits/PRs; chat-prose with user — planner side only.
- **No** `Co-Authored-By` / `Generated-with` trailers.
- **No** `--no-verify` / `--no-edit` / `--no-gpg-sign`.
- **No** `as any` / `as unknown` / unjustified `!` per `[[type-quality]]`.
- **`exactOptionalPropertyTypes: true`** is on — conditional-spread for optional pass-through; never `?? undefined`.
- **`noUncheckedIndexedAccess: true`** is on — narrow indexed accesses without `!` (Step 6.6 D-1 precedent — invert iteration axis or `if (!x) return null;`).
- **`"use client"`** directive on every component file owning state / mutations / browser APIs.
- **Commitlint**: subject ≤ 100 chars, fully lowercase (acronyms included); body lines ≤ 100 chars.
- **`react/no-multi-comp`** — if SessionCard / SessionList trigger eslint multi-component error from inline declarations, split into separate files (no inline FunctionalComponent declarations inside `.tsx`).
- **dnd-kit accessibility** — use `KeyboardSensor` + `sortableKeyboardCoordinates`. Default behavior is keyboard-navigable.
- **Memory must NOT be searched** for prior-implementation details of `plan-detail` per WORKFLOW.md § Forbidden + Context. Any prior-implementation trace → STOP and surface.

---

## § 10. Pre-flight checklist (executor runs before Phase 1)

Tick mentally before any code:

- ☐ Verified § 0.1-0.9 verbatim quotes match HEAD `cfa4a792` byte-for-byte.
- ☐ Verified `grep -rn "useCreateSession\|useUpdateSession\|useDeleteSession\|useReorderSessions" apps/platform/src/modules/` returns 0 hits.
- ☐ Verified `grep -rln "@dnd-kit/" apps/ packages/` returns 0 hits (sanity — Step 6.7 = first install).
- ☐ Read `packages/ui/src/components/modal/base-modal.tsx` to verify `ConfirmationModal` `title` prop requirements (if `title` is required by BaseModal, add `title="Delete session"` to ConfirmationModal call).
- ☐ Read OQ resolutions table § 0.10 (A1/B1/C1/D1/E1/F1/G1).
- ☐ Confirmed scope: `apps/platform/src/modules/plan-detail/` + `apps/platform/src/lib/hooks/` + `packages/ui/src/components/label-select/` + `packages/ui/src/components/index.ts` + `apps/platform/package.json` + `pnpm-workspace.yaml`.
- ☐ Domain citations: `domain-model.md §1.2 Session` (single label invariant, free-text notes, order axis).
- ☐ Husky hooks read per § 0.8.

If any ☐ unverified — return to § 0.

---

**End of Step 6.7 prompt**.

Self-contained brief; no `/feature` Research/Design needed. Run Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8; verify per § 5.1-5.2; commit per § 7 (5 code commits + 1 docs); write `output.md` per § 8.

For browser smoke-test (§ 5.3) — executor stops after § 5.2 + all 5 commits + output.md draft (smoke embedded but unchecked). User runs the 13 steps and reports back; planner closes Step 6.7 on green pass.
