import { type ReactElement } from "react";

import { TextField } from "@mui/material";

import { FormCard } from "@app/lib/components/form-card";

import { LanguageNameField } from "./language-name-field";

type LanguageEditFieldsProps = { code: string; isPending: boolean };

export const LanguageEditFields = ({ code, isPending }: LanguageEditFieldsProps): ReactElement => (
  <FormCard title="Basic info">
    <TextField
      label="Code"
      value={code}
      fullWidth
      size="small"
      helperText="The code cannot be changed"
      slotProps={{ input: { readOnly: true } }}
    />
    <LanguageNameField isPending={isPending} />
  </FormCard>
);
