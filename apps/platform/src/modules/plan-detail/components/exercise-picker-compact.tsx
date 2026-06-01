"use client";

import { useRef, useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  FormHelperText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { type Exercise } from "@repo/contracts/lms/exercise";

import { buildMetaLine } from "./exercise-meta-line";

const COMPACT_TRIGGER_MAX_WIDTH = 220;
const COMPACT_MENU_MAX_HEIGHT = 280;
const COMPACT_SEARCH_WIDTH = 260;
const OPTION_NAME_FONT_WEIGHT = 600;
const PICK_PLACEHOLDER = "(pick exercise)";
const SEARCH_PLACEHOLDER = "search…";
const NO_MATCHES_MESSAGE = "no matches";
const REQUIRED_EXERCISE_MESSAGE = "Pick an exercise";

const matchesQuery = (exercise: Exercise, query: string): boolean => {
  const normalized = query.trim().toLowerCase();

  if (normalized === "") {
    return true;
  }

  const family = exercise.movementFamily ?? "";

  return (
    exercise.canonicalName.toLowerCase().includes(normalized) ||
    family.toLowerCase().includes(normalized)
  );
};

type ExercisePickerCompactProps = {
  value: string | null;
  onChange: (id: string | null) => void;
  selected: Exercise | null;
  options: Exercise[];
  isLoading: boolean;
  error?: boolean;
  disabled?: boolean;
};

export const ExercisePickerCompact = ({
  value,
  onChange,
  selected,
  options,
  isLoading,
  error = false,
  disabled = false,
}: ExercisePickerCompactProps) => {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = options.filter((exercise) => matchesQuery(exercise, query));

  const handleOpen = (): void => {
    setIsOpen(true);
  };

  const handleClose = (): void => {
    setIsOpen(false);
    setQuery("");
  };

  const handleSelect = (id: string): void => {
    onChange(id);
    handleClose();
  };

  return (
    <Stack spacing={0.5}>
      <Button
        ref={anchorRef}
        variant="outlined"
        size="small"
        onClick={handleOpen}
        disabled={disabled || isLoading}
        endIcon={<ExpandMoreIcon fontSize="small" />}
        {...(error && { color: "error" })}
        sx={{ maxWidth: COMPACT_TRIGGER_MAX_WIDTH, justifyContent: "space-between" }}
      >
        <Typography variant="body2" noWrap>
          {selected?.canonicalName ?? PICK_PLACEHOLDER}
        </Typography>
      </Button>

      <Menu anchorEl={anchorRef.current} open={isOpen} onClose={handleClose}>
        <Box sx={(theme) => ({ px: theme.spacing(1), pb: theme.spacing(1) })}>
          <TextField
            size="small"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            sx={{ width: COMPACT_SEARCH_WIDTH }}
          />
        </Box>

        <Box sx={{ maxHeight: COMPACT_MENU_MAX_HEIGHT, overflow: "auto" }}>
          {filtered.map((exercise) => (
            <MenuItem
              key={exercise.id}
              selected={exercise.id === value}
              onClick={() => handleSelect(exercise.id)}
            >
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: OPTION_NAME_FONT_WEIGHT }}>
                  {exercise.canonicalName}
                </Typography>

                <Typography variant="caption" color="text.subtle">
                  {buildMetaLine(exercise)}
                </Typography>
              </Stack>
            </MenuItem>
          ))}

          {filtered.length === 0 && (
            <Box sx={(theme) => ({ px: theme.spacing(2), py: theme.spacing(1) })}>
              <Typography variant="caption" color="text.subtle">
                {NO_MATCHES_MESSAGE}
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>

      {error && <FormHelperText error>{REQUIRED_EXERCISE_MESSAGE}</FormHelperText>}
    </Stack>
  );
};
