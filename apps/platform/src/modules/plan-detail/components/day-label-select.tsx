"use client";

import type { Label } from "@repo/contracts/lms/label";
import { LabelSelect } from "@repo/ui";

import { useLabelOptions } from "@app/lib/hooks";

type DayLabelSelectProps = {
  value: Label | null;
  onChange: (labelId: string | null) => void;
  disabled?: boolean | undefined;
};

export const DayLabelSelect = ({ value, onChange, disabled = false }: DayLabelSelectProps) => {
  const { options, isLoading } = useLabelOptions("DAY");

  return (
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
};
