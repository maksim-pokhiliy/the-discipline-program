"use client";

import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";

import { InputBase, type TypographyVariant } from "@mui/material";

import { type InlineEditTextProps } from "./inline-edit-text.types";

type UseInlineEditTextOptions = {
  value: string;
  onCommit: (next: string) => void;
  multiline: boolean;
  emptyIsValid: boolean;
};

const useInlineEditText = ({
  value,
  onCommit,
  multiline,
  emptyIsValid,
}: UseInlineEditTextOptions) => {
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

  return {
    value: draft,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(event.target.value),
    onFocus: () => {
      isFocusedRef.current = true;
      committedValueRef.current = value;
    },
    onBlur: () => {
      isFocusedRef.current = false;
      commit();
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDraft(committedValueRef.current);

        return;
      }

      if (event.key === "Enter" && !multiline) {
        event.preventDefault();
        commit();
      }
    },
  };
};

const inlineEditSx = (variant: TypographyVariant) => ({
  p: 0,
  ".MuiInputBase-input": { p: 0, height: "auto", typography: variant },
});

export const InlineEditText: React.FC<InlineEditTextProps> = ({
  value,
  onCommit,
  variant,
  ariaLabel,
  multiline = false,
  placeholder,
  emptyIsValid = false,
  maxLength,
  sx,
}) => {
  const handlers = useInlineEditText({ value, onCommit, multiline, emptyIsValid });

  return (
    <InputBase
      {...handlers}
      fullWidth
      {...(multiline && { multiline: true })}
      {...(placeholder !== undefined && { placeholder })}
      inputProps={{
        "aria-label": ariaLabel,
        ...(maxLength !== undefined && { maxLength }),
      }}
      sx={[inlineEditSx(variant), ...(Array.isArray(sx) ? sx : sx === undefined ? [] : [sx])]}
    />
  );
};
