import { type ReactElement } from "react";

import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type CreateLocaleRequest } from "@repo/contracts/cms/locale";

type LanguageCodeFieldProps = { isPending: boolean };

export const LanguageCodeField = ({ isPending }: LanguageCodeFieldProps): ReactElement => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateLocaleRequest>();

  return (
    <TextField
      label="Code"
      placeholder="e.g. uk"
      variant="outlined"
      fullWidth
      size="small"
      disabled={isPending}
      error={!!errors.code}
      helperText={
        errors.code?.message ??
        "Two or three lowercase letters that start the language's links, as in /uk. It cannot be changed later."
      }
      {...register("code")}
    />
  );
};
