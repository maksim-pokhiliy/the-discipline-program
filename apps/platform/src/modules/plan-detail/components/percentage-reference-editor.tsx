"use client";

import { Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { PercentageReference } from "@repo/contracts/lms/_shared";

type RestrictedPercentageReference = Extract<
  PercentageReference,
  { scope: "self" | "movement_family" }
>;
type MovementFamilyReference = Extract<PercentageReference, { scope: "movement_family" }>;
type RestrictedScope = RestrictedPercentageReference["scope"];

const SCOPE_LABELS: Record<RestrictedScope, string> = {
  self: "self 1RM",
  movement_family: "family",
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
  const handleScopeChange = (_: unknown, next: RestrictedScope | null) => {
    if (next === null) {
      return;
    }

    if (next === "self") {
      onChange({ scope: "self" });

      return;
    }

    onChange({ scope: "movement_family", movementFamily: "" });
  };

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        aria-label="percentage reference"
        value={value.scope}
        exclusive
        onChange={handleScopeChange}
        size="small"
        disabled={disabled}
      >
        {SCOPE_OPTIONS.map((scope) => (
          <ToggleButton key={scope} value={scope}>
            {SCOPE_LABELS[scope]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

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
