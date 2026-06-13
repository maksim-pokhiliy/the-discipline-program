"use client";

import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";

import { Chip, Stack, TextField, Typography } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { FormModal } from "@repo/ui";

import { useCreateSchemaRow, useExercises, useUpdateSchemaRow } from "@app/lib/hooks";

import { buildRowRequest } from "../lib/build-row-request";
import { formatTempoInput } from "../lib/format-tempo-input";
import type { RowFormState, RowRequestMode } from "../lib/row-form-state.types";

import { EQUIPMENT_LABELS, MOVEMENT_TYPE_LABELS } from "./exercise-label-maps";
import { ExercisePicker } from "./exercise-picker";
import { LoadEditor } from "./load-editor";
import { ModifierPicker } from "./modifier-picker";
import { NotesListEditor } from "./notes-list-editor";
import { NumberField } from "./number-field";
import { RepsField } from "./reps-field";
import { SideField } from "./side-field";

const CREATE_TITLE = "Add row";
const EDIT_TITLE = "Edit row";
const CREATE_SUBMIT = "Add row";
const EDIT_SUBMIT = "Save";
const EXERCISE_LABEL = "Exercise";
const EXERCISE_LOCK_HINT = "To change the movement, delete and re-add the row.";
const SETS_LABEL = "Sets";
const SETS_HINT = "Repeat this row N times.";
const SETS_FIELD_WIDTH = 110;
const SETS_FIELD_MIN = 1;
const TEMPO_LABEL = "Tempo";
const TEMPO_PLACEHOLDER = "e.g. 3-1-X-0";
const DEMO_URL_LABEL = "Demo URL";
const DEMO_URL_PLACEHOLDER = "https://…";
const DEMO_LABEL_LABEL = "Demo label (optional)";
const NOTES_LABEL = "Notes";
const CAPTION_VARIANT = "caption";

export type RowEditorMode = { kind: "create"; schemaId: string } | { kind: "edit"; row: SchemaRow };

type RowEditorModalProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  startDate: string;
  mode: RowEditorMode;
};

const emptyState = (): RowFormState => ({
  exerciseId: null,
  sets: null,
  reps: null,
  load: null,
  side: null,
  tempoInput: "",
  modifierIds: [],
  mediaUrl: "",
  mediaLabel: "",
  notes: [],
});

const seedFromRow = (row: SchemaRow): RowFormState => ({
  exerciseId: row.exerciseId,
  sets: row.sets,
  reps: row.reps,
  load: row.load,
  side: row.side,
  tempoInput: formatTempoInput(row.tempo),
  modifierIds: row.modifiers.map((modifier) => modifier.id),
  mediaUrl: row.media?.url ?? "",
  mediaLabel: row.media?.label ?? "",
  notes: row.notes ?? [],
});

const seedState = (mode: RowEditorMode): RowFormState =>
  mode.kind === "edit" ? seedFromRow(mode.row) : emptyState();

const modeKey = (mode: RowEditorMode): string =>
  mode.kind === "edit" ? `edit:${mode.row.id}` : `create:${mode.schemaId}`;

const resolvedRefsFor = (mode: RowEditorMode): SchemaRow["modifiers"] =>
  mode.kind === "edit" ? mode.row.modifiers : [];

const renderMetaChips = (exercise: Exercise | undefined): ReactElement | null => {
  if (exercise === undefined) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      <Chip variant="tag" size="small" label={EQUIPMENT_LABELS[exercise.primaryEquipment]} />
      <Chip
        variant="tag"
        size="small"
        label={MOVEMENT_TYPE_LABELS[exercise.movementTypeTagPrimary]}
      />
    </Stack>
  );
};

