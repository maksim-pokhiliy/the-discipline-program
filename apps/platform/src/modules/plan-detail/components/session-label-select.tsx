"use client";

import type { Label } from "@repo/contracts/lms/label";
import { LabelSelect } from "@repo/ui";

import { useLabelOptions } from "@app/lib/hooks";

type SessionLabelSelectProps = {
  value: Label | null;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};

export const SessionLabelSelect = ({
  value,
  onChange,
  disabled = false,
}: SessionLabelSelectProps) => {
  const { options, isLoading } = useLabelOptions("SESSION");

  return (
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
};
