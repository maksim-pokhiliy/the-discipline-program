"use client";

import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type homePageStorefrontProgramsSchema } from "@repo/contracts/pages";

import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

type StorefrontProgramsSectionData = z.infer<typeof homePageStorefrontProgramsSchema>;

export const StorefrontProgramsSectionForm = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<StorefrontProgramsSectionData>();

  return (
    <TitleSubtitleSectionForm cardTitle="Programs Preview Settings">
      <TextField
        label="Button Text"
        fullWidth
        error={!!errors.buttonText}
        helperText={errors.buttonText?.message}
        {...register("buttonText")}
      />

      <TextField
        label="Button Link"
        fullWidth
        error={!!errors.buttonHref}
        helperText={errors.buttonHref?.message}
        {...register("buttonHref")}
      />
    </TitleSubtitleSectionForm>
  );
};
