"use client";

import { type ReactElement, type ReactNode } from "react";

import CheckIcon from "@mui/icons-material/Check";
import { alpha, Box, ButtonBase, Stack, Typography } from "@mui/material";

const ICON_BOX_SIZE_PX = 36;
const CHECK_SIZE_PX = 18;
const CHECK_ICON_SIZE_PX = 12;
const ICON_GLYPH_SIZE_PX = 20;
const SELECTED_TINT_ALPHA = 0.08;
const ICON_BG_ALPHA = 0.05;
const DISABLED_OPACITY = 0.55;

export type ReasonOptionProps = {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
};

export const ReasonOption = ({
  icon,
  title,
  description,
  selected,
  disabled = false,
  badge,
  onClick,
}: ReasonOptionProps): ReactElement => (
  <ButtonBase
    disabled={disabled}
    {...(onClick !== undefined && { onClick })}
    sx={(theme) => ({
      width: "100%",
      textAlign: "left",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      gap: 1.25,
      p: 1.5,
      borderRadius: theme.spacing(0.5),
      border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
      bgcolor: selected
        ? alpha(theme.palette.primary.main, SELECTED_TINT_ALPHA)
        : theme.palette.background.default,
      color: theme.palette.text.primary,
      ...(disabled && { opacity: DISABLED_OPACITY }),
    })}
  >
    <Box
      sx={(theme) => ({
        width: ICON_BOX_SIZE_PX,
        height: ICON_BOX_SIZE_PX,
        flexShrink: 0,
        borderRadius: theme.spacing(0.5),
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.common.white, ICON_BG_ALPHA),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: selected ? theme.palette.primary.main : theme.palette.text.primary,
        "& svg": { fontSize: (t) => t.typography.pxToRem(ICON_GLYPH_SIZE_PX) },
      })}
    >
      {icon}
    </Box>
    <Stack spacing={0.375} sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: (theme) => theme.typography.pxToRem(13.5),
          fontWeight: (theme) => theme.typography.fontWeightMedium,
          color: "text.primary",
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: (theme) => theme.typography.pxToRem(11.5),
          color: "text.muted",
          lineHeight: 1.4,
        }}
      >
        {description}
      </Typography>
    </Stack>
    {badge !== undefined ? (
      <Typography
        component="span"
        sx={(theme) => ({
          flexShrink: 0,
          alignSelf: "flex-start",
          px: 0.75,
          py: 0.25,
          fontSize: theme.typography.pxToRem(9),
          fontWeight: theme.typography.fontWeightBold,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: theme.palette.text.faint,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.spacing(0.375),
          whiteSpace: "nowrap",
        })}
      >
        {badge}
      </Typography>
    ) : (
      <Box
        sx={(theme) => ({
          width: CHECK_SIZE_PX,
          height: CHECK_SIZE_PX,
          flexShrink: 0,
          borderRadius: "50%",
          border: `1.5px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
          bgcolor: selected ? theme.palette.primary.main : "transparent",
          color: selected ? theme.palette.background.default : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          "& svg": { fontSize: (t) => t.typography.pxToRem(CHECK_ICON_SIZE_PX) },
        })}
      >
        {selected && <CheckIcon />}
      </Box>
    )}
  </ButtonBase>
);
