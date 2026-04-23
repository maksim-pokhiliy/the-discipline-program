"use client";

import { useMemo } from "react";

import { Grid, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import type {
  CreateSchemeData,
  SchemeParamKey,
  UpdateSchemeData,
} from "@repo/contracts/library/scheme";
import { SchemeKind } from "@repo/contracts/library/scheme";
import { FormCard, MultiSelect } from "@repo/ui";

import { SCHEME_KIND_OPTIONS, SCHEME_PARAM_OPTIONS } from "../constants";

type SchemeFormProps = {
  isEdit?: boolean;
  isLoading?: boolean;
  paramDefaultsText: string;
  onParamDefaultsTextChange: (next: string) => void;
  paramDefaultsError?: string;
};

type SchemeFormValues = CreateSchemeData & UpdateSchemeData;

const PARAM_OPTION_OBJECTS = SCHEME_PARAM_OPTIONS.map((opt) => ({
  id: opt.value,
  label: opt.label,
}));

export const SchemeForm = ({
  isEdit = false,
  isLoading = false,
  paramDefaultsText,
  onParamDefaultsTextChange,
  paramDefaultsError,
}: SchemeFormProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<SchemeFormValues>();

  const kindOptions = useMemo(() => SCHEME_KIND_OPTIONS, []);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <FormCard title="Identity">
            <Stack spacing={3}>
              <TextField
                label="Slug"
                placeholder="e.g. straight-sets"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.slug}
                helperText={errors.slug?.message}
                {...register("slug")}
              />

              <TextField
                label="Name"
                placeholder="e.g. Straight Sets"
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register("name")}
              />

              <Controller
                name="kind"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Kind"
                    select
                    variant="outlined"
                    fullWidth
                    disabled={isLoading || isEdit}
                    error={!!errors.kind}
                    helperText={
                      isEdit ? "Kind cannot be changed after creation" : errors.kind?.message
                    }
                    value={field.value ?? SchemeKind.STRAIGHT_SETS}
                  >
                    {kindOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <TextField
                label="Description"
                placeholder="Brief explanation of this scheme"
                variant="outlined"
                multiline
                minRows={3}
                fullWidth
                disabled={isLoading}
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register("description", {
                  setValueAs: (value: unknown) => {
                    if (typeof value !== "string") {
                      return undefined;
                    }

                    const trimmed = value.trim();

                    return trimmed === "" ? undefined : trimmed;
                  },
                })}
              />
            </Stack>
          </FormCard>

          <FormCard title="Parameters">
            <Stack spacing={3}>
              <Controller
                name="requiredParams"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={PARAM_OPTION_OBJECTS}
                    value={field.value ?? []}
                    onChange={(next) => field.onChange(next as SchemeParamKey[])}
                    getOptionId={(opt) => opt.id}
                    getOptionLabel={(opt) => opt.label}
                    label="Required params"
                    placeholder="Pick required params"
                    disabled={isLoading}
                    errorText={errors.requiredParams?.message}
                  />
                )}
              />

              <TextField
                label="Param defaults (JSON)"
                placeholder='{"duration": 600}'
                variant="outlined"
                multiline
                minRows={4}
                fullWidth
                disabled={isLoading}
                error={!!paramDefaultsError}
                helperText={
                  paramDefaultsError ?? "JSON object; values must be non-negative numbers"
                }
                value={paramDefaultsText}
                onChange={(event) => onParamDefaultsTextChange(event.target.value)}
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

export type ParamDefaultsValue = Partial<Record<SchemeParamKey, number>>;

export const parseParamDefaults = (
  text: string,
): { ok: true; value: ParamDefaultsValue } | { ok: false; error: string } => {
  const trimmed = text.trim();

  if (trimmed === "") {
    return { ok: true, value: {} };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Must be a JSON object" };
  }

  const validKeys = new Set<SchemeParamKey>(SCHEME_PARAM_OPTIONS.map((opt) => opt.value));
  const out: ParamDefaultsValue = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (!validKeys.has(key as SchemeParamKey)) {
      return { ok: false, error: `Unknown param key: ${key}` };
    }

    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return { ok: false, error: `Value for ${key} must be a non-negative number` };
    }

    out[key as SchemeParamKey] = value;
  }

  return { ok: true, value: out };
};

export const stringifyParamDefaults = (value: ParamDefaultsValue | undefined): string => {
  if (!value || Object.keys(value).length === 0) {
    return "";
  }

  return JSON.stringify(value, null, 2);
};
