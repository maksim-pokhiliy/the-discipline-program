"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import { EXERCISE_FORMS, type ExerciseFormKind } from "@repo/contracts/lms/_shared";

import { ExerciseFormPickerTile, type ExerciseFormTile } from "./exercise-form-picker-tile";
import { ExercisePicker } from "./exercise-picker";
import type { ExerciseFormValue } from "./exercise-row-payload-form";

type AtomicFormValue = Extract<ExerciseFormValue, { form: "atomic" }>;

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
const MULTI_FORM_NOTICE_PREFIX = "Multi-exercise form (";
const MULTI_FORM_NOTICE_SUFFIX =
  ") — editing the exercise itself is coming soon; it stays preserved on save.";

const buildMultiFormNotice = (form: ExerciseFormKind): string =>
  `${MULTI_FORM_NOTICE_PREFIX}${FORM_TILES[form].label}${MULTI_FORM_NOTICE_SUFFIX}`;

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
  const isAtomic = value.form === "atomic";
  const atomicError: FieldErrors<AtomicFormValue> | undefined = isAtomic ? error : undefined;
  const hasExerciseError = atomicError?.exerciseId !== undefined || atomicError?.root !== undefined;
  const atomicExerciseId = value.form === "atomic" ? value.exerciseId : null;

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: "grid", gridTemplateColumns: FORM_GRID_COLUMNS, gap: 0.75 }}>
        {EXERCISE_FORMS.map((form) => (
          <ExerciseFormPickerTile
            key={form}
            tile={{ form, ...FORM_TILES[form] }}
            isSelected={value.form === form}
            isDeferred={!isAtomic || DEFERRED_EXERCISE_FORMS.has(form)}
            hint={DEFERRED_HINT}
            onSelect={() => onChange({ form: "atomic", exerciseId: atomicExerciseId })}
          />
        ))}
      </Box>

      <Box sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        {value.form === "atomic" ? (
          <ExercisePicker
            value={value.exerciseId}
            onChange={(id) => onChange({ form: "atomic", exerciseId: id })}
            error={hasExerciseError}
            disabled={disabled}
          />
        ) : (
          <Typography variant="caption" color="text.subtle">
            {buildMultiFormNotice(value.form)}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};
