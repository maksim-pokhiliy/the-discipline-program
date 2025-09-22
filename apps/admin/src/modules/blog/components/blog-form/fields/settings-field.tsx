"use client";

import { Grid, Stack, Switch, TextField, Typography } from "@mui/material";
import { Control, Controller, FieldErrors, useWatch } from "react-hook-form";

import { BlogFormInputs } from "@app/modules/blog/shared";

interface SettingsFieldProps {
  control: Control<BlogFormInputs, unknown>;
  errors: FieldErrors<BlogFormInputs>;
  isSubmitting: boolean;
  onPublishedAtChange: (value: string | null) => void;
}

export const SettingsField = ({
  control,
  errors,
  isSubmitting,
  onPublishedAtChange,
}: SettingsFieldProps) => {
  const isPublished = useWatch({ control, name: "isPublished" });

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Publishing Settings</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="isPublished"
            control={control}
            render={({ field }) => (
              <Stack spacing={1}>
                <Typography variant="subtitle2">Publish status</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Switch
                    {...field}
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isSubmitting}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {field.value ? "Post is live" : "Post is a draft"}
                  </Typography>
                </Stack>
              </Stack>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <Stack spacing={1}>
                <Typography variant="subtitle2">Featured on homepage</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Switch
                    {...field}
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isSubmitting}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Highlight this post in featured sections
                  </Typography>
                </Stack>
              </Stack>
            )}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="sortOrder"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Sort order"
                fullWidth
                inputProps={{ min: 0, step: 1 }}
                error={!!errors.sortOrder}
                helperText={errors.sortOrder?.message || "Lower numbers appear first"}
                disabled={isSubmitting}
                onChange={(event) => field.onChange(Number(event.target.value))}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="readTime"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Estimated read time (minutes)"
                fullWidth
                inputProps={{ min: 1, step: 1 }}
                error={!!errors.readTime}
                helperText={errors.readTime?.message || "Optional"}
                disabled={isSubmitting}
                onChange={(event) => {
                  const value = event.target.value;

                  field.onChange(value === "" ? null : Number(value));
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="publishedAt"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="datetime-local"
                label="Publication date"
                fullWidth
                error={!!errors.publishedAt}
                helperText={
                  errors.publishedAt?.message ||
                  (isPublished
                    ? "Set the date shown on the article"
                    : "Will be set automatically when published")
                }
                disabled={isSubmitting || !isPublished}
                onChange={(event) => {
                  const value = event.target.value;

                  field.onChange(value);
                  onPublishedAtChange(value || null);
                }}
              />
            )}
          />
        </Grid>
      </Grid>
    </Stack>
  );
};
