"use client";

import { Stack, TextField } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { Load } from "@repo/contracts/lms/_shared";

type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;

type LoadByProfileFieldsProps = {
  value: ByProfileLoad;
  onChange: (next: ByProfileLoad) => void;
  error?: FieldErrors<ByProfileLoad> | undefined;
  disabled?: boolean;
};

export const LoadByProfileFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: LoadByProfileFieldsProps) => {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      <TextField
        label="Male (kg)"
        type="number"
        size="small"
        value={typeof value.first === "number" ? value.first : ""}
        onChange={(e) => onChange({ ...value, first: Number(e.target.value) })}
        inputProps={{ min: 0, step: 0.5 }}
        error={error?.first !== undefined}
        helperText={error?.first?.message}
        disabled={disabled}
        sx={{ maxWidth: 160 }}
      />

      <TextField
        label="Female (kg)"
        type="number"
        size="small"
        value={typeof value.second === "number" ? value.second : ""}
        onChange={(e) => onChange({ ...value, second: Number(e.target.value) })}
        inputProps={{ min: 0, step: 0.5 }}
        error={error?.second !== undefined}
        helperText={error?.second?.message}
        disabled={disabled}
        sx={{ maxWidth: 160 }}
      />
    </Stack>
  );
};
