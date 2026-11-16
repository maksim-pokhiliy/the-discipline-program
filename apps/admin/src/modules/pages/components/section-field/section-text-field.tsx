"use client";

import { type ReactElement, useId } from "react";

import { Grid, TextField } from "@mui/material";
import { type FieldPath, type FieldValues, useFormContext } from "react-hook-form";

import { EnglishReference } from "./english-reference";
import { SHARED_FIELD_HELPER, useSectionField } from "./section-field-context";

type SectionTextFieldProps<TValues extends FieldValues> = {
  name: FieldPath<TValues>;
  label: string;
  minRows?: number;
  helperText?: string;
};

export const SectionTextField = <TValues extends FieldValues>({
  name,
  label,
  minRows,
  helperText = "",
}: SectionTextFieldProps<TValues>): ReactElement => {
  const { register, getFieldState, formState } = useFormContext<TValues>();
  const field = useSectionField(name);
  const { error } = getFieldState(name, formState);
  const id = useId();
  const referenceId = `${id}-english`;
  const helperId = `${id}-helper-text`;
  const help = error?.message ?? (field.mode === "shared" ? SHARED_FIELD_HELPER : helperText);
  const description = [field.mode === "word" ? referenceId : "", help ? helperId : ""]
    .filter(Boolean)
    .join(" ");
  const input = (
    <TextField
      id={id}
      label={label}
      fullWidth
      error={error !== undefined}
      helperText={help}
      {...(minRows !== undefined && { multiline: true, minRows })}
      slotProps={{
        input: { readOnly: field.mode === "shared" },
        htmlInput: { ...(description && { "aria-describedby": description }) },
        formHelperText: { id: helperId },
      }}
      {...register(name)}
    />
  );

  return field.mode === "word" ? (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <EnglishReference id={referenceId} text={field.englishText} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>{input}</Grid>
    </Grid>
  ) : (
    input
  );
};
