import { type ReactElement } from "react";

import { TextField } from "@mui/material";

import { type ResultDraft } from "../../utils/result-form-config";

const INPUT_MODE = "numeric";

export type ResultNumberFieldProps = {
  fieldKey: string;
  label: string;
  draft: ResultDraft;
  onChange: (key: string, value: string) => void;
};

export const ResultNumberField = ({
  fieldKey,
  label,
  draft,
  onChange,
}: ResultNumberFieldProps): ReactElement => (
  <TextField
    label={label}
    type="number"
    value={draft[fieldKey] ?? ""}
    onChange={(event) => onChange(fieldKey, event.target.value)}
    fullWidth
    slotProps={{ htmlInput: { inputMode: INPUT_MODE, min: 0 } }}
  />
);
