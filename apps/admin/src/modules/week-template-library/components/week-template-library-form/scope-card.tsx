"use client";

import { useEffect } from "react";

import { Autocomplete, MenuItem, Stack, TextField } from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import {
  type CreateWeekTemplateInput,
  type UpdateWeekTemplateInput,
} from "@repo/contracts/lms/week-template";
import { FormCard } from "@repo/ui";

import { useCoachesList } from "@app/lib/hooks";

import { LIBRARY_SCOPE_OPTIONS } from "../../constants";

type FormValues = CreateWeekTemplateInput & UpdateWeekTemplateInput;

type ScopeCardProps = {
  isLoading: boolean;
};

export const ScopeCard = ({ isLoading }: ScopeCardProps) => {
  const { control, setValue } = useFormContext<FormValues>();
  const scope = useWatch({ control, name: "scope" });
  const ownerId = useWatch({ control, name: "ownerId" });
  const { data: coaches } = useCoachesList();

  useEffect(() => {
    if (scope === "SYSTEM" && ownerId) {
      setValue("ownerId", null, { shouldDirty: true, shouldValidate: true });
    }
  }, [scope, ownerId, setValue]);

  const selectedCoach = coaches?.find((c) => c.userId === ownerId) ?? null;

  return (
    <FormCard title="Scope">
      <Stack spacing={2}>
        <Controller
          name="scope"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Visibility"
              select
              variant="outlined"
              fullWidth
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={
                fieldState.error?.message ??
                "SYSTEM is global and read-only for coaches; COACH is owned by a single coach"
              }
            >
              {LIBRARY_SCOPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {scope === "COACH" && (
          <Controller
            name="ownerId"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete
                options={coaches ?? []}
                value={selectedCoach}
                onChange={(_, value) => field.onChange(value?.userId ?? null)}
                getOptionLabel={(option) => option.name ?? option.email}
                isOptionEqualToValue={(a, b) => a.userId === b.userId}
                disabled={isLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Owner (creator)"
                    variant="outlined"
                    error={Boolean(fieldState.error) || !ownerId}
                    helperText={
                      fieldState.error?.message ??
                      (ownerId
                        ? "Coach who owns this item"
                        : "Required: pick a coach to own this item")
                    }
                  />
                )}
              />
            )}
          />
        )}
      </Stack>
    </FormCard>
  );
};
