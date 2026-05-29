"use client";

import { Stack, TextField } from "@mui/material";

import { FormSection } from "@repo/ui";

import { CountOrRange } from "./count-or-range-field";
import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";
import type { ParamsFor } from "./schema-param-form-registry";

type NamedThemedSetsParams = ParamsFor<"named-themed-sets">;

const DEFAULT_COUNT = 4;

export const namedThemedSetsDefaultParams: NamedThemedSetsParams = {
  count: DEFAULT_COUNT,
  theme: "",
};

export const toNamedThemedSetsParams = (mode: SchemaEditorMode): NamedThemedSetsParams => {
  if (mode.kind === "create") {
    return namedThemedSetsDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype !== "named-themed-sets") {
    return namedThemedSetsDefaultParams;
  }

  return archetypeParams.params;
};

export const NamedThemedSetsForm: React.FC<SchemaParamFormProps<NamedThemedSetsParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => (
  <Stack spacing={2}>
    <FormSection label="Rounds">
      <CountOrRange
        value={value.count}
        onChange={(count) => onChange({ ...value, count })}
        error={error?.count}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Theme">
      <TextField
        value={value.theme}
        onChange={(e) => onChange({ ...value, theme: e.target.value })}
        size="small"
        error={error?.theme !== undefined}
        helperText={error?.theme?.message}
        disabled={disabled}
        required
      />
    </FormSection>
  </Stack>
);
