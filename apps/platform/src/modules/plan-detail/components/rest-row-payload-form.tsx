"use client";

import { Stack, TextField } from "@mui/material";

import { SCHEMA_ROW_CONSTANTS } from "@repo/contracts/lms/schema-row";
import { FormSection } from "@repo/ui";

import { RestSpecFields, type RestSpecFormValue } from "./rest-spec-fields";
import type { RowEditorMode, RowPayloadFormProps } from "./row-editor-types";

type RestRowFormValue = { parsed: RestSpecFormValue; notes: string; raw?: string };

const DEFAULT_REST_PARSED: RestSpecFormValue = {
  duration: { value: 90, unit: "sec" },
  scope: "between_sets",
};

const RAW_TEXT_HELPER = "optional · preserves coach's exact wording for round-trip";
const NOTES_HELPER = "optional";

export const restDefaultValue: RestRowFormValue = {
  parsed: DEFAULT_REST_PARSED,
  notes: "",
  raw: "",
};

export const toRestValue = (mode: RowEditorMode): RestRowFormValue => {
  if (mode.kind === "create") {
    return restDefaultValue;
  }

  if (mode.row.rowPayload.rowKind === "REST") {
    return {
      parsed: mode.row.rowPayload.parsed,
      notes: mode.row.notes ?? "",
      raw: mode.row.rowPayload.raw,
    };
  }

  return restDefaultValue;
};

export const RestRowPayloadForm: React.FC<RowPayloadFormProps<RestRowFormValue>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => (
  <Stack spacing={2}>
    <FormSection label="Rest spec">
      <RestSpecFields
        value={value.parsed}
        onChange={(parsed) => onChange({ ...value, parsed })}
        error={error?.parsed}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Original raw text" helper={RAW_TEXT_HELPER}>
      <TextField
        fullWidth
        size="small"
        value={value.raw ?? ""}
        onChange={(e) => onChange({ ...value, raw: e.target.value })}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Notes" helper={NOTES_HELPER}>
      <TextField
        fullWidth
        multiline
        size="small"
        value={value.notes}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        inputProps={{ maxLength: SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH }}
        disabled={disabled}
      />
    </FormSection>
  </Stack>
);
