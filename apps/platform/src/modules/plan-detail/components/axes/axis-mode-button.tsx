"use client";

import { type ReactNode } from "react";

import { ButtonBase, Typography, alpha } from "@mui/material";

const TILE_GAP = 0.625;
const TILE_PADDING_Y = 1.125;
const TILE_PADDING_X = 0.5;
const SELECTED_BG_ALPHA = 0.12;
const CAPTION_LINE_HEIGHT = 1.2;

type AxisModeButtonProps = {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onSelect: () => void;
};

export const AxisModeButton: React.FC<AxisModeButtonProps> = ({
  label,
  icon,
  isActive,
  onSelect,
}) => (
  <ButtonBase
    aria-pressed={isActive}
    aria-label={label}
    onClick={onSelect}
    sx={(theme) => ({
      flexDirection: "column",
      alignItems: "center",
      gap: TILE_GAP,
      px: TILE_PADDING_X,
      py: TILE_PADDING_Y,
      width: "100%",
      border: "1px solid",
      borderColor: isActive ? "primary.main" : "divider",
      borderRadius: 1,
      bgcolor: isActive
        ? alpha(theme.palette.primary.main, SELECTED_BG_ALPHA)
        : "background.default",
      color: isActive ? "primary.main" : "text.secondary",
      "&:hover": {
        borderColor: isActive ? "primary.main" : "dividerStrong",
        bgcolor: isActive ? alpha(theme.palette.primary.main, SELECTED_BG_ALPHA) : "action.hover",
      },
    })}
  >
    {icon}

    <Typography
      variant="caption"
      sx={{ lineHeight: CAPTION_LINE_HEIGHT, color: "inherit", textAlign: "center" }}
    >
      {label}
    </Typography>
  </ButtonBase>
);
