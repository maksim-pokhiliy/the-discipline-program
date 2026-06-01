"use client";

import type { ReactNode } from "react";

import { Box, Stack } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  EXERCISE_FORMS,
  type CompoundRow,
  type CyclicalCompound,
  type ExerciseFormKind,
  type OrAlternative,
  type SandwichCompound,
} from "@repo/contracts/lms/_shared";

import { CompoundFormEditor } from "./compound-form-editor";
import { CyclicalFormEditor } from "./cyclical-form-editor";
import type { ExerciseFormValue } from "./exercise-form-draft.types";
import { ExerciseFormPickerTile, type ExerciseFormTile } from "./exercise-form-picker-tile";
import { ExercisePicker } from "./exercise-picker";
import { OrAlternativeFormEditor } from "./or-alternative-form-editor";
import { SandwichFormEditor } from "./sandwich-form-editor";

type AtomicFormValue = Extract<ExerciseFormValue, { form: "atomic" }>;
type CompoundFormValue = Extract<ExerciseFormValue, { form: "compound" }>;
type CyclicalFormValue = Extract<ExerciseFormValue, { form: "cyclical" }>;
type SandwichFormValue = Extract<ExerciseFormValue, { form: "sandwich" }>;
type OrAlternativeFormValue = Extract<ExerciseFormValue, { form: "or_alternative" }>;
type PlaceholderRefFormValue = Extract<ExerciseFormValue, { form: "placeholder_ref" }>;

const COMPOUND_SEED_REPS = 10;
const SANDWICH_OPENING_REPS = 12;
const SANDWICH_MIDDLE_REPS = 9;
const SANDWICH_CLOSING_REPS = 6;
const OR_PRIMARY_REPS = 5;
const OR_ALT_REPS = 10;
const CYCLICAL_SEED_PRIMARY_REPS = 1;
const CYCLICAL_SEED_SECONDARY_REPS = 1;
const OR_SEED_PURPOSE = "scale_down";

const FORM_GRID_COLUMNS = "repeat(3, 1fr)";
const NO_DEFERRED_HINT = "";

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

const buildExerciseFormDraft = (
  form: ExerciseFormKind,
  current: ExerciseFormValue,
): ExerciseFormValue => {
  switch (form) {
    case "atomic":
      return { form: "atomic", exerciseId: current.form === "atomic" ? current.exerciseId : null };
    case "compound":
      return {
        form: "compound",
        compound: {
          elements: [
            { exerciseId: null, reps: { kind: "count", value: COMPOUND_SEED_REPS } },
            { exerciseId: null, reps: { kind: "count", value: COMPOUND_SEED_REPS } },
          ],
        },
      };
    case "cyclical":
      return {
        form: "cyclical",
        cyclical: {
          primaryExerciseId: null,
          secondaryExerciseId: null,
          cycles: [
            {
              primaryReps: CYCLICAL_SEED_PRIMARY_REPS,
              secondaryReps: CYCLICAL_SEED_SECONDARY_REPS,
            },
          ],
        },
      };
    case "sandwich":
      return {
        form: "sandwich",
        sandwich: {
          opening: { exerciseId: null, reps: { kind: "count", value: SANDWICH_OPENING_REPS } },
          middle: { exerciseId: null, reps: { kind: "count", value: SANDWICH_MIDDLE_REPS } },
          closing: { exerciseId: null, reps: { kind: "count", value: SANDWICH_CLOSING_REPS } },
        },
      };
    case "or_alternative":
      return {
        form: "or_alternative",
        orAlternative: {
          primaryExerciseId: null,
          primaryReps: { kind: "count", value: OR_PRIMARY_REPS },
          alternativeExerciseId: null,
          alternativeReps: { kind: "count", value: OR_ALT_REPS },
          purpose: OR_SEED_PURPOSE,
        },
      };
    case "placeholder_ref":
      return { form: "placeholder_ref", placeholderExerciseId: null };
    default:
      return form satisfies never;
  }
};

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
  const atomicArmError: FieldErrors<AtomicFormValue> | undefined =
    value.form === "atomic" ? error : undefined;
  const compoundArmError: FieldErrors<CompoundFormValue> | undefined =
    value.form === "compound" ? error : undefined;
  const cyclicalArmError: FieldErrors<CyclicalFormValue> | undefined =
    value.form === "cyclical" ? error : undefined;
  const sandwichArmError: FieldErrors<SandwichFormValue> | undefined =
    value.form === "sandwich" ? error : undefined;
  const orAlternativeArmError: FieldErrors<OrAlternativeFormValue> | undefined =
    value.form === "or_alternative" ? error : undefined;
  const placeholderArmError: FieldErrors<PlaceholderRefFormValue> | undefined =
    value.form === "placeholder_ref" ? error : undefined;

  const hasExerciseError =
    atomicArmError?.exerciseId !== undefined || atomicArmError?.root !== undefined;
  const hasPlaceholderError =
    placeholderArmError?.placeholderExerciseId !== undefined ||
    placeholderArmError?.root !== undefined;

  const compoundError: FieldErrors<CompoundRow> | undefined = compoundArmError?.compound;
  const cyclicalError: FieldErrors<CyclicalCompound> | undefined = cyclicalArmError?.cyclical;
  const sandwichError: FieldErrors<SandwichCompound> | undefined = sandwichArmError?.sandwich;
  const orAlternativeError: FieldErrors<OrAlternative> | undefined =
    orAlternativeArmError?.orAlternative;

  const renderBody = (): ReactNode => {
    switch (value.form) {
      case "atomic":
        return (
          <ExercisePicker
            value={value.exerciseId}
            onChange={(id) => onChange({ form: "atomic", exerciseId: id })}
            error={hasExerciseError}
            disabled={disabled}
          />
        );
      case "compound":
        return (
          <CompoundFormEditor
            value={value.compound}
            onChange={(compound) => onChange({ form: "compound", compound })}
            error={compoundError}
            disabled={disabled}
          />
        );
      case "cyclical":
        return (
          <CyclicalFormEditor
            value={value.cyclical}
            onChange={(cyclical) => onChange({ form: "cyclical", cyclical })}
            error={cyclicalError}
            disabled={disabled}
          />
        );
      case "sandwich":
        return (
          <SandwichFormEditor
            value={value.sandwich}
            onChange={(sandwich) => onChange({ form: "sandwich", sandwich })}
            error={sandwichError}
            disabled={disabled}
          />
        );
      case "or_alternative":
        return (
          <OrAlternativeFormEditor
            value={value.orAlternative}
            onChange={(orAlternative) => onChange({ form: "or_alternative", orAlternative })}
            error={orAlternativeError}
            disabled={disabled}
          />
        );
      case "placeholder_ref":
        return (
          <ExercisePicker
            placeholderOnly
            value={value.placeholderExerciseId}
            onChange={(id) => onChange({ form: "placeholder_ref", placeholderExerciseId: id })}
            error={hasPlaceholderError}
            disabled={disabled}
          />
        );
      default:
        value satisfies never;

        return null;
    }
  };

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: "grid", gridTemplateColumns: FORM_GRID_COLUMNS, gap: 0.75 }}>
        {EXERCISE_FORMS.map((form) => (
          <ExerciseFormPickerTile
            key={form}
            tile={{ form, ...FORM_TILES[form] }}
            isSelected={value.form === form}
            isDeferred={false}
            hint={NO_DEFERRED_HINT}
            onSelect={() => onChange(buildExerciseFormDraft(form, value))}
          />
        ))}
      </Box>

      <Box sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        {renderBody()}
      </Box>
    </Stack>
  );
};
