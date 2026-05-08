"use client";

import { type ReactElement } from "react";

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
import { Controller, type FieldValues, useFormContext } from "react-hook-form";

import {
  SCHEME_ARCHETYPE_KIND_LABELS,
  type SchemeArchetypeKind,
} from "@repo/contracts/lms/_domain";

import { DynamicListItem } from "../dynamic-list-item";

import { type SchemeParamsBasePath, type SchemeParamsKindPath } from "./scheme-params.types";

export type SchemeParamsRenderInner = (props: {
  basePath: SchemeParamsBasePath;
  kindPath: SchemeParamsKindPath;
  isLoading: boolean;
}) => ReactElement;

const INNER_ARCHETYPE_KIND_VALUES = [
  "NONE",
  "COUNT_UP",
  "COUNT_DOWN",
  "INTERVAL_LOOP",
  "EMOM_LOOP",
] as const satisfies ReadonlyArray<SchemeArchetypeKind>;

const INNER_ARCHETYPE_KIND_OPTIONS = INNER_ARCHETYPE_KIND_VALUES.map((value) => ({
  value,
  label: SCHEME_ARCHETYPE_KIND_LABELS[value],
}));

type TimeBoxedSegmentRowProps = {
  basePath: SchemeParamsBasePath;
  index: number;
  onRemove: () => void;
  isLoading: boolean;
  canRemove: boolean;
  renderInner: SchemeParamsRenderInner;
};

export const TimeBoxedSegmentRow = ({
  basePath,
  index,
  onRemove,
  isLoading,
  canRemove,
  renderInner,
}: TimeBoxedSegmentRowProps) => {
  const { register, control, getFieldState, formState } = useFormContext<FieldValues>();

  const startSecName = `${basePath}.segments.${index}.startSec`;
  const endSecName = `${basePath}.segments.${index}.endSec`;
  const labelName = `${basePath}.segments.${index}.label`;
  const innerArchetypeKindName = `${basePath}.segments.${index}.innerArchetypeKind`;

  const startSecError = getFieldState(startSecName, formState).error;
  const endSecError = getFieldState(endSecName, formState).error;
  const labelError = getFieldState(labelName, formState).error;

  const innerBasePath = `${basePath}.segments.${index}.innerParams`;
  const innerKindPath = `${basePath}.segments.${index}.innerArchetypeKind`;

  return (
    <DynamicListItem
      onRemove={onRemove}
      disableRemove={!canRemove}
      removeAriaLabel={`Remove segment ${index + 1}`}
    >
      <Stack spacing={3}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Start (sec)"
              type="number"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!startSecError}
              helperText={startSecError?.message}
              inputProps={{ min: 0, step: 1 }}
              {...register(startSecName, { valueAsNumber: true })}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="End (sec)"
              type="number"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!endSecError}
              helperText={endSecError?.message}
              inputProps={{ min: 1, step: 1 }}
              {...register(endSecName, { valueAsNumber: true })}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Label (optional)"
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              error={!!labelError}
              helperText={labelError?.message}
              {...register(labelName)}
            />
          </Grid>
        </Grid>

        <Controller
          name={innerArchetypeKindName}
          control={control}
          render={({ field, fieldState }) => (
            <FormControl fullWidth size="small" error={!!fieldState.error}>
              <InputLabel id={`${basePath}-segment-${index}-inner-kind-label`}>
                Inner Archetype
              </InputLabel>
              <Select
                labelId={`${basePath}-segment-${index}-inner-kind-label`}
                label="Inner Archetype"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isLoading}
              >
                {INNER_ARCHETYPE_KIND_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {fieldState.error?.message !== undefined && (
                <FormHelperText>{fieldState.error.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />

        {renderInner({
          basePath: innerBasePath,
          kindPath: innerKindPath,
          isLoading,
        })}
      </Stack>
    </DynamicListItem>
  );
};
