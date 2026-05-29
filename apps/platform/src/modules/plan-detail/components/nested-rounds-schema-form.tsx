"use client";

import { FormSection } from "@repo/ui";

import { CountOrRange } from "./count-or-range-field";
import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type NestedRoundsParams = ParamsFor<"nested-rounds-over-rounds">;

const DEFAULT_OUTER_COUNT = 3;

export const nestedRoundsDefaultParams: NestedRoundsParams = {
  outerCount: DEFAULT_OUTER_COUNT,
};

export const toNestedRoundsParams = (mode: SchemaEditorMode): NestedRoundsParams => {
  if (mode.kind === "create") {
    return nestedRoundsDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (
    archetypeParams.archetype !== "nested-rounds-over-rounds" &&
    archetypeParams.archetype !== "nested-rounds-over-parallel-ladder"
  ) {
    return nestedRoundsDefaultParams;
  }

  return archetypeParams.params;
};

export const NestedRoundsForm: React.FC<SchemaParamFormProps<NestedRoundsParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => (
  <FormSection label="Outer rounds">
    <CountOrRange
      value={value.outerCount}
      onChange={(outerCount) => onChange({ outerCount })}
      error={error?.outerCount}
      disabled={disabled}
    />
  </FormSection>
);
