"use client";

import { type KeyboardEvent, useState } from "react";

import { TextField, Typography, type TypographyVariant } from "@mui/material";

export type InlineEditTextProps = {
  value: string;
  onCommit: (next: string) => void;
  variant: TypographyVariant;
  ariaLabel: string;
  placeholder?: string;
  multiline?: boolean;
  emptyIsValid?: boolean;
};

export const InlineEditText: React.FC<InlineEditTextProps> = ({
  value,
  onCommit,
  variant,
  ariaLabel,
  placeholder,
  multiline = false,
  emptyIsValid = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const enterEdit = () => {
    setDraft(value);
    setIsEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();

    setIsEditing(false);

    if (trimmed === value) {
      return;
    }

    if (trimmed === "" && !emptyIsValid) {
      return;
    }

    onCommit(trimmed);
  };

  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();

      return;
    }

    if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      commit();
    }
  };

  if (isEditing) {
    return (
      <TextField
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        variant="standard"
        fullWidth
        autoFocus
        multiline={multiline}
        {...(placeholder !== undefined && { placeholder })}
        slotProps={{ htmlInput: { "aria-label": ariaLabel } }}
        sx={{ ".MuiInputBase-input": { typography: variant } }}
      />
    );
  }

  const isEmpty = value === "";

  return (
    <Typography
      variant={variant}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={enterEdit}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          enterEdit();
        }
      }}
      sx={{
        cursor: "text",
        color: isEmpty ? "text.disabled" : "text.primary",
      }}
    >
      {isEmpty ? placeholder : value}
    </Typography>
  );
};
