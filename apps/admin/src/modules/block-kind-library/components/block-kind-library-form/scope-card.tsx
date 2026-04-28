"use client";

import { MenuItem, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import {
  type CreateBlockKindInput,
  type UpdateBlockKindInput,
} from "@repo/contracts/lms/block-kind";
import { FormCard } from "@repo/ui";

import { LIBRARY_SCOPE_OPTIONS } from "../../constants";

type FormValues = CreateBlockKindInput & UpdateBlockKindInput;

type ScopeCardProps = {
  isEdit: boolean;
  isLoading: boolean;
};

export const ScopeCard = ({ isEdit, isLoading }: ScopeCardProps) => {
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
