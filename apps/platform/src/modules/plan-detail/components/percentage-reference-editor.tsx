"use client";

import { FormControl, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { PercentageReference } from "@repo/contracts/lms/_shared";

type RestrictedPercentageReference = Extract<
  PercentageReference,
  { scope: "self" | "movement_family" }
>;
type MovementFamilyReference = Extract<PercentageReference, { scope: "movement_family" }>;
type RestrictedScope = RestrictedPercentageReference["scope"];

const SCOPE_LABELS: Record<RestrictedScope, string> = {
  self: "Of the same movement",
  movement_family: "Of a movement family",
};

const SCOPE_OPTIONS: RestrictedScope[] = ["self", "movement_family"];

type PercentageReferenceEditorProps = {
  value: RestrictedPercentageReference;
  onChange: (next: RestrictedPercentageReference) => void;
  error?: FieldErrors<MovementFamilyReference> | undefined;
  disabled?: boolean;
};

export const PercentageReferenceEditor = ({
  value,
  onChange,
  error,
  disabled = false,
}: PercentageReferenceEditorProps) => {
  const handleScopeChange = (nextScope: RestrictedScope) => {
    if (nextScope === "self") {
      onChange({ scope: "self" });

      return;
    }

    onChange({ scope: "movement_family", movementFamily: "" });
  };

  return (
    <Stack spacing={1.5}>
      <FormControl size="small" sx={{ minWidth: 220 }} disabled={disabled}>
        <InputLabel>Reference</InputLabel>
        <Select
          value={value.scope}
          label="Reference"
          onChange={(e) => handleScopeChange(e.target.value as RestrictedScope)}
        >
          {SCOPE_OPTIONS.map((scope) => (
            <MenuItem key={scope} value={scope}>
              {SCOPE_LABELS[scope]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {value.scope === "movement_family" && (
        <TextField
          label="Movement family"
          size="small"
          value={value.movementFamily}
          onChange={(e) => onChange({ scope: "movement_family", movementFamily: e.target.value })}
          error={error?.movementFamily !== undefined}
          helperText={error?.movementFamily?.message}
          disabled={disabled}
          sx={{ maxWidth: 280 }}
        />
      )}
    </Stack>
  );
};
