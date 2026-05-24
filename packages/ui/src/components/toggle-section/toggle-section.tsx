"use client";

import { type ReactElement, type ReactNode } from "react";

import { Box, ButtonBase, Card, Typography, alpha } from "@mui/material";

const TOGGLE_DOT_SIZE_PX = 9;
const TOGGLE_CARD_ACTIVE_BG_ALPHA = 0.04;
const TOGGLE_CARD_ACTIVE_BORDER_ALPHA = 0.35;

export type ToggleSectionProps = {
  on: boolean;
  label: ReactNode;
  children: ReactNode;
  helper?: ReactNode | undefined;
  onToggle?: (() => void) | undefined;
};

export const ToggleSection: React.FC<ToggleSectionProps> = ({
  on,
  label,
  children,
  helper,
  onToggle,
}): ReactElement => (
  <Card
    variant="outlined"
    sx={(theme) => ({
      bgcolor: on ? alpha(theme.palette.primary.main, TOGGLE_CARD_ACTIVE_BG_ALPHA) : "transparent",
      borderColor: on
        ? alpha(theme.palette.primary.main, TOGGLE_CARD_ACTIVE_BORDER_ALPHA)
        : theme.palette.divider,
    })}
  >
    <ButtonBase
      {...(onToggle !== undefined && { onClick: onToggle })}
      sx={{ p: 1, gap: 1, width: "100%", justifyContent: "flex-start" }}
    >
      <Box
        sx={(theme) => ({
          width: TOGGLE_DOT_SIZE_PX,
          height: TOGGLE_DOT_SIZE_PX,
          borderRadius: "50%",
          bgcolor: on ? theme.palette.primary.main : theme.palette.divider,
          border: "1px solid",
          borderColor: theme.palette.dividerStrong,
        })}
      />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      {helper !== undefined && (
        <Typography variant="caption" sx={{ color: "text.subtle" }}>
          {helper}
        </Typography>
      )}
    </ButtonBase>
    {on && <Box sx={{ p: 1.25, borderTop: "1px solid", borderColor: "divider" }}>{children}</Box>}
  </Card>
);
