"use client";

import { useState } from "react";

import { Box, Button, Chip, FormHelperText, Stack, TextField } from "@mui/material";
import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";

const MIN_STEPS = 1;

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export const parseStepDraft = (draft: string): number | null => {
  const trimmed = draft.trim();

  return POSITIVE_INTEGER_PATTERN.test(trimmed) ? Number(trimmed) : null;
};

type StepArrayFieldsError = Merge<FieldError, FieldErrorsImpl<number[]>>;

type StepArrayFieldsProps = {
  value: number[];
  onChange: (next: number[]) => void;
  error?: StepArrayFieldsError | undefined;
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
    const parsed = parseStepDraft(draft);

    if (parsed !== null) {
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

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
          inputProps={{ min: 1, step: 1 }}
          disabled={disabled}
          sx={{ maxWidth: 140 }}
        />

        <Box>
          <Button size="small" variant="outlined" onClick={commitDraft} disabled={disabled}>
            Add
          </Button>
        </Box>
      </Stack>

      {error !== undefined && <FormHelperText error>{error.message}</FormHelperText>}
    </Stack>
  );
};
