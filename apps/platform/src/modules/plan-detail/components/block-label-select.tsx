"use client";

import type { Label } from "@repo/contracts/lms/label";
import { LabelSelect } from "@repo/ui";

import { useLabelOptions } from "@app/lib/hooks";

type BlockLabelSelectProps = {
  value: Label[];
  onChange: (labelIds: string[]) => void;
  disabled?: boolean | undefined;
};

export const BlockLabelSelect = ({ value, onChange, disabled = false }: BlockLabelSelectProps) => {
  const { options, isLoading } = useLabelOptions("BLOCK");

  return (
    <LabelSelect
      multiple
      value={value}
      options={options}
      isLoading={isLoading}
      onChange={onChange}
      disabled={disabled}
      label="Block labels"
      placeholder="Tag this block…"
    />
  );
};
