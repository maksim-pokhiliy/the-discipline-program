"use client";

import { TextField } from "@mui/material";

import { SCHEMA_ROW_CONSTANTS } from "@repo/contracts/lms/schema-row";
import { FormSection } from "@repo/ui";

import type { RowEditorMode, RowPayloadFormProps } from "./row-editor-types";

type RestSlotRowFormValue = { notes: string };

const NOTES_HELPER = "optional";

export const restSlotDefaultValue: RestSlotRowFormValue = { notes: "" };

export const toRestSlotValue = (mode: RowEditorMode): RestSlotRowFormValue => {
  if (mode.kind === "create") {
    return restSlotDefaultValue;
  }

  if (mode.row.rowPayload.rowKind === "REST_SLOT") {
    return { notes: mode.row.notes ?? "" };
  }

  return restSlotDefaultValue;
};

export const RestSlotRowPayloadForm: React.FC<RowPayloadFormProps<RestSlotRowFormValue>> = ({
  value,
  onChange,
  disabled = false,
}) => (
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
);
