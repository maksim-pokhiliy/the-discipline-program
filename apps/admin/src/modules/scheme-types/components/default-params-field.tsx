"use client";

import { useEffect, useRef, useState } from "react";

import { TextField } from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { type z } from "zod";

import {
  defaultSchemeParams,
  schemeParamsSchema,
  type SchemeArchetypeKind,
  type SchemeParams,
} from "@repo/contracts/lms/_domain";
import { type createSchemeTypeSchema } from "@repo/contracts/lms/scheme-type";

const TEXTAREA_MIN_ROWS = 8;
const JSON_INDENT = 2;

type SchemeTypeFormValues = z.input<typeof createSchemeTypeSchema>;

type DefaultParamsFieldProps = {
  isLoading: boolean;
};

const stringifyParams = (params: SchemeParams): string => JSON.stringify(params, null, JSON_INDENT);

type ParseResult =
  | { kind: "empty" }
  | { kind: "ok"; value: SchemeParams }
  | { kind: "error"; message: string };

const parseTextarea = (text: string): ParseResult => {
  const trimmed = text.trim();

  if (trimmed === "") {
    return { kind: "empty" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON",
    };
  }

  const result = schemeParamsSchema.safeParse(parsed);

  if (!result.success) {
    return { kind: "error", message: result.error.issues[0]?.message ?? "Invalid scheme params" };
  }

  return { kind: "ok", value: result.data };
};

export const DefaultParamsField = ({ isLoading }: DefaultParamsFieldProps) => {
  const { control, setValue, setError, clearErrors, getValues } =
    useFormContext<SchemeTypeFormValues>();

  const archetypeKind = useWatch<SchemeTypeFormValues, "archetypeKind">({
    control,
    name: "archetypeKind",
  });

  const initialValue = getValues("defaultParams");
  const [text, setText] = useState<string>(initialValue ? stringifyParams(initialValue) : "");
  const previousArchetypeRef = useRef<SchemeArchetypeKind>(archetypeKind);

  useEffect(() => {
    if (previousArchetypeRef.current === archetypeKind) {
      return;
    }

    previousArchetypeRef.current = archetypeKind;

    const next = defaultSchemeParams(archetypeKind);

    setText(stringifyParams(next));
    setValue("defaultParams", next, { shouldDirty: true });
    clearErrors("defaultParams");
  }, [archetypeKind, setValue, clearErrors]);

  return (
    <Controller
      name="defaultParams"
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          label="Default Params (JSON)"
          placeholder={stringifyParams(defaultSchemeParams(archetypeKind))}
          variant="outlined"
          fullWidth
          size="small"
          multiline
          minRows={TEXTAREA_MIN_ROWS}
          disabled={isLoading}
          value={text}
          onChange={(event) => {
            const next = event.target.value;

            setText(next);

            const result = parseTextarea(next);

            if (result.kind === "empty") {
              field.onChange(undefined);
              clearErrors("defaultParams");

              return;
            }

            if (result.kind === "error") {
              field.onChange(undefined);
              setError("defaultParams", { message: result.message });

              return;
            }

            field.onChange(result.value);
            clearErrors("defaultParams");
          }}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? "Edit JSON to override the archetype defaults"}
        />
      )}
    />
  );
};
