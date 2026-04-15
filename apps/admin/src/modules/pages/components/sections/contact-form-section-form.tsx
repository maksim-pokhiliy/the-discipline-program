"use client";

import { TextField } from "@mui/material";
import { type FieldError, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type contactPageFormSchema } from "@repo/contracts/cms/pages";
import { FormCard } from "@repo/ui";

import { TitleSubtitleSectionForm } from "./title-subtitle-section-form";

type ContactFormSectionData = z.infer<typeof contactPageFormSchema>;

const fieldError = (error: FieldError | string | undefined) =>
  typeof error === "object" ? error.message : undefined;

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

      <TextField
        label="Sending Label"
        fullWidth
        error={!!errors.sendingLabel}
        helperText={errors.sendingLabel?.message}
        {...register("sendingLabel")}
      />

      <TextField
        label="Error Message"
        fullWidth
        error={!!errors.errorMessage}
        helperText={errors.errorMessage?.message}
        {...register("errorMessage")}
      />

      <FormCard title="Field Labels">
        <TextField
          label="Name Field Label"
          fullWidth
          error={!!errors.fieldLabels?.name}
          helperText={errors.fieldLabels?.name?.message}
          {...register("fieldLabels.name")}
        />

        <TextField
          label="Contact Field Label"
          fullWidth
          error={!!errors.fieldLabels?.contact}
          helperText={errors.fieldLabels?.contact?.message}
          {...register("fieldLabels.contact")}
        />

        <TextField
          label="Program Field Label"
          fullWidth
          error={!!errors.fieldLabels?.program}
          helperText={errors.fieldLabels?.program?.message}
          {...register("fieldLabels.program")}
        />

        <TextField
          label="Message Field Label"
          fullWidth
          error={!!errors.fieldLabels?.message}
          helperText={fieldError(errors.fieldLabels?.message)}
          {...register("fieldLabels.message")}
        />
      </FormCard>

      <FormCard title="Field Placeholders">
        <TextField
          label="Contact Field Placeholder"
          fullWidth
          error={!!errors.fieldPlaceholders?.contact}
          helperText={errors.fieldPlaceholders?.contact?.message}
          {...register("fieldPlaceholders.contact")}
        />

        <TextField
          label="Message Field Placeholder"
          fullWidth
          error={!!errors.fieldPlaceholders?.message}
          helperText={fieldError(errors.fieldPlaceholders?.message)}
          {...register("fieldPlaceholders.message")}
        />
      </FormCard>
    </TitleSubtitleSectionForm>
  );
};
