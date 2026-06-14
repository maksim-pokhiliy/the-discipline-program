"use client";

import { Grid, Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type CreateEquipmentData } from "@repo/contracts/lms/equipment";

import { FormCard } from "@app/lib/components/form-card";

type EquipmentFormProps = {
  isLoading: boolean;
};

export const EquipmentForm = ({ isLoading }: EquipmentFormProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateEquipmentData>();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <FormCard title="Basic info">
          <Stack spacing={3}>
            <TextField
              label="Name"
              placeholder="e.g. Barbell"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!errors.name}
              helperText={errors.name?.message ?? "Will be uniquely matched case-insensitively"}
              {...register("name")}
            />

            <TextField
              label="Notes"
              placeholder="Coaching notes, usage guidance..."
              multiline
              rows={4}
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!errors.notes}
              helperText={errors.notes?.message}
              {...register("notes")}
            />
          </Stack>
        </FormCard>
      </Grid>
    </Grid>
  );
};
