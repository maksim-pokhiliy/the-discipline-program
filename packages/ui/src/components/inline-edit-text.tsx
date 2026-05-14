"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { InputBase, type TypographyVariant } from "@mui/material";

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
  const [draft, setDraft] = useState(value);
  const committedValueRef = useRef(value);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value);
      committedValueRef.current = value;
    }
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim();

    if (trimmed === committedValueRef.current || (trimmed === "" && !emptyIsValid)) {
      setDraft(committedValueRef.current);

      return;
    }

    committedValueRef.current = trimmed;
    setDraft(trimmed);
    onCommit(trimmed);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    committedValueRef.current = value;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    commit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(committedValueRef.current);

      return;
    }

    if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      commit();
    }
  };

  return (
    <InputBase
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      multiline={multiline}
      fullWidth
      {...(placeholder !== undefined && { placeholder })}
      inputProps={{ "aria-label": ariaLabel }}
      sx={{
        p: 0,
        ".MuiInputBase-input": { p: 0, height: "auto", typography: variant },
      }}
    />
  );
};
