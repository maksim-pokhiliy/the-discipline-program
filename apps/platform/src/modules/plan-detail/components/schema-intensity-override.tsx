"use client";

import { Stack } from "@mui/material";
import { Controller, type Control } from "react-hook-form";

import { FormSection } from "@repo/ui";

import { EffortPercentField } from "./effort-percent-field";
import { HrZoneField } from "./hr-zone-field";
import { NumericPaceField } from "./numeric-pace-field";
import { PaceField } from "./pace-field";
import { RpeField } from "./rpe-field";
import type { SchemaShellFormData } from "./schema-editor-modal";

type SchemaIntensityOverrideProps = {
  control: Control<SchemaShellFormData>;
  isPending: boolean;
};

export const SchemaIntensityOverride: React.FC<SchemaIntensityOverrideProps> = ({
  control,
  isPending,
}) => (
  <FormSection label="Intensity override" helper="overrides block intensity for this schema only">
    <Stack spacing={0.75}>
      <Controller
        name="intensity.effortPercent"
        control={control}
        render={({ field, formState }) => (
          <EffortPercentField
            value={field.value}
            onChange={field.onChange}
            error={formState.errors.intensity?.effortPercent}
            disabled={isPending}
          />
        )}
      />

      <Controller
        name="intensity.rpe"
        control={control}
        render={({ field }) => (
          <RpeField value={field.value} onChange={field.onChange} disabled={isPending} />
        )}
      />

      <Controller
        name="intensity.pace"
        control={control}
        render={({ field }) => (
          <PaceField value={field.value} onChange={field.onChange} disabled={isPending} />
        )}
      />

      <Controller
        name="intensity.hrZone"
        control={control}
        render={({ field }) => (
          <HrZoneField value={field.value} onChange={field.onChange} disabled={isPending} />
        )}
      />

      <Controller
        name="intensity.numericPace"
        control={control}
        render={({ field, formState }) => (
          <NumericPaceField
            value={field.value}
            onChange={field.onChange}
            error={formState.errors.intensity?.numericPace}
            disabled={isPending}
          />
        )}
      />
    </Stack>
  </FormSection>
);
