"use client";

import { MenuItem, Stack, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import {
  BLOCK_KIND_CONSTANTS,
  type CreateBlockKindInput,
  type UpdateBlockKindInput,
} from "@repo/contracts/lms/block-kind";
import { FormCard } from "@repo/ui";

import { SCHEME_ARCHETYPE_KIND_OPTIONS } from "../../constants";

type FormValues = CreateBlockKindInput & UpdateBlockKindInput;

type ParamsCardProps = {
  isLoading: boolean;
};

const NONE_VALUE = "__none__";

export const ParamsCard = ({ isLoading }: ParamsCardProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <FormCard title="Parameters">
      <Stack spacing={3}>
        <TextField
          label="Icon key"
          placeholder="e.g. flame, dumbbell, timer"
          variant="outlined"
          fullWidth
          disabled={isLoading}
          error={!!errors.iconKey}
          helperText={errors.iconKey?.message}
          inputProps={{ maxLength: BLOCK_KIND_CONSTANTS.MAX_ICON_KEY_LENGTH }}
          {...register("iconKey")}
        />

        <Controller
          name="defaultWeight"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              label="Default weight"
              type="number"
              variant="outlined"
              fullWidth
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={
                fieldState.error?.message ??
                `Range ${BLOCK_KIND_CONSTANTS.MIN_DEFAULT_WEIGHT}–${BLOCK_KIND_CONSTANTS.MAX_DEFAULT_WEIGHT}, controls ordering`
              }
              inputProps={{
                min: BLOCK_KIND_CONSTANTS.MIN_DEFAULT_WEIGHT,
                max: BLOCK_KIND_CONSTANTS.MAX_DEFAULT_WEIGHT,
                step: 1,
              }}
              value={field.value ?? ""}
              onChange={(event) => {
                const raw = event.target.value;

                field.onChange(raw === "" ? undefined : Number(raw));
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
            />
          )}
        />

        <Controller
          name="defaultArchetypeKind"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              label="Default archetype"
              select
              variant="outlined"
              fullWidth
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={
                fieldState.error?.message ??
                "One archetype per block kind — picks the timer FSM (NONE, EMOM, intervals, etc.) suggested when this block is dropped. Need a different timer? Create another block kind."
              }
              value={field.value ?? NONE_VALUE}
              onChange={(event) => {
                const next = event.target.value;

                field.onChange(next === NONE_VALUE ? undefined : next);
              }}
              onBlur={field.onBlur}
              name={field.name}
            >
              <MenuItem value={NONE_VALUE}>Not set</MenuItem>
              {SCHEME_ARCHETYPE_KIND_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <TextField
          label="Analytics category"
          placeholder="e.g. strength, conditioning, accessory"
          variant="outlined"
          fullWidth
          disabled={isLoading}
          error={!!errors.analyticsCategory}
          helperText={
            errors.analyticsCategory?.message ??
            "Free-text label that groups blocks of this kind in coach analytics dashboards. Optional."
          }
          inputProps={{ maxLength: BLOCK_KIND_CONSTANTS.MAX_ANALYTICS_CATEGORY_LENGTH }}
          {...register("analyticsCategory")}
        />
      </Stack>
    </FormCard>
  );
};
