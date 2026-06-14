"use client";

import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";

import { Stack, TextField, Typography } from "@mui/material";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { FormModal } from "@repo/ui";

import { useCreateSchemaRow, useUpdateSchemaRow } from "@app/lib/hooks";

import { buildRowRequest } from "../lib/build-row-request";
import { formatTempoInput } from "../lib/format-tempo-input";
import type { RowFormState, RowRequestMode } from "../lib/row-form-state.types";

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
const SETS_FIELD_WIDTH = 110;
const SETS_FIELD_MIN = 1;
const TEMPO_LABEL = "Tempo";
const TEMPO_PLACEHOLDER = "e.g. 3-1-X-0";
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
  notes: row.notes ?? [],
});

const seedState = (mode: RowEditorMode): RowFormState =>
  mode.kind === "edit" ? seedFromRow(mode.row) : emptyState();

const modeKey = (mode: RowEditorMode): string =>
  mode.kind === "edit" ? `edit:${mode.row.id}` : `create:${mode.schemaId}`;

const resolvedRefsFor = (mode: RowEditorMode): SchemaRow["modifiers"] =>
  mode.kind === "edit" ? mode.row.modifiers : [];

export const RowEditorModal = ({
  open,
  onClose,
  planId,
  startDate,
  mode,
}: RowEditorModalProps): ReactElement => {
  const createRow = useCreateSchemaRow(planId, startDate);
  const updateRow = useUpdateSchemaRow(planId, startDate);

  const [state, setState] = useState<RowFormState>(() => seedState(mode));
  const [submitError, setSubmitError] = useState<{ field: string | null; message: string } | null>(
    null,
  );

  const modeRef = useRef(mode);

  modeRef.current = mode;

  const isSubmittingRef = useRef(false);
  const key = modeKey(mode);

  useEffect(() => {
    setState(seedState(modeRef.current));
    setSubmitError(null);
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

  const patch = (next: Partial<RowFormState>): void => {
    setSubmitError(null);
    setState((prev) => ({ ...prev, ...next }));
  };

  const errorFor = (field: string): string | undefined =>
    submitError !== null && submitError.field === field ? submitError.message : undefined;

  const releaseGuard = (): void => {
    isSubmittingRef.current = false;
  };

  const mutationCallbacks = {
    onSuccess: onClose,
    onError: (cause: Error) => setSubmitError({ field: null, message: cause.message }),
    onSettled: releaseGuard,
  };

  const handleSubmit = (): void => {
    if (isSubmittingRef.current || isPending) {
      return;
    }

    setSubmitError(null);

    if (!requestResult.ok) {
      setSubmitError({ field: requestResult.field ?? null, message: requestResult.error });

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
      error={submitError !== null && submitError.field === null ? submitError.message : null}
    >
      <Stack spacing={1}>
        <ExercisePicker
          value={state.exerciseId}
          onChange={(exerciseId) => patch({ exerciseId })}
          disabled={!isCreate}
          compact
          label={EXERCISE_LABEL}
          error={errorFor("exerciseId") !== undefined}
        />

        {!isCreate && (
          <Typography variant={CAPTION_VARIANT} color="text.subtle">
            {EXERCISE_LOCK_HINT}
          </Typography>
        )}
      </Stack>

      <NumberField
        label={SETS_LABEL}
        value={state.sets ?? Number.NaN}
        onChange={(sets) => patch({ sets: sets > 0 ? sets : null })}
        min={SETS_FIELD_MIN}
        maxWidth={SETS_FIELD_WIDTH}
        error={errorFor("sets")}
      />

      <RepsField value={state.reps} onChange={(reps) => patch({ reps })} error={errorFor("reps")} />

      <LoadEditor
        value={state.load}
        onChange={(load) => patch({ load })}
        error={errorFor("load")}
      />

      <SideField value={state.side} onChange={(side) => patch({ side })} error={errorFor("side")} />

      <TextField
        size="small"
        label={TEMPO_LABEL}
        value={state.tempoInput}
        onChange={(event) => patch({ tempoInput: event.target.value })}
        placeholder={TEMPO_PLACEHOLDER}
        error={errorFor("tempo") !== undefined}
        helperText={errorFor("tempo")}
      />

      <ModifierPicker
        value={state.modifierIds}
        onChange={(modifierIds) => patch({ modifierIds })}
        resolvedRefs={resolvedRefsFor(mode)}
        error={errorFor("modifierIds")}
      />

      <NotesListEditor value={state.notes} onChange={(notes) => patch({ notes })} />
    </FormModal>
  );
};
