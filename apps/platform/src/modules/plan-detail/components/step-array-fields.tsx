"use client";

import { useState } from "react";

import { Chip, FormHelperText, Stack, TextField } from "@mui/material";
import type { FieldError } from "react-hook-form";

const MIN_STEPS = 1;

type StepArrayFieldsProps = {
  value: number[];
  onChange: (next: number[]) => void;
  error?: FieldError | undefined;
  disabled?: boolean;
};

export const StepArrayFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: StepArrayFieldsProps) => {
  const [draft, setDraft] = useState("");

  const canRemove = value.length > MIN_STEPS;

  const commitDraft = () => {
    const parsed = Number(draft);

    if (Number.isInteger(parsed) && parsed > 0) {
      onChange([...value, parsed]);
      setDraft("");
    }
  };

  const removeStep = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const isRemovable = canRemove && !disabled;

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {value.map((step, index) => (
          <Chip
            key={index}
            size="small"
            label={step}
            {...(isRemovable && { onDelete: () => removeStep(index) })}
          />
        ))}
      </Stack>

      <TextField
        label="Add step"
        type="number"
        size="small"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
          }
        }}
        onBlur={commitDraft}
        inputProps={{ min: 1, step: 1 }}
        disabled={disabled}
        sx={{ maxWidth: 140 }}
      />

      {error !== undefined && <FormHelperText error>{error.message}</FormHelperText>}
    </Stack>
  );
};
