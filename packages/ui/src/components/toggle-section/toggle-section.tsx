"use client";

import { type ReactElement, type ReactNode } from "react";

import { Box, ButtonBase, Card, Typography, alpha } from "@mui/material";

const TOGGLE_DOT_SIZE_PX = 9;
const TOGGLE_CARD_ACTIVE_BG_ALPHA = 0.04;
const TOGGLE_CARD_ACTIVE_BORDER_ALPHA = 0.35;
const TOGGLE_HEAD_SX = { p: 1, gap: 1, width: "100%", justifyContent: "flex-start" } as const;

export type ToggleSectionProps = {
  on: boolean;
  label: ReactNode;
  children: ReactNode;
  helper?: ReactNode | undefined;
  onToggle?: (() => void) | undefined;
  disabled?: boolean | undefined;
};

export const ToggleSection: React.FC<ToggleSectionProps> = ({
  on,
  label,
  children,
  helper,
  onToggle,
  disabled = false,
}): ReactElement => {
  const dot = (
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
  );

  const labelNode = (
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {label}
    </Typography>
  );

  const helperNode = helper !== undefined && (
    <Typography variant="caption" sx={{ color: "text.subtle" }}>
      {helper}
    </Typography>
  );

  const head =
    onToggle !== undefined ? (
      <ButtonBase
        onClick={onToggle}
        disabled={disabled}
        sx={(theme) => ({
          ...TOGGLE_HEAD_SX,
          opacity: disabled ? theme.palette.action.disabledOpacity : 1,
        })}
      >
        {dot}
        {labelNode}
        {helperNode}
      </ButtonBase>
    ) : (
      <Box
        sx={(theme) => ({
          ...TOGGLE_HEAD_SX,
          display: "flex",
          alignItems: "center",
          opacity: disabled ? theme.palette.action.disabledOpacity : 1,
        })}
      >
        {dot}
        {labelNode}
        {helperNode}
      </Box>
    );

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        bgcolor: on
          ? alpha(theme.palette.primary.main, TOGGLE_CARD_ACTIVE_BG_ALPHA)
          : "transparent",
        borderColor: on
          ? alpha(theme.palette.primary.main, TOGGLE_CARD_ACTIVE_BORDER_ALPHA)
          : theme.palette.divider,
      })}
    >
      {head}
      {on && (
        <Box
          sx={(theme) => ({
            p: 1.25,
            borderTop: "1px solid",
            borderColor: "divider",
            ...(disabled
              ? { pointerEvents: "none", opacity: theme.palette.action.disabledOpacity }
              : {}),
          })}
        >
          {children}
        </Box>
      )}
    </Card>
  );
};
