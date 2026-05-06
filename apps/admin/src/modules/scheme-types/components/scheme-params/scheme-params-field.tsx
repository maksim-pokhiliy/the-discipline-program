"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { Alert, Stack } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";
import { type z } from "zod";

import { defaultSchemeParams, type SchemeArchetypeKind } from "@repo/contracts/lms/_domain";
import { type createSchemeTypeSchema } from "@repo/contracts/lms/scheme-type";

import { SchemeParamsDistanceForm } from "./scheme-params-distance";
import { SchemeParamsNoneForm } from "./scheme-params-none";

export type SchemeParamsBasePath = "defaultParams" | `defaultParams.segments.${number}.innerParams`;

export type SchemeParamsKindPath =
  | "archetypeKind"
  | `defaultParams.segments.${number}.innerArchetypeKind`;

type SchemeTypeFormValues = z.input<typeof createSchemeTypeSchema>;

type SchemeParamsFieldProps = {
  basePath: SchemeParamsBasePath;
  kindPath: SchemeParamsKindPath;
  isLoading: boolean;
};

const isArchetypeKind = (value: unknown): value is SchemeArchetypeKind => {
  return (
    value === "NONE" ||
    value === "COUNT_UP" ||
    value === "COUNT_DOWN" ||
    value === "INTERVAL_LOOP" ||
    value === "EMOM_LOOP" ||
    value === "TIME_BOXED" ||
    value === "LADDER" ||
    value === "DISTANCE"
  );
};

const renderArchetype = (
  kind: SchemeArchetypeKind,
  basePath: SchemeParamsBasePath,
  isLoading: boolean,
): ReactNode => {
  switch (kind) {
    case "NONE":
      return <SchemeParamsNoneForm basePath={basePath} />;
    case "COUNT_UP":
      return null;
    case "COUNT_DOWN":
      return null;
    case "INTERVAL_LOOP":
      return null;
    case "EMOM_LOOP":
      return null;
    case "TIME_BOXED":
      return null;
    case "LADDER":
      return null;
    case "DISTANCE":
      if (basePath !== "defaultParams") {
        return null;
      }

      return <SchemeParamsDistanceForm basePath={basePath} isLoading={isLoading} />;
  }
};

export const SchemeParamsField = ({ basePath, kindPath, isLoading }: SchemeParamsFieldProps) => {
  const { control, setValue, clearErrors, getValues, getFieldState, formState } =
    useFormContext<SchemeTypeFormValues>();

  const watched: unknown = useWatch<SchemeTypeFormValues>({ control, name: kindPath });
  const kind = isArchetypeKind(watched) ? watched : undefined;

  const previousKindRef = useRef<SchemeArchetypeKind | undefined>(kind);

  useEffect(() => {
    if (kind === undefined) {
      return;
    }

    const previousKind = previousKindRef.current;
    const currentValue = getValues(basePath);

    if (previousKind === kind && currentValue !== undefined) {
      return;
    }

    previousKindRef.current = kind;
    setValue(basePath, defaultSchemeParams(kind), { shouldDirty: true });
    clearErrors(basePath);
    clearErrors(kindPath);
  }, [kind, basePath, kindPath, getValues, setValue, clearErrors]);

  const baseError = getFieldState(basePath, formState).error;
  const baseErrorMessage = typeof baseError?.message === "string" ? baseError.message : undefined;

  return (
    <Stack spacing={3}>
      {baseErrorMessage !== undefined && <Alert severity="error">{baseErrorMessage}</Alert>}
      {kind !== undefined && renderArchetype(kind, basePath, isLoading)}
    </Stack>
  );
};
