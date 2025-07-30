import { Stack } from "@mui/material";
import { useImperativeHandle, forwardRef } from "react";

import { ProgramFormProps } from "../shared/types";

import { BasicFields } from "./fields/basic-fields";
import { FeaturesField } from "./fields/features-field";
import { PricingFields } from "./fields/pricing-fields";
import { SettingsFields } from "./fields/settings-fields";
import { useProgramForm } from "./hooks/use-program-form";

export interface ProgramFormRef {
  submit: () => void;
}

export const ProgramForm = forwardRef<ProgramFormRef, ProgramFormProps>(
  ({ program, onSubmit, isSubmitting = false }, ref) => {
    const {
      control,
      errors,
      handleSlugChange,
      handleFeaturesChange,
      handleSubmit,
      isSubmitting: formIsSubmitting,
    } = useProgramForm({ program, onSubmit, isSubmitting });

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <Stack spacing={4}>
        <BasicFields
          control={control}
          errors={errors}
          isSubmitting={formIsSubmitting}
          onSlugChange={handleSlugChange}
        />

        <PricingFields control={control} errors={errors} isSubmitting={formIsSubmitting} />

        <FeaturesField
          control={control}
          errors={errors}
          isSubmitting={formIsSubmitting}
          onFeaturesChange={handleFeaturesChange}
        />

        <SettingsFields control={control} errors={errors} isSubmitting={formIsSubmitting} />
      </Stack>
    );
  },
);

ProgramForm.displayName = "ProgramForm";
