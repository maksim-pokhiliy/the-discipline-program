"use client";

import { Button, FormHelperText, Stack, TextField, ToggleButton } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  PLACEHOLDER_KINDS,
  type PerSetSubstitution,
  type PlaceholderKind,
  type PlaceholderPayload,
} from "@repo/contracts/lms/_shared";
import { FormSection, LabeledToggleGroup } from "@repo/ui";

import { PlaceholderPerSetEditor } from "./placeholder-per-set-editor";
import type { RowEditorMode, RowPayloadFormProps } from "./row-editor-types";
import type {
  PerSetSubstitutionDraft,
  PlaceholderPayloadDraft,
  PlaceholderRowFormValue,
} from "./row-payload-draft.types";

const PLACEHOLDER_KIND_LABEL = "kind";
const TEXT_LABEL = "Text";
const TEXT_HELPER = "what the coach sees in place of a concrete exercise";
const PER_SET_LABEL = "Per-set substitutions";
const PER_SET_HELPER = "optional · map each set to a concrete exercise";
const ADD_PER_SET_LABEL = "add per-set substitutions";
const REMOVE_PER_SET_LABEL = "remove substitutions";
const DEFAULT_PLACEHOLDER_KIND: PlaceholderKind = "muscle_group_reference";

const PLACEHOLDER_KIND_LABELS: Record<PlaceholderKind, string> = {
  muscle_group_reference: "Muscle group",
  purpose_category: "Purpose category",
  coach_choice_slot: "Coach choice",
};

const EMPTY_PER_SET: PerSetSubstitutionDraft = {
  placeholderName: "",
  assignments: [{ setIndex: 1, exerciseId: null }],
};

const toPerSetDraft = (perSet: PerSetSubstitution): PerSetSubstitutionDraft => ({
  placeholderName: perSet.placeholderName,
  assignments: perSet.assignments.map((assignment) => ({
    setIndex: assignment.setIndex,
    exerciseId: assignment.exerciseId ?? null,
  })),
});

export const placeholderDefaultValue: PlaceholderRowFormValue = {
  placeholder: { placeholderKind: DEFAULT_PLACEHOLDER_KIND, text: "" },
};

export const toPlaceholderValue = (mode: RowEditorMode): PlaceholderRowFormValue => {
  if (mode.kind === "create") {
    return placeholderDefaultValue;
  }

  if (mode.row.rowPayload.rowKind === "PLACEHOLDER") {
    const { placeholderKind, text, perSetAssignments, pairedConcreteRowId } =
      mode.row.rowPayload.placeholder;

    return {
      placeholder: {
        placeholderKind,
        text,
        ...(perSetAssignments !== undefined && {
          perSetAssignments: toPerSetDraft(perSetAssignments),
        }),
        ...(pairedConcreteRowId !== undefined && { pairedConcreteRowId }),
      },
    };
  }

  return placeholderDefaultValue;
};

export const PlaceholderRowPayloadForm: React.FC<RowPayloadFormProps<PlaceholderRowFormValue>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const placeholderError: FieldErrors<PlaceholderPayload> | undefined = error?.placeholder;
  const { perSetAssignments } = value.placeholder;

  const handleKindChange = (_: unknown, next: PlaceholderKind | null): void => {
    if (next === null) {
      return;
    }

    onChange({ placeholder: { ...value.placeholder, placeholderKind: next } });
  };

  const addPerSet = (): void => {
    onChange({ placeholder: { ...value.placeholder, perSetAssignments: EMPTY_PER_SET } });
  };

  const removePerSet = (): void => {
    const next: PlaceholderPayloadDraft = {
      placeholderKind: value.placeholder.placeholderKind,
      text: value.placeholder.text,
      ...(value.placeholder.pairedConcreteRowId !== undefined && {
        pairedConcreteRowId: value.placeholder.pairedConcreteRowId,
      }),
    };

    onChange({ placeholder: next });
  };

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <LabeledToggleGroup
          label={PLACEHOLDER_KIND_LABEL}
          value={value.placeholder.placeholderKind}
          onChange={handleKindChange}
          disabled={disabled}
        >
          {PLACEHOLDER_KINDS.map((kind) => (
            <ToggleButton key={kind} value={kind}>
              {PLACEHOLDER_KIND_LABELS[kind]}
            </ToggleButton>
          ))}
        </LabeledToggleGroup>

        {placeholderError?.placeholderKind?.message !== undefined && (
          <FormHelperText error>{placeholderError.placeholderKind.message}</FormHelperText>
        )}
      </Stack>

      <FormSection label={TEXT_LABEL} helper={TEXT_HELPER}>
        <TextField
          fullWidth
          size="small"
          value={value.placeholder.text}
          onChange={(e) =>
            onChange({ placeholder: { ...value.placeholder, text: e.target.value } })
          }
          error={placeholderError?.text !== undefined}
          helperText={placeholderError?.text?.message}
          disabled={disabled}
        />
      </FormSection>

      <FormSection label={PER_SET_LABEL} helper={PER_SET_HELPER}>
        {perSetAssignments === undefined ? (
          <Button size="tiny" variant="text" onClick={addPerSet} disabled={disabled}>
            {ADD_PER_SET_LABEL}
          </Button>
        ) : (
          <Stack spacing={1}>
            <PlaceholderPerSetEditor
              value={perSetAssignments}
              onChange={(next) =>
                onChange({ placeholder: { ...value.placeholder, perSetAssignments: next } })
              }
              error={placeholderError?.perSetAssignments}
              disabled={disabled}
            />

            <Button size="tiny" variant="text" onClick={removePerSet} disabled={disabled}>
              {REMOVE_PER_SET_LABEL}
            </Button>
          </Stack>
        )}
      </FormSection>
    </Stack>
  );
};
