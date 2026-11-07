import { type ReactElement } from "react";

import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type CreateLocaleRequest } from "@repo/contracts/cms/locale";

type LanguageNameFieldProps = { isPending: boolean };

export const LanguageNameField = ({ isPending }: LanguageNameFieldProps): ReactElement => {
  const {
    register,
    formState: { errors },
  } = useFormContext<Pick<CreateLocaleRequest, "name">>();

  return (
    <TextField
      label="Name"
      placeholder="e.g. Українська"
      variant="outlined"
      fullWidth
      size="small"
      disabled={isPending}
      error={!!errors.name}
      helperText={errors.name?.message ?? "Shown to visitors in the language switcher"}
      {...register("name")}
    />
  );
};
