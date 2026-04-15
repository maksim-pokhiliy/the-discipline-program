"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { FormCard } from "@repo/ui";

type TitleFields = {
  title: string;
};

type TitleSectionFormProps = {
  cardTitle: string;
};

export const TitleSectionForm = ({ cardTitle }: TitleSectionFormProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<TitleFields>();

  return (
    <FormCard title={cardTitle}>
      <Stack spacing={3}>
        <TextField
          label="Section Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register("title")}
        />
      </Stack>
    </FormCard>
  );
};
