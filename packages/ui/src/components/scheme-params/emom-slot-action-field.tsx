"use client";

import { useEffect, useRef } from "react";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, type FieldValues, useFormContext, useWatch } from "react-hook-form";

import {
  EMOM_SLOT_ACTION_KIND_OPTIONS,
  type EmomSlotActionKind,
  type SchemeParamsEmomLoop,
} from "@repo/contracts/lms/_domain";

import { type SchemeParamsBasePath } from "./scheme-params.types";

type EmomSlotAction = SchemeParamsEmomLoop["slots"][number]["action"];

type EmomSlotActionFieldProps = {
  basePath: SchemeParamsBasePath;
  slotIndex: number;
  isLoading: boolean;
};

const isActionKind = (value: unknown): value is EmomSlotActionKind => {
  return value === "ENTRY" || value === "REST" || value === "MAX_OF_ENTRY";
};

const buildActionPayload = (
  kind: EmomSlotActionKind,
  previousEntryRefIndex: number,
): EmomSlotAction => {
  if (kind === "REST") {
    return { kind };
  }

  return { kind, entryRefIndex: previousEntryRefIndex };
};

const readEntryRefIndex = (value: unknown): number => {
  if (typeof value !== "object" || value === null) {
    return 0;
  }

  if (!("entryRefIndex" in value)) {
    return 0;
  }

  const refIndex = value.entryRefIndex;

  return typeof refIndex === "number" && Number.isFinite(refIndex) ? refIndex : 0;
};

const isActionShapeForKind = (value: unknown, kind: EmomSlotActionKind): boolean => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("kind" in value) || value.kind !== kind) {
    return false;
  }

  if (kind === "REST") {
    return !("entryRefIndex" in value);
  }

  if (!("entryRefIndex" in value)) {
    return false;
  }

  const refIndex = value.entryRefIndex;

  return typeof refIndex === "number" && Number.isFinite(refIndex);
};

export const EmomSlotActionField = ({
  basePath,
  slotIndex,
  isLoading,
}: EmomSlotActionFieldProps) => {
  const { register, control, setValue, clearErrors, getValues, getFieldState, formState } =
    useFormContext<FieldValues>();

  const actionPath = `${basePath}.slots.${slotIndex}.action`;
  const kindPath = `${actionPath}.kind`;
  const entryRefIndexPath = `${actionPath}.entryRefIndex`;

  const watchedKind: unknown = useWatch({ control, name: kindPath });
  const kind = isActionKind(watchedKind) ? watchedKind : undefined;

  const previousKindRef = useRef<EmomSlotActionKind | undefined>(kind);

  useEffect(() => {
    if (kind === undefined) {
      return;
    }

    const previousAction = getValues(actionPath);
    const isUserDrivenSwap = previousKindRef.current !== kind;

    if (!isUserDrivenSwap && isActionShapeForKind(previousAction, kind)) {
      return;
    }

    const previousIndex = readEntryRefIndex(previousAction);

    previousKindRef.current = kind;
    setValue(actionPath, buildActionPayload(kind, previousIndex), {
      shouldDirty: isUserDrivenSwap,
    });
    clearErrors(actionPath);
  }, [kind, actionPath, getValues, setValue, clearErrors]);

  const entryRefIndexError = getFieldState(entryRefIndexPath, formState).error;
  const showEntryRefIndex = kind === "ENTRY" || kind === "MAX_OF_ENTRY";

  return (
    <Stack spacing={2}>
      <Controller
        name={kindPath}
        control={control}
        render={({ field, fieldState }) => (
          <FormControl fullWidth size="small" error={!!fieldState.error}>
            <InputLabel id={`${basePath}-slot-${slotIndex}-action-kind-label`}>
              Action Kind
            </InputLabel>
            <Select
              labelId={`${basePath}-slot-${slotIndex}-action-kind-label`}
              label="Action Kind"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isLoading}
            >
              {EMOM_SLOT_ACTION_KIND_OPTIONS.map((option) => (
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

      {showEntryRefIndex && (
        <TextField
          label="Entry Ref Index"
          type="number"
          variant="outlined"
          fullWidth
          size="small"
          disabled={isLoading}
          error={!!entryRefIndexError}
          helperText={entryRefIndexError?.message}
          inputProps={{ min: 0, step: 1 }}
          {...register(entryRefIndexPath, { valueAsNumber: true })}
        />
      )}
    </Stack>
  );
};
