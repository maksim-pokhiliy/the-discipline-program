"use client";

import { Stack } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/lms/exercise";
import { TagsInput } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";

type DemosAndAliasesCardProps = {
  isLoading: boolean;
};

export const DemosAndAliasesCard = ({ isLoading }: DemosAndAliasesCardProps) => {
  const { control } = useFormContext<CreateExerciseData>();

  return (
    <FormCard title="Demos & aliases">
      <Stack spacing={3}>
        <Controller
          name="defaultDemoUrls"
          control={control}
          render={({ field, fieldState }) => (
            <TagsInput
              label="Default Demo URLs"
              placeholder="https://..."
              value={field.value}
              onChange={field.onChange}
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={
                fieldState.error?.message ?? "Press Enter to add a URL. URLs validated on submit."
              }
            />
          )}
        />

        <Controller
          name="aliases"
          control={control}
          render={({ field, fieldState }) => (
            <TagsInput
              label="Aliases"
              placeholder="alternative name"
              value={field.value}
              onChange={field.onChange}
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? "Press Enter to add an alias."}
            />
          )}
        />
      </Stack>
    </FormCard>
  );
};
