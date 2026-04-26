"use client";

import { useEffect, useMemo } from "react";

import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { schemeParamsSchema, type SchemeArchetypeKind } from "@repo/contracts/lms/_domain";
import {
  type CreateSchemeTemplateInput,
  type UpdateSchemeTemplateInput,
} from "@repo/contracts/lms/scheme-template";
import { FormCard } from "@repo/ui";

import { DEFAULT_PARAMS_TEMPLATES, SCHEME_ARCHETYPE_KIND_OPTIONS } from "../../constants";

type FormValues = CreateSchemeTemplateInput & UpdateSchemeTemplateInput;

type ParamsCardProps = {
  isLoading: boolean;
};

const stringifyParams = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
};

const validateDefaultParams = (
  raw: string,
  archetypeKind: SchemeArchetypeKind | undefined,
): { ok: true; value: unknown } | { ok: false; message: string } => {
  if (raw.trim().length === 0) {
    return { ok: false, message: "Default params required" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      message: `Invalid JSON: ${error instanceof Error ? error.message : "parse error"}`,
    };
  }

  const result = schemeParamsSchema.safeParse(parsed);

  if (!result.success) {
    return { ok: false, message: result.error.issues.map((i) => i.message).join("; ") };
  }

  if (archetypeKind && result.data.kind !== archetypeKind) {
    return {
      ok: false,
      message: `Params 'kind' must equal selected archetype (${archetypeKind})`,
    };
  }

  return { ok: true, value: result.data };
};

export const ParamsCard = ({ isLoading }: ParamsCardProps) => {
  const { control, setValue, getValues } = useFormContext<FormValues>();
  const archetypeKind = useWatch({ control, name: "archetypeKind" });

  const initialParamsText = useMemo(() => stringifyParams(getValues("defaultParams")), [getValues]);

  useEffect(() => {
    if (!archetypeKind) {
      return;
    }

    const current = getValues("defaultParams") as { kind?: string } | undefined;

    if (current?.kind === archetypeKind) {
      return;
    }

    const template = DEFAULT_PARAMS_TEMPLATES[archetypeKind];

    if (template) {
      setValue("defaultParams", template as FormValues["defaultParams"], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [archetypeKind, getValues, setValue]);

  return (
    <FormCard title="Archetype + default params">
      <Stack spacing={3}>
        <Controller
          name="archetypeKind"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Archetype kind"
              select
              variant="outlined"
              fullWidth
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={
                fieldState.error?.message ??
                "Switching archetypes resets default params to a starter shape"
              }
            >
              {SCHEME_ARCHETYPE_KIND_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="defaultParams"
          control={control}
          render={({ field, fieldState }) => {
            const text = stringifyParams(field.value) || initialParamsText;
            const result = validateDefaultParams(text, archetypeKind);
            const errorMessage = !result.ok ? result.message : undefined;

            return (
              <Stack spacing={1}>
                <TextField
                  label="Default params (JSON)"
                  multiline
                  minRows={10}
                  fullWidth
                  variant="outlined"
                  disabled={isLoading}
                  error={!!fieldState.error || Boolean(errorMessage)}
                  value={text}
                  onChange={(event) => {
                    const next = event.target.value;
                    const validation = validateDefaultParams(next, archetypeKind);

                    if (validation.ok) {
                      field.onChange(validation.value);
                    } else {
                      field.onChange(next as unknown as FormValues["defaultParams"]);
                    }
                  }}
                  inputProps={{ "aria-label": "Default params JSON" }}
                />

                <Typography
                  variant="caption"
                  color={errorMessage ? "error" : "text.secondary"}
                  sx={{ fontFamily: "monospace" }}
                >
                  {errorMessage ?? "Validated against schemeParamsSchema before save"}
                </Typography>
              </Stack>
            );
          }}
        />
      </Stack>
    </FormCard>
  );
};
