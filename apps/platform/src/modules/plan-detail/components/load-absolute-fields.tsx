"use client";

import type { FieldErrors } from "react-hook-form";

import type { Load } from "@repo/contracts/lms/_shared";

import { WeightEditor } from "./weight-editor";

type AbsoluteLoad = Extract<Load, { kind: "absolute" }>;

type LoadAbsoluteFieldsProps = {
  value: AbsoluteLoad;
  onChange: (next: AbsoluteLoad) => void;
  error?: FieldErrors<AbsoluteLoad> | undefined;
  disabled?: boolean;
};

export const LoadAbsoluteFields = ({
  value,
  onChange,
  error,
  disabled = false,
}: LoadAbsoluteFieldsProps) => {
  return (
    <WeightEditor
      value={value.weight}
      onChange={(weight) => onChange({ kind: "absolute", weight })}
      error={error?.weight}
      disabled={disabled}
    />
  );
};
