"use client";

import { Box, Grid, Stack, TextField } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";
import { type z } from "zod";

import { DAY_TYPE_CONSTANTS, type createDayTypeSchema } from "@repo/contracts/lms/day-type";
import { FormCard } from "@repo/ui";

const SWATCH_SIZE = 40;

type DayTypeFormValues = z.input<typeof createDayTypeSchema>;

type DayTypeFormProps = {
  isLoading?: boolean;
};

export const DayTypeForm = ({ isLoading = false }: DayTypeFormProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<DayTypeFormValues>();

  const watchedColor = useWatch<DayTypeFormValues, "color">({ control, name: "color" });

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Identity">
            <TextField
              label="Name"
              placeholder="e.g. Strength Day"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!errors.name}
              helperText={errors.name?.message}
              inputProps={{ maxLength: DAY_TYPE_CONSTANTS.MAX_NAME_LENGTH }}
              {...register("name")}
            />
          </FormCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <FormCard title="Appearance">
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <TextField
              label="Color"
              type="color"
              variant="outlined"
              size="small"
              disabled={isLoading}
              error={!!errors.color}
              helperText={errors.color?.message ?? "Pick a color used on the calendar"}
              {...register("color")}
            />
            <Box
              sx={{
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                bgcolor: watchedColor,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                flexShrink: 0,
              }}
              aria-label="Color preview"
            />
          </Stack>
        </FormCard>
      </Grid>
    </Grid>
  );
};
