"use client";

import type { Label } from "@repo/contracts/lms/label";
import { LabelSelect } from "@repo/ui";

type DayLabelSelectProps = {
  value: Label | null;
  options: Label[];
  isLoading: boolean;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};

export const DayLabelSelect = ({
  value,
  options,
  isLoading,
  onChange,
  disabled = false,
}: DayLabelSelectProps) => (
  <LabelSelect
    value={value}
    options={options}
    isLoading={isLoading}
    onChange={onChange}
    disabled={disabled}
    label="Day label"
    placeholder="Tag this day…"
  />
);
