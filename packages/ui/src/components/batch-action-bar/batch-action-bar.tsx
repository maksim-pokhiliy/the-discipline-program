"use client";

import { type ReactElement, type ReactNode } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, Stack, Typography } from "@mui/material";

const BAR_MAX_WIDTH_PX = 1208;
const BAR_SIDE_INSET_PX = 16;
const BAR_Z_INDEX = 18;
const COUNT_FONT_SIZE_PX = 18;
const CANCEL_LABEL = "Cancel";

export type BatchActionBarProps = {
  count: number;
  onCancel: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryIcon?: ReactNode;
};

export const BatchActionBar = ({
  count,
  onCancel,
  primaryLabel,
  onPrimary,
  primaryIcon,
}: BatchActionBarProps): ReactElement => (
  <Box
    sx={(theme) => ({
      position: "fixed",
      bottom: `calc(${String(theme.layout.platformBottomNavHeight)}px + env(safe-area-inset-bottom))`,
      left: BAR_SIDE_INSET_PX,
      right: BAR_SIDE_INSET_PX,
      maxWidth: BAR_MAX_WIDTH_PX,
      mx: "auto",
      zIndex: BAR_Z_INDEX,
      display: "flex",
      alignItems: "center",
      gap: 1.25,
      px: 1.5,
      py: 1.25,
      bgcolor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(0.5),
    })}
  >
    <Typography
      sx={{
        fontSize: (theme) => theme.typography.pxToRem(13),
        color: "text.primary",
        minWidth: 0,
      }}
    >
      <Box
        component="span"
        sx={{
          fontFamily: "var(--font-display)",
          fontSize: (theme) => theme.typography.pxToRem(COUNT_FONT_SIZE_PX),
          lineHeight: 1,
          color: "primary.main",
          mr: 0.5,
        }}
      >
        {count}
      </Box>
      selected
    </Typography>
    <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
      <Button variant="outlined" size="small" startIcon={<CloseIcon />} onClick={onCancel}>
        {CANCEL_LABEL}
      </Button>
      <Button
        variant="contained"
        size="small"
        onClick={onPrimary}
        {...(primaryIcon !== undefined && { startIcon: primaryIcon })}
      >
        {primaryLabel}
      </Button>
    </Stack>
  </Box>
);
