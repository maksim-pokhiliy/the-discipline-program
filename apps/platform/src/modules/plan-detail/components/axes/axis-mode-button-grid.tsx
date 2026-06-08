"use client";

import { type ReactNode } from "react";

import { Box } from "@mui/material";

import { AxisModeButton } from "./axis-mode-button";

const GRID_COLUMNS = "repeat(4, 1fr)";
const GRID_GAP = 0.75;

export type AxisModeTile<TKind extends string> = {
  kind: TKind;
  label: string;
  icon: ReactNode;
};

type AxisModeButtonGridProps<TKind extends string> = {
  label: string;
  value: TKind;
  tiles: readonly AxisModeTile<TKind>[];
  onChange: (next: TKind) => void;
};

export const AxisModeButtonGrid = <TKind extends string>({
  label,
  value,
  tiles,
  onChange,
}: AxisModeButtonGridProps<TKind>): ReactNode => (
  <Box
    role="radiogroup"
    aria-label={label}
    sx={{ display: "grid", gridTemplateColumns: GRID_COLUMNS, gap: GRID_GAP }}
  >
    {tiles.map((tile) => (
      <AxisModeButton
        key={tile.kind}
        label={tile.label}
        icon={tile.icon}
        isActive={tile.kind === value}
        onSelect={() => onChange(tile.kind)}
      />
    ))}
  </Box>
);
