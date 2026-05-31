"use client";

import { Box, Stack } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import { EXERCISE_FORMS, type ExerciseFormKind } from "@repo/contracts/lms/_shared";

import { ExerciseFormPickerTile, type ExerciseFormTile } from "./exercise-form-picker-tile";
import { ExercisePicker } from "./exercise-picker";
import type { ExerciseFormValue } from "./exercise-row-payload-form";

const DEFERRED_EXERCISE_FORMS = new Set<ExerciseFormKind>([
  "compound",
  "cyclical",
  "sandwich",
  "or_alternative",
  "placeholder_ref",
]);
const DEFERRED_HINT = "needs the multi-exercise editor — coming soon";

const FORM_TILES: Record<ExerciseFormKind, Omit<ExerciseFormTile, "form">> = {
  atomic: { label: "Atomic", desc: "single exercise", glyph: "·" },
  compound: {
    label: "Compound",
    desc: "multiple exercises performed back-to-back as ONE row",
    glyph: "+",
  },
  cyclical: { label: "Cyclical", desc: "alternating primary ↔ secondary in cycles", glyph: "↻" },
  sandwich: { label: "Sandwich", desc: "opening → middle → closing (3 fixed slots)", glyph: "▢" },
  or_alternative: {
    label: "OR alternative",
    desc: "primary · or · alternative (scale / equipment / coach pick)",
    glyph: "÷",
  },
  placeholder_ref: {
    label: "Placeholder ref",
    desc: "coach-choice slot from placeholder library",
    glyph: "?",
  },
};

const FORM_GRID_COLUMNS = "repeat(3, 1fr)";

type ExerciseFormPickerProps = {
  value: ExerciseFormValue;
  onChange: (next: ExerciseFormValue) => void;
  error?: FieldErrors<ExerciseFormValue> | undefined;
  disabled?: boolean;
};

export const ExerciseFormPicker = ({
  value,
  onChange,
  error,
  disabled = false,
}: ExerciseFormPickerProps) => {
  const hasExerciseError = error?.exerciseId !== undefined || error?.root !== undefined;

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: "grid", gridTemplateColumns: FORM_GRID_COLUMNS, gap: 0.75 }}>
        {EXERCISE_FORMS.map((form) => (
          <ExerciseFormPickerTile
            key={form}
            tile={{ form, ...FORM_TILES[form] }}
            isSelected={value.form === form}
            isDeferred={DEFERRED_EXERCISE_FORMS.has(form)}
            hint={DEFERRED_HINT}
            onSelect={() => onChange({ form: "atomic", exerciseId: value.exerciseId })}
          />
        ))}
      </Box>

      <Box sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        <ExercisePicker
          value={value.exerciseId}
          onChange={(id) => onChange({ form: "atomic", exerciseId: id })}
          error={hasExerciseError}
          disabled={disabled}
        />
      </Box>
    </Stack>
  );
};
