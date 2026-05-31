"use client";

import { type MouseEvent, type ReactElement, type ReactNode } from "react";

import { Stack, ToggleButtonGroup, type ToggleButtonGroupProps, Typography } from "@mui/material";

const ROW_SX = { alignItems: "center", flexWrap: "wrap" } as const;

export type LabeledToggleGroupProps<TValue> = {
  label: string;
  value: TValue;
  onChange: (event: MouseEvent<HTMLElement>, value: TValue | null) => void;
  children: ReactNode;
  exclusive?: boolean;
  size?: ToggleButtonGroupProps["size"];
  fullWidth?: boolean;
  disabled?: boolean;
  helper?: ReactNode | undefined;
};

export const LabeledToggleGroup = <TValue,>({
  label,
  value,
  onChange,
  children,
  exclusive = true,
  size = "small",
  fullWidth = false,
  disabled = false,
  helper,
}: LabeledToggleGroupProps<TValue>): ReactElement => (
  <Stack direction="row" spacing={1} sx={ROW_SX}>
    <Typography variant="caption" color="text.subtle">
      {label}
    </Typography>

    <ToggleButtonGroup
      aria-label={label}
      value={value}
      onChange={onChange}
      exclusive={exclusive}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
    >
      {children}
    </ToggleButtonGroup>

    {helper}
  </Stack>
);
