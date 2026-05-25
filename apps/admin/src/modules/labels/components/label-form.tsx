"use client";

import { Grid, Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type CreateLabelData } from "@repo/contracts/lms/label";

import { FormCard } from "@app/lib/components/form-card";

import { ApplicableLevelsField } from "./applicable-levels-field";
import { RestSwitchField } from "./rest-switch-field";

type LabelFormProps = {
  isLoading: boolean;
};

export const LabelForm = ({ isLoading }: LabelFormProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateLabelData>();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <FormCard title="Basic info">
          <Stack spacing={3}>
            <TextField
              label="Name"
              placeholder="e.g. Push Day"
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

      <Grid size={{ xs: 12, lg: 4 }}>
        <FormCard title="Applicable levels">
          <Stack spacing={2}>
            <ApplicableLevelsField isLoading={isLoading} />
            <RestSwitchField isLoading={isLoading} />
          </Stack>
        </FormCard>
      </Grid>
    </Grid>
  );
};
