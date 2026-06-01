"use client";

import { FormHelperText, Stack, ToggleButton, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  OR_ALTERNATIVE_PURPOSES,
  type OrAlternative,
  type OrAlternativePurpose,
} from "@repo/contracts/lms/_shared";
import { FormSection, LabeledToggleGroup } from "@repo/ui";

import type { OrAlternativeFormDraft } from "./exercise-form-draft.types";
import { ExercisePicker } from "./exercise-picker";
import { RepNotationEditor } from "./rep-notation-editor";
import { VoCard } from "./vo-card";

const PRIMARY_HEAD = "primary";
const ALTERNATIVE_HEAD = "alternative";
const OR_DIVIDER = "· OR ·";
const PURPOSE_LABEL = "purpose";

const OR_ALTERNATIVE_PURPOSE_LABELS: Record<OrAlternativePurpose, string> = {
  scale_down: "Scale down",
  equipment_substitute: "Equipment substitute",
  coach_choice: "Coach choice",
};

type OrAlternativeFormEditorProps = {
  value: OrAlternativeFormDraft;
  onChange: (next: OrAlternativeFormDraft) => void;
  error?: FieldErrors<OrAlternative> | undefined;
  disabled?: boolean;
};

export const OrAlternativeFormEditor = ({
  value,
  onChange,
  error,
  disabled = false,
}: OrAlternativeFormEditorProps) => {
  const handlePurposeChange = (_: unknown, next: OrAlternativePurpose | null): void => {
    if (next === null) {
      return;
    }

    onChange({ ...value, purpose: next });
  };

  return (
    <Stack spacing={2}>
      <VoCard head={PRIMARY_HEAD}>
        <ExercisePicker
          compact
          value={value.primaryExerciseId}
          onChange={(id) => onChange({ ...value, primaryExerciseId: id })}
          error={error?.primaryExerciseId !== undefined}
          disabled={disabled}
        />

        <FormSection label="reps">
          <RepNotationEditor
            value={value.primaryReps}
            onChange={(reps) => onChange({ ...value, primaryReps: reps })}
            error={error?.primaryReps}
            disabled={disabled}
          />
        </FormSection>
      </VoCard>

      <Typography variant="caption" color="text.subtle" sx={{ textAlign: "center" }}>
        {OR_DIVIDER}
      </Typography>

      <VoCard head={ALTERNATIVE_HEAD}>
        <ExercisePicker
          compact
          value={value.alternativeExerciseId}
          onChange={(id) => onChange({ ...value, alternativeExerciseId: id })}
          error={error?.alternativeExerciseId !== undefined}
          disabled={disabled}
        />

        <FormSection label="reps">
          <RepNotationEditor
            value={value.alternativeReps}
            onChange={(reps) => onChange({ ...value, alternativeReps: reps })}
            error={error?.alternativeReps}
            disabled={disabled}
          />
        </FormSection>
      </VoCard>

      <Stack spacing={0.5}>
        <LabeledToggleGroup
          label={PURPOSE_LABEL}
          value={value.purpose}
          onChange={handlePurposeChange}
          disabled={disabled}
        >
          {OR_ALTERNATIVE_PURPOSES.map((purpose) => (
            <ToggleButton key={purpose} value={purpose}>
              {OR_ALTERNATIVE_PURPOSE_LABELS[purpose]}
            </ToggleButton>
          ))}
        </LabeledToggleGroup>

        {error?.purpose?.message !== undefined && (
          <FormHelperText error>{error.purpose.message}</FormHelperText>
        )}
      </Stack>
    </Stack>
  );
};
