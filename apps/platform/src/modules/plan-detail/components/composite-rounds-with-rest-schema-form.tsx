"use client";

import { Stack } from "@mui/material";

import { FormSection } from "@repo/ui";

import { CountOrRange } from "./count-or-range-field";
import { RestSpecFields } from "./rest-spec-fields";
import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type CompositeRoundsWithRestParams = ParamsFor<"composite-rounds-with-rest">;

const DEFAULT_COUNT = 5;
const DEFAULT_REST_VALUE = 90;

export const compositeRoundsWithRestDefaultParams: CompositeRoundsWithRestParams = {
  count: DEFAULT_COUNT,
  rest: { duration: { value: DEFAULT_REST_VALUE, unit: "sec" }, scope: "between_rounds" },
};

export const toCompositeRoundsWithRestParams = (
  mode: SchemaEditorMode,
): CompositeRoundsWithRestParams => {
  if (mode.kind === "create") {
    return compositeRoundsWithRestDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype !== "composite-rounds-with-rest") {
    return compositeRoundsWithRestDefaultParams;
  }

  return archetypeParams.params;
};

export const CompositeRoundsWithRestForm: React.FC<
  SchemaParamFormProps<CompositeRoundsWithRestParams>
> = ({ value, onChange, error, disabled = false }) => (
  <Stack spacing={2}>
    <FormSection label="Rounds">
      <CountOrRange
        value={value.count}
        onChange={(count) => onChange({ ...value, count })}
        error={error?.count}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Rest between rounds">
      <RestSpecFields
        value={value.rest}
        onChange={(rest) => onChange({ ...value, rest })}
        error={error?.rest}
        disabled={disabled}
      />
    </FormSection>
  </Stack>
);