export const RowEditorModal = ({
  open,
  onClose,
  planId,
  startDate,
  mode,
}: RowEditorModalProps): ReactElement => {
  const createRow = useCreateSchemaRow(planId, startDate);
  const updateRow = useUpdateSchemaRow(planId, startDate);
  const { data: exercises = [] } = useExercises();

  const [state, setState] = useState<RowFormState>(() => seedState(mode));
  const [error, setError] = useState<string | null>(null);

  const modeRef = useRef(mode);

  modeRef.current = mode;

  const isSubmittingRef = useRef(false);
  const key = modeKey(mode);

  useEffect(() => {
    setState(seedState(modeRef.current));
    setError(null);
    isSubmittingRef.current = false;
  }, [key]);

  const isCreate = mode.kind === "create";
  const isPending = createRow.isPending || updateRow.isPending;
  const createSchemaId = mode.kind === "create" ? mode.schemaId : null;
  const requestMode = useMemo<RowRequestMode>(
    () =>
      createSchemaId === null ? { kind: "edit" } : { kind: "create", schemaId: createSchemaId },
    [createSchemaId],
  );
  const requestResult = useMemo(() => buildRowRequest(state, requestMode), [state, requestMode]);
  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === state.exerciseId),
    [exercises, state.exerciseId],
  );

  const patch = (next: Partial<RowFormState>): void => setState((prev) => ({ ...prev, ...next }));

  const releaseGuard = (): void => {
    isSubmittingRef.current = false;
  };

  const mutationCallbacks = {
    onSuccess: onClose,
    onError: (cause: Error) => setError(cause.message),
    onSettled: releaseGuard,
  };

  const handleSubmit = (): void => {
    if (isSubmittingRef.current || isPending) {
      return;
    }

    setError(null);

    if (!requestResult.ok) {
      setError(requestResult.error);

      return;
    }

    const { data } = requestResult;

    isSubmittingRef.current = true;

    if (mode.kind === "edit") {
      updateRow.mutate({ schemaRowId: mode.row.id, data }, mutationCallbacks);

      return;
    }

    if ("exerciseId" in data) {
      createRow.mutate(data, mutationCallbacks);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isCreate ? CREATE_TITLE : EDIT_TITLE}
      maxWidth="sm"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      isSubmitting={isPending}
      submitText={isCreate ? CREATE_SUBMIT : EDIT_SUBMIT}
      submitDisabled={!requestResult.ok}
      error={error}
    >
      <Stack spacing={1}>
        <Typography variant={CAPTION_VARIANT} color="text.subtle">
          {EXERCISE_LABEL}
        </Typography>

        <ExercisePicker
          value={state.exerciseId}
          onChange={(exerciseId) => patch({ exerciseId })}
          disabled={!isCreate}
        />

        {renderMetaChips(selectedExercise)}

        {!isCreate && (
          <Typography variant={CAPTION_VARIANT} color="text.subtle">
            {EXERCISE_LOCK_HINT}
          </Typography>
        )}
      </Stack>

      <Stack spacing={1}>
        <Typography variant={CAPTION_VARIANT} color="text.subtle">
          {SETS_LABEL}
        </Typography>

        <NumberField
          value={state.sets ?? Number.NaN}
          onChange={(sets) => patch({ sets: sets > 0 ? sets : null })}
          min={SETS_FIELD_MIN}
          maxWidth={SETS_FIELD_WIDTH}
        />

        <Typography variant={CAPTION_VARIANT} color="text.subtle">
          {SETS_HINT}
        </Typography>
      </Stack>

      <RepsField value={state.reps} onChange={(reps) => patch({ reps })} />

      <LoadEditor value={state.load} onChange={(load) => patch({ load })} />

      <SideField value={state.side} onChange={(side) => patch({ side })} />

      <Stack spacing={1}>
        <Typography variant={CAPTION_VARIANT} color="text.subtle">
          {TEMPO_LABEL}
        </Typography>

        <TextField
          size="small"
          value={state.tempoInput}
          onChange={(event) => patch({ tempoInput: event.target.value })}
          placeholder={TEMPO_PLACEHOLDER}
        />
      </Stack>

      <ModifierPicker
        value={state.modifierIds}
        onChange={(modifierIds) => patch({ modifierIds })}
        resolvedRefs={resolvedRefsFor(mode)}
      />

      <Stack spacing={1}>
        <TextField
          size="small"
          label={DEMO_URL_LABEL}
          value={state.mediaUrl}
          onChange={(event) => patch({ mediaUrl: event.target.value })}
          placeholder={DEMO_URL_PLACEHOLDER}
        />

        <TextField
          size="small"
          label={DEMO_LABEL_LABEL}
          value={state.mediaLabel}
          onChange={(event) => patch({ mediaLabel: event.target.value })}
        />
      </Stack>

      <Stack spacing={1}>
        <Typography variant={CAPTION_VARIANT} color="text.subtle">
          {NOTES_LABEL}
        </Typography>

        <NotesListEditor value={state.notes} onChange={(notes) => patch({ notes })} />
      </Stack>
    </FormModal>
  );
};
