"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { Alert, Stack } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";

import { defaultSchemeParams, type SchemeArchetypeKind } from "@repo/contracts/lms/_domain";

import { SchemeParamsCountDownForm } from "./scheme-params-count-down";
import { SchemeParamsCountUpForm } from "./scheme-params-count-up";
import { SchemeParamsDistanceForm } from "./scheme-params-distance";
import { SchemeParamsEmomLoopForm } from "./scheme-params-emom-loop";
import { SchemeParamsIntervalLoopForm } from "./scheme-params-interval-loop";
import { SchemeParamsLadderForm } from "./scheme-params-ladder";
import { SchemeParamsNoneForm } from "./scheme-params-none";
import { SchemeParamsTimeBoxedForm } from "./scheme-params-time-boxed";
import {
  type SchemeParamsBasePath,
  type SchemeParamsKindPath,
  type SchemeTypeFormValues,
} from "./scheme-params.types";

export type { SchemeParamsBasePath, SchemeParamsKindPath } from "./scheme-params.types";

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
      return <SchemeParamsCountUpForm basePath={basePath} isLoading={isLoading} />;
    case "COUNT_DOWN":
      return <SchemeParamsCountDownForm basePath={basePath} isLoading={isLoading} />;
    case "INTERVAL_LOOP":
      return <SchemeParamsIntervalLoopForm basePath={basePath} isLoading={isLoading} />;
    case "EMOM_LOOP":
      return <SchemeParamsEmomLoopForm basePath={basePath} isLoading={isLoading} />;
    case "TIME_BOXED":
      if (basePath !== "defaultParams") {
        return null;
      }

      return <SchemeParamsTimeBoxedForm basePath={basePath} isLoading={isLoading} />;
    case "LADDER":
      if (basePath !== "defaultParams") {
        return null;
      }

      return <SchemeParamsLadderForm basePath={basePath} isLoading={isLoading} />;
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

    const isMountSeed = currentValue === undefined && previousKind === kind;

    previousKindRef.current = kind;
    setValue(basePath, defaultSchemeParams(kind), { shouldDirty: !isMountSeed });
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
