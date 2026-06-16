"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Box, Button, ButtonBase, Chip, Stack, Typography } from "@mui/material";

import { COACH_PROFILE_CONSTANTS, SPECIALTY_PRESET } from "@repo/contracts/coaching/coach-profile";

type SpecialtiesEditorProps = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

const isSameSelection = (left: string[], right: string[]): boolean =>
  left.length === right.length && left.every((item, index) => item === right[index]);

export const SpecialtiesEditor: React.FC<SpecialtiesEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [draft, setDraft] = useState<string[] | null>(null);

  const isEditing = draft !== null;
  const current = draft ?? value;
  const isAtLimit = current.length >= COACH_PROFILE_CONSTANTS.MAX_SPECIALTIES;

  const removeChip = (specialty: string) => {
    const next = current.filter((item) => item !== specialty);

    if (isEditing) {
      setDraft(next);
    } else {
      onChange(next);
    }
  };

  const togglePreset = (specialty: string) => {
    if (current.includes(specialty)) {
      setDraft(current.filter((item) => item !== specialty));
    } else if (!isAtLimit) {
      setDraft([...current, specialty]);
    }
  };

  const commit = () => {
    if (draft !== null && !isSameSelection(draft, value)) {
      onChange(draft);
    }

    setDraft(null);
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75}>
        {current.length === 0 && !isEditing && (
          <Typography variant="caption" sx={{ fontStyle: "italic", color: "text.muted" }}>
            No specialties listed yet.
          </Typography>
        )}

        {current.map((specialty) => (
          <Chip
            key={specialty}
            label={specialty}
            size="small"
            {...(!disabled && { onDelete: () => removeChip(specialty) })}
          />
        ))}

        <ButtonBase
          onClick={isEditing ? commit : () => setDraft(value)}
          disabled={disabled}
          aria-expanded={isEditing}
          sx={(theme) => ({
            height: 24,
            px: 1.25,
            gap: 0.5,
            borderRadius: 9999,
            border: `1px dashed ${theme.palette.divider}`,
            color: "text.muted",
            typography: "overline",
            transition: theme.transitions.create(["color", "border-color"]),

            "&:hover": {
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
            },
          })}
        >
          <AddIcon sx={{ fontSize: 14 }} />
          {current.length === 0 ? "Add specialties" : "Add"}
        </ButtonBase>
      </Stack>

      {isEditing && (
        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            bgcolor: "background.default",
            p: 1,
          })}
        >
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {SPECIALTY_PRESET.map((specialty) => {
              const isSelected = current.includes(specialty);

              return (
                <Chip
                  key={specialty}
                  label={specialty}
                  size="small"
                  clickable
                  onClick={() => togglePreset(specialty)}
                  color={isSelected ? "primary" : "default"}
                  variant={isSelected ? "filled" : "outlined"}
                  disabled={disabled || (!isSelected && isAtLimit)}
                />
              );
            })}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={(theme) => ({
              mt: 0.5,
              pt: 0.75,
              borderTop: `1px solid ${theme.palette.divider}`,
            })}
          >
            <Typography variant="overline" color="text.muted">
              Tap to toggle
            </Typography>

            <Button size="small" onClick={commit}>
              Done
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  );
};
