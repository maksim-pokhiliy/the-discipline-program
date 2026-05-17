"use client";

import { useEffect, useRef, useState } from "react";

type UseBlurCommitArgs = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

type UseBlurCommitResult = {
  draft: string;
  setDraft: (next: string) => void;
  handleFocus: () => void;
  handleBlur: () => void;
};

export const useBlurCommit = ({ value, onCommit }: UseBlurCommitArgs): UseBlurCommitResult => {
  const [draft, setDraft] = useState(value ?? "");
  const committedRef = useRef(value ?? "");
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value ?? "");
      committedRef.current = value ?? "";
    }
  }, [value]);

  const handleFocus = () => {
    isFocusedRef.current = true;
    committedRef.current = value ?? "";
  };

  const handleBlur = () => {
    isFocusedRef.current = false;

    const trimmed = draft.trim();

    if (trimmed === committedRef.current) {
      setDraft(committedRef.current);

      return;
    }

    committedRef.current = trimmed;
    setDraft(trimmed);
    onCommit(trimmed === "" ? null : trimmed);
  };

  return { draft, setDraft, handleFocus, handleBlur };
};
