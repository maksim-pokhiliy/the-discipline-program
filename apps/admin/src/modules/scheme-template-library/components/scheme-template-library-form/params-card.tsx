"use client";

import { useEffect } from "react";

import { MenuItem, Stack, TextField } from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import {
  type CreateSchemeTemplateInput,
  type UpdateSchemeTemplateInput,
} from "@repo/contracts/lms/scheme-template";
import { FormCard, SchemeForm } from "@repo/ui";

import { DEFAULT_PARAMS_TEMPLATES, SCHEME_ARCHETYPE_KIND_OPTIONS } from "../../constants";

type FormValues = CreateSchemeTemplateInput & UpdateSchemeTemplateInput;

type ParamsCardProps = {
  isLoading: boolean;
};

export const ParamsCard = ({ isLoading }: ParamsCardProps) => {
  const { control, setValue, getValues } = useFormContext<FormValues>();
  const archetypeKind = useWatch({ control, name: "archetypeKind" });

  useEffect(() => {
    if (!archetypeKind) {
      return;
    }

    const current = getValues("defaultParams");

    if (current?.kind === archetypeKind) {
      return;
    }

    setValue("defaultParams", DEFAULT_PARAMS_TEMPLATES[archetypeKind], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [archetypeKind, getValues, setValue]);

  return (
    <FormCard title="Archetype + default params">
      <Stack spacing={3}>
        <Controller
          name="archetypeKind"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Archetype kind"
              select
              variant="outlined"
              fullWidth
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={
                fieldState.error?.message ??
                "Switching archetypes resets default params to a starter shape"
              }
            >
              {SCHEME_ARCHETYPE_KIND_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="defaultParams"
          control={control}
          render={({ field }) => {
            if (!archetypeKind || !field.value) {
              return <></>;
            }

            return (
              <SchemeForm
                archetypeKind={archetypeKind}
                schemeParams={field.value}
                onChange={(next) => field.onChange(next)}
                disabled={isLoading}
              />
            );
          }}
        />
      </Stack>
    </FormCard>
  );
};
