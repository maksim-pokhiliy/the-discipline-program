"use client";

import { Stack, TextField, Typography } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";
import { SCHEMA_ROW_CONSTANTS } from "@repo/contracts/lms/schema-row";
import { FormSection } from "@repo/ui";

import { LoadEditor } from "./load-editor";
import type { RowEditorMode, RowPayloadFormProps } from "./row-editor-types";
import { buildDefaultLoad } from "./weight-load-defaults";

type StandaloneLoadRowFormValue = { load: Load; notes: string };

const LOAD_SCOPE_CAPTION = "Applies to all preceding rows";
const NOTES_HELPER = "optional";

export const standaloneLoadDefaultValue: StandaloneLoadRowFormValue = {
  load: buildDefaultLoad("absolute"),
  notes: "",
};

export const toStandaloneLoadValue = (mode: RowEditorMode): StandaloneLoadRowFormValue => {
  if (mode.kind === "create") {
    return standaloneLoadDefaultValue;
  }

  if (mode.row.rowPayload.rowKind === "STANDALONE_LOAD") {
    return { load: mode.row.rowPayload.load, notes: mode.row.notes ?? "" };
  }

  return standaloneLoadDefaultValue;
};

export const StandaloneLoadRowPayloadForm: React.FC<
  RowPayloadFormProps<StandaloneLoadRowFormValue>
> = ({ value, onChange, error, disabled = false }) => (
  <Stack spacing={2}>
    <FormSection label="Load">
      <Stack spacing={1}>
        <LoadEditor
          value={value.load}
          onChange={(load) => onChange({ ...value, load })}
          error={error?.load}
          disabled={disabled}
        />

        <Typography variant="caption" color="text.subtle">
          {LOAD_SCOPE_CAPTION}
        </Typography>
      </Stack>
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
