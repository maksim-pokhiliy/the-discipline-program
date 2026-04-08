"use client";

import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type homePageContactSchema } from "@repo/contracts/pages";

import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

type ContactSectionData = z.infer<typeof homePageContactSchema>;

export const ContactSectionForm = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContactSectionData>();

  return (
    <TitleSubtitleSectionForm cardTitle="Final CTA Settings">
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
