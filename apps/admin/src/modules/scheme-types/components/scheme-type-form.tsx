"use client";

import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { SCHEME_ARCHETYPE_KIND_OPTIONS } from "@repo/contracts/lms/_domain";
import {
  SCHEME_TYPE_CONSTANTS,
  type createSchemeTypeSchema,
} from "@repo/contracts/lms/scheme-type";
import { FormCard } from "@repo/ui";

import { DefaultParamsField } from "./default-params-field";

type SchemeTypeFormValues = z.input<typeof createSchemeTypeSchema>;

type SchemeTypeFormProps = {
  isLoading?: boolean;
};

export const SchemeTypeForm = ({ isLoading = false }: SchemeTypeFormProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SchemeTypeFormValues>();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Stack spacing={3}>
          <FormCard title="Identity">
            <TextField
              label="Name"
              placeholder="e.g. AMRAP 20"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!errors.name}
              helperText={errors.name?.message}
              inputProps={{ maxLength: SCHEME_TYPE_CONSTANTS.MAX_NAME_LENGTH }}
              {...register("name")}
            />
          </FormCard>

          <FormCard title="Classification">
            <Controller
              name="archetypeKind"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" error={!!fieldState.error}>
                  <InputLabel id="scheme-type-archetype-kind-label">Archetype</InputLabel>
                  <Select
                    labelId="scheme-type-archetype-kind-label"
                    label="Archetype"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={isLoading}
                  >
                    {SCHEME_ARCHETYPE_KIND_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </FormCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <FormCard title="Default Params">
          <DefaultParamsField isLoading={isLoading} />
        </FormCard>
      </Grid>
    </Grid>
  );
};
