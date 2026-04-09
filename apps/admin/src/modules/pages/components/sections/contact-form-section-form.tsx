"use client";

import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type contactPageFormSchema } from "@repo/contracts/pages";

import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

type ContactFormSectionData = z.infer<typeof contactPageFormSchema>;

export const ContactFormSectionForm = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<ContactFormSectionData>();

  return (
    <TitleSubtitleSectionForm cardTitle="Contact Form Settings">
      <TextField
        label="Success Title"
        fullWidth
        error={!!errors.successTitle}
        helperText={errors.successTitle?.message}
        {...register("successTitle")}
      />

      <TextField
        label="Success Message"
        fullWidth
        multiline
        minRows={2}
        error={!!errors.successMessage}
        helperText={errors.successMessage?.message}
        {...register("successMessage")}
      />

      <TextField
        label="Submit Button Label"
        fullWidth
        error={!!errors.submitLabel}
        helperText={errors.submitLabel?.message}
        {...register("submitLabel")}
      />
    </TitleSubtitleSectionForm>
  );
};
