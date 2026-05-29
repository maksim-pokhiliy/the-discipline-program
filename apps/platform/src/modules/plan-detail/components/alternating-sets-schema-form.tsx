"use client";

import { FormSection } from "@repo/ui";

import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";
import { StepArrayFields } from "./step-array-fields";

type AlternatingSetsParams = ParamsFor<"alternating-sets">;

export const alternatingSetsDefaultParams: AlternatingSetsParams = {
  setEnumeration: [1, 3, 5],
};

export const toAlternatingSetsParams = (mode: SchemaEditorMode): AlternatingSetsParams => {
  if (mode.kind === "create") {
    return alternatingSetsDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "alternating-sets") {
    return { setEnumeration: archetypeParams.params.setEnumeration };
  }

  return alternatingSetsDefaultParams;
};

export const AlternatingSetsForm: React.FC<SchemaParamFormProps<AlternatingSetsParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => (
  <FormSection label="Set enumeration" helper="which set indices this schema applies to">
    <StepArrayFields
      value={value.setEnumeration}
      onChange={(setEnumeration) => onChange({ setEnumeration })}
      error={error?.setEnumeration}
      disabled={disabled}
    />
  </FormSection>
);
