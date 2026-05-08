"use client";

import { type ReactNode, useCallback, useEffect, useRef } from "react";

import { Alert, Stack } from "@mui/material";
import { type FieldValues, useFormContext, useWatch } from "react-hook-form";

import { defaultSchemeParams, type SchemeArchetypeKind } from "@repo/contracts/lms/_domain";

import { SchemeParamsCountDownForm } from "./scheme-params-count-down";
import { SchemeParamsCountUpForm } from "./scheme-params-count-up";
import { SchemeParamsDistanceForm } from "./scheme-params-distance";
import { SchemeParamsEmomLoopForm } from "./scheme-params-emom-loop";
import { SchemeParamsIntervalLoopForm } from "./scheme-params-interval-loop";
import { SchemeParamsLadderForm } from "./scheme-params-ladder";
import { SchemeParamsNoneForm } from "./scheme-params-none";
import { SchemeParamsSetsRepsForm } from "./scheme-params-sets-reps";
import { SchemeParamsTimeBoxedForm } from "./scheme-params-time-boxed";
import { type SchemeParamsBasePath, type SchemeParamsKindPath } from "./scheme-params.types";
import { type SchemeParamsRenderInner } from "./time-boxed-segment-row";

type SchemeParamsFieldProps = {
  basePath: SchemeParamsBasePath;
  kindPath: SchemeParamsKindPath;
  isLoading?: boolean;
};

const isArchetypeKind = (value: unknown): value is SchemeArchetypeKind => {
  return (
    value === "NONE" ||
    value === "SETS_REPS" ||
    value === "COUNT_UP" ||
    value === "COUNT_DOWN" ||
    value === "INTERVAL_LOOP" ||
    value === "EMOM_LOOP" ||
    value === "TIME_BOXED" ||
    value === "LADDER" ||
    value === "DISTANCE"
  );
};

const isSchemeParamsForKind = (value: unknown, kind: SchemeArchetypeKind): boolean => {
  if (typeof value !== "object" || value === null || !("kind" in value)) {
    return false;
  }

  return value.kind === kind;
};

const renderArchetype = (
  kind: SchemeArchetypeKind,
  basePath: SchemeParamsBasePath,
  isLoading: boolean,
  renderInner: SchemeParamsRenderInner,
): ReactNode => {
  switch (kind) {
    case "NONE":
      return <SchemeParamsNoneForm />;
    case "SETS_REPS":
      return <SchemeParamsSetsRepsForm basePath={basePath} isLoading={isLoading} />;
    case "COUNT_UP":
      return <SchemeParamsCountUpForm basePath={basePath} isLoading={isLoading} />;
    case "COUNT_DOWN":
      return <SchemeParamsCountDownForm basePath={basePath} isLoading={isLoading} />;
    case "INTERVAL_LOOP":
      return <SchemeParamsIntervalLoopForm basePath={basePath} isLoading={isLoading} />;
    case "EMOM_LOOP":
      return <SchemeParamsEmomLoopForm basePath={basePath} isLoading={isLoading} />;
    case "TIME_BOXED":
      return (
        <SchemeParamsTimeBoxedForm
          basePath={basePath}
          isLoading={isLoading}
          renderInner={renderInner}
        />
      );
    case "LADDER":
      return <SchemeParamsLadderForm basePath={basePath} isLoading={isLoading} />;
    case "DISTANCE":
      return <SchemeParamsDistanceForm basePath={basePath} isLoading={isLoading} />;
  }
};

export const SchemeParamsField = ({
  basePath,
  kindPath,
  isLoading = false,
}: SchemeParamsFieldProps) => {
  const { control, setValue, clearErrors, getValues, getFieldState, formState } =
    useFormContext<FieldValues>();

  const watched: unknown = useWatch({ control, name: kindPath });
  const kind = isArchetypeKind(watched) ? watched : undefined;

  const previousKindRef = useRef<SchemeArchetypeKind | undefined>(kind);

  useEffect(() => {
    if (kind === undefined) {
      return;
    }

    const previousKind = previousKindRef.current;
    const currentValue: unknown = getValues(basePath);

    if (
      previousKind === kind &&
      currentValue !== undefined &&
      isSchemeParamsForKind(currentValue, kind)
    ) {
      return;
    }

    const isUserDrivenSwap = previousKind !== kind;

    previousKindRef.current = kind;
    setValue(basePath, defaultSchemeParams(kind), { shouldDirty: isUserDrivenSwap });
    clearErrors(basePath);
    clearErrors(kindPath);
  }, [kind, basePath, kindPath, getValues, setValue, clearErrors]);

  const renderInner = useCallback<SchemeParamsRenderInner>(
    (innerProps) => <SchemeParamsField {...innerProps} />,
    [],
  );

  const baseError = getFieldState(basePath, formState).error;
  const baseErrorMessage = typeof baseError?.message === "string" ? baseError.message : undefined;

  return (
    <Stack spacing={3}>
      {baseErrorMessage !== undefined && <Alert severity="error">{baseErrorMessage}</Alert>}
      {kind !== undefined && renderArchetype(kind, basePath, isLoading, renderInner)}
    </Stack>
  );
};
