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

import { type SchemeParamsBasePath } from "./scheme-params-field";

type UntypedFormValues = FieldValues;

type EmomSlotActionKind = "ENTRY" | "REST" | "MAX_OF_ENTRY";

type EmomSlotActionFieldProps = {
  basePath: SchemeParamsBasePath;
  slotIndex: number;
  isLoading: boolean;
};

const ACTION_KIND_OPTIONS = [
  { value: "ENTRY", label: "Entry" },
  { value: "REST", label: "Rest" },
  { value: "MAX_OF_ENTRY", label: "Max of Entry" },
] as const;

const isActionKind = (value: unknown): value is EmomSlotActionKind => {
  return value === "ENTRY" || value === "REST" || value === "MAX_OF_ENTRY";
};

const buildActionPayload = (
  kind: EmomSlotActionKind,
  previousEntryRefIndex: number,
): { kind: EmomSlotActionKind; entryRefIndex?: number } => {
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

export const EmomSlotActionField = ({
  basePath,
  slotIndex,
  isLoading,
}: EmomSlotActionFieldProps) => {
  const { register, control, setValue, getValues, getFieldState, formState } =
    useFormContext<UntypedFormValues>();

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

    if (previousKindRef.current === kind) {
      return;
    }

    const previousAction = getValues(actionPath);
    const previousIndex = readEntryRefIndex(previousAction);

    previousKindRef.current = kind;
    setValue(actionPath, buildActionPayload(kind, previousIndex), { shouldDirty: true });
  }, [kind, actionPath, getValues, setValue]);

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
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isLoading}
            >
              {ACTION_KIND_OPTIONS.map((option) => (
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
