"use client";

import { Grid, Stack, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { type z } from "zod";

import { BLOCK_TYPE_CONSTANTS, type createBlockTypeSchema } from "@repo/contracts/lms/block-type";
import { FormCard } from "@repo/ui";

const DESCRIPTION_MIN_ROWS = 4;

type BlockTypeFormValues = z.input<typeof createBlockTypeSchema>;

type BlockTypeFormProps = {
  isLoading?: boolean;
};

export const BlockTypeForm = ({ isLoading = false }: BlockTypeFormProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<BlockTypeFormValues>();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Stack spacing={3}>
          <FormCard title="Identity">
            <TextField
              label="Name"
              placeholder="e.g. Strength"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!errors.name}
              helperText={errors.name?.message}
              inputProps={{ maxLength: BLOCK_TYPE_CONSTANTS.MAX_NAME_LENGTH }}
              {...register("name")}
            />
          </FormCard>

          <FormCard title="Details">
            <TextField
              label="Description"
              placeholder="What is this block used for?"
              variant="outlined"
              fullWidth
              size="small"
              multiline
              minRows={DESCRIPTION_MIN_ROWS}
              disabled={isLoading}
              error={!!errors.description}
              helperText={errors.description?.message}
              inputProps={{ maxLength: BLOCK_TYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH }}
              {...register("description", {
                setValueAs: (value) => (value === "" ? null : value),
              })}
            />
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};
