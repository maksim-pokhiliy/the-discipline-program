"use client";

import { Button, FormHelperText, Stack } from "@mui/material";

import { FormSection } from "@repo/ui";

import { NumberField } from "./number-field";
import { RepDefinitionCompositionRow } from "./rep-definition-composition-row";
import type { RowEditorMode, RowPayloadFormProps } from "./row-editor-types";
import type {
  RepDefinitionCompositionElementDraft,
  RepDefinitionRowFormValue,
} from "./row-payload-draft.types";

const EQUALITY_FORM = "inline_equality";
const TOTAL_REPS_LABEL = "Total reps";
const TOTAL_REPS_HELPER = "sum of reps across the composition";
const COMPOSITION_LABEL = "Composition";
const COMPOSITION_HELPER = "exercises that make up the total";
const ADD_ELEMENT_LABEL = "add element";
const TOTAL_REPS_MIN = 1;
const MIN_COMPOSITION = 1;
const DEFAULT_TOTAL_REPS = 5;
const DEFAULT_COUNT = 1;

export const repDefinitionDefaultValue: RepDefinitionRowFormValue = {
  equality: {
    form: EQUALITY_FORM,
    totalReps: DEFAULT_TOTAL_REPS,
    composition: [{ exerciseId: null, count: DEFAULT_COUNT }],
  },
};

export const toRepDefinitionValue = (mode: RowEditorMode): RepDefinitionRowFormValue => {
  if (mode.kind === "create") {
    return repDefinitionDefaultValue;
  }

  if (mode.row.rowPayload.rowKind === "REP_DEFINITION") {
    const { totalReps, composition } = mode.row.rowPayload.equality;

    return {
      equality: {
        form: EQUALITY_FORM,
        totalReps,
        composition: composition.map((element) => ({
          exerciseId: element.exerciseId,
          count: element.count,
        })),
      },
    };
  }

  return repDefinitionDefaultValue;
};

export const RepDefinitionRowPayloadForm: React.FC<
  RowPayloadFormProps<RepDefinitionRowFormValue>
> = ({ value, onChange, error, disabled = false }) => {
  const equalityError = error?.equality;
  const { composition } = value.equality;
  const canRemove = composition.length > MIN_COMPOSITION;
  const compositionRootMessage = equalityError?.composition?.root?.message;

  const handleTotalRepsChange = (totalReps: number): void => {
    onChange({ equality: { ...value.equality, totalReps } });
  };

  const replaceElement = (index: number, next: RepDefinitionCompositionElementDraft): void => {
    onChange({
      equality: {
        ...value.equality,
        composition: composition.map((element, i) => (i === index ? next : element)),
      },
    });
  };

  const removeElement = (index: number): void => {
    onChange({
      equality: { ...value.equality, composition: composition.filter((_, i) => i !== index) },
    });
  };

  const addElement = (): void => {
    onChange({
      equality: {
        ...value.equality,
        composition: [...composition, { exerciseId: null, count: DEFAULT_COUNT }],
      },
    });
  };

  return (
    <Stack spacing={2}>
      <FormSection label={TOTAL_REPS_LABEL} helper={TOTAL_REPS_HELPER}>
        <NumberField
          value={value.equality.totalReps}
          onChange={handleTotalRepsChange}
          min={TOTAL_REPS_MIN}
          error={equalityError?.totalReps?.message}
          disabled={disabled}
        />
      </FormSection>

      <FormSection label={COMPOSITION_LABEL} helper={COMPOSITION_HELPER}>
        <Stack spacing={1}>
          {composition.map((element, index) => (
            <RepDefinitionCompositionRow
              key={index}
              value={element}
              onChange={(next) => replaceElement(index, next)}
              onRemove={() => removeElement(index)}
              canRemove={canRemove}
              error={equalityError?.composition?.[index]}
              disabled={disabled}
            />
          ))}

          <Button size="tiny" variant="text" onClick={addElement} disabled={disabled}>
            {ADD_ELEMENT_LABEL}
          </Button>

          {compositionRootMessage !== undefined && (
            <FormHelperText error>{compositionRootMessage}</FormHelperText>
          )}
        </Stack>
      </FormSection>
    </Stack>
  );
};
