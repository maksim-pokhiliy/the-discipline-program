"use client";

import { type ReactElement, type ReactNode } from "react";

import { Chip } from "@mui/material";

export type TogglePillActiveColor = "info" | "success" | "primary";

export type TogglePillProps = {
  icon: ReactElement;
  active: boolean;
  label: ReactNode;
  onChange: () => void;
  activeColor?: TogglePillActiveColor | undefined;
};

export const TogglePill: React.FC<TogglePillProps> = ({
  icon,
  active,
  label,
  onChange,
  activeColor,
}): ReactElement => (
  <Chip
    size="small"
    clickable
    color={active ? (activeColor ?? "info") : "default"}
    variant={active ? "filled" : "outlined"}
    icon={icon}
    label={label}
    onClick={onChange}
  />
);
