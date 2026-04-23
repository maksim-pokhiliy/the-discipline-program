"use client";

import { Grid, Stack, Switch, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import type { CreateBlockTypeData, UpdateBlockTypeData } from "@repo/contracts/library/block-type";
import { FormCard } from "@repo/ui";

type BlockTypeFormProps = {
  isLoading?: boolean;
};

type BlockTypeFormValues = CreateBlockTypeData & UpdateBlockTypeData;

const emptyToUndefined = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
};

export const BlockTypeForm = ({ isLoading = false }: BlockTypeFormProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<BlockTypeFormValues>();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Identity">
            <Stack spacing={3}>
              <TextField
                label="Slug"
                placeholder="e.g. warm-up"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.slug}
                helperText={errors.slug?.message}
                {...register("slug")}
              />

              <TextField
                label="Name"
                placeholder="e.g. Warm-up"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register("name")}
              />

              <TextField
                label="Description"
                placeholder="What this block is for"
                variant="outlined"
                multiline
                minRows={3}
                fullWidth
                disabled={isLoading}
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register("description", { setValueAs: emptyToUndefined })}
              />
            </Stack>
          </FormCard>

          <FormCard title="Appearance">
            <Stack spacing={3}>
              <TextField
                label="Icon key"
                placeholder="e.g. flame"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.iconKey}
                helperText={errors.iconKey?.message}
                {...register("iconKey", { setValueAs: emptyToUndefined })}
              />

              <TextField
                label="Color key"
                placeholder="e.g. warning"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.colorKey}
                helperText={errors.colorKey?.message}
                {...register("colorKey", { setValueAs: emptyToUndefined })}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <FormCard title="Visibility">
            <Stack spacing={3}>
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack>
                      <Typography variant="subtitle2">Active</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Available to coaches when editing workouts
                      </Typography>
                    </Stack>
                    <Switch
                      checked={field.value ?? false}
                      onChange={(_, checked) => field.onChange(checked)}
                      disabled={isLoading}
                    />
                  </Stack>
                )}
              />

              <TextField
                label="Sort order"
                type="number"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.sortOrder}
                helperText={errors.sortOrder?.message}
                {...register("sortOrder", {
                  setValueAs: (value: unknown) => {
                    if (value === "" || value === null || value === undefined) {
                      return 0;
                    }

                    const parsed = Number(value);

                    return Number.isFinite(parsed) ? parsed : 0;
                  },
                })}
              />
            </Stack>
          </FormCard>
        </Stack>
      </Grid>
    </Grid>
  );
};
