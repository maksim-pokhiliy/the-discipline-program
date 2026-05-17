"use client";

import type { Label } from "@repo/contracts/lms/label";
import { LabelSelect } from "@repo/ui";

type SessionLabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};

export const SessionLabelSelect = ({
  value,
  options,
  isLoading,
  onChange,
  disabled = false,
}: SessionLabelSelectProps) => (
  <LabelSelect
    value={value}
    options={options}
    isLoading={isLoading}
    onChange={onChange}
    disabled={disabled}
    label="Session label"
    placeholder="Tag this session…"
  />
);
