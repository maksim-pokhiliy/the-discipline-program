"use client";

import { Stack } from "@mui/material";

import { FormSection } from "@repo/ui";

import { NumberField } from "./number-field";
import { RestSpecFields } from "./rest-spec-fields";
import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";
import type { ParamsFor } from "./schema-param-form-registry";

type NestedCompositeOverLadderParams = ParamsFor<"nested-composite-rounds-over-ladder">;

const DEFAULT_OUTER_COUNT = 5;
const DEFAULT_REST_VALUE = 60;
const OUTER_COUNT_FIELD_MIN = 1;
const OUTER_COUNT_FIELD_STEP = 1;
const OUTER_COUNT_FIELD_WIDTH = 140;

export const nestedCompositeOverLadderDefaultParams: NestedCompositeOverLadderParams = {
  outerCount: DEFAULT_OUTER_COUNT,
  rest: { duration: { value: DEFAULT_REST_VALUE, unit: "sec" }, scope: "between_rounds" },
};

export const toNestedCompositeOverLadderParams = (
  mode: SchemaEditorMode,
): NestedCompositeOverLadderParams => {
  if (mode.kind === "create") {
    return nestedCompositeOverLadderDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "nested-composite-rounds-over-ladder") {
    const { outerCount, rest } = archetypeParams.params;

    return { outerCount, rest };
  }

  return nestedCompositeOverLadderDefaultParams;
};

export const NestedCompositeOverLadderForm: React.FC<
  SchemaParamFormProps<NestedCompositeOverLadderParams>
> = ({ value, onChange, error, disabled = false }) => (
  <Stack spacing={2}>
    <FormSection label="Outer rounds">
      <NumberField
        label="Rounds"
        value={value.outerCount}
        onChange={(outerCount) => onChange({ ...value, outerCount })}
        min={OUTER_COUNT_FIELD_MIN}
        step={OUTER_COUNT_FIELD_STEP}
        error={error?.outerCount?.message}
        disabled={disabled}
        maxWidth={OUTER_COUNT_FIELD_WIDTH}
      />
    </FormSection>

    <FormSection label="Rest">
      <RestSpecFields
        value={value.rest}
        onChange={(rest) => onChange({ ...value, rest })}
        error={error?.rest}
        disabled={disabled}
      />
    </FormSection>
  </Stack>
);
