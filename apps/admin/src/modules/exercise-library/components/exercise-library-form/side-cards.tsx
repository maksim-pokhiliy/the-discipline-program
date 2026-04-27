"use client";

import { Checkbox, FormControlLabel, MenuItem, Stack, Switch, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import {
  type CreateExerciseLibraryItemInput,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { FormCard } from "@repo/ui";

import { LIBRARY_SCOPE_OPTIONS } from "../../constants";

type FormValues = CreateExerciseLibraryItemInput & UpdateExerciseLibraryItemInput;

type SideCardsProps = {
  isEdit: boolean;
  isLoading: boolean;
};

const METRIC_FIELDS = [
  { name: "canMeasureLoad", label: "Load" },
  { name: "canMeasureReps", label: "Reps" },
  { name: "canMeasureDuration", label: "Duration" },
  { name: "canMeasureDistance", label: "Distance" },
  { name: "canMeasureCalories", label: "Calories" },
] as const;

const ScopeCard = ({ isEdit, isLoading }: SideCardsProps) => {
  const { control } = useFormContext<FormValues>();

  return (
    <FormCard title="Scope">
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
            disabled={isLoading || isEdit}
            error={!!fieldState.error}
            helperText={
              isEdit
                ? "Use Promote/Demote to change scope"
                : (fieldState.error?.message ?? "SYSTEM is global, COACH is owner-scoped")
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
    </FormCard>
  );
};

const DefaultMetricsCard = ({ isLoading }: { isLoading: boolean }) => {
  const { control } = useFormContext<FormValues>();

  return (
    <FormCard title="Default metrics">
      <Stack>
        {METRIC_FIELDS.map((m) => (
          <Controller
            key={m.name}
            name={`defaultMetrics.${m.name}`}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isLoading}
                    size="small"
                  />
                }
                label={m.label}
              />
            )}
          />
        ))}
      </Stack>
    </FormCard>
  );
};

const MediaCard = ({ isLoading }: { isLoading: boolean }) => {
  const { control, trigger } = useFormContext<FormValues>();

  return (
    <FormCard title="Media">
      <Stack spacing={2}>
        <Controller
          name="demoVideoUrl"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              label="Demo video URL"
              placeholder="https://..."
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || undefined)}
              onBlur={() => {
                field.onBlur();
                void trigger("demoVideoUrl");
              }}
              inputRef={field.ref}
            />
          )}
        />

        <Controller
          name="demoImageUrl"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              label="Demo image URL"
              placeholder="https://..."
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || undefined)}
              onBlur={() => {
                field.onBlur();
                void trigger("demoImageUrl");
              }}
              inputRef={field.ref}
            />
          )}
        />
      </Stack>
    </FormCard>
  );
};

const FlagsCard = ({ isEdit, isLoading }: SideCardsProps) => {
  const { control } = useFormContext<FormValues>();

  return (
    <FormCard title="Flags">
      <Stack>
        <Controller
          name="isBenchmark"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isLoading}
                />
              }
              label="Benchmark"
            />
          )}
        />

        {isEdit && (
          <Controller
            name="isDeprecated"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label="Deprecated"
              />
            )}
          />
        )}
      </Stack>
    </FormCard>
  );
};

export const SideCards = ({ isEdit, isLoading }: SideCardsProps) => (
  <Stack spacing={3}>
    <ScopeCard isEdit={isEdit} isLoading={isLoading} />
    <DefaultMetricsCard isLoading={isLoading} />
    <MediaCard isLoading={isLoading} />
    <FlagsCard isEdit={isEdit} isLoading={isLoading} />
  </Stack>
);
