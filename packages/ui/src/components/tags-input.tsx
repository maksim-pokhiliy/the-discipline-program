"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import { Chip, Stack, TextField, type TextFieldProps } from "@mui/material";

export type TagsInputProps = {
  value?: string[] | undefined;
  onChange: (tags: string[]) => void;
  label?: string | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  size?: TextFieldProps["size"] | undefined;
  error?: boolean | undefined;
  helperText?: ReactNode | undefined;
};

export const TagsInput = ({
  value = [],
  onChange,
  label = "Tags",
  placeholder = "Type and press Enter...",
  disabled = false,
  size = "small",
  error = false,
  helperText,
}: TagsInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      const trimmed = inputValue.trim();

      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
        setInputValue("");
      }
    } else if (event.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleDelete = (tagToDelete: string) => {
    onChange(value.filter((tag) => tag !== tagToDelete));
  };

  return (
    <Stack spacing={1}>
      <TextField
        label={label}
        placeholder={value.length === 0 ? placeholder : ""}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
        error={error}
        helperText={helperText || "Press Enter to add tag"}
        onKeyDown={handleKeyDown}
        fullWidth
        size={size}
        variant="outlined"
      />
      {value.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {value.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              {...(!disabled && { onDelete: () => handleDelete(tag) })}
              size="small"
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};
