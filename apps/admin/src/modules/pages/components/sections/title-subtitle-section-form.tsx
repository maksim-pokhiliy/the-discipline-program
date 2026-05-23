"use client";

import { Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { FormCard } from "@app/lib/components/form-card";

type TitleSubtitleFields = {
  title: string;
  subtitle: string;
};

type TitleSubtitleSectionFormProps = {
  cardTitle: string;
  children?: React.ReactNode;
};

export const TitleSubtitleSectionForm = ({
  cardTitle,
  children,
}: TitleSubtitleSectionFormProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<TitleSubtitleFields>();

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

        <TextField
          label="Section Subtitle"
          fullWidth
          multiline
          minRows={2}
          error={!!errors.subtitle}
          helperText={errors.subtitle?.message}
          {...register("subtitle")}
        />

        {children}
      </Stack>
    </FormCard>
  );
};
